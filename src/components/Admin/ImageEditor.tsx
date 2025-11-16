import { useState, useEffect } from 'react';
import { ImageFormData } from 'src/utils/types';

interface ImageEditorProps {
  imageUrl: string;
  initialData?: Partial<ImageFormData>;
  onSave: (data: ImageFormData) => void;
  onSkip?: () => void;
  currentIndex?: number;
  totalImages?: number;
}

const CATEGORIES = [
  'christmas', 'halloween', 'food', 'flowers', 'animals', 'cats',
  'birthday', 'holidays', 'nature', 'people'
];

export default function ImageEditor({
  imageUrl,
  initialData,
  onSave,
  onSkip,
  currentIndex,
  totalImages,
}: ImageEditorProps) {
  const [formData, setFormData] = useState<ImageFormData>({
    title: initialData?.title || '',
    description: initialData?.description || '',
    alt_text: initialData?.alt_text || '',
    tags: initialData?.tags || [],
    category: initialData?.category || '',
    published: initialData?.published ?? true,
    scheduled_for: initialData?.scheduled_for,
  });

  const [tagInput, setTagInput] = useState('');

  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title || '',
        description: initialData.description || '',
        alt_text: initialData.alt_text || '',
        tags: initialData.tags || [],
        category: initialData.category || '',
        published: initialData.published ?? true,
        scheduled_for: initialData.scheduled_for,
      });
    }
  }, [initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim().toLowerCase())) {
      setFormData({
        ...formData,
        tags: [...formData.tags, tagInput.trim().toLowerCase()],
      });
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter(tag => tag !== tagToRemove),
    });
  };

  const handleTagInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Header */}
      {currentIndex !== undefined && totalImages !== undefined && (
        <div className="bg-indigo-600 text-white px-6 py-3">
          <p className="text-sm font-medium">
            Image {currentIndex + 1} of {totalImages}
          </p>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6 p-6">
        {/* Image Preview */}
        <div className="space-y-4">
          <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center">
            <img
              src={imageUrl}
              alt="Preview"
              className="max-w-full max-h-full object-contain"
            />
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
              Title *
            </label>
            <input
              type="text"
              id="title"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="e.g., Christmas Santa Claus"
            />
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              id="description"
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Brief description of the image..."
            />
          </div>

          {/* Alt Text */}
          <div>
            <label htmlFor="alt_text" className="block text-sm font-medium text-gray-700 mb-1">
              Alt Text (SEO)
            </label>
            <input
              type="text"
              id="alt_text"
              value={formData.alt_text}
              onChange={(e) => setFormData({ ...formData, alt_text: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Descriptive text for accessibility"
            />
          </div>

          {/* Category */}
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            <select
              id="category"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">Select category...</option>
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </option>
              ))}
            </select>
          </div>

          {/* Tags */}
          <div>
            <label htmlFor="tags" className="block text-sm font-medium text-gray-700 mb-1">
              Tags
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                id="tags"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleTagInputKeyDown}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Enter tag and press Enter"
              />
              <button
                type="button"
                onClick={addTag}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
              >
                Add
              </button>
            </div>
            {formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-indigo-100 text-indigo-700"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="ml-2 text-indigo-500 hover:text-indigo-700"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Publishing Options */}
          <div className="space-y-2">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="published"
                checked={formData.published}
                onChange={(e) => setFormData({ ...formData, published: e.target.checked })}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label htmlFor="published" className="ml-2 text-sm text-gray-700">
                Publish immediately
              </label>
            </div>

            {!formData.published && (
              <div>
                <label htmlFor="scheduled_for" className="block text-sm font-medium text-gray-700 mb-1">
                  Schedule for
                </label>
                <input
                  type="datetime-local"
                  id="scheduled_for"
                  value={formData.scheduled_for ? new Date(formData.scheduled_for).toISOString().slice(0, 16) : ''}
                  onChange={(e) => setFormData({ ...formData, scheduled_for: new Date(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4">
            {onSkip && (
              <button
                type="button"
                onClick={onSkip}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              >
                Skip
              </button>
            )}
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
              Save & Next
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


