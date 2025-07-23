"use client";

// Mocking shadcn/ui components and lucide-react icons for a self-contained example
// In a real Next.js project, these would be imported from their respective libraries.

// Mocking Avatar components
const Avatar = ({ children, className }) => <div className={`relative rounded-full overflow-hidden ${className}`}>{children}</div>;
const AvatarFallback = ({ children }) => <div className="flex items-center justify-center h-full w-full bg-gray-200 text-gray-600">{children}</div>;
const AvatarImage = ({ src, alt }) => <img src={src} alt={alt} className="object-cover w-full h-full" />;

// Mocking Button component
const Button = ({ children, variant, size, className, onClick, asChild }) => {
  let baseClasses = "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50";
  let variantClasses = "";
  let sizeClasses = "h-10 px-4 py-2";

  switch (variant) {
    case "ghost":
      variantClasses = "hover:bg-accent hover:text-accent-foreground";
      break;
    case "default":
      variantClasses = "bg-primary text-primary-foreground hover:bg-primary/90";
      break;
    // Add more variants if needed
  }

  if (size === "icon") {
    sizeClasses = "h-10 w-10";
  }

  const combinedClasses = `${baseClasses} ${variantClasses} ${sizeClasses} ${className || ''}`;

  if (asChild) {
    return React.cloneElement(children, { className: combinedClasses, onClick });
  }

  return (
    <button className={combinedClasses} onClick={onClick}>
      {children}
    </button>
  );
};

// Mocking Card components
const Card = ({ children, className }) => <div className={`rounded-lg border bg-card text-card-foreground shadow-sm ${className}`}>{children}</div>;
const CardContent = ({ children, className }) => <div className={`p-6 pt-0 ${className}`}>{children}</div>;

// Mocking Separator
const Separator = ({ orientation, className }) => {
  const orientationClass = orientation === "vertical" ? "w-px bg-gray-200" : "h-px bg-gray-200";
  return <div className={`${orientationClass} ${className}`}></div>;
};

// Mocking lucide-react icons
const ArrowUp = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12 7-7 7 7"/><path d="M12 19V5"/></svg>;
const Calendar = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 2v4"/><path d="M16 2v4"/><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M3 10h18"/></svg>;
const Home = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>;
const MapPin = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 12.7a1 1 0 1 0 0-1.4 1 1 0 0 0 0 1.4Z"/><path d="M19.4 15A16.1 16.1 0 0 0 12 2C6.8 2 2 6.1 2 12a10.9 10.9 0 0 0 5 8.7c.8.7 1.5 1.7 2 2.7h6c.5-1 1.2-2 2-2.7a10.9 10.9 0 0 0 5-8.7c0-5.9-4.8-10-10-10Z"/></svg>;
const MessageSquare = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V3a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>;
const PlayCircle = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polygon points="10 8 16 12 10 16 10 8"/></svg>;
const Plus = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14"/><path d="M5 12h14"/></svg>;
const Settings = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>;
const Share2 = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"/><path d="M8.59 11.51L15.42 7.05"/><circle cx="5" cy="12" r="3"/><path d="M15.41 16.95 8.59 12.49"/><circle cx="18" cy="19" r="3"/></svg>;
const Star = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>;
const Wallet = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h12a2 2 0 0 1 0 4H5a2 2 0 0 0 0 4h12a2 2 0 0 0 2-2v-3"/><path d="M10 12h6"/></svg>;

// Mock data for users
const users = [
  {
    id: "user1",
    name: "John Doe",
    type: "provider",
    reputation: 4.8,
    profileImage: "https://i.pravatar.cc/150?img=68" // Example image
  },
  {
    id: "user2",
    name: "Jane Smith",
    type: "customer",
    reputation: 4.5,
    profileImage: "https://i.pravatar.cc/150?img=69" // Example image
  }
];

// Use a static provider user for display purposes to avoid context/state issues.
const displayUser = users.find(u => u.type === 'provider');

