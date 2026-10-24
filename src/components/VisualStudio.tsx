import React, { useState } from 'react';
import { GeneratedImageItem } from '../types/stats';
import {
  Sparkles,
  Image as ImageIcon,
  Wand2,
  Download,
  Loader2,
  RefreshCw,
  Upload,
  Layers,
  ZoomIn,
  Sliders,
  Check,
} from 'lucide-react';

const STATS_PROMPT_PRESETS = [
  'Modern scientific diagram of a Gaussian bell curve highlighting alpha = 0.05 rejection regions in glowing crimson on a dark educational background',
  'Minimalist artistic illustration of a courtroom scale balancing statistical evidence: innocent until proven guilty as an analogy for the Null Hypothesis',
  '2x2 decision matrix diagram showing Type I Error (false alarm) and Type II Error (missed effect) with clean conceptual icons',
  'Comparative visualization of two normal distributions demonstrating how increased sample size shrinks standard error and boosts statistical power',
];

export const VisualStudio: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'create' | 'edit'>('create');

  // Generation state
  const [createPrompt, setCreatePrompt] = useState<string>('');
  const [aspectRatio, setAspectRatio] = useState<string>('1:1');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Edit state
  const [selectedImageForEdit, setSelectedImageForEdit] = useState<string | null>(null);
  const [editPrompt, setEditPrompt] = useState<string>('');
  const [isEditing, setIsEditing] = useState<boolean>(false);

  // Gallery
  const [gallery, setGallery] = useState<GeneratedImageItem[]>([]);
  const [previewImage, setPreviewImage] = useState<GeneratedImageItem | null>(null);

  // Handle Create Image
  const handleCreateImage = async () => {
    if (!createPrompt.trim() || isGenerating) return;

    setIsGenerating(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/image/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: createPrompt,
          aspectRatio,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to generate image');
      }

      const newItem: GeneratedImageItem = {
        id: `img-${Date.now()}`,
        imageUrl: data.imageUrl,
        prompt: createPrompt,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        model: data.model || 'gemini-nano-banana-2.1',
      };

      setGallery((prev) => [newItem, ...prev]);
      setSelectedImageForEdit(newItem.imageUrl);
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'Image generation failed. Please try another prompt.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Handle Edit Image
  const handleEditImage = async () => {
    if (!selectedImageForEdit || !editPrompt.trim() || isEditing) return;

    setIsEditing(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/image/edit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: selectedImageForEdit,
          prompt: editPrompt,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to edit image');
      }

      const newItem: GeneratedImageItem = {
        id: `img-edit-${Date.now()}`,
        imageUrl: data.imageUrl,
        prompt: `Edited: ${editPrompt}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        model: data.model || 'gemini-nano-banana-2.1',
      };

      setGallery((prev) => [newItem, ...prev]);
      setSelectedImageForEdit(newItem.imageUrl);
      setEditPrompt('');
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'Image editing failed.');
    } finally {
      setIsEditing(false);
    }
  };

  // Handle File Upload for Editing
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setSelectedImageForEdit(reader.result);
          setActiveTab('edit');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const downloadImage = (url: string, filename: string) => {
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider bg-violet-50 text-violet-700 rounded-md">
                AI Visual Studio
              </span>
              <span className="text-xs text-slate-500 font-mono">gemini-nano-banana-2.1</span>
            </div>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
              Statistical Visuals Studio: Create &amp; Edit Images
            </h2>
            <p className="text-sm text-slate-600 mt-1 max-w-2xl">
              Generate custom statistical diagrams, bell curve infographics, and experimental analogies using text prompts, or edit existing images to add annotations and refine visuals.
            </p>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="flex items-center gap-1 bg-slate-100 p-1.5 rounded-xl border border-slate-200 text-xs">
            <button
              onClick={() => setActiveTab('create')}
              className={`px-4 py-2 rounded-lg font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'create'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-violet-600" />
              Create Image
            </button>
            <button
              onClick={() => setActiveTab('edit')}
              className={`px-4 py-2 rounded-lg font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'edit'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Wand2 className="w-3.5 h-3.5 text-indigo-600" />
              Edit Image
            </button>
          </div>
        </div>
      </div>

      {/* Main Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Form (Create or Edit) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
          {activeTab === 'create' ? (
            <>
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1">
                  Prompt to Create Image
                </label>
                <textarea
                  rows={4}
                  value={createPrompt}
                  onChange={(e) => setCreatePrompt(e.target.value)}
                  placeholder="Describe the statistical diagram, distribution curve, or analogy you want to generate..."
                  className="w-full p-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-violet-600 transition-all text-slate-900 resize-none"
                  disabled={isGenerating}
                />
              </div>

              {/* Aspect Ratio Options */}
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1.5">
                  Aspect Ratio
                </label>
                <div className="grid grid-cols-4 gap-2 text-xs">
                  {['1:1', '16:9', '4:3', '3:4'].map((ratio) => (
                    <button
                      key={ratio}
                      onClick={() => setAspectRatio(ratio)}
                      className={`py-1.5 rounded-lg border font-medium transition-all ${
                        aspectRatio === ratio
                          ? 'bg-violet-50 border-violet-500 text-violet-700 font-bold'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {ratio}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quick Prompt Presets */}
              <div>
                <label className="text-xs font-semibold text-slate-500 block mb-1.5">
                  Suggested Educational Prompts:
                </label>
                <div className="space-y-1.5">
                  {STATS_PROMPT_PRESETS.map((p, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCreatePrompt(p)}
                      className="w-full text-left p-2 rounded-lg bg-slate-50 hover:bg-violet-50/60 border border-slate-200 hover:border-violet-300 text-[11px] text-slate-700 hover:text-violet-900 transition-all leading-tight cursor-pointer"
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              {/* Generate Action Button */}
              <button
                onClick={handleCreateImage}
                disabled={!createPrompt.trim() || isGenerating}
                className="w-full py-3 bg-violet-600 hover:bg-violet-700 text-white font-semibold text-sm rounded-xl shadow-sm flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
              >
                {isGenerating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
                <span>{isGenerating ? 'Generating Image with nano-banana-2.1...' : 'Create Image'}</span>
              </button>
            </>
          ) : (
            <>
              {/* EDIT TAB */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1">
                  1. Image Target for Editing
                </label>
                {selectedImageForEdit ? (
                  <div className="relative rounded-xl overflow-hidden border border-slate-200 bg-slate-950 max-h-48 flex items-center justify-center">
                    <img
                      src={selectedImageForEdit}
                      alt="Target for edit"
                      className="max-h-48 object-contain"
                    />
                    <div className="absolute top-2 right-2 bg-slate-900/80 text-white text-[10px] px-2 py-0.5 rounded backdrop-blur">
                      Selected Target
                    </div>
                  </div>
                ) : (
                  <div className="p-6 border-2 border-dashed border-slate-200 rounded-xl text-center space-y-2">
                    <ImageIcon className="w-8 h-8 text-slate-400 mx-auto" />
                    <div className="text-xs text-slate-500">
                      Select an image from the gallery on the right or upload one below.
                    </div>
                  </div>
                )}

                {/* Upload custom image */}
                <div className="mt-2">
                  <label className="text-xs text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1.5 cursor-pointer">
                    <Upload className="w-3.5 h-3.5" />
                    Upload image from computer
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1">
                  2. Text Edit Instruction
                </label>
                <textarea
                  rows={3}
                  value={editPrompt}
                  onChange={(e) => setEditPrompt(e.target.value)}
                  placeholder="e.g. 'Add glowing red annotations highlighting the rejection region' or 'Change the lighting to a high-contrast laboratory aesthetic'..."
                  className="w-full p-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-indigo-600 transition-all text-slate-900 resize-none"
                  disabled={isEditing || !selectedImageForEdit}
                />
              </div>

              <button
                onClick={handleEditImage}
                disabled={!selectedImageForEdit || !editPrompt.trim() || isEditing}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-xl shadow-sm flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
              >
                {isEditing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Wand2 className="w-4 h-4" />
                )}
                <span>{isEditing ? 'Editing with gemini-nano-banana-2.1...' : 'Apply Image Edit'}</span>
              </button>
            </>
          )}

          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800">
              {errorMessage}
            </div>
          )}
        </div>

        {/* Right Gallery / Showcase */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Layers className="w-4 h-4 text-violet-600" />
                Generated Visuals Showcase ({gallery.length})
              </h3>
              <p className="text-xs text-slate-500">
                Created &amp; edited with gemini-nano-banana-2.1
              </p>
            </div>
          </div>

          {gallery.length === 0 ? (
            <div className="h-96 border-2 border-dashed border-slate-100 rounded-xl flex flex-col items-center justify-center text-slate-400 space-y-2 p-6 text-center">
              <ImageIcon className="w-12 h-12 text-slate-300" />
              <div className="text-sm font-semibold text-slate-700">No images created yet</div>
              <p className="text-xs text-slate-500 max-w-sm">
                Enter a text prompt on the left to generate custom statistical diagrams, or pick one of the suggested educational prompts!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[560px] overflow-y-auto pr-1">
              {gallery.map((item) => (
                <div
                  key={item.id}
                  className="rounded-xl border border-slate-200 overflow-hidden bg-slate-950 flex flex-col group relative"
                >
                  <div className="relative aspect-square overflow-hidden bg-slate-900 flex items-center justify-center">
                    <img
                      src={item.imageUrl}
                      alt={item.prompt}
                      className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-300"
                    />

                    {/* Quick action buttons on hover */}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <button
                        onClick={() => setPreviewImage(item)}
                        className="p-2 rounded-lg bg-white/90 hover:bg-white text-slate-900 transition-all cursor-pointer"
                        title="Zoom full image"
                      >
                        <ZoomIn className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => downloadImage(item.imageUrl, `hypothesis_diagram_${item.id}`)}
                        className="p-2 rounded-lg bg-white/90 hover:bg-white text-slate-900 transition-all cursor-pointer"
                        title="Download image"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedImageForEdit(item.imageUrl);
                          setActiveTab('edit');
                        }}
                        className="p-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition-all cursor-pointer text-xs font-medium flex items-center gap-1"
                        title="Edit this image"
                      >
                        <Wand2 className="w-3.5 h-3.5" />
                        Edit
                      </button>
                    </div>
                  </div>

                  {/* Metadata footer */}
                  <div className="p-3 bg-white border-t border-slate-200 space-y-1">
                    <p className="text-xs text-slate-800 font-medium line-clamp-2">
                      {item.prompt}
                    </p>
                    <div className="flex items-center justify-between text-[10px] text-slate-400">
                      <span>{item.model}</span>
                      <span>{item.timestamp}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Fullscreen Zoom Modal */}
      {previewImage && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setPreviewImage(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h4 className="font-bold text-sm text-slate-900">{previewImage.prompt}</h4>
                <span className="text-[10px] text-slate-500 font-mono">
                  {previewImage.model} • {previewImage.timestamp}
                </span>
              </div>
              <button
                onClick={() => setPreviewImage(null)}
                className="text-slate-400 hover:text-slate-700 text-sm font-bold px-2 py-1"
              >
                ✕
              </button>
            </div>
            <div className="p-4 bg-slate-950 flex items-center justify-center overflow-auto">
              <img
                src={previewImage.imageUrl}
                alt={previewImage.prompt}
                className="max-h-[65vh] object-contain rounded-lg"
              />
            </div>
            <div className="p-4 border-t border-slate-200 flex justify-end gap-2 bg-slate-50">
              <button
                onClick={() => {
                  setSelectedImageForEdit(previewImage.imageUrl);
                  setActiveTab('edit');
                  setPreviewImage(null);
                }}
                className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5"
              >
                <Wand2 className="w-3.5 h-3.5" /> Edit this image
              </button>
              <button
                onClick={() => downloadImage(previewImage.imageUrl, `stats_image_${previewImage.id}`)}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" /> Download
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
