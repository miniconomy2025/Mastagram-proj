import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as apigatewayv2 from 'aws-cdk-lib/aws-apigatewayv2';
import * as integrations from 'aws-cdk-lib/aws-apigatewayv2-integrations';
import * as iam from 'aws-cdk-lib/aws-iam';

interface ExtendedStackProps extends cdk.StackProps {
  deployRegion: string;
}

export class InfrastructureStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: ExtendedStackProps) {
    super(scope, id, props);

    // S3 bucket props
    const commonBucketProps = {
      accessControl: s3.BucketAccessControl.PRIVATE,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    };

    // Frontend S3 Bucket for the Mastergram web application
    const frontendBucket = new s3.Bucket(this, 'MastergramWebAppBucket', {
      bucketName: 'mastergram-webapp',
      websiteIndexDocument: 'index.html',
      websiteErrorDocument: 'index.html',
      ...commonBucketProps,
    });

    // Content Storage S3 Bucket for user-generated content
    const contentStorageBucket = new s3.Bucket(this, 'MastergramContentStorageBucket', {
      bucketName: 'mastergram-storage',
      ...commonBucketProps,
    });


    // CloudFront Distribution for Mastergram WebApp 
    const distribution = new cloudfront.Distribution(this, 'MastergramWebAppDistribution', {
      defaultBehavior: {
        origin: origins.S3BucketOrigin.withOriginAccessControl(frontendBucket, {
          originAccessLevels: [cloudfront.AccessLevel.READ],
        }),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED,
      },
      defaultRootObject: 'index.html',
      errorResponses: [
        {
          httpStatus: 403,
          responseHttpStatus: 200,
          responsePagePath: '/index.html',
        },
        {
          httpStatus: 404,
          responseHttpStatus: 200,
          responsePagePath: '/index.html',
        },
      ],
    });

    // CloudFront Distribution for user content
    const storageDistribution = new cloudfront.Distribution(this, 'MastergramStorageDistribution', {
      defaultBehavior: {
        origin: origins.S3BucketOrigin.withOriginAccessControl(contentStorageBucket, {
          originAccessLevels: [cloudfront.AccessLevel.READ],
        }),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED, 
        allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD_OPTIONS, 
        cachedMethods: cloudfront.CachedMethods.CACHE_GET_HEAD_OPTIONS,
      }, 
      enabled: true,
      comment: 'CDN for Mastergram user-generated content',
    });

    // Create a VPC for the EC2 instance
    const vpc = new ec2.Vpc(this, 'MastergramVpc', {
      maxAzs: 2,
      subnetConfiguration: [
        {
          name: 'PublicSubnet',
          subnetType: ec2.SubnetType.PUBLIC,
          cidrMask: 24,
        }
      ],
    });

    // Security Group for the EC2 instance
    const ec2SecurityGroup = new ec2.SecurityGroup(this, 'MastergramEc2SecurityGroup', {
      vpc,
      description: 'Allow SSH and HTTP access',
      allowAllOutbound: true,
    });

    ec2SecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(22),
      'Allow SSH access'
    );

    ec2SecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      'Allow HTTP access'
    );

    ec2SecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'Allow HTTPS access'
    );

    ec2SecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(5000),
      'Allow API Requests.'
    );

    // const keyPair = new ec2.KeyPair(this, 'MastergramKeyPair', {
    //   keyPairName: 'mastergram-key-pair',
    // });

    // Create an IAM role for the EC2 instance with S3 access
    const ec2S3AccessRole = new iam.Role(this, 'MastergramEc2S3AccessRole', {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      description: 'Allows EC2 instance to access S3 buckets for Mastergram',
    });

    // Add policy for S3 access
    ec2S3AccessRole.addToPolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        "s3:GetObject",
        "s3:PutObject",
        "s3:ListBucket"
      ],
      resources: [
        contentStorageBucket.bucketArn,
        `${contentStorageBucket.bucketArn}/*`,
      ]
    }));



    const userData = ec2.UserData.forLinux();
    userData.addCommands(
      'sudo yum update -y',

      'curl -sL https://rpm.nodesource.com/setup_20.x | sudo bash -',
      'sudo yum install -y nodejs',

      'sudo yum install -y git',

      // Install and configure Nginx (Amazon Linux 2023 compatible)
      'sudo yum install -y nginx',
      'sudo systemctl start nginx',
      'sudo systemctl enable nginx',

      // Install Docker (Amazon Linux 2023 compatible)
      'sudo yum install -y docker',
      'sudo systemctl start docker',
      'sudo systemctl enable docker',

      // Add ec2-user to docker group for permission to run Docker commands
      'sudo usermod -a -G docker ec2-user',

      // Install Docker Compose v2 (recommended approach)
      'sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose',
      'sudo chmod +x /usr/local/bin/docker-compose',
      'sudo ln -sf /usr/local/bin/docker-compose /usr/bin/docker-compose',

      // Verify Docker installation and permissions
      'sudo docker --version',
      'sudo docker-compose --version',

      // Create application directory with proper ownership
      'sudo mkdir -p /home/ec2-user/mastagram',
      'sudo chown ec2-user:ec2-user /home/ec2-user/mastagram',

      // Ensure Docker service is properly configured to start on boot
      'sudo systemctl is-enabled docker || sudo systemctl enable docker',

      // Create a simple test to verify Docker works for ec2-user (will run on next login)
      'echo "#!/bin/bash" | sudo tee /home/ec2-user/test-docker.sh',
      'echo "docker --version && docker-compose --version && echo \\"Docker setup complete\\"" | sudo tee -a /home/ec2-user/test-docker.sh',
      'sudo chmod +x /home/ec2-user/test-docker.sh',
      'sudo chown ec2-user:ec2-user /home/ec2-user/test-docker.sh'
    );

    // Create the EC2 instance
    const ec2Instance = new ec2.Instance(this, 'MastergramEc2Instance', {
      vpc,
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MEDIUM),
      machineImage: ec2.MachineImage.latestAmazonLinux2023(),
      securityGroup: ec2SecurityGroup,
      keyName: 'mastergram-ssh-key-pair',
      vpcSubnets: {
        subnetType: ec2.SubnetType.PUBLIC,
      },
      userData: userData,
      role: ec2S3AccessRole,
      blockDevices: [
        {
          deviceName: '/dev/xvda',
          volume: ec2.BlockDeviceVolume.ebs(30, {
            volumeType: ec2.EbsDeviceVolumeType.GP3,
            encrypted: true,
            deleteOnTermination: true,
          }),
        },
      ],
    });

    // -=== API Gateway ===-
    const api = new apigatewayv2.HttpApi(this, 'MastergramAPI', {
      apiName: 'MastergramAPI',
      description: 'API for Mastergram',
      createDefaultStage: true,
    });

    const ebAppUrl = `http://${ec2Instance.instancePublicIp}:5000`;

    api.addRoutes({
      path: '/{proxy+}',
      methods: [apigatewayv2.HttpMethod.ANY],
      integration: new integrations.HttpUrlIntegration('MastergramEc2InstanceIntegration', `${ebAppUrl}/{proxy}`),
    });
  }
}
