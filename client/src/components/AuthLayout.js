import PropTypes from 'prop-types';
import { HiHeart, HiSparkles } from 'react-icons/hi';

export default function AuthLayout({ title, subtitle, illustration, children }) {
  return (
    <div className="min-h-screen flex relative overflow-hidden">
      
      {/* Illustration column (hidden on small) */}
      <div className="hidden lg:flex flex-1 items-center justify-center p-12 relative z-10">
        <div className="max-w-lg text-center">
          {/* Hero Image */}
          <div className="relative mb-8">
            <div className="w-80 h-80 mx-auto bg-gradient-to-br from-brand-100 to-accent-100 rounded-full flex items-center justify-center shadow-large">
              {illustration ? (
                <img 
                  src={illustration} 
                  alt="Happy pets waiting for adoption" 
                  className="w-64 h-64 object-cover rounded-full"
                />
              ) : (
                <div className="text-center">
                  <HiHeart className="w-24 h-24 text-brand mx-auto mb-4" />
                  <HiSparkles className="w-16 h-16 text-accent mx-auto" />
                </div>
              )}
            </div>
            {/* Floating elements */}
            <div className="absolute -top-4 -right-4 w-8 h-8 bg-accent rounded-full animate-bounce-soft" />
            <div className="absolute -bottom-2 -left-6 w-6 h-6 bg-brand rounded-full animate-float" />
          </div>
          
          {/* Hero Text */}
          <h2 className="text-4xl font-display font-bold text-neutral-800 mb-4">
            Find your new
            <span className="gradient-text block">best friend</span>
          </h2>
          <p className="text-lg text-neutral-600 leading-relaxed">
            Connect with loving pets waiting for their forever homes. 
            Every adoption creates a beautiful story of companionship and joy.
          </p>
          
          {/* Stats */}
          <div className="mt-8 grid grid-cols-2 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-brand">500+</div>
              <div className="text-sm text-neutral-500">Happy Adoptions</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-accent">50+</div>
              <div className="text-sm text-neutral-500">Partner Shelters</div>
            </div>
          </div>
        </div>
      </div>

      {/* Form column */}
      <div className="flex-1 flex items-center justify-center p-6 relative z-10">
        <div className="w-full max-w-md">
          {/* Form Container */}
          <div className="glass rounded-3xl shadow-large p-8 md:p-10 border border-white/20">
            {/* Header */}
            <div className="text-center mb-8">
              {/* Logo */}
              <div className="inline-flex items-center space-x-2 mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-brand to-accent rounded-xl flex items-center justify-center shadow-soft">
                  <HiHeart className="w-6 h-6 text-white" />
                </div>
                <span className="text-xl font-display font-bold gradient-text">
                  ShelterSync
                </span>
              </div>
              
              <h1 className="text-2xl font-display font-bold text-neutral-900 mb-2">
                {title}
              </h1>
              {subtitle && (
                <p className="text-neutral-600 text-sm">
                  {subtitle}
                </p>
              )}
            </div>

            {/* Form Content */}
            {children}
          </div>

          {/* Footer */}
          <div className="mt-6 text-center">
            <p className="text-xs text-neutral-500">
              By continuing, you agree to our{' '}
              <a href="/terms" className="text-brand hover:underline">Terms of Service</a>
              {' '}and{' '}
              <a href="/privacy" className="text-brand hover:underline">Privacy Policy</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

AuthLayout.propTypes = {
  title: PropTypes.string.isRequired,
  subtitle: PropTypes.string,
  illustration: PropTypes.string,
  children: PropTypes.node.isRequired,
};
