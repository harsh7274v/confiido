const mongoose = require('mongoose');

async function checkBookings() {
  try {
    // Connect to MongoDB
    await mongoose.connect('mongodb+srv://confiidoio:UzCmaVZ2SICeFh2H@cluster.mongodb.net/lumina', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ Connected to MongoDB');
    
    // Check the Booking collection
    const Booking = require('./src/models/Booking').default;
    
    const bookings = await Booking.find({});
    console.log('📊 Total bookings in database:', bookings.length);
    
    if (bookings.length > 0) {
      console.log('📋 Sample booking structure:');
      console.log(JSON.stringify(bookings[0], null, 2));
    } else {
      console.log('❌ No bookings found in database');
    }
    
  } catch (error) {
    console.error('❌ Error checking bookings:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

checkBookings();
