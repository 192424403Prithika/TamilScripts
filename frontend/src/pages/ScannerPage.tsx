import React, { useState } from 'react';
import { Card, Button, Badge } from '../components/ui';
import { useAppStore } from '../store/useAppStore';
import { Upload, Copy, Check, Download, FileText, ScanLine, Feather } from 'lucide-react';

export const ScannerPage: React.FC = () => {
  const { currentLang } = useAppStore();
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [recognizedText, setRecognizedText] = useState<string>('');
  const [lineCount, setLineCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const b64 = event.target?.result as string;
      setImagePreview(b64);
      processOCR(b64);
    };
    reader.readAsDataURL(file);
  };

  const processOCR = async (b64: string) => {
    setLoading(true);
    try {
      const res = await fetch('/api/ocr/page', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image_base64: b64,
          enhance_denoise: true
        })
      });
      if (res.ok) {
        const data = await res.json();
        setRecognizedText(data.full_text);
        setLineCount(data.line_count);
      }
    } catch (e) {
      console.error("OCR Error:", e);
    } finally {
      setLoading(false);
    }
  };

  const copyText = () => {
    navigator.clipboard.writeText(recognizedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadTextFile = () => {
    const blob = new Blob([recognizedText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tamil_manuscript_ocr_${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Studio Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border-subtle pb-5">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-serif-tamil font-bold text-ink-primary tracking-tight">
              {currentLang === 'ta' ? 'சுவடி & ஆவண ஸ்கேனர்' : 'Manuscript Page Scanner'}
            </h1>
            <Badge variant="gold">
              Multi-Line CRNN
            </Badge>
          </div>
          <p className="text-sm text-ink-secondary mt-1">
            {currentLang === 'ta'
              ? 'கைப்பட எழுதப்பட்ட தமிழ் சுவடிகள் அல்லது ஏடுகளை பதிவேற்றி முழு உரையையும் பிரித்தெடுங்கள்.'
              : 'Upload scanned handwritten Tamil documents or palm-leaf manuscripts for neural line segmentation and transcription.'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Document Upload Card (6 cols) */}
        <div className="lg:col-span-6 space-y-5">
          <Card className="p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-border-subtle pb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-ink-secondary flex items-center gap-1.5">
                <ScanLine className="w-3.5 h-3.5 text-vermilion" />
                <span>Upload Document / Palm-Leaf Scan</span>
              </span>
            </div>

            {/* Drag & Drop Upload Zone */}
            <label className="border-2 border-dashed border-border-subtle hover:border-vermilion/50 rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer transition-colors bg-paper-canvas group">
              <Upload className="w-8 h-8 text-ink-tertiary group-hover:text-vermilion transition-colors mb-3" />
              <span className="text-sm font-semibold text-ink-primary">
                Choose an image file or photograph
              </span>
              <span className="text-xs text-ink-tertiary mt-1">
                PNG, JPG or WEBP (up to 10MB)
              </span>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>

            {/* Image Preview */}
            {imagePreview && (
              <div className="space-y-2 pt-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-ink-secondary">
                  Source Image Preview
                </span>
                <div className="max-h-72 rounded-xl overflow-hidden border border-border-subtle bg-paper-canvas p-2">
                  <img
                    src={imagePreview}
                    alt="Uploaded document preview"
                    className="w-full h-full object-contain max-h-64 mx-auto rounded-lg"
                  />
                </div>
              </div>
            )}
          </Card>
        </div>

        {/* Right: Extracted Transcription Card (6 cols) */}
        <div className="lg:col-span-6 space-y-5">
          <Card className="p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-border-subtle pb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-vermilion" />
                <span className="text-xs font-semibold uppercase tracking-wider text-ink-secondary">
                  Transcribed Text
                </span>
              </div>

              {lineCount > 0 && (
                <span className="text-xs font-mono text-ink-tertiary">
                  {lineCount} lines recognized
                </span>
              )}
            </div>

            {/* Transcription Content Area */}
            <div className="min-h-[280px] rounded-2xl bg-paper-canvas canvas-ruled border border-border-subtle p-5 relative overflow-hidden">
              {loading ? (
                <div className="h-full min-h-[240px] flex flex-col items-center justify-center gap-2 text-ink-tertiary animate-pulse">
                  <Feather className="w-8 h-8 text-vermilion" />
                  <span className="text-xs font-mono">Running Line Segmentation &amp; CRNN Decoding...</span>
                </div>
              ) : recognizedText ? (
                <div className="font-serif-tamil text-lg leading-relaxed text-ink-primary whitespace-pre-wrap select-text">
                  {recognizedText}
                </div>
              ) : (
                <div className="h-full min-h-[240px] flex flex-col items-center justify-center text-center text-ink-tertiary space-y-2">
                  <ScanLine className="w-8 h-8 mx-auto opacity-30 text-vermilion" />
                  <p className="text-xs max-w-xs">
                    Upload a scanned handwritten page on the left to extract full digital Tamil text.
                  </p>
                </div>
              )}
            </div>

            {/* Actions: Copy & Export */}
            <div className="flex items-center gap-3 pt-2">
              <Button
                variant="primary"
                onClick={copyText}
                disabled={!recognizedText}
                className="flex-1"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 mr-1.5" />
                    <span>Copied to Clipboard</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 mr-1.5" />
                    <span>Copy Text</span>
                  </>
                )}
              </Button>

              <Button
                variant="secondary"
                onClick={downloadTextFile}
                disabled={!recognizedText}
              >
                <Download className="w-3.5 h-3.5 mr-1.5" />
                <span>Export TXT</span>
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ScannerPage;
