'use client';

import { useState } from 'react';
import type { Product } from '@/types';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div
      className={`group rounded-xl border border-border/50 bg-card transition-all duration-200 ${
        isExpanded ? 'border-primary/30 shadow-md' : 'hover:border-primary/30 hover:shadow-md'
      }`}
    >
      {/* Collapsed View - Clickable */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex w-full gap-3 p-3 text-left"
      >
        {/* Product Image Placeholder */}
        <div className="flex h-20 w-20 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg bg-muted">
          <span className="text-3xl">🐾</span>
        </div>

        {/* Product Info */}
        <div className="flex min-w-0 flex-1 flex-col justify-between">
          <div>
            <p className="text-xs text-muted-foreground">{product.brand}</p>
            <h4 className="line-clamp-2 text-sm font-medium leading-tight text-foreground group-hover:text-primary">
              {product.name}
            </h4>
          </div>
          <div className="flex items-center">
            <span className="text-sm font-semibold text-primary">
              {product.price}
            </span>
          </div>
        </div>
      </button>

      {/* Expanded View with smooth animation */}
      <div
        className={`grid transition-all duration-200 ease-out ${
          isExpanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
        }`}
      >
        <div className="overflow-hidden">
          <div className="border-t border-border/50 p-3">
            {/* Description */}
            <p className="mb-3 text-sm text-muted-foreground">
              {product.description}
            </p>

            {/* Helps with */}
            {product.helps_with && (
              <div className="mb-3">
                <p className="text-xs font-medium text-accent">Helps with</p>
                <p className="text-xs text-muted-foreground">{product.helps_with}</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => alert('Add to Cart - Demo placeholder')}
                className="flex-1 rounded-lg border border-primary bg-transparent px-3 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary/10"
              >
                Add to Cart
              </button>
              <button
                type="button"
                onClick={() => alert('Purchase Now - Demo placeholder')}
                className="flex-1 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
              >
                Buy Now
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface ProductCardsProps {
  products: Product[];
}

export function ProductCards({ products }: ProductCardsProps) {
  if (!products || products.length === 0) return null;

  return (
    <div className="mt-4 space-y-3">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {products.map((product, index) => (
          <ProductCard key={`${product.name}-${index}`} product={product} />
        ))}
      </div>
    </div>
  );
}
