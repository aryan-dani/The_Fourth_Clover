// 🔍 Supabase Debugging Utilities
// Use this file to debug Supabase connection and database issues

import { supabase } from './supabase';

interface DebugResult {
  success: boolean;
  error?: string;
  data?: any;
  details?: any;
}

// 🔌 Test Supabase Connection
export async function testSupabaseConnection(): Promise<DebugResult> {
  try {
    console.log('🔌 Testing Supabase connection...');
    
    const { data, error } = await supabase
      .from('posts')
      .select('id')
      .limit(1);

    if (error) {
      console.error('❌ Supabase connection failed:', error);
      return {
        success: false,
        error: error.message,
        details: error
      };
    }

    console.log('✅ Supabase connection successful');
    return {
      success: true,
      data: data
    };
  } catch (err: any) {
    console.error('❌ Unexpected connection error:', err);
    return {
      success: false,
      error: err.message || 'Unknown connection error',
      details: err
    };
  }
}

// 🗃️ Check Database Schema
export async function checkDatabaseSchema(): Promise<DebugResult> {
  try {
    console.log('🗃️ Checking database schema...');
    
    // Test posts table structure
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .limit(1);

    if (error) {
      console.error('❌ Schema check failed:', error);
      return {
        success: false,
        error: `Schema error: ${error.message}`,
        details: error
      };
    }

    console.log('✅ Database schema is accessible');
    return {
      success: true,
      data: 'Schema is valid'
    };
  } catch (err: any) {
    console.error('❌ Schema check error:', err);
    return {
      success: false,
      error: err.message || 'Schema check failed',
      details: err
    };
  }
}

// 👤 Test User Authentication
export async function testUserAuth(): Promise<DebugResult> {
  try {
    console.log('👤 Testing user authentication...');
    
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error) {
      console.error('❌ Auth check failed:', error);
      return {
        success: false,
        error: `Auth error: ${error.message}`,
        details: error
      };
    }

    if (!user) {
      console.log('⚠️ No user logged in');
      return {
        success: false,
        error: 'No user is currently logged in'
      };
    }

    console.log('✅ User authenticated:', user.email);
    return {
      success: true,
      data: {
        id: user.id,
        email: user.email,
        role: user.role
      }
    };
  } catch (err: any) {
    console.error('❌ Auth test error:', err);
    return {
      success: false,
      error: err.message || 'Auth test failed',
      details: err
    };
  }
}

// 📝 Test Post Creation
export async function testPostCreation(testData?: {
  title?: string;
  content?: string;
}): Promise<DebugResult> {
  try {
    console.log('📝 Testing post creation...');
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return {
        success: false,
        error: 'User not authenticated for post creation test'
      };
    }

    const testPost = {
      title: testData?.title || `Test Post ${Date.now()}`,
      content: testData?.content || 'This is a test post content.',
      slug: `test-post-${Date.now()}`,
      status: 'draft' as const,
      author_id: user.id,
      excerpt: 'Test excerpt',
      read_time: 1
    };

    console.log('📤 Sending test post:', testPost);

    const { data, error } = await supabase
      .from('posts')
      .insert(testPost)
      .select()
      .single();

    if (error) {
      console.error('❌ Post creation failed:', error);
      console.error('📤 Payload that failed:', testPost);
      return {
        success: false,
        error: `Post creation error: ${error.message}`,
        details: { error, payload: testPost }
      };
    }

    console.log('✅ Test post created successfully:', data);

    // Clean up: delete the test post
    await supabase.from('posts').delete().eq('id', data.id);
    console.log('🧹 Test post cleaned up');

    return {
      success: true,
      data: data
    };
  } catch (err: any) {
    console.error('❌ Post creation test error:', err);
    return {
      success: false,
      error: err.message || 'Post creation test failed',
      details: err
    };
  }
}

