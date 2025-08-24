// Test script to verify user-specific transaction filtering
const API_BASE_URL = 'http://localhost:5003/api';
const TEST_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4YWIxYTE0OTRiMjlkNmQwMjQ0ZmQzNiIsImVtYWlsIjoidGVzdEBleGFtcGxlLmNvbSIsInVzZXJfaWQiOiIxMDAxIiwiaXNFeHBlcnQiOmZhbHNlLCJpYXQiOjE3NTYwNDc3MDcsImV4cCI6MTc1NjY1MjUwN30.FMEvqxD-5-1r-V4j-iRZAzNAyiYYYAPjxO7BkZTcXKk';

async function testUserTransactions() {
  try {
    console.log('🔍 Testing User-Specific Transaction Filtering...');
    console.log('📋 User ID: 1001');
    console.log('🔑 Token includes user_id: 1001');
    
    const response = await fetch(`${API_BASE_URL}/payments/transactions`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${TEST_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const data = await response.json();
      console.log('\n✅ API Response Success!');
      
      const transactions = data.data.transactions;
      console.log(`📊 Total transactions found: ${transactions.length}`);
      
      // Verify all transactions belong to user_id: 1001
      const allBelongToUser = transactions.every(t => t.user_id === '1001');
      console.log(`🔒 All transactions belong to user 1001: ${allBelongToUser ? '✅ YES' : '❌ NO'}`);
      
      if (transactions.length > 0) {
        console.log('\n📋 Sample Transactions:');
        transactions.slice(0, 3).forEach((txn, index) => {
          console.log(`${index + 1}. ${txn.transaction_id} - ${txn.service} - ₹${txn.amount} - ${txn.status}`);
          console.log(`   User ID: ${txn.user_id} | Mentor: ${txn.mentor_name}`);
        });
      }
      
      console.log('\n📈 Transaction Statistics:');
      console.log(`   Total: ${data.data.stats.total}`);
      console.log(`   Completed: ${data.data.stats.completed}`);
      console.log(`   Pending: ${data.data.stats.pending}`);
      console.log(`   Failed: ${data.data.stats.failed}`);
      console.log(`   Total Spent: ₹${data.data.stats.totalSpent}`);
      
    } else {
      const errorText = await response.text();
      console.error('❌ API Error:', response.status, errorText);
    }
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testUserTransactions();
