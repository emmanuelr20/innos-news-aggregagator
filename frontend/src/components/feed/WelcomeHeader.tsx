interface WelcomeHeaderProps {
  userName?: string | undefined;
}

export function WelcomeHeader({ userName }: WelcomeHeaderProps) {
  const displayName = userName?.split(' ')[0] || 'User';
  
  return (
    <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome back, {displayName}!
          </h1>
          <p className="text-gray-600 mt-1">
            Here's your personalized news feed
          </p>
        </div>
        <div className="hidden md:block">
          <div className="text-sm text-gray-500">
            {new Date().toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </div>
        </div>
      </div>
    </div>
  );
} 