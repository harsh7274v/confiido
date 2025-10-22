// Test route loading fix
console.log('🧪 Testing Route Loading Fix\n');

// Set Vercel-like environment
process.env.VERCEL = '1';
process.env.NODE_ENV = 'production';
process.env.JWT_SECRET = 'test-secret';
process.env.MONGODB_URI = 'mongodb://localhost:27017/test';

// Test the loadRoute function
const loadRoute = (routePath, routeName) => {
  try {
    const routeModule = require(routePath);
    // Handle both CommonJS and ES6 default exports
    const route = routeModule.default || routeModule;
    
    if (typeof route !== 'function') {
      throw new Error(`Route is not a function, got ${typeof route}`);
    }
    
    console.log(`✅ ${routeName} route loaded successfully (type: ${typeof route})`);
    return true;
  } catch (error) {
    console.log(`❌ ${routeName} route failed: ${error.message}`);
    return false;
  }
};

// Test core routes
console.log('Testing route loading...\n');

const routes = [
  { path: './dist/routes/auth', name: 'auth' },
  { path: './dist/routes/users', name: 'users' },
  { path: './dist/routes/experts', name: 'experts' },
  { path: './dist/routes/bookings', name: 'bookings' }
];

let passed = 0;
let failed = 0;

routes.forEach(route => {
  if (loadRoute(route.path, route.name)) {
    passed++;
  } else {
    failed++;
  }
});

console.log(`\n📊 Results: ${passed} passed, ${failed} failed`);

if (failed === 0) {
  console.log('\n🎉 Route loading fix successful!');
  console.log('Your backend should now work on Vercel.');
} else {
  console.log('\n❌ Route loading still has issues.');
}
