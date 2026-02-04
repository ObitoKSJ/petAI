'use client';

import type { Product } from '@/types';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  return (
    <a
      href={product.product_url}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex gap-3 rounded-xl border border-border/50 bg-card p-3 transition-all hover:border-primary/30 hover:shadow-md"
    >
      {/* Product Image */}
      <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg bg-muted">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-2xl text-muted-foreground">
            🛍️
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="flex min-w-0 flex-1 flex-col justify-between">
        <div>
          <p className="text-xs text-muted-foreground">{product.brand}</p>
          <h4 className="line-clamp-2 text-sm font-medium leading-tight text-foreground group-hover:text-primary">
            {product.name}
          </h4>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-primary">
            {product.price}
          </span>
          <span className="text-xs text-muted-foreground group-hover:text-primary">
            View →
          </span>
        </div>
      </div>
    </a>
  );
}

interface ProductCardsProps {
  products: Product[];
}

export function ProductCards({ products }: ProductCardsProps) {
  if (!products || products.length === 0) return null;

  return (
    <div className="mt-4 space-y-3">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Recommended Products
      </p>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {products.map((product, index) => (
          <ProductCard key={`${product.name}-${index}`} product={product} />
        ))}
      </div>
    </div>
  );
}
