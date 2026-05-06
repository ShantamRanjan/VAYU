import { useState, useCallback } from "react";
import { Upload, Image, Loader2, Sun } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function SolarUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const navigate = useNavigate();

  const handleFile = useCallback((f: File) => {
    setFile(f);
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(f);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f && (f.type === "image/jpeg" || f.type === "image/png")) handleFile(f);
  }, [handleFile]);

  const handleAnalyze = () => {
    setLoading(true);
    setTimeout(() => {
      navigate("/solar/results");
    }, 2000);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in-up">
      {/* Hero */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-status-orange/10 text-status-orange text-xs font-medium">
          <Sun className="w-3.5 h-3.5" />
          Solar Rooftop Analyzer
        </div>
        <h1 className="text-3xl font-bold text-foreground">Analyze Your Rooftop Solar Potential</h1>
        <p className="text-muted-foreground max-w-lg mx-auto">
          Upload a satellite image of your rooftop and our AI will calculate optimal panel placement, energy generation, and financial returns.
        </p>
      </div>

      {/* Upload + Sample */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Upload zone */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className={`glass-card rounded-2xl p-8 flex flex-col items-center justify-center text-center min-h-[300px] cursor-pointer transition-all duration-200 ${
            dragOver ? "border-primary border-2 bg-primary/5" : "border-dashed border-2"
          }`}
          onClick={() => document.getElementById("file-input")?.click()}
        >
          <input
            id="file-input"
            type="file"
            accept=".jpg,.jpeg,.png"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          />
          {preview ? (
            <img src={preview} alt="Uploaded rooftop" className="max-h-52 rounded-xl object-cover" />
          ) : (
            <>
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                <Upload className="w-8 h-8 text-primary" />
              </div>
              <p className="text-sm font-medium text-foreground mb-1">Drag & drop your rooftop image</p>
              <p className="text-xs text-muted-foreground">JPG, PNG — Satellite or aerial imagery</p>
            </>
          )}
          {file && <p className="mt-3 text-xs text-muted-foreground">{file.name}</p>}
        </div>

        {/* Sample reference */}
        <div className="glass-card rounded-2xl p-6 flex flex-col items-center justify-center text-center">
          <div className="w-full h-48 rounded-xl bg-secondary/50 flex items-center justify-center mb-4">
            <Image className="w-12 h-12 text-muted-foreground/40" />
          </div>
          <p className="text-xs font-medium text-muted-foreground">Sample satellite image</p>
          <p className="text-xs text-muted-foreground mt-1">Use Google Earth or similar for best results</p>
        </div>
      </div>

      {/* Analyze button */}
      <div className="text-center">
        <Button
          size="lg"
          disabled={!file || loading}
          onClick={handleAnalyze}
          className="px-8"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Analyzing...
            </>
          ) : (
            "Analyze Roof"
          )}
        </Button>
      </div>
    </div>
  );
}
