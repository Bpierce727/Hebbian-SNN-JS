// physics.js

// Alias Matter.js modules for easier reference
const Engine = Matter.Engine,
      Render = Matter.Render,
      World = Matter.World,
      Bodies = Matter.Bodies,
      Body = Matter.Body,
      Constraint = Matter.Constraint,
      Mouse = Matter.Mouse,
      MouseConstraint = Matter.MouseConstraint,
      Events = Matter.Events;

// Create an engine
const engine = Engine.create();

// Get the world canvas and set its dimensions
const worldCanvas = document.getElementById('world');
worldCanvas.width = window.innerWidth - 300; // Adjust width for network canvas
worldCanvas.height = window.innerHeight;

// Create a renderer for the physics simulation
const render = Render.create({
    element: document.body,
    canvas: worldCanvas,
    engine: engine,
    options: {
        width: worldCanvas.width,
        height: worldCanvas.height,
        wireframes: false,
        background: '#fafafa',
        showAngleIndicator: true,
        showCollisions: true,
    }
});

// Create the ground
const ground = Bodies.rectangle(
    (worldCanvas.width) / 2,
    worldCanvas.height - 50,
    worldCanvas.width,
    100,
    { isStatic: true }
);
ground.render.fillStyle = '#654321'; // Brown color for the ground

// Define character parts with labels and styles
const torso = Bodies.rectangle(400, 200, 40, 80, { density: 0.001 });
torso.label = 'Torso';
torso.render.fillStyle = '#FFC0CB'; // Pink

const upperLegLeft = Bodies.rectangle(380, 300, 20, 60, { density: 0.001 });
upperLegLeft.label = 'Upper Leg Left';
upperLegLeft.render.fillStyle = '#ADD8E6'; // Light Blue

const lowerLegLeft = Bodies.rectangle(380, 360, 20, 60, { density: 0.001 });
lowerLegLeft.label = 'Lower Leg Left';
lowerLegLeft.render.fillStyle = '#0000FF'; // Blue

const upperLegRight = Bodies.rectangle(420, 300, 20, 60, { density: 0.001 });
upperLegRight.label = 'Upper Leg Right';
upperLegRight.render.fillStyle = '#ADD8E6'; // Light Blue

const lowerLegRight = Bodies.rectangle(420, 360, 20, 60, { density: 0.001 });
lowerLegRight.label = 'Lower Leg Right';
lowerLegRight.render.fillStyle = '#0000FF'; // Blue

// Head
const head = Bodies.circle(400, 150, 20, { density: 0.001 });
head.label = 'Head';
head.render.fillStyle = '#FFDAB9'; // Peach

// Define all necessary joints (constraints)

// 1. Torso to Upper Legs
const jointTorsoLeftLeg = Constraint.create({
    bodyA: torso,
    pointA: { x: -10, y: 40 },
    bodyB: upperLegLeft,
    pointB: { x: 0, y: -30 },
    stiffness: 1,
    length: 0
});

const jointTorsoRightLeg = Constraint.create({
    bodyA: torso,
    pointA: { x: 10, y: 40 },
    bodyB: upperLegRight,
    pointB: { x: 0, y: -30 },
    stiffness: 1,
    length: 0
});

// 2. Upper Legs to Lower Legs
const jointUpperLowerLeftLeg = Constraint.create({
    bodyA: upperLegLeft,
    pointA: { x: 0, y: 30 },
    bodyB: lowerLegLeft,
    pointB: { x: 0, y: -30 },
    stiffness: 1,
    length: 0
});

const jointUpperLowerRightLeg = Constraint.create({
    bodyA: upperLegRight,
    pointA: { x: 0, y: 30 },
    bodyB: lowerLegRight,
    pointB: { x: 0, y: -30 },
    stiffness: 1,
    length: 0
});

// 3. Neck (Head to Torso)
const neck = Constraint.create({
    bodyA: head,
    pointA: { x: 0, y: 20 },
    bodyB: torso,
    pointB: { x: 0, y: -40 },
    stiffness: 1,
    length: 0
});

// Boundary Walls Setup
const wallThickness = 50;

// Create Top Wall
const topWall = Bodies.rectangle(
    worldCanvas.width / 2,
    -wallThickness / 2,
    worldCanvas.width,
    wallThickness,
    {
        isStatic: true,
        render: {
            fillStyle: 'rgba(0, 0, 0, 0)', // Invisible
        }
    }
);

// Create Left Wall
const leftWall = Bodies.rectangle(
    -wallThickness / 2,
    worldCanvas.height / 2,
    wallThickness,
    worldCanvas.height,
    {
        isStatic: true,
        render: {
            fillStyle: 'rgba(0, 0, 0, 0)', // Invisible
        }
    }
);

// Create Right Wall
const rightWall = Bodies.rectangle(
    worldCanvas.width + wallThickness / 2,
    worldCanvas.height / 2,
    wallThickness,
    worldCanvas.height,
    {
        isStatic: true,
        render: {
            fillStyle: 'rgba(0, 0, 0, 0)', // Invisible
        }
    }
);

// Add all bodies and constraints to the world
const allBodies = [
    ground,
    torso,
    head,
    upperLegLeft,
    lowerLegLeft,
    upperLegRight,
    lowerLegRight,
    jointTorsoLeftLeg,
    jointTorsoRightLeg,
    jointUpperLowerLeftLeg,
    jointUpperLowerRightLeg,
    neck,
    topWall,
    leftWall,
    rightWall
];

World.add(engine.world, allBodies);

/* --------------------- Mouse Interaction Setup --------------------- */

// Create a mouse instance
const mouse = Mouse.create(worldCanvas);

// Create a mouse constraint to allow dragging of bodies
const mouseConstraint = MouseConstraint.create(engine, {
    mouse: mouse,
    constraint: {
        stiffness: 0.2,
        render: {
            visible: false
        }
    }
});

// Add the mouse constraint to the world
World.add(engine.world, mouseConstraint);

// Ensure the mouse is synced with the renderer
render.mouse = mouse;

// Highlight the body under the mouse cursor
Events.on(render, 'afterRender', function() {
    const context = render.context;
    if (mouseConstraint.body) {
        context.beginPath();
        context.arc(mouseConstraint.body.position.x, mouseConstraint.body.position.y, 20, 0, 2 * Math.PI);
        context.strokeStyle = 'rgba(0, 255, 0, 0.6)';
        context.lineWidth = 2;
        context.stroke();
    }
});

/* ------------------- Optional: Handle Window Resize ------------------ */

window.addEventListener('resize', function() {
    // Update world canvas size
    worldCanvas.width = window.innerWidth - 300;
    worldCanvas.height = window.innerHeight;

    // Update renderer options
    Render.lookAt(render, {
        min: { x: 0, y: 0 },
        max: { x: worldCanvas.width, y: worldCanvas.height }
    });

    // Reposition the ground
    Body.setPosition(ground, { x: worldCanvas.width / 2, y: worldCanvas.height - 50 });

    // Reposition Boundary Walls
    Body.setPosition(topWall, { x: worldCanvas.width / 2, y: -wallThickness / 2 });
    Body.setPosition(leftWall, { x: -wallThickness / 2, y: worldCanvas.height / 2 });
    Body.setPosition(rightWall, { x: worldCanvas.width + wallThickness / 2, y: worldCanvas.height / 2 });
});