export default function ProfilePage() {
    if (!displayUser) {
        return <div>Proveedor no encontrado.</div>
    }
  
  return (
    <div className="bg-background min-h-screen">
      {/* Header */}
      <header className="bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <Avatar className="w-20 h-20 border">
                <AvatarImage src={`https://i.pravatar.cc/150?u=${displayUser.id}`} alt={displayUser.name} />
                <AvatarFallback>U</AvatarFallback>
              </Avatar>
              <div className="absolute bottom-0 right-0 bg-green-500 rounded-full w-6 h-6 flex items-center justify-center border-2 border-white">
                <Plus className="w-4 h-4 text-white" />
              </div>
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-800">{displayUser.name}</h1>
              <p className="text-sm text-gray-500">Especialidad del Proveedor</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Calendar className="text-gray-500" />
            <Wallet className="text-gray-500" />
            <MapPin className="text-gray-500" />
          </div>
        </div>
        <div className="mt-4 flex justify-around items-center text-center text-sm">
           <div className="flex items-center space-x-1">
             <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
             <span className="font-medium">{displayUser.reputation}</span>
           </div>
           <Separator orientation="vertical" className="h-6" />
           <div>
             <p className="font-medium">99.9%</p>
             <p className="text-xs text-gray-500">Efec.</p>
           </div>
            <Separator orientation="vertical" className="h-6" />
           <div>
             <p className="font-medium">00 | 05</p>
             <p className="text-xs text-gray-500">Trab. Realizados</p>
           </div>
            <Separator orientation="vertical" className="h-6" />
           <div>
             <p className="font-medium">30</p>
             <p className="text-xs text-gray-500">Publicaciones</p>
           </div>
        </div>
      </header>

      {/* Campaign Button */}
      <div className="p-4 flex justify-end">
        <Button className="bg-gradient-to-r from-gray-400 to-gray-600 text-white rounded-full text-xs font-medium shadow-md h-8">
          GESTION DE CAMPAÑAS
        </Button>
      </div>

      {/* Main Content */}
      <main className="flex-grow p-4 space-y-6 pb-24">
        <Card className="rounded-xl shadow-md overflow-hidden">
          <CardContent className="p-0 relative">
            <div className="relative w-full h-64">
              {/* Replaced Next.js Image with standard img tag */}
              <img src="https://placehold.co/600x400/a7d9ed/ffffff?text=" alt="Promotional" className="object-cover w-full h-full" />
              <div className="absolute top-4 right-4 flex flex-col items-center space-y-4">
                  <div className="flex flex-col items-center">
                    <Share2 className="text-gray-700 w-6 h-6" />
                    <span className="text-xs text-gray-700 font-semibold">4567</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <Star className="text-yellow-400 fill-yellow-400 w-7 h-7" />
                    <span className="text-sm text-gray-700 font-semibold">8934.5</span>
                  </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <div className="flex justify-around text-gray-700 font-medium text-md">
            <span className="border-b-2 border-green-500 pb-1 text-black font-semibold">Promoción del Día</span>
            <span className="text-gray-500">Editar Descripción</span>
        </div>

        <div className="grid grid-cols-3 gap-3">
            {[...Array(6)].map((_, i) => (
                <div key={i} className="relative aspect-square">
                     {/* Replaced Next.js Image with standard img tag */}
                     <img src="https://placehold.co/200x200/a7d9ed/ffffff?text=" className="object-cover w-full h-full rounded-lg" alt={`promo ${i+1}`} />
                </div>
            ))}
        </div>
      </main>

      {/* Custom Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white p-2 flex justify-around items-center border-t border-gray-200 shadow-lg z-50">
        <Button variant="ghost" className="flex-col h-auto p-1">
            <Home className="w-6 h-6 text-gray-500" />
        </Button>
        <Button variant="ghost" className="flex-col h-auto p-1">
            <PlayCircle className="w-6 h-6 text-gray-500" />
        </Button>
        <div className="relative">
            <Button size="icon" className="relative -top-5 w-16 h-16 bg-white rounded-full shadow-lg border-4 border-background hover:bg-gray-100">
                <ArrowUp className="w-8 h-8 text-green-500" />
            </Button>
        </div>
        <Button variant="ghost" className="flex-col h-auto p-1">
            <MessageSquare className="w-6 h-6 text-gray-500" />
        </Button>
        <Button variant="ghost" className="flex-col h-auto p-1">
            <Settings className="w-6 h-6 text-gray-500" />
        </Button>
      </nav>
    </div>
  );
}
