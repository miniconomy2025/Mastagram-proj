import { useState, useRef } from 'react';
import { X, Image, ChevronLeft, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import './CreatePost.css';

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
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);

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
      navigate('/profile');
    } catch (error) {
      console.error('Error creating post:', error);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="create-post">
      {isUploading && (
        <div className="upload-overlay">
          <div className="spinner-wrapper">
            <div className="spinner"></div>
            <span>Sharing...</span>
          </div>
        </div>
      )}


      <div className="header">
        <div className="header-content">
          {currentStep === 'details' ? (
            <button
              onClick={() => setCurrentStep('media')}
              className="header-button"
            >
              <ChevronLeft className="icon" />
            </button>
          ) : (
            <button
              onClick={() => navigate(-1)}
              className="header-button"
            >
              <X className="icon" />
            </button>
          )}

          <h1 className="header-title">
            {currentStep === 'media' ? 'New Post' : 'Edit Post'}
          </h1>

          {currentStep === 'details' && (
            <button
              onClick={handleSubmit}
              disabled={isUploading}
              className="share-button"
            >
              Share
            </button>
          )}
        </div>
      </div>

      <main className="main-content">
        {currentStep === 'media' ? (
          <div className="media-selection">
            <div className="media-selection-content">
              <div className="image-icon-container">
                <Image className="image-icon" />
              </div>
              <h3 className="media-title">Drag photos and videos here</h3>
              <button
                className="select-button"
                onClick={triggerFileInput}
              >
                Select from Device
              </button>
            </div>
          </div>
        ) : (
          <div className="details-step">
            <div className="media-preview">
              {media[currentMediaIndex]?.type === 'image' ? (
                <img
                  src={media[currentMediaIndex].url}
                  alt={`Post preview ${currentMediaIndex}`}
                  className="preview-media"
                />
              ) : (
                <video
                  src={media[currentMediaIndex].url}
                  className="preview-media"
                  controls
                />
              )}
            </div>

            <div className="details-content">
              <div className="caption-section">
                <div className="avatar"></div>
                <textarea
                  placeholder="Write a caption..."
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  className="caption-textarea"
                />
              </div>

              <div className="thumbnails-section">
                {media.map((item, index) => (
                  <div
                    key={index}
                    onClick={() => setCurrentMediaIndex(index)}
                    className="thumbnail-container"
                  >
                    {item.type === 'image' ? (
                      <img
                        src={item.url}
                        alt=""
                        className="thumbnail"
                      />
                    ) : (
                      <video
                        src={item.url}
                        className="thumbnail"
                      />
                    )}
                    <button
                      className="remove-thumbnail"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeMedia(index);
                      }}
                    >
                      <X className="remove-icon" />
                    </button>
                  </div>
                ))}
                <button
                  onClick={triggerFileInput}
                  className="add-media-button"
                  title="Add more media"
                >
                  <Plus className="add-icon" />
                </button>
              </div>

              <div className="options-section">
                <div className="hashtag-section">
                  <span className="section-label">Add hashtags</span>
                  <div className="hashtag-input-container">
                    <input
                      type="text"
                      placeholder="#example"
                      value={currentHashtag}
                      onChange={(e) => setCurrentHashtag(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && addHashtag()}
                      className="hashtag-input"
                    />
                    <button
                      onClick={addHashtag}
                      disabled={!currentHashtag.trim()}
                      className="add-hashtag-button"
                    >
                      Add
                    </button>
                  </div>
                </div>

                {hashtags.length > 0 && (
                  <div className="hashtags-display">
                    {hashtags.map((tag) => (
                      <div key={tag} className="hashtag-chip">
                        #{tag}
                        <button
                          onClick={() => removeHashtag(tag)}
                          className="remove-hashtag"
                        >
                          <X className="remove-hashtag-icon" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden-input"
          accept="image/*,video/*"
          multiple
        />
      </main>
    </div>
  );
};

export default CreatePost;
