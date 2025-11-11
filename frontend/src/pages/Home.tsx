import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Activity,
  Camera,
  BarChart3,
  Shield,
  Zap,
  Users,
  ArrowRight,
  Play,
  Star,
  CheckCircle,
} from 'lucide-react';

const Home: React.FC = () => {
  const { isAuthenticated } = useAuth();

  const features = [
    {
      icon: Camera,
      title: 'Real-time Detection',
      description: 'Advanced facial emotion recognition using state-of-the-art AI models for accurate real-time analysis.',
    },
    {
      icon: BarChart3,
      title: 'Analytics Dashboard',
      description: 'Comprehensive insights into your emotional patterns with interactive charts and trend analysis.',
    },
    {
      icon: Activity,
      title: 'Pattern Recognition',
      description: 'Identify emotional patterns and triggers to better understand your mental wellness journey.',
    },
    {
      icon: Shield,
      title: 'Privacy First',
      description: 'Your data is encrypted and secure. We never share your personal emotion data with third parties.',
    },
    {
      icon: Zap,
      title: 'Fast & Accurate',
      description: 'Optimized for performance with 30fps detection and 95%+ accuracy across all emotion categories.',
    },
    {
      icon: Users,
      title: 'Personal Insights',
      description: 'Get personalized recommendations and insights based on your unique emotional patterns.',
    },
  ];

  const testimonials = [
    {
      name: 'Sarah Johnson',
      role: 'Mental Health Professional',
      content: 'EmotiTrack has revolutionized how I help my clients understand their emotional patterns. The accuracy is remarkable.',
      rating: 5,
    },
    {
      name: 'Dr. Michael Chen',
      role: 'Researcher',
      content: 'The analytics dashboard provides incredible insights. Perfect for both personal use and research applications.',
      rating: 5,
    },
    {
      name: 'Emily Rodriguez',
      role: 'Wellness Coach',
      content: 'My clients love the real-time feedback. It\'s helped them become more aware of their emotional states.',
      rating: 5,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <div className="flex justify-center mb-8">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-2xl">
                <Activity className="w-10 h-10 text-white" />
              </div>
            </div>
            
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
              Track Your{' '}
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Emotions
              </span>
              <br />
              In Real-Time
            </h1>
            
            <p className="text-xl text-gray-600 dark:text-gray-400 mb-8 max-w-3xl mx-auto">
              Discover patterns in your emotional well-being with advanced AI-powered facial emotion recognition. 
              Gain insights, track progress, and improve your mental health journey.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {isAuthenticated ? (
                <Link
                  to="/dashboard"
                  className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium rounded-xl shadow-lg hover:from-blue-700 hover:to-purple-700 transition-all transform hover:scale-105"
                >
                  <Play className="w-5 h-5 mr-2" />
                  Go to Dashboard
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Link>
              ) : (
                <>
                  <Link
                    to="/register"
                    className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium rounded-xl shadow-lg hover:from-blue-700 hover:to-purple-700 transition-all transform hover:scale-105"
                  >
                    Get Started Free
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Link>
                  <Link
                    to="/login"
                    className="inline-flex items-center px-8 py-4 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 font-medium rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
                  >
                    Sign In
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Floating Elements */}
        <div className="absolute top-10 left-10 w-20 h-20 bg-blue-200 dark:bg-blue-900 rounded-full opacity-50 animate-pulse-slow"></div>
        <div className="absolute bottom-10 right-10 w-32 h-32 bg-purple-200 dark:bg-purple-900 rounded-full opacity-30 animate-pulse-slow" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 right-20 w-16 h-16 bg-green-200 dark:bg-green-900 rounded-full opacity-40 animate-pulse-slow" style={{ animationDelay: '2s' }}></div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Powerful Features for Better Emotional Health
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Everything you need to understand and improve your emotional well-being in one comprehensive platform.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all transform hover:-translate-y-1"
            >
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mb-6">
                <feature.icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                {feature.title}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* How It Works Section */}
      <div className="bg-white dark:bg-gray-800 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              How EmotiTrack Works
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Simple, secure, and scientifically-backed emotional analysis in just a few steps.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-6">
                <Camera className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                1. Start Detection
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Allow camera access and position your face in the detection area. Our AI will automatically start analyzing your emotions.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-6">
                <Activity className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                2. Real-time Analysis
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Watch as emotions are detected in real-time with confidence scores. All processing happens locally for privacy.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center mx-auto mb-6">
                <BarChart3 className="w-8 h-8 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                3. Get Insights
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                View detailed analytics, track patterns over time, and receive personalized insights to improve your emotional health.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Testimonials Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Loved by Professionals & Individuals
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            See what mental health professionals and users are saying about EmotiTrack.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-sm border border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-center mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                ))}
              </div>
              <p className="text-gray-600 dark:text-gray-400 mb-6 italic">
                "{testimonial.content}"
              </p>
              <div>
                <div className="font-semibold text-gray-900 dark:text-white">
                  {testimonial.name}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {testimonial.role}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-800 dark:to-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-6">
              Ready to Start Your Emotional Wellness Journey?
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 mb-8 max-w-2xl mx-auto">
              Join thousands of users who are already tracking their emotions and improving their mental health.
            </p>
            
            <div className="flex items-center justify-center space-x-6 mb-8">
              <div className="flex items-center text-gray-600 dark:text-gray-400">
                <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                <span>100% Free to start</span>
              </div>
              <div className="flex items-center text-gray-600 dark:text-gray-400">
                <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                <span>Privacy protected</span>
              </div>
              <div className="flex items-center text-gray-600 dark:text-gray-400">
                <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                <span>No credit card required</span>
              </div>
            </div>

            {!isAuthenticated && (
              <Link
                to="/register"
                className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium rounded-xl shadow-lg hover:from-blue-700 hover:to-purple-700 transition-all transform hover:scale-105"
              >
                Start Tracking Emotions
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 dark:bg-gray-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Activity className="w-6 h-6 text-white" />
              </div>
            </div>
            <p className="text-gray-400 text-sm">
              © 2024 EmotiTrack. All rights reserved. Built with privacy and security in mind.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
