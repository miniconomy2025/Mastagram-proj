import { useState, useRef } from 'react';
import { X, Image, Video, Hash, Smile, MapPin, ChevronLeft, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { api } from '@/lib/api';

interface MediaItem {
  url: string;
  type: 'image' | 'video';
  file: File;
}

const CreatePost = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [caption, setCaption] = useState('');
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [currentHashtag, setCurrentHashtag] = useState('');
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [currentStep, setCurrentStep] = useState<'media' | 'details'>('media');
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0); // Added state for tracking current preview index

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newMedia: MediaItem[] = [];

    Array.from(files).forEach(file => {
      const url = URL.createObjectURL(file);
      const type = file.type.startsWith('video') ? 'video' : 'image';

      newMedia.push({ url, type, file });
    });

    setMedia(prev => [...prev, ...newMedia]);

    if (media.length === 0 && newMedia.length > 0) {
      setCurrentStep('details');
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeMedia = (index: number) => {
    const newMedia = media.filter((_, i) => i !== index);
    setMedia(newMedia);

    if (newMedia.length === 0) {
      setCurrentStep('media');
      setCurrentMediaIndex(0);
    } else if (currentMediaIndex >= newMedia.length) {
      setCurrentMediaIndex(newMedia.length - 1);
    }
  };

  const addHashtag = () => {
    const tag = currentHashtag.trim().replace(/#/g, '');
    if (tag && !hashtags.includes(tag)) {
      setHashtags(prev => [...prev, tag]);
      setCurrentHashtag('');
    }
  };

  const removeHashtag = (tag: string) => {
    setHashtags(prev => prev.filter(t => t !== tag));
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleSubmit = async () => {
    if (media.length === 0) return;

    setIsUploading(true);

    const formData = new FormData();
    formData.append('feedType', 'media');
    if (caption) formData.append('caption', caption);
    if (hashtags.length > 0) formData.append('hashtags', hashtags.join(','));
    media.forEach(item => {
      formData.append('media', item.file);
    });

    try {
      await api.post('/feed', formData);
      navigate('/');
    } catch (error) {
      console.error('Error creating post:', error);
      alert('Something went wrong while uploading the post.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background border-b border-border">
        <div className="max-w-md mx-auto p-4 flex items-center justify-between">
          {currentStep === 'details' ? (
            <button
              onClick={() => setCurrentStep('media')}
              className="text-muted-foreground hover:text-foreground"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
          ) : (
            <button
              onClick={() => navigate(-1)}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="w-6 h-6" />
            </button>
          )}

          <h1 className="font-semibold text-foreground">
            {currentStep === 'media' ? 'New Post' : 'Edit Post'}
          </h1>

          {currentStep === 'details' && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSubmit}
              disabled={isUploading}
              className="text-primary font-semibold hover:bg-transparent"
            >
              {isUploading ? 'Sharing...' : 'Share'}
            </Button>
          )}
        </div>
      </div>

      <main className="max-w-md mx-auto">
        {currentStep === 'media' ? (
          <div className="flex flex-col items-center justify-center h-[70vh]">
            <div className="flex flex-col items-center justify-center space-y-6 p-8">
              <div className="p-4 bg-muted rounded-full">
                <Image className="w-8 h-8 text-foreground" />
              </div>
              <h3 className="text-xl font-medium text-foreground">Drag photos and videos here</h3>
              <Button
                variant="outline"
                className="rounded-lg bg-primary text-primary-foreground hover:bg-primary/90"
                onClick={triggerFileInput}
              >
                Select from Device
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col">
            {/* Media Preview */}
            <div className="relative aspect-square bg-black">
              {media[currentMediaIndex]?.type === 'image' ? (
                <img
                  src={media[currentMediaIndex].url}
                  alt={`Post preview ${currentMediaIndex}`}
                  className="w-full h-full object-contain"
                />
              ) : (
                <video
                  src={media[currentMediaIndex].url}
                  className="w-full h-full object-contain"
                  controls
                />
              )}
            </div>

            {/* Caption and Details */}
            <div className="p-4 space-y-4">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 rounded-full bg-muted flex-shrink-0"></div>
                <Textarea
                  placeholder="Write a caption..."
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  className="border-none resize-none min-h-[60px] p-0 focus-visible:ring-0"
                />
              </div>

              <div className="flex items-center space-x-2 overflow-x-auto py-2">
                {media.map((item, index) => (
                  <div
                    key={index}
                    onClick={() => setCurrentMediaIndex(index)}
                    className="relative flex-shrink-0 w-16 h-16 cursor-pointer"
                  >
                    {item.type === 'image' ? (
                      <img
                        src={item.url}
                        alt={`Thumbnail ${index}`}
                        className="w-full h-full object-cover rounded"
                      />
                    ) : (
                      <video
                        src={item.url}
                        className="w-full h-full object-cover rounded"
                      />
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeMedia(index);
                      }}
                      className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
                <button
                  onClick={triggerFileInput}
                  className="flex-shrink-0 w-16 h-16 border border-dashed border-muted rounded flex items-center justify-center"
                  title="Add more media"
                >
                  <Plus className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>

              <div className="border-t pt-4 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Add hashtags</span>
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      placeholder="#example"
                      value={currentHashtag}
                      onChange={(e) => setCurrentHashtag(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && addHashtag()}
                      className="bg-transparent border-none outline-none text-sm text-right placeholder:text-muted-foreground"
                    />
                    <button
                      onClick={addHashtag}
                      disabled={!currentHashtag.trim()}
                      className="text-primary disabled:text-muted-foreground"
                    >
                      Add
                    </button>
                  </div>
                </div>

                {hashtags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {hashtags.map((tag) => (
                      <div
                        key={tag}
                        className="flex items-center bg-muted px-3 py-1 rounded-full text-sm"
                      >
                        #{tag}
                        <button
                          onClick={() => removeHashtag(tag)}
                          className="ml-2 text-muted-foreground hover:text-foreground"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Smile className="w-5 h-5 text-muted-foreground" />
                    <span className="text-sm">Add emoji</span>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <MapPin className="w-5 h-5 text-muted-foreground" />
                    <span className="text-sm">Add location</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Hidden File Input */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          accept="image/*,video/*"
          multiple
        />
      </main>
    </div>
  );
};

export default CreatePost;