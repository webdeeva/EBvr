# Animation Files

This directory is intended for animation files (.fbx, .gltf, .glb) that can be applied to avatars.

## Current Status

The Ready Player Me avatars work best with their own embedded animations or with procedural animations. The app currently uses a simple procedural bobbing effect for movement.

## Adding Animation Files

If you want to add custom animations:

1. **Mixamo Animations**: 
   - Download animations from [Mixamo](https://www.mixamo.com)
   - Export as FBX for Unity (.fbx)
   - Place the files in this directory

2. **Ready Player Me Animations**:
   - Ready Player Me provides animation packs for purchase
   - Visit their [animation library](https://readyplayer.me/animation-library)

3. **Custom Animations**:
   - Ensure animations are compatible with humanoid rigs
   - Test with Ready Player Me avatar bone structure

## File Naming Convention

- `idle-male.fbx` - Idle animation for male characters
- `walk-male.fbx` - Walking animation
- `run-male.fbx` - Running animation
- Add `-female` suffix for female-specific animations if needed