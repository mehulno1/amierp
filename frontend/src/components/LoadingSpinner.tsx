export default function LoadingSpinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const s = { sm: 'h-4 w-4', md: 'h-8 w-8', lg: 'h-12 w-12' }[size]
  return (
    <div className="flex items-center justify-center p-8">
      <div className={`${s} border-2 border-blue-600 border-t-transparent rounded-full animate-spin`} />
    </div>
  )
}
