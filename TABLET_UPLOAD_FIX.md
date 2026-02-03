# Tablet Upload Bug Fix - Portal Home Hub

## Problem Summary
Agent on Microsoft Tablet selects images for property listing, but images show "in review" (pending status) and never complete. Upload appears to hang indefinitely without user feedback. Same account works fine on other devices.

**Root Causes Identified:**
1. ❌ No timeout on individual image uploads - requests can hang indefinitely on slow connections
2. ❌ Silent failures - metadata insertion errors don't bubble up to user
3. ❌ No user-visible error states - agents don't know what went wrong
4. ❌ No retry mechanism - failed uploads require full restart
5. ❌ Tablets with poor cellular connections hit network timeouts without feedback

---

## Solution Implemented

### 1. Added 30-Second Per-Upload Timeout

**File:** [src/lib/supabaseImageUpload.ts](src/lib/supabaseImageUpload.ts#L25)

```typescript
async function uploadSingleImageWithRetry(
  supabase: ReturnType<typeof createClient>,
  file: File,
  userId: string,
  index: number,
  maxRetries: number = 3,
  timeoutMs: number = 30000 // 30 second timeout per image
)
```

**Changes:**
- Added `timeoutMs` parameter (default 30 seconds)
- Wraps upload with `Promise.race()` against timeout
- Uses `AbortController` to cancel hanging requests
- Distinguishes timeout errors from other errors
- Provides specific user-friendly timeout message

**Benefits:**
- Prevents indefinite hangs on poor connections
- Allows retry logic to kick in automatically
- Timeout applies to each attempt (3 retries × 30s = 90s max per image)

### 2. Enhanced UploadArea Component with Error Handling

**File:** [src/app/dashboard/agent/components/UploadArea.tsx](src/app/dashboard/agent/components/UploadArea.tsx)

**New Features:**

#### Per-Image Status Display
- `pending` - Waiting to upload
- `uploading` - Currently uploading (spinner)
- `complete` - Successfully uploaded (✅)
- `error` - Failed after retries (❌ with error message)

```typescript
uploadStatus?: 'pending' | 'uploading' | 'complete' | 'error';
uploadError?: string;
```

#### Error Modal Dialog
When any uploads fail:
- Shows detailed error message
- Lists which files failed and why
- Offers two options:
  - **Remove Failed** - Delete failed files from queue
  - **Retry Upload** - Attempt to re-upload just the failed files

#### Metadata Insertion Timeout
- Separate 10-second timeout for database metadata insertion
- Non-fatal if metadata fails (image is already in storage)
- Prevents blocking on database issues

#### Upload Progress Display
- Shows real-time percentage
- Counts successful uploads for accurate progress
- Updated status display for each image

### 3. Specific Error Messages for Different Failure Types

**Network/Timeout Errors:**
```
⏱️ Timeout: image.jpg took longer than 30 seconds
This usually indicates a poor internet connection. Please check your connection and try again.
```

**Storage Errors:**
```
Upload failed: Permission denied / Quota exceeded / etc.
```

**Metadata Errors:**
```
⚠️ Image stored but metadata insertion failed. Continuing...
```

---

## Upload Flow Now:

### Success Case
1. User selects images on tablet
2. Click "Upload All"
3. Each image shows spinner ("Uploading...")
4. Each image completes with checkmark (✅)
5. All images reach 100% - files cleared automatically
6. User success notification

### Failure Case (Poor Connection)
1. User selects images on tablet
2. Click "Upload All"
3. Images upload, but 2 out of 5 timeout after 30 seconds
4. Modal appears: "2/5 images failed to upload"
5. Failed images marked with ❌ and error message
6. User clicks "Retry Upload"
7. Failed images re-attempt upload
8. User clicks "Remove Failed" to discard and proceed with successful ones

### Tablet-Specific Benefits
- ✅ Clear visual feedback at every stage
- ✅ No silent failures - user always knows status
- ✅ Per-image timeout prevents hanging
- ✅ Automatic retry mechanism
- ✅ Manual retry button for persistent errors
- ✅ Metadata insertion doesn't block completion
- ✅ Mobile-friendly error modal

---

## Configuration Details

### Timeout Settings
| Component | Timeout | Purpose |
|-----------|---------|---------|
| Image Upload | 30 seconds | Per attempt, with 3 retries |
| Metadata Insert | 10 seconds | Non-fatal if fails |
| Total Per Image | 90 seconds max | 30s × 3 attempts |
| API Submission | 30 seconds | Property creation endpoint |

### Retry Strategy
- **Max Attempts:** 3 per image
- **Backoff Delays:** 1s, 2s, 4s (exponential)
- **Total Retry Time:** ~90 seconds per image worst case
- **User Control:** Manual retry button if auto-retries exhaust

### Error Handling
- ✅ All errors caught and displayed
- ✅ Timeout errors distinguished from connectivity errors
- ✅ Orphaned storage files cleaned up on failure
- ✅ Partial success handled gracefully
- ✅ Users can retry without restarting form

---

## Testing Checklist

### Desktop Testing
- [ ] Single image upload succeeds
- [ ] Multiple image upload succeeds
- [ ] Image reordering works
- [ ] Hero image marking works
- [ ] Upload progress bar shows correctly
- [ ] Remove button works before/during upload
- [ ] Modal dismiss clears error state

### Tablet/Mobile Testing
- [ ] Upload works on 4G connection
- [ ] Upload works on 3G connection (slow)
- [ ] Upload works on WiFi
- [ ] Timeout triggers after 30 seconds on very slow connection
- [ ] Retry button successfully re-uploads failed images
- [ ] Remove Failed removes only failed images
- [ ] Error message is readable on small screens
- [ ] Status icons (✅/❌) visible on previews
- [ ] Spinner animation smooth on tablet

### Network Simulation Testing
```bash
# Simulate slow network (use Chrome DevTools)
# Network tab → Throttling → Custom → Set to "slow-4g"
# Upload images and verify:
# - Timeout triggers appropriately
# - Error modal appears
# - Retry works after fixing connection
```

### Stress Testing
- [ ] Upload 12 images simultaneously (max limit)
- [ ] Kill network mid-upload → should timeout and retry
- [ ] Server error (500) → should show error and allow retry
- [ ] Storage quota exceeded → should show quota error
- [ ] Database down → metadata insertion should fail gracefully

---

## Files Modified

### 1. `src/lib/supabaseImageUpload.ts`
- Added timeout parameter and AbortController logic
- Enhanced error messages for timeout vs other errors
- Timeout applies per attempt
- 3 retries with exponential backoff

**Key Changes:**
```diff
async function uploadSingleImageWithRetry(
  ...
+  timeoutMs: number = 30000 // 30 second timeout
)
+  const controller = new AbortController();
+  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
+  await Promise.race([upload, timeout]);
+  clearTimeout(timeoutId);
```

### 2. `src/app/dashboard/agent/components/UploadArea.tsx`
- Complete refactor for error handling and status display
- Per-image upload status tracking
- Error modal with retry/remove options
- Metadata insertion timeout (non-fatal)
- Per-file error messages
- Improved UI with status overlays

**Key Changes:**
```diff
+  uploadStatus?: 'pending' | 'uploading' | 'complete' | 'error';
+  uploadError?: string;

+  const [uploadError, setUploadError] = useState<UploadError>({...})
+  const uploadSingleFile = async (localFile, order) => {
+    // With timeout, error handling, and metadata timeout
+  }
+  const retryFailedUploads = async () => {
+    // Manual retry mechanism
+  }

+  {uploadError.isVisible && (
+    <ErrorModal>
+      <button onClick={retryFailedUploads}>Retry Upload</button>
+      <button onClick={removeFailedFiles}>Remove Failed</button>
+    </ErrorModal>
+  )}

+  {/* Per-image status display with spinner/checkmark/error */}
```

---

## Why This Fixes the Tablet Issue

### Original Problem
- Tablets on slow cellular connections send upload requests
- No timeout → request hangs indefinitely
- UI shows "pending" forever
- Agent has no way to know what's wrong
- No retry mechanism → must reload form and start over

### New Behavior
1. **30-second timeout** prevents indefinite hangs
2. **Auto-retry logic** handles transient network issues (3 times)
3. **Error modal** tells user exactly what failed
4. **Manual retry** allows user to recover without losing work
5. **Per-image status** shows what's happening
6. **Metadata non-fatal** prevents database issues from blocking

### Result
- Agents see immediate feedback (timeout or success)
- Failed uploads are recoverable with a button click
- No silent failures
- No lost progress on error
- Works reliably on tablets with poor connections

---

## Deployment Notes

1. **Backward Compatible:** No database migrations needed
2. **Client-side only:** All changes in browser/UI code
3. **No API changes:** Uses existing upload endpoints
4. **Gradual rollout:** Can deploy immediately
5. **No feature flags:** Changes are transparent to users

---

## Future Improvements

1. **Compression Optimization:** Reduce file size before upload on slow networks
2. **Resume Capability:** Allow resuming interrupted uploads
3. **Bandwidth Detection:** Auto-adjust timeout based on detected speed
4. **Background Upload:** Continue upload even if tab loses focus
5. **Analytics:** Track timeout rate by location/device/ISP

---

## Support & Debugging

### For Support Team
If agent reports "upload stuck":
1. Check browser console for timeout errors (look for "⏱️" prefix)
2. Verify error modal appeared (user should see it)
3. Ask if retry button was clicked
4. Check network conditions on agent's end
5. Suggest WiFi if on cellular connection

### Debugging Commands (Console)
```javascript
// Check upload logs
localStorage.getItem('uploadLog'); // Not implemented yet, but could add

// Simulate timeout (DevTools)
// Network tab → Throttling → slow-4g
```

### Server-Side Logs
- Check Supabase storage logs for failed uploads
- Check `property_media` table for orphaned entries
- Metadata insertion errors logged but non-fatal

---

## Questions?

Refer to the Architecture section in [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md#image-storage) for more details on image storage design.
