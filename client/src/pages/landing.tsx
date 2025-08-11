import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { GraduationCap, Presentation, University, Highlighter, Video, Users, Bell, Eye, MessageCircle } from "lucide-react";

export default function Landing() {
  const [, setLocation] = useLocation();
  const { login, register, user } = useAuth();
  const { toast } = useToast();
  
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [userType, setUserType] = useState<'teacher' | 'student'>('student');
  const [isLogin, setIsLogin] = useState(true);

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    username: '',
    department: '',
    role: 'student' as 'teacher' | 'student'
  });

  // Redirect if already logged in
  if (user) {
    if (user.role === 'teacher') {
      setLocation('/teacher/dashboard');
    } else {
      setLocation('/student/dashboard');
    }
    return null;
  }

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (isLogin) {
        const user = await login(formData.email, formData.password);
        toast({
          title: "Login successful!",
          description: `Welcome back, ${user.fullName}!`,
        });
        
        if (user.role === 'teacher') {
          setLocation('/teacher/dashboard');
        } else {
          setLocation('/student/dashboard');
        }
      } else {
        const userData = {
          ...formData,
          role: userType
        };
        const user = await register(userData);
        toast({
          title: "Registration successful!",
          description: `Welcome to EduCollab, ${user.fullName}!`,
        });
        
        if (user.role === 'teacher') {
          setLocation('/teacher/dashboard');
        } else {
          setLocation('/student/dashboard');
        }
      }
      
      setShowLoginModal(false);
      setShowRegisterModal(false);
    } catch (error: any) {
      toast({
        title: "Authentication failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const openAuthModal = (type: 'teacher' | 'student', isLoginFlow = true) => {
    setUserType(type);
    setIsLogin(isLoginFlow);
    setFormData(prev => ({ ...prev, role: type }));
    
    if (isLoginFlow) {
      setShowLoginModal(true);
    } else {
      setShowRegisterModal(true);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary to-blue-600 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="1"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>
      
      {/* Navigation */}
      <nav className="relative z-10 glass-effect border-b border-white border-opacity-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-2">
              <GraduationCap className="text-white h-8 w-8" />
              <span className="font-heading text-white text-2xl font-bold">EduCollab</span>
            </div>
            <div className="hidden md:flex items-center space-x-6">
              <a href="#features" className="text-white hover:text-blue-200 transition-colors">Features</a>
              <a href="#about" className="text-white hover:text-blue-200 transition-colors">About</a>
              <a href="#contact" className="text-white hover:text-blue-200 transition-colors">Contact</a>
            </div>
          </div>
        </div>
      </nav>
      
      {/* Hero Section */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
        <div className="text-center">
          <h1 className="font-heading text-4xl md:text-6xl font-bold text-white mb-6 animate-fade-in">
            Collaborative Learning<br/>
            <span className="text-blue-200">Made Simple</span>
          </h1>
          <p className="text-xl text-blue-100 mb-12 max-w-2xl mx-auto animate-slide-up">
            Connect teachers and students through real-time collaboration, shared notes, and interactive learning experiences.
          </p>
          
          {/* Login Options */}
          <div className="grid md:grid-cols-2 gap-8 max-w-2xl mx-auto">
            {/* Teacher Login Card */}
            <Card className="transform hover:scale-105 transition-transform duration-300 animate-slide-up cursor-pointer shadow-2xl">
              <CardContent className="p-8 text-center">
                <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center mx-auto mb-6">
                  <Presentation className="text-white h-8 w-8" />
                </div>
                <h3 className="font-heading text-2xl font-bold text-edu-text-primary mb-4">Teacher Portal</h3>
                <p className="text-edu-text-secondary mb-6">Upload and manage your course materials, track student engagement, and facilitate collaborative learning.</p>
                <div className="space-y-2">
                  <Button 
                    className="w-full bg-primary text-white hover:bg-blue-700"
                    onClick={() => openAuthModal('teacher', true)}
                  >
                    Sign In as Teacher
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => openAuthModal('teacher', false)}
                  >
                    Register as Teacher
                  </Button>
                </div>
              </CardContent>
            </Card>
            
            {/* Student Login Card */}
            <Card className="transform hover:scale-105 transition-transform duration-300 animate-slide-up cursor-pointer shadow-2xl">
              <CardContent className="p-8 text-center">
                <div className="w-20 h-20 bg-secondary rounded-full flex items-center justify-center mx-auto mb-6">
                  <University className="text-white h-8 w-8" />
                </div>
                <h3 className="font-heading text-2xl font-bold text-edu-text-primary mb-4">Student Portal</h3>
                <p className="text-edu-text-secondary mb-6">Access course materials, collaborate with peers, join study groups, and engage in real-time discussions.</p>
                <div className="space-y-2">
                  <Button 
                    className="w-full bg-secondary text-white hover:bg-green-600"
                    onClick={() => openAuthModal('student', true)}
                  >
                    Sign In as Student
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => openAuthModal('student', false)}
                  >
                    Register as Student
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      
      {/* Features Preview */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="grid md:grid-cols-3 gap-8">
          <div className="text-center text-white">
            <Highlighter className="h-12 w-12 mb-4 text-blue-200 mx-auto" />
            <h4 className="font-heading text-xl font-bold mb-2">Real-time Annotations</h4>
            <p className="text-blue-100">Highlight and annotate documents together in real-time</p>
          </div>
          <div className="text-center text-white">
            <Video className="h-12 w-12 mb-4 text-blue-200 mx-auto" />
            <h4 className="font-heading text-xl font-bold mb-2">Video Collaboration</h4>
            <p className="text-blue-100">Connect through video calls and screen sharing</p>
          </div>
          <div className="text-center text-white">
            <Users className="h-12 w-12 mb-4 text-blue-200 mx-auto" />
            <h4 className="font-heading text-xl font-bold mb-2">Study Groups</h4>
            <p className="text-blue-100">Create and join study groups for better learning</p>
          </div>
        </div>
      </div>

      {/* Authentication Modal */}
      <Dialog open={showLoginModal || showRegisterModal} onOpenChange={() => {
        setShowLoginModal(false);
        setShowRegisterModal(false);
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading">
              {isLogin ? 'Sign In' : 'Register'} as {userType === 'teacher' ? 'Teacher' : 'Student'}
            </DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleAuthSubmit} className="space-y-4">
            {!isLogin && (
              <>
                <div>
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    value={formData.fullName}
                    onChange={(e) => setFormData(prev => ({...prev, fullName: e.target.value}))}
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    value={formData.username}
                    onChange={(e) => setFormData(prev => ({...prev, username: e.target.value}))}
                    required
                  />
                </div>
                
                {userType === 'teacher' && (
                  <div>
                    <Label htmlFor="department">Department</Label>
                    <Input
                      id="department"
                      value={formData.department}
                      onChange={(e) => setFormData(prev => ({...prev, department: e.target.value}))}
                      placeholder="e.g. Computer Science Department"
                    />
                  </div>
                )}
              </>
            )}
            
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({...prev, email: e.target.value}))}
                required
              />
            </div>
            
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData(prev => ({...prev, password: e.target.value}))}
                required
              />
            </div>

            <div className="flex space-x-2 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                className="flex-1"
                onClick={() => {
                  setShowLoginModal(false);
                  setShowRegisterModal(false);
                }}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                className={`flex-1 ${userType === 'teacher' ? 'bg-primary hover:bg-blue-700' : 'bg-secondary hover:bg-green-600'}`}
              >
                {isLogin ? 'Sign In' : 'Register'}
              </Button>
            </div>
            
            <div className="text-center pt-2">
              <Button
                type="button"
                variant="link"
                onClick={() => {
                  setIsLogin(!isLogin);
                  if (isLogin) {
                    setShowLoginModal(false);
                    setShowRegisterModal(true);
                  } else {
                    setShowRegisterModal(false);
                    setShowLoginModal(true);
                  }
                }}
              >
                {isLogin ? "Don't have an account? Register" : "Already have an account? Sign In"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
