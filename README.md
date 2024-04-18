# Minecraft
Pranav Mereddy (pm32775), Manoj Singireddy (mrs5959)

Collaboration: We pair-programmed for the entire project, alternating between driver and observer.

Slip Days: We used 2 Slip Days for this assignment.

# Terrain Synthesis

We developed a voxel-based terrain generation system using value noise to produce a 64x64 grid of terrain heights, which we implemented across a region around the player. This terrain is generated on-the-fly as the player moves, with seamless transitions between chunks. The terrain heights range from 0 to 100, providing a mix of mountains, valleys, and local features. We optimized rendering performance by utilizing WebGL 2.0's instanced rendering feature, efficiently drawing stacks of cubes based on the terrain heights. Each chunk consists of cubes stacked to represent the terrain, and as the player moves, we dynamically load and unload chunks to maintain a 3x3 chunk renderable region around the player. To ensure a seamless experience, we focused on seamless chunk boundaries and persistent terrain, allowing the player to revisit areas without changes. Pressing the 'R' key resets the player to the starting position and refreshes the rendered chunks. Overall, the system is designed for real-time rendering of terrain and offers a smooth exploration experience.

# Procedural Textures

We introduced Perlin noise to add texture and detail to the terrain. We implemented a Perlin noise function in the shader to generate smooth noise values based on a random seed and position. To ensure smoothness across the cube faces, we used bicubic interpolation. For the texturing part, we designed three procedural textures using Perlin noise as a foundational element. These textures were created by combining Perlin noise with mathematical functions to produce diverse and visually appealing patterns. The textures were then used in the fragment shader to shade pixels, blending diffuse shading and ambient lighting for a realistic look. While there might be seams between adjacent blocks or faces, the overall visual experience was significantly enhanced with the addition of textured blocks. We ensured the world had at least three distinct block types to offer diversity in the terrain.

# FPS Controls

We implemented player movement mechanics to allow navigation across the terrain. The player is represented as a cylinder with a radius of 0.4 units, extending two units downward from the camera. To prevent the player from moving through terrain, we added collision detection logic. This logic ensures that the player's cylinder does not intersect with any cube in the world. We extended the Chunk class to determine the minimum vertical position allowed for the player's cylinder, considering both the current grid cell and its neighboring cells to detect potential collisions, including at chunk boundaries. For realistic movement, we added gravity to the player's vertical velocity. When the player's cylinder is not supported by a block underneath, the player accelerates downwards at 9.8 units per second squared. We ensured that the collision detection prevents the player from sinking into the terrain due to gravity. The player's vertical velocity is reset to zero upon landing on terrain. Additionally, we implemented jumping functionality. The player can jump by pressing the spacebar while standing on solid ground. If executed correctly, jumping sets the player's vertical velocity to a positive constant. To prevent mid-air jumps, we restricted the player from double-jumping while airborne. With these mechanics, players can now navigate the terrain by walking and jumping, ensuring a more interactive and engaging experience.

# Extra Features

Our Time-Varying Perlin feature utilizes the current time as a seed for its Perlin shading logic, creating an animated effect on the ground. Pressing the "T" key toggles this feature on and off, allowing you to control the animation effect easily. 

On the other hand, the Day/Night feature dynamically adjusts the lighting of the sky, world ambient lighting, and the position of the light based on the time of day. Pressing the "I" key initiates the day-night cycle at a standard speed of 100. If you wish to change the speed, pressing the "O" key doubles it, while the "P" key cuts it in half. This provides flexibility in adjusting the pace of the day-night transition to suit your preferences.