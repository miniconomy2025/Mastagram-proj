import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as ec2 from 'aws-cdk-lib/aws-ec2';

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

    const keyPair = new ec2.KeyPair(this, 'MastergramKeyPair', {
      keyPairName: 'mastergram-key-pair',
    });

    const userData = ec2.UserData.forLinux();
    userData.addCommands(
      'sudo yum update -y',

      'curl -sL https://rpm.nodesource.com/setup_20.x | sudo bash -',
      'sudo yum install -y nodejs',

      'sudo yum install -y git',
      'sudo yum install -y amazon-linux-extras',
      'sudo amazon-linux-extras install nginx1 -y',

      'sudo systemctl start nginx',
      'sudo systemctl enable nginx',

      'sudo npm install -g pm2'
    );

    // Create the EC2 instance
    const ec2Instance = new ec2.Instance(this, 'MastergramEc2Instance', {
      vpc,
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MICRO),
      machineImage: ec2.MachineImage.latestAmazonLinux2023(),
      securityGroup: ec2SecurityGroup,
      keyPair: keyPair,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PUBLIC,
      },
      userData: userData,
    });
  }
}
