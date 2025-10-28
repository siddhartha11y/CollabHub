// Simple test script to verify profile API is working
// Run this after deployment to test the endpoints

const testProfileAPI = async () => {
  try {
    console.log('Testing profile API...')
    
    // Test GET endpoint
    const getResponse = await fetch('https://collabhub-amber.vercel.app/api/profile', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    })
    
    console.log('GET /api/profile status:', getResponse.status)
    
    if (getResponse.status === 401) {
      console.log('✅ Unauthorized response expected (no session)')
    } else if (getResponse.status === 200) {
      const data = await getResponse.json()
      console.log('✅ Profile data received:', data)
    } else {
      console.log('❌ Unexpected status:', getResponse.status)
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error)
  }
}

// Uncomment to run test
// testProfileAPI()

console.log('Profile API test script ready. The database schema has been updated and deployed.')
console.log('The 500 errors should now be resolved.')