# The Lost: Decisions Log

### D-001: Visual Realism Direction & Rendering Model
**Date:** 2026-10-04  
**Context:** Pre-Phase 0 / Visual Direction Alignment  
**Problem:** The initial design documents and concept sketches (`Concept/`, `agent.md §6`) specified a flat, minimalist vector silhouette aesthetic. The human vision update requests a realistic, immersive world (realistic forest, trees, animals, hunters, environmental atmosphere reminiscent of realistic modern games like Call of Duty).  
**Options:**
- **Option A (Recommended for 2D Top-Down Web): High-Fidelity Realistic 2D Top-Down.** Render rich, high-resolution realistic top-down sprites, detailed forest floor textures (mud, fallen leaves, puddles), photorealistic tree canopies with dynamic 2D normal-mapped lighting and volumetric fog shaders in Phaser 3 / WebGL.
- **Option B: Full 3D Top-Down (e.g. Three.js / WebGL / Babylon).** Pivot engine from Phaser 2D to a 3D WebGL engine (Three.js/WebGPU) with 3D models of trees, animals, and characters with 3D shadows and realistic materials viewed from a top-down isometric/orthographic camera.  
**Recommendation:** Option B selected by human: Full 3D Top-Down in WebGL/Three.js.  
**Status:** Approved (Option B: Three.js + WebGL 3D)  

