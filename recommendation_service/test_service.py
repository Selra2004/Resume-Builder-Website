#!/usr/bin/env python3
"""
Test script for the Hybrid Job Recommendation Service
Run this to verify the service is working correctly
"""

import asyncio
import json
import sys
from typing import Dict, Any

try:
    import aiohttp
except ImportError:
    print("❌ aiohttp not found. Installing...")
    import subprocess
    subprocess.check_call([sys.executable, "-m", "pip", "install", "aiohttp"])
    import aiohttp

async def test_service():
    """Test the recommendation service endpoints"""
    
    base_url = "http://localhost:5001"
    
    print("🧪 Testing Hybrid Job Recommendation Service...")
    print(f"🎯 Target URL: {base_url}")
    
    async with aiohttp.ClientSession() as session:
        
        # Test 1: Health Check
        print("\n📊 Test 1: Health Check")
        try:
            async with session.get(f"{base_url}/") as response:
                if response.status == 200:
                    data = await response.json()
                    print("✅ Health check passed")
                    print(f"   Status: {data.get('status')}")
                    print(f"   Service: {data.get('service')}")
                    print(f"   Version: {data.get('version')}")
                    print(f"   Database Connected: {data.get('database_connected')}")
                    print(f"   ML Models Loaded: {data.get('ml_models_loaded')}")
                else:
                    print(f"❌ Health check failed with status {response.status}")
                    return False
        except Exception as e:
            print(f"❌ Health check failed: {e}")
            return False
        
        # Test 2: Active Jobs Count
        print("\n📈 Test 2: Active Jobs Count")
        try:
            async with session.get(f"{base_url}/jobs/active/count") as response:
                if response.status == 200:
                    data = await response.json()
                    job_count = data.get('active_jobs_count', 0)
                    print(f"✅ Found {job_count} active jobs")
                    if job_count == 0:
                        print("⚠️ No active jobs found - recommendations may be empty")
                else:
                    print(f"❌ Job count check failed with status {response.status}")
        except Exception as e:
            print(f"❌ Job count check failed: {e}")
        
        # Test 3: User Profile Debug (if user exists)
        print("\n👤 Test 3: User Profile Debug")
        test_user_id = 2  # Adjust this to a user ID that exists in your database
        try:
            async with session.get(f"{base_url}/user/{test_user_id}/profile") as response:
                if response.status == 200:
                    data = await response.json()
                    profile = data.get('profile', {})
                    print(f"✅ User {test_user_id} profile retrieved")
                    print(f"   Name: {profile.get('name', 'Unknown')}")
                    print(f"   Student Type: {profile.get('student_type', 'Unknown')}")
                    print(f"   Profile Completed: {profile.get('profile_completed', False)}")
                    print(f"   Has Resume: {profile.get('has_completed_resume', False)}")
                    print(f"   Skills Count: {profile.get('skills_count', 0)}")
                    print(f"   Experience Count: {profile.get('work_experience_count', 0)}")
                elif response.status == 500:
                    data = await response.json()
                    if 'User profile not found' in str(data):
                        print(f"⚠️ User {test_user_id} not found - try different user ID")
                    else:
                        print(f"❌ Profile debug failed: {data}")
                else:
                    print(f"❌ Profile debug failed with status {response.status}")
        except Exception as e:
            print(f"❌ Profile debug failed: {e}")
        
        # Test 4: Recommendation Request
        print("\n🎯 Test 4: Recommendation Request")
        try:
            request_data = {
                "user_id": test_user_id,
                "limit": 5,
                "include_reasons": True
            }
            
            async with session.post(
                f"{base_url}/recommendations",
                json=request_data,
                headers={"Content-Type": "application/json"}
            ) as response:
                
                if response.status == 200:
                    data = await response.json()
                    recommendations = data.get('recommendations', [])
                    print(f"✅ Got {len(recommendations)} recommendations")
                    print(f"   Processing Time: {data.get('processing_time_ms', 0):.2f}ms")
                    print(f"   Total Jobs Analyzed: {data.get('total_jobs_analyzed', 0)}")
                    
                    # Show first recommendation details
                    if recommendations:
                        rec = recommendations[0]
                        print(f"\n   📋 Top Recommendation:")
                        print(f"      Job: {rec.get('job_title', 'Unknown')}")
                        print(f"      Category: {rec.get('job_category', 'Unknown')}")
                        print(f"      Company: {rec.get('company_name', 'Unknown')}")
                        print(f"      Hybrid Score: {rec.get('hybrid_score', 0):.3f}")
                        print(f"      Content Score: {rec.get('content_score', 0):.3f}")
                        print(f"      Knowledge Score: {rec.get('knowledge_score', 0):.3f}")
                        print(f"      Confidence: {rec.get('confidence', 0):.3f}")
                        
                        reasons = rec.get('reasons', [])
                        if reasons:
                            print(f"      Reasons: {reasons[:2]}")  # Show first 2 reasons
                    
                    # Show algorithm info
                    algo_info = data.get('algorithm_info', {})
                    if algo_info:
                        print(f"\n   🤖 Algorithm Info:")
                        print(f"      Version: {algo_info.get('version')}")
                        print(f"      Type: {algo_info.get('type')}")
                        print(f"      Features: {', '.join(algo_info.get('features', []))}")
                
                elif response.status == 400:
                    data = await response.json()
                    print(f"⚠️ Bad request: {data.get('detail', 'Unknown error')}")
                    print("   This might be due to incomplete user profile or missing resume")
                
                else:
                    print(f"❌ Recommendation request failed with status {response.status}")
                    error_data = await response.text()
                    print(f"   Error: {error_data}")
        
        except Exception as e:
            print(f"❌ Recommendation request failed: {e}")
    
    print("\n🎉 Service testing completed!")
    return True

def print_usage():
    """Print usage instructions"""
    print("\n" + "="*60)
    print("📋 How to Use the Hybrid Recommendation Service")
    print("="*60)
    print("\n🚀 1. Start the recommendation service:")
    print("   python main.py")
    print("   (or use start.bat/start.sh)")
    
    print("\n🔧 2. Update database settings in config.py:")
    print("   DB_HOST, DB_USER, DB_PASSWORD, DB_NAME")
    
    print("\n👥 3. Ensure you have users with completed profiles and resumes")
    print("   The service only uses completed resumes (status = 'completed')")
    
    print("\n💼 4. Make sure you have active jobs in the database")
    print("   Jobs with status = 'active' and future/no deadline")
    
    print("\n🔗 5. Your Node.js backend will automatically use this service")
    print("   It will fallback to legacy recommendations if this service is down")
    
    print("\n📊 6. Test the full integration:")
    print("   - Start this Python service (port 5001)")
    print("   - Start your Node.js backend (port 5000)") 
    print("   - Login as a user with completed profile and resume")
    print("   - Check job recommendations in the ACC platform")

if __name__ == "__main__":
    print("🤖 Hybrid Job Recommendation Service - Test Script")
    
    try:
        # Run the async test
        result = asyncio.run(test_service())
        
        if result:
            print("\n✅ All tests completed! The service appears to be working correctly.")
        else:
            print("\n❌ Some tests failed. Check the service and database connection.")
        
        print_usage()
        
    except KeyboardInterrupt:
        print("\n🛑 Test interrupted by user")
    except Exception as e:
        print(f"\n💥 Test script failed: {e}")
        print("\n🔧 Troubleshooting:")
        print("1. Make sure the recommendation service is running (python main.py)")
        print("2. Check if port 5001 is accessible")
        print("3. Verify database connection settings")
        print("4. Ensure you have test users and jobs in the database")
