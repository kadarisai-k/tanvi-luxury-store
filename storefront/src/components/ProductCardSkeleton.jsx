export default function ProductCardSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="aspect-[4/5] bg-line" />
      <div className="pt-4">
        <div className="h-4 bg-line w-3/4" />
        <div className="h-3 bg-line w-1/3 mt-2.5" />
      </div>
    </div>
  );
}
