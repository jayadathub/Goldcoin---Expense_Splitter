import { useState, useRef } from 'react';
import { processAndCompressImage } from '../utils/imageCompressor.js';

export default function ClusterImagePicker({ image, onChange }) {
  const [urlInput, setUrlInput] = useState('');
  const [mode, setMode] = useState('upload'); // 'upload' | 'url'
  const [compressing, setCompressing] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setCompressing(true);
      setError('');
      const compressed = await processAndCompressImage(file);
      onChange(compressed);
    } catch (err) {
      setError(err.message || 'Failed to process image');
    } finally {
      setCompressing(false);
    }
  };

  const handlePaste = async (e) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type.indexOf('image') !== -1) {
        e.preventDefault();
        const file = item.getAsFile();
        if (file) {
          try {
            setCompressing(true);
            setError('');
            const compressed = await processAndCompressImage(file);
            onChange(compressed);
          } catch (err) {
            setError(err.message || 'Failed to process pasted image');
          } finally {
            setCompressing(false);
          }
          return;
        }
      } else if (item.type === 'text/plain') {
        item.getAsString((text) => {
          if (text.startsWith('http://') || text.startsWith('https://') || text.startsWith('data:image/')) {
            e.preventDefault();
            onChange(text.trim());
          }
        });
      }
    }
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    const file = e.dataTransfer?.files?.[0];
    if (file && file.type.startsWith('image/')) {
      try {
        setCompressing(true);
        setError('');
        const compressed = await processAndCompressImage(file);
        onChange(compressed);
      } catch (err) {
        setError(err.message || 'Failed to process dropped image');
      } finally {
        setCompressing(false);
      }
    }
  };

  const handleApplyUrl = (e) => {
    e.preventDefault();
    if (urlInput.trim()) {
      onChange(urlInput.trim());
      setUrlInput('');
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="block font-medium text-stone-700 text-xs">
          Cluster Icon / Picture (optional)
        </label>
        {image && (
          <button
            type="button"
            onClick={() => onChange('')}
            className="text-[11px] text-rose-700 hover:text-rose-800 font-semibold underline"
          >
            ✕ Remove Image (Use Default 🧳)
          </button>
        )}
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Preview + Input Container */}
      <div className="bg-[#f7f2e8] border border-[#ded5c5] rounded-xl p-3 flex flex-col sm:flex-row items-center gap-3">
        {/* Thumbnail Preview */}
        <div className="relative group shrink-0">
          {image ? (
            <img
              src={image}
              alt="Cluster Icon Preview"
              className="w-14 h-14 object-cover rounded-xl border border-[#decfa8] shadow-3xs bg-[#ede4d4]"
              onError={() => setError('Image failed to load. Check URL or try another file.')}
            />
          ) : (
            <div className="w-14 h-14 rounded-xl bg-[#ede4d4] border border-[#decfa8] flex items-center justify-center text-2xl shadow-3xs text-stone-600">
              🧳
            </div>
          )}
          {compressing && (
            <div className="absolute inset-0 bg-stone-900/60 rounded-xl flex items-center justify-center text-[10px] text-white font-medium">
              ⏳
            </div>
          )}
        </div>

        {/* Input Methods */}
        <div className="flex-1 w-full space-y-2 text-xs">
          {/* Sub-mode selector tabs */}
          <div className="flex space-x-1.5 border-b border-[#e5dccf] pb-1.5">
            <button
              type="button"
              onClick={() => setMode('upload')}
              className={`text-[11px] font-semibold px-2 py-0.5 rounded-md transition ${
                mode === 'upload'
                  ? 'bg-stone-800 text-[#fbf9f4]'
                  : 'text-stone-600 hover:text-stone-900 bg-[#ede4d4]'
              }`}
            >
              📁 File / Direct Paste
            </button>
            <button
              type="button"
              onClick={() => setMode('url')}
              className={`text-[11px] font-semibold px-2 py-0.5 rounded-md transition ${
                mode === 'url'
                  ? 'bg-stone-800 text-[#fbf9f4]'
                  : 'text-stone-600 hover:text-stone-900 bg-[#ede4d4]'
              }`}
            >
              🌐 Image Address / URL
            </button>
          </div>

          {mode === 'upload' ? (
            <div className="flex flex-col sm:flex-row gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={compressing}
                className="bg-[#ede4d4] hover:bg-[#e2d6c3] border border-[#d8cebd] text-stone-800 font-semibold px-3 py-1.5 rounded-lg transition text-xs flex items-center justify-center space-x-1 shrink-0"
              >
                <span>📁</span>
                <span>{compressing ? 'Optimizing...' : 'Upload from PC / Phone'}</span>
              </button>

              {/* Paste / Drop Target Area */}
              <div
                tabIndex={0}
                onPaste={handlePaste}
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
                className="flex-1 p-1.5 bg-[#fbf9f4] border border-dashed border-[#cfc1ad] hover:border-stone-700 rounded-lg text-center text-[11px] text-stone-500 cursor-pointer focus:outline-none focus:ring-1 focus:ring-stone-600 transition flex items-center justify-center"
                title="Click here and press Ctrl+V to paste an image or URL"
              >
                <span>📋 Click & paste image (Ctrl+V) or drop file</span>
              </div>
            </div>
          ) : (
            <div className="flex gap-1.5">
              <input
                type="url"
                placeholder="Paste image address (https://...)"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                onPaste={handlePaste}
                className="flex-1 bg-[#fbf9f4] border border-[#dcd1bf] rounded-lg px-2.5 py-1 text-xs text-stone-900 focus:outline-none focus:border-stone-700"
              />
              <button
                type="button"
                onClick={handleApplyUrl}
                disabled={!urlInput.trim()}
                className="bg-stone-800 hover:bg-stone-900 disabled:opacity-50 text-[#fbf9f4] font-semibold px-2.5 py-1 rounded-lg text-xs transition"
              >
                Apply
              </button>
            </div>
          )}
        </div>
      </div>

      {error && (
        <p className="text-[11px] text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-1 rounded-md">
          {error}
        </p>
      )}
    </div>
  );
}
