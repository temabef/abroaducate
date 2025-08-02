# Deployment Guide: Scholarship Encoding & Multiple Levels Fixes

## Quick Start

This guide will help you deploy the scholarship system fixes to resolve encoding issues and add multiple level support.

## Prerequisites

- Access to Supabase SQL Editor
- Admin access to the Abroaducate platform
- Basic understanding of database migrations

## Step-by-Step Deployment

### Step 1: Apply Database Migration

1. **Open Supabase Dashboard**
   - Go to your Supabase project dashboard
   - Navigate to the SQL Editor

2. **Run the Migration**
   - Copy the contents of `database_migrations/fix_scholarship_encoding_and_levels.sql`
   - Paste it into the SQL Editor
   - Click "Run" to execute the migration

3. **Verify Migration Success**
   - You should see: `"Scholarship encoding and multiple levels support migration completed successfully!"`

### Step 2: Test the Migration

1. **Run Test Script**
   - Copy the contents of `database_scripts/test_scholarship_fixes.sql`
   - Paste it into the SQL Editor
   - Click "Run" to execute the tests

2. **Verify Test Results**
   - All tests should pass without errors
   - Check that encoding/decoding functions work
   - Verify multiple levels functionality

### Step 3: Update Existing Data

1. **Populate Levels Array**
   ```sql
   UPDATE scholarships 
   SET levels = ARRAY[level] 
   WHERE levels IS NULL OR array_length(levels, 1) IS NULL;
   ```

2. **Verify Data Update**
   ```sql
   SELECT COUNT(*) FROM scholarships WHERE array_length(levels, 1) > 0;
   ```

### Step 4: Deploy Frontend Changes

1. **Update Admin Scholarship Page**
   - The file `src/routes/admin/scholarships/+page.svelte` has been updated
   - Multiple level selection is now available
   - Enhanced functions are being used

2. **Update Public Scholarship Page**
   - The file `src/routes/scholarships/+page.svelte` has been updated
   - Now uses the decoded view for proper character display
   - Multiple levels are properly displayed

3. **Add HTML Entity Utilities**
   - The file `src/lib/utils/htmlEntities.ts` has been added
   - Provides encoding/decoding utilities for frontend use

### Step 5: Test the System

1. **Admin Testing**
   - Go to `/admin/scholarships`
   - Try adding a new scholarship with special characters (e.g., `$50,000`, `#hashtag`)
   - Try selecting multiple levels (e.g., both Master's and PhD)
   - Verify the scholarship saves and displays correctly

2. **Public Testing**
   - Go to `/scholarships`
   - Check that special characters display properly
   - Verify multiple levels are shown correctly
   - Test search and filtering functionality

3. **Bulk Import Testing**
   - Try importing a CSV with multiple levels (semicolon-separated)
   - Verify the import works correctly
   - Check that encoding is handled properly

## Verification Checklist

### Database Layer
- [ ] `levels` column exists in scholarships table
- [ ] HTML entity functions work correctly
- [ ] Enhanced nuclear functions are available
- [ ] Public view returns decoded data
- [ ] GIN index exists for levels array

### Frontend Layer
- [ ] Admin form supports multiple level selection
- [ ] Special characters display correctly
- [ ] Multiple levels are shown properly
- [ ] Bulk import works with multiple levels
- [ ] Search and filtering work correctly

### Data Integrity
- [ ] Existing scholarships have levels array populated
- [ ] No data loss during migration
- [ ] Backward compatibility maintained
- [ ] Performance is acceptable

## Troubleshooting

### Common Issues

1. **Migration Fails**
   - Check for syntax errors in the SQL
   - Ensure you have admin privileges
   - Verify the scholarships table exists

2. **Functions Not Found**
   - Re-run the migration script
   - Check that all functions were created successfully
   - Verify function permissions

3. **Encoding Issues Persist**
   - Clear browser cache
   - Check that the public view is being used
   - Verify the decoding functions work

4. **Multiple Levels Not Working**
   - Check that the levels column exists
   - Verify the admin form is updated
   - Test with a fresh scholarship entry

### Rollback Plan

If issues arise, you can rollback using:

```sql
-- Drop the levels column
ALTER TABLE scholarships DROP COLUMN IF EXISTS levels;

-- Drop enhanced functions
DROP FUNCTION IF EXISTS nuclear_insert_scholarship_enhanced;
DROP FUNCTION IF EXISTS nuclear_update_scholarship_enhanced;
DROP FUNCTION IF EXISTS nuclear_load_scholarships_enhanced;
DROP FUNCTION IF EXISTS get_scholarship_decoded;

-- Drop encoding functions
DROP FUNCTION IF EXISTS encode_html_entities;
DROP FUNCTION IF EXISTS decode_html_entities;

-- Drop the public view
DROP VIEW IF EXISTS public_scholarships_decoded;
```

## Performance Considerations

1. **Index Usage**
   - The GIN index on levels array improves search performance
   - Monitor query performance after deployment

2. **Encoding Overhead**
   - Encoding/decoding adds minimal overhead
   - Functions are optimized for performance

3. **Data Size**
   - HTML entities increase storage slightly
   - Impact is minimal for most use cases

## Monitoring

After deployment, monitor:

1. **Error Rates**
   - Check for any encoding/decoding errors
   - Monitor function call failures

2. **Performance**
   - Query response times
   - Index usage statistics

3. **User Feedback**
   - Special character display issues
   - Multiple level functionality
   - Search and filtering problems

## Support

If you encounter issues:

1. Check the test script results
2. Verify all migration steps were completed
3. Test with a fresh scholarship entry
4. Review the troubleshooting section above

## Success Metrics

The deployment is successful when:

- [ ] Special characters display correctly (e.g., `$50,000` not `&#36;50,000`)
- [ ] Multiple levels can be selected and displayed
- [ ] Bulk import works with multiple levels
- [ ] Search and filtering work properly
- [ ] No performance degradation
- [ ] No data loss or corruption

## Next Steps

After successful deployment:

1. **Monitor the system** for any issues
2. **Train users** on the new multiple level functionality
3. **Update documentation** if needed
4. **Consider additional enhancements** based on user feedback 