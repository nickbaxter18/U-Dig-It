# Camera Access Setup for Dev Container

## What Was Changed

Added camera device passthrough to `.devcontainer/devcontainer.json`:
- `/dev/video0`, `/dev/video1`, `/dev/video2` are now passed through to the container

## Next Steps

### 1. Rebuild the Dev Container

You need to rebuild the container for the changes to take effect:

**Option A: Using VS Code Command Palette**
1. Press `F1` or `Ctrl+Shift+P` (Windows/Linux) / `Cmd+Shift+P` (Mac)
2. Type: `Dev Containers: Rebuild Container`
3. Select it and wait for the rebuild to complete

**Option B: Using VS Code UI**
1. Click the green icon in the bottom-left corner (or the remote indicator)
2. Select "Rebuild Container"

### 2. Verify Camera Access

After rebuilding, verify the camera is accessible:

```bash
# Check if video devices are available
ls -la /dev/video*

# If you see devices, the camera is accessible!
```

### 3. Grant Browser Permissions

Once the container has camera access, you still need to grant browser permissions:

1. **In the browser** (when you click "Take photo"):
   - Look for a camera icon in the address bar
   - Click it and select "Allow"
   - Or go to browser settings → Site settings → Camera → Allow

2. **For Chrome/Edge**:
   - Settings → Privacy and security → Site settings → Camera
   - Add `http://localhost:3000` and set to "Allow"

3. **For Firefox**:
   - Settings → Privacy & Security → Permissions → Camera
   - Add exception for `http://localhost:3000`

### 4. Test Camera Access

After rebuilding and granting permissions:

1. Navigate to a booking manage page
2. Click "Take photo" on either capture card
3. You should see a browser permission prompt
4. Click "Allow"
5. The camera should start!

## Troubleshooting

### No video devices found after rebuild

**On Linux:**
```bash
# Check if camera exists on host
ls -la /dev/video*  # Run this on your HOST machine (not in container)

# If camera exists, check permissions
groups  # Should include 'video' group
```

**On macOS:**
- Camera devices are typically at `/dev/video0`
- Make sure no other app is using the camera

**On Windows (WSL2):**
- WSL2 doesn't natively support USB device passthrough
- You may need to use USBIP or a different approach
- Consider using the file upload option instead

### Permission denied errors

If you see permission errors:

```bash
# Add user to video group (if on Linux host)
sudo usermod -a -G video $USER
# Then log out and back in
```

### Camera still not working

1. Check browser console for errors
2. Verify camera works in other applications
3. Try the file upload option as a fallback
4. Check if camera is being used by another application

## Alternative: Use File Upload

If camera access continues to be problematic, you can always use the "Choose file" button to upload photos directly from your computer.


