interface LoadingSpinnerProps {
  message?: string;
}

export default function LoadingSpinner({
  message = "Processing...",
}: LoadingSpinnerProps) {
  return (
    <div className="flex flex-col items-center justify-center py-8">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
      <p className="text-gray-600 font-medium">{message}</p>
    </div>
  );
}