// 🔄 Test Post Publishing
export async function testPostPublishing(): Promise<DebugResult> {
  try {
    console.log('🔄 Testing post publishing...');
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return {
        success: false,
        error: 'User not authenticated for publishing test'
      };
    }

    // Create a draft post
    const draftPost = {
      title: `Test Publish Post ${Date.now()}`,
      content: 'This is a test post for publishing.',
      slug: `test-publish-${Date.now()}`,
      status: 'draft' as const,
      author_id: user.id,
      excerpt: 'Test publish excerpt',
      read_time: 1
    };

    const { data: draft, error: draftError } = await supabase
      .from('posts')
      .insert(draftPost)
      .select()
      .single();

    if (draftError) {
      console.error('❌ Draft creation failed:', draftError);
      return {
        success: false,
        error: `Draft creation error: ${draftError.message}`,
        details: draftError
      };
    }

    console.log('📝 Draft created:', draft);

    // Now try to publish it
    const { data: published, error: publishError } = await supabase
      .from('posts')
      .update({
        status: 'published',
        published_at: new Date().toISOString()
      })
      .eq('id', draft.id)
      .select()
      .single();

    if (publishError) {
      console.error('❌ Publishing failed:', publishError);
      // Clean up draft
      await supabase.from('posts').delete().eq('id', draft.id);
      return {
        success: false,
        error: `Publishing error: ${publishError.message}`,
        details: publishError
      };
    }

    console.log('✅ Post published successfully:', published);

    // Verify we can fetch the published post
    const { data: fetched, error: fetchError } = await supabase
      .from('posts')
      .select('*')
      .eq('slug', published.slug)
      .eq('status', 'published')
      .single();

    if (fetchError) {
      console.error('❌ Failed to fetch published post:', fetchError);
      // Clean up
      await supabase.from('posts').delete().eq('id', published.id);
      return {
        success: false,
        error: `Fetch published post error: ${fetchError.message}`,
        details: fetchError
      };
    }

    console.log('✅ Published post fetched successfully:', fetched);

    // Clean up
    await supabase.from('posts').delete().eq('id', published.id);
    console.log('🧹 Test published post cleaned up');

    return {
      success: true,
      data: {
        draft,
        published,
        fetched
      }
    };
  } catch (err: any) {
    console.error('❌ Publishing test error:', err);
    return {
      success: false,
      error: err.message || 'Publishing test failed',
      details: err
    };
  }
}

// 🏠 Test RLS Policies
export async function testRLSPolicies(): Promise<DebugResult> {
  try {
    console.log('🏠 Testing RLS policies...');
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return {
        success: false,
        error: 'User not authenticated for RLS test'
      };
    }

    // Test: Can view published posts
    const { data: publishedPosts, error: viewError } = await supabase
      .from('posts')
      .select('*')
      .eq('status', 'published')
      .limit(5);

    if (viewError) {
      console.error('❌ Failed to view published posts:', viewError);
      return {
        success: false,
        error: `RLS view error: ${viewError.message}`,
        details: viewError
      };
    }

    console.log('✅ Can view published posts:', publishedPosts?.length || 0);

    // Test: Can view own drafts
    const { data: ownPosts, error: ownError } = await supabase
      .from('posts')
      .select('*')
      .eq('author_id', user.id)
      .limit(5);

    if (ownError) {
      console.error('❌ Failed to view own posts:', ownError);
      return {
        success: false,
        error: `RLS own posts error: ${ownError.message}`,
        details: ownError
      };
    }

    console.log('✅ Can view own posts:', ownPosts?.length || 0);

    return {
      success: true,
      data: {
        publishedPostsCount: publishedPosts?.length || 0,
        ownPostsCount: ownPosts?.length || 0
      }
    };
  } catch (err: any) {
    console.error('❌ RLS test error:', err);
    return {
      success: false,
      error: err.message || 'RLS test failed',
      details: err
    };
  }
}

// 🚀 Run All Tests
export async function runAllTests(): Promise<{ [key: string]: DebugResult }> {
  console.log('🚀 Running comprehensive Supabase tests...');
  
  const results = {
    connection: await testSupabaseConnection(),
    schema: await checkDatabaseSchema(),
    auth: await testUserAuth(),
    postCreation: await testPostCreation(),
    publishing: await testPostPublishing(),
    rls: await testRLSPolicies()
  };

  console.log('📊 Test Results Summary:');
  Object.entries(results).forEach(([test, result]) => {
    const status = result.success ? '✅' : '❌';
    console.log(`${status} ${test}: ${result.success ? 'PASSED' : result.error}`);
  });

  return results;
}

// 🚨 Enhanced Error Logger for Production Debugging
export function logSupabaseError(operation: string, error: any, context?: any) {
  console.group(`🚨 Supabase Error - ${operation}`);
  console.error('Error:', error);
  console.error('Error Message:', error?.message);
  console.error('Error Code:', error?.code);
  console.error('Error Details:', error?.details);
  console.error('Error Hint:', error?.hint);
  if (context) {
    console.error('Context:', context);
  }
  console.groupEnd();
  
  // Return formatted error for UI display
  return {
    message: error?.message || 'Unknown error',
    code: error?.code,
    details: error?.details,
    hint: error?.hint,
    operation,
    context
  };
}
