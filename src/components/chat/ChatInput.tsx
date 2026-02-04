'use client';

import {
  useState,
  useCallback,
  useRef,
  type FormEvent,
  type KeyboardEvent,
  type ChangeEvent,
} from 'react';
import { ArrowUp, Image, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { generateId } from '@/lib/utils';
import type { ImageAttachment } from '@/types';

interface ChatInputProps {
  onSend: (message: string, options?: { images?: ImageAttachment[] }) => void;
  disabled?: boolean;
  placeholder?: string;
}

const MAX_IMAGES = 4;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

export function ChatInput({
  onSend,
  disabled = false,
  placeholder = 'Ask about your pet...',
}: ChatInputProps) {
  const [input, setInput] = useState('');
  const [images, setImages] = useState<ImageAttachment[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageSelect = useCallback(
    async (e: ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files) return;

      const newImages: ImageAttachment[] = [];

      for (const file of Array.from(files)) {
        // Validate file type
        if (!ACCEPTED_TYPES.includes(file.type)) {
          console.warn(`Skipping ${file.name}: unsupported type`);
          continue;
        }

        // Validate file size
        if (file.size > MAX_FILE_SIZE) {
          console.warn(`Skipping ${file.name}: file too large`);
          continue;
        }

        // Check max images limit
        if (images.length + newImages.length >= MAX_IMAGES) {
          break;
        }

        // Convert to base64
        const base64 = await fileToBase64(file);
        newImages.push({
          id: generateId(),
          base64,
          mimeType: file.type,
          name: file.name,
        });
      }

      setImages((prev) => [...prev, ...newImages].slice(0, MAX_IMAGES));

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    },
    [images.length]
  );

  const removeImage = useCallback((id: string) => {
    setImages((prev) => prev.filter((img) => img.id !== id));
  }, []);

  const handleSubmit = useCallback(
    (e: FormEvent) => {
      e.preventDefault();
      const trimmed = input.trim();
      const hasContent = trimmed || images.length > 0;

      if (hasContent && !disabled) {
        onSend(trimmed, images.length > 0 ? { images } : undefined);
        setInput('');
        setImages([]);
      }
    },
    [input, images, disabled, onSend]
  );

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSubmit(e as unknown as FormEvent);
      }
    },
    [handleSubmit]
  );

  const canSend = (input.trim() || images.length > 0) && !disabled;

  return (
    <div className="w-full px-4 pb-2 pt-2">
      <div className="mx-auto max-w-3xl">
        {/* Image previews */}
        {images.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-2">
            {images.map((img) => (
              <div key={img.id} className="relative group">
                <img
                  src={img.base64}
                  alt={img.name || 'Uploaded image'}
                  className="size-16 rounded-lg object-cover border border-border/50"
                />
                <button
                  type="button"
                  onClick={() => removeImage(img.id)}
                  className="absolute -top-1.5 -right-1.5 size-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label="Remove image"
                >
                  <X className="size-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="relative flex items-center">
            {/* Image upload button */}
            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPTED_TYPES.join(',')}
              multiple
              onChange={handleImageSelect}
              className="hidden"
              disabled={disabled || images.length >= MAX_IMAGES}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled || images.length >= MAX_IMAGES}
              className={cn(
                'absolute left-3 sm:left-2.5 z-10 flex size-8 sm:size-7 items-center justify-center rounded-full',
                'transition-all duration-200',
                disabled || images.length >= MAX_IMAGES
                  ? 'text-muted-foreground/30 cursor-not-allowed'
                  : 'text-muted-foreground/60 hover:text-primary hover:bg-primary/10'
              )}
              aria-label="Upload image"
            >
              <Image className="size-5 sm:size-4" />
            </button>

            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              disabled={disabled}
              className={cn(
                'w-full rounded-full bg-foreground/10 backdrop-blur-md py-4 pl-12 pr-14 sm:py-3 sm:pl-10 sm:pr-12',
                'text-base sm:text-sm placeholder:text-muted-foreground/60',
                'outline-none',
                disabled && 'opacity-50 cursor-not-allowed'
              )}
              aria-label="Chat message input"
            />
            <button
              type="submit"
              disabled={!canSend}
              className={cn(
                'absolute right-2.5 sm:right-2 flex size-10 sm:size-8 items-center justify-center rounded-full',
                'transition-all duration-200',
                canSend
                  ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                  : 'bg-muted-foreground/20 text-muted-foreground/40'
              )}
              aria-label="Send message"
            >
              <ArrowUp className="size-5 sm:size-4" strokeWidth={2.5} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Helper: Convert file to base64 data URL
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
