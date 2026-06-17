import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { ArrowLeft, Image as ImageIcon, Upload } from 'lucide-react';
import { articlesAPI } from '../services/api';
import Input from '../components/Input';
import Button from '../components/Button';
import Skeleton from '../components/Skeleton';

const ArticleForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = !!id;

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [existingImage, setExistingImage] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [imageError, setImageError] = useState(null);

  const { register, handleSubmit, setValue, setError, watch, formState: { errors } } = useForm();
  
  const bodyValue = watch('body') || '';
  const titleValue = watch('title') || '';
  const categoryValue = watch('category') || '';
  const statusValue = watch('status') || '';
  const bodyCharCount = bodyValue.trim().length;

  useEffect(() => {
    if (isEditMode) {
      const loadArticle = async () => {
        setFetching(true);
        try {
          const article = await articlesAPI.get(id);
          setValue('title', article.title);
          setValue('body', article.body);
          setValue('category', article.category);
          setValue('status', article.status);
          if (article.image) {
            const imgUrl = article.image.startsWith('http') ? article.image : `http://localhost:8000${article.image}`;
            setExistingImage(imgUrl);
          }
        } catch (err) {
          toast.error(err.response?.data?.detail || 'Failed to load article details.');
          navigate('/articles');
        } finally {
          setFetching(false);
        }
      };
      loadArticle();
    }
  }, [id, isEditMode, setValue, navigate]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    setImageError(null);
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setImageError("Image size must be less than 5 MB.");
        setSelectedFile(null);
        setImagePreview(null);
        return;
      }
      
      const fileExtension = file.name.split('.').pop().toLowerCase();
      if (!['png', 'jpg', 'jpeg'].includes(fileExtension)) {
        setImageError("Unsupported image format.");
        setSelectedFile(null);
        setImagePreview(null);
        return;
      }
      
      setSelectedFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleRemoveImage = () => {
    setSelectedFile(null);
    setImagePreview(null);
    setImageError(null);
    setExistingImage(null);
    const fileInput = document.getElementById('image-input');
    if (fileInput) fileInput.value = '';
  };

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('title', data.title);
      formData.append('body', data.body);
      formData.append('category', data.category);
      formData.append('status', data.status);
      
      if (selectedFile) {
        formData.append('image', selectedFile);
      }

      console.log("Outgoing Article FormData:");
      for (const pair of formData.entries()) {
          console.log(pair[0], pair[1]);
      }

      let response;
      if (isEditMode) {
        response = await articlesAPI.update(id, formData);
        console.log("Incoming backend response:", response);
        toast.success('✓ Article updated successfully.');
      } else {
        response = await articlesAPI.create(formData);
        console.log("Incoming backend response:", response);
        toast.success('✓ Article published successfully.');
      }
      
      const newArticleId = response.data?.id || response.id;
      navigate('/articles', { state: { highlightedId: newArticleId } });
    } catch (err) {
      console.log("Status:", err.response?.status);
      console.log("Response:", err.response?.data);
      console.log("Payload:", err.config?.data);
      
      let errorMsg = 'Failed to save article.';
      if (err.response?.data) {
        const resData = err.response.data;
        if (resData.errors) {
          Object.keys(resData.errors).forEach((field) => {
            setError(field, {
              type: 'server',
              message: resData.errors[field].join(' ')
            });
          });
          errorMsg = 'Please fix the validation errors.';
        } else if (resData.message) {
          errorMsg = resData.message;
        } else if (resData.error) {
          errorMsg = resData.error;
        } else {
          errorMsg = JSON.stringify(resData);
        }
      }
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="space-y-6">
        <Skeleton variant="title" className="w-1/3" />
        <Skeleton variant="rect" className="h-20" />
        <Skeleton variant="rect" className="h-40" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-3">
        <Link to="/articles" className="text-slate-400 hover:text-slate-600 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-xl font-semibold text-slate-900">
            {isEditMode ? 'Edit Article' : 'Create New Article'}
          </h1>
          <p className="text-slate-500 text-xs mt-0.5">
            {isEditMode ? 'Modify and re-submit your article.' : 'Write a news article for your campus community.'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="bg-white border border-slate-100 rounded-2xl shadow-2xs p-6 md:p-8 space-y-6">
        <div className="flex flex-col gap-1">
          <Input
            label="Article Title"
            id="title"
            placeholder="e.g., Campus Spring Festival 2026 Scheduled"
            error={errors.title}
            {...register('title', { required: 'Title is required.' })}
          />
          <p className="text-[11px] text-slate-400 mt-1">Title should clearly describe your article.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="category" className="text-xs font-semibold text-slate-700 tracking-wide">
              Category
            </label>
            <select
              id="category"
              className={`px-3 py-2 text-sm bg-white border ${errors.category ? 'border-red-400 focus:ring-red-400' : 'border-slate-200 focus:ring-blue-500'
                } rounded-lg outline-none shadow-2xs transition-all duration-200 focus:ring-1`}
              {...register('category', { required: 'Category is required.' })}
            >
              <option value="">Select Category</option>
              <option value="NEWS">News</option>
              <option value="EVENT">Event</option>
              <option value="ANNOUNCEMENT">Announcement</option>
              <option value="FEATURE">Feature</option>
              <option value="OTHER">Other</option>
            </select>
            {errors.category && (
              <span className="text-xs text-red-500 font-medium">{errors.category.message}</span>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="status" className="text-xs font-semibold text-slate-700 tracking-wide">
              Status
            </label>
            <select
              id="status"
              className={`px-3 py-2 text-sm bg-white border ${errors.status ? 'border-red-400 focus:ring-red-400' : 'border-slate-200 focus:ring-blue-500'
                } rounded-lg outline-none shadow-2xs transition-all duration-200 focus:ring-1`}
              {...register('status', { required: 'Status is required.' })}
            >
              <option value="DRAFT">Draft</option>
              <option value="PUBLISHED">Published</option>
            </select>
            {errors.status && (
              <span className="text-xs text-red-500 font-medium">{errors.status.message}</span>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="body" className="text-xs font-semibold text-slate-700 tracking-wide">
            Body Content
          </label>
          <textarea
            id="body"
            rows={8}
            placeholder="Type your article contents here..."
            className={`w-full px-3 py-2 text-sm bg-white border ${errors.body ? 'border-red-400 focus:ring-red-400 focus:border-red-400' : 'border-slate-200 focus:ring-blue-500 focus:border-blue-500'
              } rounded-lg shadow-2xs outline-none transition-all duration-200 focus:ring-1`}
            {...register('body', { 
              required: 'Body is required.',
              minLength: { value: 10, message: 'Body must contain at least 10 characters.' }
            })}
          />
          <div className="flex justify-between items-center mt-1">
            <span className="text-[11px] text-slate-400 font-medium">
              Characters: {bodyCharCount} / 10
            </span>
            {errors.body && (
              <span className="text-xs text-red-500 font-medium">{errors.body.message}</span>
            )}
          </div>
        </div>

        <div className="space-y-3">
          <label className="text-xs font-semibold text-slate-700 tracking-wide block">
            Cover Image
          </label>
          <div className="flex items-center gap-6">
            <div className="w-24 h-24 bg-slate-50 border border-dashed border-slate-200 rounded-xl flex items-center justify-center overflow-hidden flex-shrink-0">
              {imagePreview ? (
                <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
              ) : existingImage ? (
                <img src={existingImage} alt="Existing" className="w-full h-full object-cover" />
              ) : (
                <ImageIcon className="w-8 h-8 text-slate-300" />
              )}
            </div>

            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-3">
                <label className="inline-flex items-center gap-2 px-3 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg text-sm font-medium cursor-pointer transition-colors shadow-2xs">
                  <Upload className="w-4 h-4 text-slate-400" />
                  <span>Upload Image</span>
                  <input
                    id="image-input"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageChange}
                  />
                </label>
                {(selectedFile || imagePreview || existingImage) && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleRemoveImage}
                  >
                    Remove Image
                  </Button>
                )}
              </div>
              
              {selectedFile && (
                <p className="text-xs text-slate-500 font-medium truncate max-w-[250px]">
                  File: {selectedFile.name} ({(selectedFile.size / (1024*1024)).toFixed(2)} MB)
                </p>
              )}
              
              <p className="text-[10px] text-slate-400">
                Supported: PNG, JPG, JPEG. Maximum size: 5 MB
              </p>
              
              {(imageError || errors.image) && (
                <span className="text-xs text-red-500 font-medium block">
                  {imageError || errors.image?.message}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
          <Link to="/articles">
            <Button variant="secondary" disabled={loading}>Cancel</Button>
          </Link>
          <Button
            type="submit"
            isLoading={loading}
            disabled={loading || titleValue.trim() === '' || bodyCharCount < 10 || !categoryValue || !statusValue || !!imageError}
          >
            {loading ? (isEditMode ? 'Updating...' : 'Publishing...') : (isEditMode ? 'Update Article' : 'Publish Article')}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ArticleForm;
