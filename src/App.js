import React, { useState, useEffect } from 'react';
import { Edit, Plus, X, LogOut, Globe, Facebook, Instagram, Home, Users, Book, Eye, BarChart2, Package } from 'lucide-react';
import { auth } from './firebase';
import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, updateDoc, increment, getDoc, setDoc, collection, getDocs, addDoc, deleteDoc, query, orderBy } from 'firebase/firestore';
import './App.css';

// Initialize Firestore
const db = getFirestore();

const App = () => {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentPage, setCurrentPage] = useState('home');
  const [siteStats, setSiteStats] = useState({
    pageViews: 0,
    blogViews: 0
  });
  const [businesses, setBusinesses] = useState([]);
  const [blogs, setBlogs] = useState([]);
  const [loginCredentials, setLoginCredentials] = useState({ email: '', password: '' });
  const [showBusinessForm, setShowBusinessForm] = useState(false);
  const [showBlogForm, setShowBlogForm] = useState(false);
  const [editingBusiness, setEditingBusiness] = useState(null);
  const [editingBlog, setEditingBlog] = useState(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loginError, setLoginError] = useState('');
  const [selectedBusiness, setSelectedBusiness] = useState(null);
  const [selectedBlog, setSelectedBlog] = useState(null);
  const [activeAdminTab, setActiveAdminTab] = useState('dashboard');

  // Fetch businesses from Firestore
  useEffect(() => {
    const fetchBusinesses = async () => {
      try {
        const businessesCollection = collection(db, 'businesses');
        const businessesSnapshot = await getDocs(businessesCollection);
        const businessesList = businessesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        // If no businesses in Firestore, add sample businesses
        if (businessesList.length === 0) {
          const sampleBusinesses = [
            {
              name: 'Hazara House Restaurant',
              category: 'Restaurant',
              description: 'Authentic Hazara cuisine featuring traditional mantu, ashak, and quroot dishes prepared with family recipes passed down generations.',
              address: '12 Thomas Street',
              phone: '(03) 9793 1234',
              rating: 4.8,
              image: 'https://picsum.photos/400/220',
              website: 'https://hazarahouse.com.au',
              facebook: 'https://facebook.com/hazarahouse',
              instagram: 'https://instagram.com/hazarahouse'
            },
            {
              name: 'Bamiyan Naan Bakery',
              category: 'Bakery',
              description: 'Traditional Hazara breads, including roghani naan, kolcheh, and specialty pastries made fresh daily using ancestral methods.',
              address: '18 Thomas Street',
              phone: '(03) 9791 2345',
              rating: 4.9,
              image: 'https://picsum.photos/400/220',
              website: 'https://bamiyannaan.com.au',
              instagram: 'https://instagram.com/bamiyannaan'
            },
            {
              name: 'Hazaristan Market',
              category: 'Grocery',
              description: 'Specialty store offering Hazara ingredients, dried fruits, pickles, and traditional spices essential for authentic Hazara cooking.',
              address: '24 Thomas Street',
              phone: '(03) 9793 3456',
              rating: 4.7,
              image: 'https://picsum.photos/400/220',
              website: 'https://hazaristanmarket.com.au',
              facebook: 'https://facebook.com/hazaristanmarket'
            }
          ];
          
          // Add sample businesses to Firestore
          for (const business of sampleBusinesses) {
            await addDoc(collection(db, 'businesses'), business);
          }
          
          // Fetch businesses again
          const newSnapshot = await getDocs(businessesCollection);
          const updatedList = newSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          setBusinesses(updatedList);
        } else {
          setBusinesses(businessesList);
        }
      } catch (error) {
        console.error('Error fetching businesses:', error);
      }
    };

    fetchBusinesses();
  }, []);

  // Fetch blogs from Firestore
  useEffect(() => {
    const fetchBlogs = async () => {
      try {
        const blogsCollection = collection(db, 'blogs');
        const blogsQuery = query(blogsCollection, orderBy('date', 'desc'));
        const blogsSnapshot = await getDocs(blogsQuery);
        const blogsList = blogsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        // If no blogs in Firestore, add sample blog
        if (blogsList.length === 0) {
          const sampleBlog = {
            title: 'The History of Bamiyan Valley',
            excerpt: 'Explore the rich cultural heritage of the Bamiyan Valley, the ancestral homeland of the Hazara people...',
            date: '2025-03-15',
            author: 'Admin',
            image: 'https://picsum.photos/400/250',
            content: 'The Bamiyan Valley in central Afghanistan has been a cradle of Hazara culture for centuries. Located along the ancient Silk Road, this picturesque valley once housed the magnificent Bamiyan Buddhas, testament to the region\'s rich history and cultural significance. The valley\'s strategic position made it an important trade and cultural hub, connecting East and West.\n\nFor the Hazara people, Bamiyan represents more than just geographic significance. It embodies their resilience, heritage, and identity. The terraced agricultural fields, distinctive architecture, and traditional practices reflect generations of adaptation to the mountainous terrain. From the intricately carved caves to the breathtaking landscape, every aspect of Bamiyan resonates with the story of the Hazara people.\n\nDespite facing numerous challenges throughout history, the cultural traditions of Bamiyan continue to thrive. Traditional music played on the dambura, unique culinary practices, and vibrant festivals celebrate the enduring spirit of the Hazara community. These traditions have crossed oceans and continents, finding new homes in places like Melbourne\'s Little Bamiyan.\n\nToday, the Bamiyan Valley remains a symbol of cultural resilience and heritage for Hazara people worldwide. While the physical landscape may be distant for many in the diaspora, the cultural connection remains strong, passed down through generations and celebrated in communities like ours. At Little Bamiyan in Dandenong, we strive to honor and preserve these connections to our ancestral homeland, ensuring that the rich legacy of Bamiyan continues to inspire future generations.',
            views: 156
          };
          
          // Add sample blog to Firestore
          await addDoc(collection(db, 'blogs'), sampleBlog);
          
          // Fetch blogs again
          const newSnapshot = await getDocs(blogsQuery);
          const updatedList = newSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          setBlogs(updatedList);
        } else {
          setBlogs(blogsList);
        }
      } catch (error) {
        console.error('Error fetching blogs:', error);
      }
    };

    fetchBlogs();
  }, []);

  // Authentication observer
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUser(user);
        setIsAdmin(true); // Any authenticated user is admin
      } else {
        setUser(null);
        setIsAdmin(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Add the page view tracking effect
  useEffect(() => {
    const trackPageView = async () => {
      try {
        const statsRef = doc(db, 'analytics', 'stats');
        
        // Check if document exists
        const statsSnap = await getDoc(statsRef);
        
        if (statsSnap.exists()) {
          // Update existing document
          await updateDoc(statsRef, {
            pageViews: increment(1)
          });
        } else {
          // Create new document
          await setDoc(statsRef, {
            pageViews: 1,
            blogViews: 0
          });
        }
      } catch (error) {
        console.error('Error tracking page view:', error);
      }
    };

    trackPageView();
  }, []);

  // Add the stats fetching effect
  useEffect(() => {
    const fetchStats = async () => {
      if (currentPage === 'admin') {
        try {
          const statsRef = doc(db, 'analytics', 'stats');
          const statsSnap = await getDoc(statsRef);
          
          if (statsSnap.exists()) {
            setSiteStats(statsSnap.data());
          }
        } catch (error) {
          console.error('Error fetching stats:', error);
        }
      }
    };
    
    fetchStats();
  }, [currentPage]);

  // Scroll handler
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 100);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Handle login
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    try {
      await signInWithEmailAndPassword(
        auth, 
        loginCredentials.email, 
        loginCredentials.password
      );
      
      setCurrentPage('admin');
      setLoginCredentials({ email: '', password: '' });
    } catch (error) {
      console.error('Login error:', error);
      setLoginError('Invalid credentials.');
    }
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      await signOut(auth);
      setCurrentPage('home');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Business management functions
  const handleAddBusiness = async (business) => {
    try {
      if (editingBusiness) {
        // Update existing business in Firestore
        const businessRef = doc(db, 'businesses', editingBusiness.id);
        await updateDoc(businessRef, business);
        
        // Update business in state
        setBusinesses(businesses.map(b => b.id === editingBusiness.id ? { ...business, id: editingBusiness.id } : b));
        setEditingBusiness(null);
      } else {
        // Add new business to Firestore
        const docRef = await addDoc(collection(db, 'businesses'), business);
        
        // Add business to state
        setBusinesses([...businesses, { ...business, id: docRef.id }]);
      }
      setShowBusinessForm(false);
    } catch (error) {
      console.error('Error saving business:', error);
      alert('Failed to save business. Please try again.');
    }
  };

  const handleDeleteBusiness = async (id) => {
    if (window.confirm('Are you sure you want to delete this business?')) {
      try {
        // Delete business from Firestore
        await deleteDoc(doc(db, 'businesses', id));
        
        // Remove business from state
        setBusinesses(businesses.filter(b => b.id !== id));
      } catch (error) {
        console.error('Error deleting business:', error);
        alert('Failed to delete business. Please try again.');
      }
    }
  };

  const handleAddBlog = async (blog) => {
    try {
      if (editingBlog) {
        // Update existing blog in Firestore
        const blogRef = doc(db, 'blogs', editingBlog.id);
        await updateDoc(blogRef, {
          ...blog,
          views: editingBlog.views || 0
        });
        
        // Update blog in state
        setBlogs(blogs.map(b => b.id === editingBlog.id ? { 
          ...blog, 
          id: editingBlog.id, 
          views: editingBlog.views || 0 
        } : b));
        setEditingBlog(null);
      } else {
        // Add new blog to Firestore
        const newBlog = {
          ...blog,
          date: new Date().toISOString().split('T')[0],
          author: 'Admin',
          views: 0
        };
        
        const docRef = await addDoc(collection(db, 'blogs'), newBlog);
        
        // Add blog to state
        setBlogs([...blogs, { ...newBlog, id: docRef.id }]);
      }
      setShowBlogForm(false);
    } catch (error) {
      console.error('Error saving blog:', error);
      alert('Failed to save blog post. Please try again.');
    }
  };

  const handleDeleteBlog = async (id) => {
    if (window.confirm('Are you sure you want to delete this blog post?')) {
      try {
        // Delete blog from Firestore
        await deleteDoc(doc(db, 'blogs', id));
        
        // Remove blog from state
        setBlogs(blogs.filter(b => b.id !== id));
      } catch (error) {
        console.error('Error deleting blog:', error);
        alert('Failed to delete blog post. Please try again.');
      }
    }
  };

  // Replace your existing handleBlogClick function with this one
  const handleBlogClick = async (blog) => {
    setSelectedBlog(blog);
    
    try {
      // Update blog view count in state
      const updatedBlogs = blogs.map(b => b.id === blog.id ? { ...b, views: (b.views || 0) + 1 } : b);
      setBlogs(updatedBlogs);
      
      // Update blog view count in Firestore
      const blogRef = doc(db, 'blogs', blog.id);
      await updateDoc(blogRef, {
        views: increment(1)
      });
      
      // Update total blog views
      const statsRef = doc(db, 'analytics', 'stats');
      await updateDoc(statsRef, {
        blogViews: increment(1)
      });
    } catch (error) {
      console.error('Error tracking blog view:', error);
    }
  };

  // Components
  // Updated Navigation component with fixed navigation logic
  const Navigation = () => (
    <nav className={isScrolled ? 'scrolled' : ''}>
      <div className="container">
        <div className="nav-container">
          <div className="logo-container">
            <a href="#" onClick={(e) => { e.preventDefault(); setCurrentPage('home'); }}>
              <img src="./logo.png" alt="Little Bamiyan Logo" className="logo" />
            </a>
            <div className="logo-text">
              <h3 className="logo-name">Little Bamiyan</h3>
              <div className="tagline">Hazara Cultural Heritage Center</div>
            </div>
          </div>
          <button className="nav-toggle" onClick={() => setIsMenuOpen(!isMenuOpen)}>☰</button>
          <ul className={`nav-menu ${isMenuOpen ? 'open' : ''}`}>
            <li><a href="#" onClick={(e) => { e.preventDefault(); setCurrentPage('home'); }} className={currentPage === 'home' ? 'active' : ''}>Home</a></li>
            <li><a href="#" onClick={(e) => { 
              e.preventDefault(); 
              setCurrentPage('home'); 
              // Use setTimeout to ensure the element exists before trying to scroll to it
              setTimeout(() => {
                const element = document.getElementById('about');
                if (element) element.scrollIntoView({behavior: 'smooth'});
              }, 100);
            }}>About</a></li>
            <li><a href="#" onClick={(e) => { 
              e.preventDefault(); 
              setCurrentPage('home'); 
              // Use setTimeout to ensure the element exists before trying to scroll to it
              setTimeout(() => {
                const element = document.getElementById('businesses');
                if (element) element.scrollIntoView({behavior: 'smooth'});
              }, 100);
            }}>Businesses</a></li>
            <li><a href="#" onClick={(e) => { 
              e.preventDefault(); 
              setCurrentPage('home'); 
              // Use setTimeout to ensure the element exists before trying to scroll to it
              setTimeout(() => {
                const element = document.getElementById('events');
                if (element) element.scrollIntoView({behavior: 'smooth'});
              }, 100);
            }}>Events</a></li>
            <li><a href="#" onClick={(e) => { e.preventDefault(); setCurrentPage('blog'); setSelectedBlog(null); }} className={currentPage === 'blog' ? 'active' : ''}>Blog</a></li>
            <li><a href="#" onClick={(e) => { 
              e.preventDefault(); 
              setCurrentPage('home'); 
              // Use setTimeout to ensure the element exists before trying to scroll to it
              setTimeout(() => {
                const element = document.getElementById('visit');
                if (element) element.scrollIntoView({behavior: 'smooth'});
              }, 100);
            }}>Visit Us</a></li>
            {!isAdmin && (
              <li><a href="#" onClick={(e) => { e.preventDefault(); setCurrentPage('login'); }} className={currentPage === 'login' ? 'active' : ''}>Admin</a></li>
            )}
            {isAdmin && (
              <li>
                <a href="#" onClick={(e) => { e.preventDefault(); setCurrentPage('admin'); }} className={currentPage === 'admin' ? 'active' : ''}>Dashboard</a>
              </li>
            )}
            {isAdmin && (
              <li>
                <button onClick={handleLogout} style={{background: 'none', border: 'none', fontWeight: 600, cursor: 'pointer', color: 'var(--accent)'}}>
                  <LogOut className="w-4 h-4 mr-2" style={{display: 'inline'}} />
                  Logout
                </button>
              </li>
            )}
          </ul>
        </div>
      </div>
    </nav>
  );

  const LoginPage = () => {
    // Move the login state and handler into the component itself
    const [localLoginState, setLocalLoginState] = useState({ 
      email: '', 
      password: '' 
    });
    const [localLoginError, setLocalLoginError] = useState('');
  
    // Local login handler that only updates parent state after submission
    const handleLocalLogin = async (e) => {
      e.preventDefault();
      setLocalLoginError('');
      
      try {
        await signInWithEmailAndPassword(
          auth, 
          localLoginState.email, 
          localLoginState.password
        );
        
        setCurrentPage('admin');
        // Only update parent state after successful login
        setLoginCredentials({ email: '', password: '' });
      } catch (error) {
        console.error('Login error:', error);
        setLocalLoginError('Invalid credentials.');
      }
    };
  
    return (
      <section className="login-page" style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
        <div className="container" style={{ maxWidth: '400px' }}>
          <h2 style={{ textAlign: 'center', marginBottom: '2rem' }}>Admin Login</h2>
          <form onSubmit={handleLocalLogin} style={{ background: 'white', padding: '2rem', borderRadius: '1rem', boxShadow: '0 15px 50px rgba(0,0,0,0.1)' }}>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input 
                type="email" 
                className="form-input"
                value={localLoginState.email}
                onChange={(e) => setLocalLoginState({...localLoginState, email: e.target.value})}
                required
                placeholder="Enter your email"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input 
                type="password" 
                className="form-input"
                value={localLoginState.password}
                onChange={(e) => setLocalLoginState({...localLoginState, password: e.target.value})}
                required
                placeholder="Enter your password"
              />
            </div>
            {localLoginError && (
              <div style={{ color: 'red', marginBottom: '1rem', textAlign: 'center' }}>
                {localLoginError}
              </div>
            )}
            <button type="submit" className="form-submit" style={{ width: '100%' }}>Login</button>
          </form>
          <p style={{ textAlign: 'center', marginTop: '1rem' }}>
            <a href="#" onClick={(e) => { e.preventDefault(); setCurrentPage('home'); }} style={{ color: 'var(--primary)' }}>← Back to Home</a>
          </p>
        </div>
      </section>
    );
  };

  const AdminPage = () => (
    <section className="admin-page" style={{ padding: '2rem 0', minHeight: '80vh' }}>
      <div className="container">
        <h2 style={{ marginBottom: '2rem' }}>Admin Dashboard</h2>
        
        <div className="admin-tabs" style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
          <button 
            onClick={() => setActiveAdminTab('dashboard')} 
            className={`admin-tab ${activeAdminTab === 'dashboard' ? 'active' : ''}`}
            style={{ 
              padding: '0.75rem 1.5rem', 
              borderRadius: '0.5rem', 
              border: 'none',
              background: activeAdminTab === 'dashboard' ? 'var(--primary)' : '#f0f0f0',
              color: activeAdminTab === 'dashboard' ? 'white' : 'var(--text)',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              cursor: 'pointer'
            }}
          >
            <BarChart2 size={16} />
            Dashboard
          </button>
          <button 
            onClick={() => setActiveAdminTab('businesses')} 
            className={`admin-tab ${activeAdminTab === 'businesses' ? 'active' : ''}`}
            style={{ 
              padding: '0.75rem 1.5rem', 
              borderRadius: '0.5rem', 
              border: 'none',
              background: activeAdminTab === 'businesses' ? 'var(--primary)' : '#f0f0f0',
              color: activeAdminTab === 'businesses' ? 'white' : 'var(--text)',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              cursor: 'pointer'
            }}
          >
            <Package size={16} />
            Businesses
          </button>
          <button 
            onClick={() => setActiveAdminTab('blogs')} 
            className={`admin-tab ${activeAdminTab === 'blogs' ? 'active' : ''}`}
            style={{ 
              padding: '0.75rem 1.5rem', 
              borderRadius: '0.5rem', 
              border: 'none',
              background: activeAdminTab === 'blogs' ? 'var(--primary)' : '#f0f0f0',
              color: activeAdminTab === 'blogs' ? 'white' : 'var(--text)',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              cursor: 'pointer'
            }}
          >
            <Book size={16} />
            Blogs
          </button>
        </div>
        
        {activeAdminTab === 'dashboard' && (
          <div className="dashboard-content">
            <div className="stats-grid" style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', 
              gap: '1.5rem',
              marginBottom: '2rem'
            }}>
              <div className="stat-card" style={{ 
                background: 'white', 
                padding: '1.5rem', 
                borderRadius: '0.5rem', 
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
              }}>
                <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Eye size={20} color="var(--primary)" />
                  <h3 style={{ fontSize: '1.2rem', fontWeight: '600' }}>Total Website Views</h3>
                </div>
                <p style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--primary)' }}>{siteStats.pageViews || 0}</p>
              </div>
              
              <div className="stat-card" style={{ 
                background: 'white', 
                padding: '1.5rem', 
                borderRadius: '0.5rem', 
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
              }}>
                <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Package size={20} color="var(--primary)" />
                  <h3 style={{ fontSize: '1.2rem', fontWeight: '600' }}>Businesses Listed</h3>
                </div>
                <p style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--primary)' }}>{businesses.length}</p>
              </div>
              
              <div className="stat-card" style={{ 
                background: 'white', 
                padding: '1.5rem', 
                borderRadius: '0.5rem', 
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
              }}>
                <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Book size={20} color="var(--primary)" />
                  <h3 style={{ fontSize: '1.2rem', fontWeight: '600' }}>Blog Posts</h3>
                </div>
                <p style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--primary)' }}>{blogs.length}</p>
              </div>
              
              <div className="stat-card" style={{ 
                background: 'white', 
                padding: '1.5rem', 
                borderRadius: '0.5rem', 
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
              }}>
                <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Eye size={20} color="var(--primary)" />
                  <h3 style={{ fontSize: '1.2rem', fontWeight: '600' }}>Total Blog Views</h3>
                </div>
                <p style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--primary)' }}>
                  {siteStats.blogViews || 0}
                </p>
              </div>
            </div>
            
            <div className="recent-activity" style={{ background: 'white', padding: '1.5rem', borderRadius: '0.5rem', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)' }}>
              <h3 style={{ marginBottom: '1rem', fontSize: '1.3rem', fontWeight: '600' }}>Top Blog Posts by Views</h3>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #eee' }}>
                    <th style={{ padding: '0.75rem', textAlign: 'left' }}>Title</th>
                    <th style={{ padding: '0.75rem', textAlign: 'left' }}>Date</th>
                    <th style={{ padding: '0.75rem', textAlign: 'right' }}>Views</th>
                  </tr>
                </thead>
                <tbody>
                  {[...blogs].sort((a, b) => (b.views || 0) - (a.views || 0)).map(blog => (
                    <tr key={blog.id} style={{ borderBottom: '1px solid #eee' }}>
                      <td style={{ padding: '0.75rem' }}>{blog.title}</td>
                      <td style={{ padding: '0.75rem' }}>{blog.date}</td>
                      <td style={{ padding: '0.75rem', textAlign: 'right' }}>{blog.views || 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        
        {activeAdminTab === 'businesses' && (
          <div className="businesses-content">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.3rem', fontWeight: '600' }}>Manage Businesses</h3>
              <button onClick={() => setShowBusinessForm(true)} className="add-btn">
                <Plus size={20} />
                Add Business
              </button>
            </div>
            
            <div className="admin-business-list" style={{ background: 'white', borderRadius: '0.5rem', overflow: 'hidden', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f9f9f9', borderBottom: '2px solid #eee' }}>
                    <th style={{ padding: '0.75rem', textAlign: 'left' }}>Name</th>
                    <th style={{ padding: '0.75rem', textAlign: 'left' }}>Category</th>
                    <th style={{ padding: '0.75rem', textAlign: 'left' }}>Address</th>
                    <th style={{ padding: '0.75rem', textAlign: 'center' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {businesses.map(business => (
                    <tr key={business.id} style={{ borderBottom: '1px solid #eee' }}>
                      <td style={{ padding: '0.75rem' }}>{business.name}</td>
                      <td style={{ padding: '0.75rem' }}>{business.category}</td>
                      <td style={{ padding: '0.75rem' }}>{business.address}</td>
                      <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
                          <button 
                            onClick={() => {
                              setEditingBusiness(business);
                              setShowBusinessForm(true);
                            }}
                            style={{ background: '#f0f0f0', border: 'none', borderRadius: '4px', padding: '0.5rem', cursor: 'pointer' }}
                          >
                            <Edit size={16} />
                          </button>
                          <button 
                            onClick={() => handleDeleteBusiness(business.id)}
                            style={{ background: '#f0f0f0', border: 'none', borderRadius: '4px', padding: '0.5rem', cursor: 'pointer' }}
                          >
                            <X size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        
        {activeAdminTab === 'blogs' && (
          <div className="blogs-content">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.3rem', fontWeight: '600' }}>Manage Blog Posts</h3>
              <button onClick={() => setShowBlogForm(true)} className="add-btn">
                <Plus size={20} />
                Add Blog Post
              </button>
            </div>
            
            <div className="admin-blog-list" style={{ background: 'white', borderRadius: '0.5rem', overflow: 'hidden', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f9f9f9', borderBottom: '2px solid #eee' }}>
                    <th style={{ padding: '0.75rem', textAlign: 'left' }}>Title</th>
                    <th style={{ padding: '0.75rem', textAlign: 'left' }}>Date</th>
                    <th style={{ padding: '0.75rem', textAlign: 'right' }}>Views</th>
                    <th style={{ padding: '0.75rem', textAlign: 'center' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {blogs.map(blog => (
                    <tr key={blog.id} style={{ borderBottom: '1px solid #eee' }}>
                      <td style={{ padding: '0.75rem' }}>{blog.title}</td>
                      <td style={{ padding: '0.75rem' }}>{blog.date}</td>
                      <td style={{ padding: '0.75rem', textAlign: 'right' }}>{blog.views || 0}</td>
                      <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
                          <button 
                            onClick={() => {
                              setEditingBlog(blog);
                              setShowBlogForm(true);
                            }}
                            style={{ background: '#f0f0f0', border: 'none', borderRadius: '4px', padding: '0.5rem', cursor: 'pointer' }}
                          >
                            <Edit size={16} />
                          </button>
                          <button 
                            onClick={() => handleDeleteBlog(blog.id)}
                            style={{ background: '#f0f0f0', border: 'none', borderRadius: '4px', padding: '0.5rem', cursor: 'pointer' }}
                          >
                            <X size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </section>
  );

  const BusinessForm = () => {
    const [formData, setFormData] = useState(editingBusiness || {
      name: '',
      category: '',
      description: '',
      address: '',
      phone: '',
      rating: 4.5,
      image: 'https://picsum.photos/400/220',
      website: '',
      facebook: '',
      instagram: ''
    });

    const handleSubmit = (e) => {
      e.preventDefault();
      handleAddBusiness(formData);
    };

    return (
      <div className="modal-overlay">
        <div className="modal-content">
          <div className="modal-header">
            <h2 className="modal-title">{editingBusiness ? 'Edit Business' : 'Add New Business'}</h2>
            <button onClick={() => {
              setShowBusinessForm(false);
              setEditingBusiness(null);
            }} className="modal-close">
              <X className="w-6 h-6" />
            </button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="form-grid">
            <div className="form-group">
                <label className="form-label">Business Name</label>
                <input 
                  type="text" 
                  className="form-input"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Category</label>
                <select 
                  className="form-select"
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                  required
                >
                  <option value="">Select Category</option>
                  <option value="Restaurant">Restaurant</option>
                  <option value="Bakery">Bakery</option>
                  <option value="Grocery">Grocery</option>
                  <option value="Fashion">Fashion</option>
                  <option value="Cafe">Cafe</option>
                  <option value="Services">Services</option>
                </select>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea 
                className="form-textarea"
                rows="3"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                required
              />
            </div>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Address</label>
                <input 
                  type="text" 
                  className="form-input"
                  value={formData.address}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Phone</label>
                <input 
                  type="text" 
                  className="form-input"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Rating</label>
                <input 
                  type="number" 
                  step="0.1"
                  min="0"
                  max="5"
                  className="form-input"
                  value={formData.rating}
                  onChange={(e) => setFormData({...formData, rating: parseFloat(e.target.value)})}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Image URL</label>
                <input 
                  type="text" 
                  className="form-input"
                  value={formData.image}
                  onChange={(e) => setFormData({...formData, image: e.target.value})}
                  placeholder="https://picsum.photos/400/220"
                />
              </div>
            </div>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Website URL</label>
                <input 
                  type="url" 
                  className="form-input"
                  value={formData.website || ''}
                  onChange={(e) => setFormData({...formData, website: e.target.value})}
                  placeholder="https://example.com"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Facebook URL</label>
                <input 
                  type="url" 
                  className="form-input"
                  value={formData.facebook || ''}
                  onChange={(e) => setFormData({...formData, facebook: e.target.value})}
                  placeholder="https://facebook.com/page"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Instagram URL</label>
                <input 
                  type="url" 
                  className="form-input"
                  value={formData.instagram || ''}
                  onChange={(e) => setFormData({...formData, instagram: e.target.value})}
                  placeholder="https://instagram.com/page"
                />
              </div>
            </div>
            <button type="submit" className="form-submit">
              {editingBusiness ? 'Update Business' : 'Add Business'}
            </button>
          </form>
        </div>
      </div>
    );
  };

  const BusinessPreviewModal = ({ business, onClose }) => {
    return (
      <div className="modal-overlay">
        <div className="modal-content business-preview-modal">
          <div className="modal-header">
            <h2 className="modal-title">{business.name}</h2>
            <button onClick={onClose} className="modal-close">
              <X className="w-6 h-6" />
            </button>
          </div>
          <div className="modal-body">
            <div className="business-preview-image">
              <img src={business.image} alt={business.name} />
              <span className="business-category">{business.category}</span>
            </div>
            <div className="business-preview-details">
              <p className="business-description">{business.description}</p>
              <div className="business-info-grid">
                <div className="business-info-item">
                  <strong>Address:</strong>
                  <p>{business.address}</p>
                </div>
                <div className="business-info-item">
                  <strong>Phone:</strong>
                  <p><a href={`tel:${business.phone}`}>{business.phone}</a></p>
                </div>
                <div className="business-info-item">
                  <strong>Rating:</strong>
                  <p className="business-rating">{business.rating} / 5</p>
                </div>
              </div>
              
              <div className="business-links">
                <h3>Visit Us Online</h3>
                <div className="social-links-grid">
                  {business.website && (
                    <a href={business.website} target="_blank" rel="noopener noreferrer" className="social-link">
                      <Globe size={20} />
                      <span>Website</span>
                    </a>
                  )}
                  {business.facebook && (
                    <a href={business.facebook} target="_blank" rel="noopener noreferrer" className="social-link">
                      <Facebook size={20} />
                      <span>Facebook</span>
                    </a>
                  )}
                  {business.instagram && (
                    <a href={business.instagram} target="_blank" rel="noopener noreferrer" className="social-link">
                      <Instagram size={20} />
                      <span>Instagram</span>
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const BlogForm = () => {
    const [formData, setFormData] = useState(editingBlog || {
      title: '',
      excerpt: '',
      content: '',
      image: 'https://picsum.photos/400/250'
    });

    const handleSubmit = (e) => {
      e.preventDefault();
      handleAddBlog(formData);
    };

    return (
      <div className="modal-overlay">
        <div className="modal-content">
          <div className="modal-header">
            <h2 className="modal-title">{editingBlog ? 'Edit Blog Post' : 'Add New Blog Post'}</h2>
            <button onClick={() => {
              setShowBlogForm(false);
              setEditingBlog(null);
            }} className="modal-close">
              <X className="w-6 h-6" />
            </button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Title</label>
              <input 
                type="text" 
                className="form-input"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Excerpt</label>
              <textarea 
                className="form-textarea"
                rows="2"
                value={formData.excerpt}
                onChange={(e) => setFormData({...formData, excerpt: e.target.value})}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Content</label>
              <textarea 
                className="form-textarea"
                rows="10"
                value={formData.content}
                onChange={(e) => setFormData({...formData, content: e.target.value})}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Image URL</label>
              <input 
                type="text" 
                className="form-input"
                value={formData.image}
                onChange={(e) => setFormData({...formData, image: e.target.value})}
                placeholder="https://picsum.photos/400/250"
              />
            </div>
            <button type="submit" className="form-submit">
              {editingBlog ? 'Update Blog Post' : 'Add Blog Post'}
            </button>
          </form>
        </div>
      </div>
    );
  };

  const BlogView = ({ blog, onClose }) => {
    return (
      <div className="blog-view-container" style={{ padding: '2rem 0' }}>
        <div className="container">
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            marginBottom: '1.5rem',
            borderBottom: '1px solid #eee',
            paddingBottom: '1rem'
          }}>
            <a 
              href="#" 
              onClick={(e) => { 
                e.preventDefault(); 
                onClose(); 
              }}
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.5rem', 
                color: 'var(--accent)',
                textDecoration: 'none',
                fontWeight: '600'
              }}
            >
              ← Back to blog
            </a>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#888' }}>
              <Eye size={16} />
              <span>{blog.views || 0} views</span>
            </div>
          </div>
          
          <div className="blog-post-header" style={{ marginBottom: '2rem' }}>
            <h1 style={{ fontSize: '2.5rem', color: 'var(--primary)', marginBottom: '1rem' }}>{blog.title}</h1>
            <div style={{ color: '#666', marginBottom: '1.5rem' }}>
              Published on {blog.date} • By {blog.author}
            </div>
          </div>
          
          <div className="blog-post-image" style={{ marginBottom: '2rem', borderRadius: '0.5rem', overflow: 'hidden' }}>
            <img src={blog.image} alt={blog.title} style={{ width: '100%', height: 'auto', maxHeight: '400px', objectFit: 'cover' }} />
          </div>
          
          <div className="blog-post-content" style={{ fontSize: '1.1rem', lineHeight: '1.8', color: '#333' }}>
            {blog.content.split('\n\n').map((paragraph, idx) => (
              <p key={idx} style={{ marginBottom: '1.5rem' }}>{paragraph}</p>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const Hero = () => (
    <section className="hero" id="home">
      <div className="hero-content">
        <h1>Experience Little Bamiyan</h1>
        <p>Discover the vibrant culture, authentic cuisine, and warm hospitality of Melbourne's Hazara cultural heart</p>
        <a href="#businesses" className="cta-button">Explore The Bazaar</a>
      </div>
    </section>
  );

  const About = () => (
    <section className="about" id="about">
      <div className="container">
        <h2>About Little Bamiyan</h2>
        <div className="about-content">
          <div className="about-text">
            <p>Little Bamiyan, named after the historic valley in central Afghanistan that has been home to Hazara people for centuries, is Melbourne's premier Hazara cultural precinct on Thomas Street in Dandenong. Our community honors the resilience, culture, and traditions of the Hazara people.</p>
            <p>Since early 2000s, Hazara families have transformed this area into a vibrant hub celebrating our distinctive culture, language, and heritage. Our community's journey from the mountains of central Afghanistan to Melbourne has enriched the multicultural tapestry of Greater Dandenong.</p>
            <p>Today, Little Bamiyan serves as a cultural bridge, offering authentic Hazara cuisine, traditional music and arts, and a warm community spirit that welcomes all visitors to experience our unique heritage and centuries-old traditions.</p>
          </div>
          <div className="about-image">
            <img src="https://picsum.photos/600/400" alt="Little Bamiyan Hazara Community" />
          </div>
        </div>
      </div>
    </section>
  );

  const Businesses = () => (
    <section className="businesses" id="businesses">
      <div className="container">
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem'}}>
          <h2>Business Directory</h2>
          {isAdmin && (
            <button onClick={() => setShowBusinessForm(true)} className="add-btn">
              <Plus size={20} />
              Add Business
            </button>
          )}
        </div>
        
        <div className="filters">
          <button className="filter-btn active">All</button>
          <button className="filter-btn">Restaurants</button>
          <button className="filter-btn">Bakeries</button>
          <button className="filter-btn">Groceries</button>
          <button className="filter-btn">Fashion</button>
          <button className="filter-btn">Services</button>
        </div>
        
        <div className="business-directory">
          {businesses.map(business => (
            <div key={business.id} className="business-card" onClick={() => setSelectedBusiness(business)}>
              <div className="business-image">
                <img src={business.image} alt={business.name} />
                <span className="business-category">{business.category}</span>
                {isAdmin && (
                  <div className="admin-controls" onClick={(e) => e.stopPropagation()}>
                    <button onClick={() => {
                      setEditingBusiness(business);
                      setShowBusinessForm(true);
                    }} className="admin-btn">
                      <Edit size={16} />
                    </button>
                    <button onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteBusiness(business.id);
                    }} className="admin-btn">
                      <X size={16} />
                    </button>
                  </div>
                )}
              </div>
              <div className="business-info">
                <h3>{business.name}</h3>
                <p>{business.description}</p>
                <p><strong>Address:</strong> {business.address}</p>
                <div className="business-meta">
                  <div className="business-rating">{business.rating}</div>
                  <a 
                    href={`tel:${business.phone}`} 
                    className="business-phone" 
                    onClick={(e) => e.stopPropagation()}
                  >
                    {business.phone}
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );

  const Events = () => (
    <section className="events" id="events">
      <div className="event-circles">
        <div className="event-circle"></div>
        <div className="event-circle"></div>
        <div className="event-circle"></div>
      </div>
      <div className="container events-container">
        <h2>Upcoming Events</h2>
        <div className="event-list">
          <div className="event-card">
            <div className="event-date">April, 2025</div>
            <div className="event-title">Nowroz Celebration</div>
            <p>Join us for the New Year celebration and community festivities.</p>
          </div>
        </div>
      </div>
    </section>
  );

  const BlogSection = () => {
    // If a specific blog is selected, show the full blog view
    if (selectedBlog) {
      return <BlogView blog={selectedBlog} onClose={() => setSelectedBlog(null)} />;
    }
    
    // Otherwise show the blog listing
    return (
      <section className="blog" id="blog">
        <div className="container">
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem'}}>
            <h2>Little Bamiyan Blog</h2>
            {isAdmin && (
              <button onClick={() => setShowBlogForm(true)} className="add-btn">
                <Plus size={20} />
                Add Blog Post
              </button>
            )}
          </div>
          
          <div className="blog-grid">
            {blogs.map(blog => (
              <div key={blog.id} className="blog-card" onClick={() => handleBlogClick(blog)}>
                <div className="blog-image" style={{position: 'relative'}}>
                  <img src={blog.image} alt={blog.title} />
                  {isAdmin && (
                    <div className="admin-controls" onClick={(e) => e.stopPropagation()}>
                      <button onClick={(e) => {
                        e.stopPropagation();
                        setEditingBlog(blog);
                        setShowBlogForm(true);
                      }} className="admin-btn">
                        <Edit size={16} />
                      </button>
                      <button onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteBlog(blog.id);
                      }} className="admin-btn">
                        <X size={16} />
                      </button>
                    </div>
                  )}
                </div>
                <div className="blog-info">
                  <div className="blog-meta">{blog.date} • By {blog.author} • {blog.views || 0} views</div>
                  <h3 className="blog-title">{blog.title}</h3>
                  <p className="blog-excerpt">{blog.excerpt}</p>
                  <a href="#" onClick={(e) => {
                    e.preventDefault();
                    handleBlogClick(blog);
                  }} className="blog-link">Read more →</a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  };

  const Visit = () => (
    <section className="visit-section" id="visit">
      <div className="container">
        <h2>Visit Little Bamiyan</h2>
        <div className="visit-content">
          <div className="visit-info">
            <h3>How to Find Us</h3>
            <p>Little Bamiyan Hazara precinct is located on Thomas Street in Dandenong, approximately 30km southeast of Melbourne CBD.</p>
            
            <h3>Public Transport</h3>
            <p>Dandenong Station is within walking distance (approximately 10 minutes), served by multiple train lines and bus routes from central Melbourne.</p>
            
            <h3>Parking</h3>
            <p>Street parking is available on Thomas Street and surrounding areas. Public parking lots are located within a short walking distance.</p>
            
            <h3>Best Times to Visit</h3>
            <p>Experience the vibrant community atmosphere on weekends, especially Saturday mornings. Most restaurants and businesses are open seven days a week, with cultural events frequently held on weekends.</p>
          </div>
          
          <div className="visit-map">
            <iframe 
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3137.867492073104!2d145.21351561532213!3d-37.98779297972094!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x6ad6150fb96dea39%3A0x9d6f920f3a8e7eef!2sThomas%20St%2C%20Dandenong%20VIC%203175%2C%20Australia!5e0!3m2!1sen!2sus!4v1651234567890!5m2!1sen!2sus" 
              width="100%" 
              height="100%" 
              style={{border:0, borderRadius: '20px'}} 
              allowFullScreen="" 
              loading="lazy" 
              referrerPolicy="no-referrer-when-downgrade"
              title="Little Bamiyan Location Map"
            />
          </div>
        </div>
      </div>
    </section>
  );

  // Updated Footer component with the same navigation fix
  const Footer = () => (
    <footer id="contact">
      <div className="footer-pattern"></div>
      <div className="container">
        <div className="footer-top">
          <div className="footer-logo">
            <img src="./logo.png" alt="Little Bamiyan Logo" className="footer-logo-img" />
            <div className="footer-tagline">Hazara Cultural Heritage Center</div>
          </div>
          
          <div className="footer-nav">
            <div className="footer-nav-column">
              <h4>Explore</h4>
              <a href="#" onClick={(e) => { e.preventDefault(); setCurrentPage('home'); }}>Home</a>
              <a href="#" onClick={(e) => { 
                e.preventDefault(); 
                setCurrentPage('home'); 
                setTimeout(() => {
                  const element = document.getElementById('about');
                  if (element) element.scrollIntoView({behavior: 'smooth'});
                }, 100); 
              }}>About</a>
              <a href="#" onClick={(e) => { 
                e.preventDefault(); 
                setCurrentPage('home'); 
                setTimeout(() => {
                  const element = document.getElementById('businesses');
                  if (element) element.scrollIntoView({behavior: 'smooth'});
                }, 100); 
              }}>Businesses</a>
              <a href="#" onClick={(e) => { 
                e.preventDefault(); 
                setCurrentPage('home'); 
                setTimeout(() => {
                  const element = document.getElementById('events');
                  if (element) element.scrollIntoView({behavior: 'smooth'});
                }, 100); 
              }}>Events</a>
              <a href="#" onClick={(e) => { 
                e.preventDefault(); 
                setCurrentPage('home'); 
                setTimeout(() => {
                  const element = document.getElementById('visit');
                  if (element) element.scrollIntoView({behavior: 'smooth'});
                }, 100); 
              }}>Visit</a>
            </div>
            
            <div className="footer-nav-column">
              <h4>Community</h4>
              <a href="#" onClick={(e) => { e.preventDefault(); setCurrentPage('blog'); setSelectedBlog(null); }}>Hazara News</a>
              <a href="#">Cultural Resources</a>
              <a href="#">Hazara Association</a>
              <a href="#">Volunteer</a>
            </div>
          </div>
          
          <div className="footer-subscribe">
            <h4>Stay Connected</h4>
            <form className="footer-form">
              <input type="email" placeholder="Your email address" className="footer-input" />
              <button type="submit" className="footer-button">Subscribe</button>
            </form>
          </div>
        </div>
        
        <div className="footer-bottom">
          <div className="footer-info">
            <p>Thomas Street, Dandenong, VIC 3175 | Phone: (03) 9793 0000 | Email: info@littlebamiyan.com.au</p>
          </div>
          
          <div className="social-links">
            <a href="#" className="social-icon">FB</a>
            <a href="#" className="social-icon">IG</a>
            <a href="#" className="social-icon">TW</a>
            <a href="#" className="social-icon">YT</a>
          </div>
        </div>
        
        <div className="copyright">
          <p>&copy; 2025 Little Bamiyan Hazara Cultural Precinct. All Rights Reserved.</p>
        </div>
      </div>
    </footer>
  );

  // Main render
  return (
    <div className="main-content">
      <Navigation />
      {showBusinessForm && isAdmin && <BusinessForm />}
      {showBlogForm && isAdmin && <BlogForm />}
      {selectedBusiness && <BusinessPreviewModal business={selectedBusiness} onClose={() => setSelectedBusiness(null)} />}
      {currentPage === 'home' ? (
        <>
          <Hero />
          <About />
          <Businesses />
          <Events />
          <Visit />
        </>
      ) : currentPage === 'blog' ? (
        <BlogSection />
      ) : currentPage === 'login' ? (
        <LoginPage />
      ) : currentPage === 'admin' ? (
        <AdminPage />
      ) : null}
      <Footer />
    </div>
  );
};

export default App;
