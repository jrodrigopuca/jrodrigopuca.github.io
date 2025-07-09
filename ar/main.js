// Variables globales
let xrSession = null;
let xrRefSpace = null;
let gl = null;
let renderer = null; // Para Three.js, si lo usas
let scene = null; // Para Three.js, si lo usas
let camera = null; // Para Three.js, si lo usas
let arCanvas = document.getElementById("ar-canvas");
let captureButton = document.getElementById("capture-button");
let messageDiv = document.getElementById("message");

// Variables para el marco
let frameMesh = null; // Malla del marco
let isDraggingFrame = false;
let initialTouchX, initialTouchY;
let initialFramePosition = new THREE.Vector3(); // Posición inicial del marco
let lastHitResult = null; // Para almacenar el resultado de la detección de superficies

// --- 1. Verificación de Compatibilidad y Solicitud de Sesión ---
async function initAR() {
	try {
		const isARSupported = await navigator.xr.isSessionSupported("immersive-ar");
		if (!isARSupported) {
			messageDiv.textContent = "Tu navegador no soporta WebXR AR.";
			messageDiv.style.display = "block";
			return;
		}

		// Si es compatible, habilita el botón de iniciar AR
		captureButton.style.display = "block";
		captureButton.textContent = "Iniciar AR";
		captureButton.onclick = startARSession;
	} catch (error) {
		console.error("Error al verificar la compatibilidad con WebXR:", error);
		messageDiv.textContent = `Error al verificar WebXR: ${error.message}`;
		messageDiv.style.display = "block";
	}
}

async function startARSession() {
	try {
		xrSession = await navigator.xr.requestSession("immersive-ar", {
			requiredFeatures: ["local", "hit-test"], // 'hit-test' es crucial para colocar objetos
			optionalFeatures: ["dom-overlay"], // Puede ser útil para UI superpuesta
			domOverlay: { root: document.body }, // Opcional: para que el botón sea parte del overlay
		});

		xrSession.addEventListener("end", onSessionEnded);

		// Oculta el mensaje si todo va bien
		messageDiv.style.display = "none";

		// Configura el contexto WebGL
		gl = arCanvas.getContext("webgl", { xrCompatible: true });
		if (!gl) {
			alert("Necesitas un navegador compatible con WebGL.");
			return;
		}

		// Para Three.js (recomendado para gráficos 3D)
		renderer = new THREE.WebGLRenderer({
			alpha: true, // Para ver el passthrough de la cámara
			preserveDrawingBuffer: true, // Importante para la captura de pantalla
			canvas: arCanvas,
			context: gl,
		});
		renderer.autoClear = false; // El fondo de la cámara ya es transparente
		renderer.setPixelRatio(window.devicePixelRatio);
		renderer.setSize(window.innerWidth, window.innerHeight);

		scene = new THREE.Scene();
		camera = new THREE.PerspectiveCamera(); // La cámara será actualizada por WebXR

		// Configura el sistema de referencia para AR
		xrRefSpace = await xrSession.requestReferenceSpace("viewer"); // 'viewer' para hit-testing
		// Una vez que tenemos la sesión y el espacio de referencia, podemos solicitar el espacio 'local'
		// para posicionar objetos de manera más estable en el entorno.
		// xrRefSpace = await xrSession.requestReferenceSpace('local'); // O 'local-floor' si necesitas altura

		// Crea el marco (inicialmente invisible o en una posición por defecto)
		createFrame();

		// Inicia el bucle de renderizado WebXR
		xrSession.requestAnimationFrame(onXRFrame);

		// Cambia el texto del botón y habilita la captura
		captureButton.textContent = "Capturar Screenshot";
		captureButton.onclick = takeScreenshot;
	} catch (error) {
		console.error("Error al iniciar la sesión WebXR AR:", error);
		messageDiv.textContent = `Error al iniciar AR: ${error.message}. Asegúrate de permitir el acceso a la cámara.`;
		messageDiv.style.display = "block";
	}
}

function onSessionEnded() {
	xrSession = null;
	gl = null;
	renderer = null;
	scene = null;
	camera = null;
	frameMesh = null;
	lastHitResult = null;
	messageDiv.textContent = "Sesión AR finalizada.";
	messageDiv.style.display = "block";
	captureButton.textContent = "Iniciar AR";
	captureButton.onclick = startARSession;
}

// --- 2. Creación y Manejo del Marco ---
function createFrame() {
	// Define las dimensiones del marco
	const frameWidth = 0.5; // metros
	const frameHeight = 0.8; // metros
	const frameThickness = 0.02; // metros

	// Geometría del marco (un cubo hueco o 4 barras)
	const material = new THREE.MeshBasicMaterial({
		color: 0xff00ff,
		wireframe: false,
		transparent: true,
		opacity: 0.7,
	});

	// Esto crea un marco simple usando BoxGeometry
	const frameGroup = new THREE.Group();

	// Barra superior
	const topBar = new THREE.Mesh(
		new THREE.BoxGeometry(
			frameWidth + frameThickness * 2,
			frameThickness,
			frameThickness
		),
		material
	);
	topBar.position.y = frameHeight / 2 + frameThickness / 2;
	frameGroup.add(topBar);

	// Barra inferior
	const bottomBar = new THREE.Mesh(
		new THREE.BoxGeometry(
			frameWidth + frameThickness * 2,
			frameThickness,
			frameThickness
		),
		material
	);
	bottomBar.position.y = -frameHeight / 2 - frameThickness / 2;
	frameGroup.add(bottomBar);

	// Barra izquierda
	const leftBar = new THREE.Mesh(
		new THREE.BoxGeometry(frameThickness, frameHeight, frameThickness),
		material
	);
	leftBar.position.x = -frameWidth / 2 - frameThickness / 2;
	frameGroup.add(leftBar);

	// Barra derecha
	const rightBar = new THREE.Mesh(
		new THREE.BoxGeometry(frameThickness, frameHeight, frameThickness),
		material
	);
	rightBar.position.x = frameWidth / 2 + frameThickness / 2;
	frameGroup.add(rightBar);

	frameMesh = frameGroup;
	scene.add(frameMesh);

	// Inicialmente, colocar el marco frente al usuario
	const initialDistance = -1.5; // 1.5 metros delante del usuario
	frameMesh.position.z = initialDistance;
	// Si usas 'viewer' ref space, el marco se moverá con la cámara inicialmente.
	// Necesitamos que se quede fijo en el espacio.
	// Esto se corrige cuando se detectan superficies.
}

// --- 3. Detección de Superficies y Movimiento del Marco ---
// El 'hit-test' es esencial para esto.
arCanvas.addEventListener("touchstart", onTouchStart);
arCanvas.addEventListener("touchmove", onTouchMove);
arCanvas.addEventListener("touchend", onTouchEnd);

function onTouchStart(event) {
	if (!xrSession || !xrRefSpace || !frameMesh) return;

	// Solo considera el primer toque para evitar problemas multitouch
	const touch = event.touches[0];

	// Verificar si el toque está sobre el marco (detección de colisiones simple)
	// Esto es un poco más complejo en 3D. Para simplicidad, vamos a asumir que
	// un toque inicia un movimiento del marco si está en "modo de arrastre".
	// Una forma de hacerlo sería lanzar un rayo desde el toque y ver si intersecta el marco.
	// Por ahora, asumiremos que cualquier toque después de que el marco esté "fijo" lo mueve.

	// Para iniciar el arrastre, puedes requerir que el toque esté cerca del marco o en el centro.
	// Una forma simple es que el primer toque inicie el arrastre, y los subsiguientes toques
	// muevan el marco en el espacio AR.

	// Si quieres mover el marco:
	isDraggingFrame = true;
	initialTouchX = touch.clientX;
	initialTouchY = touch.clientY;
	initialFramePosition.copy(frameMesh.position); // Guarda la posición actual del marco

	// Crear un objeto para la solicitud de hit-test.
	// Necesitas un XRHitTestSource si quieres un seguimiento continuo.
	// Para un hit-test puntual en cada toque, lo creas y lo usas.
}

function onTouchMove(event) {
	if (!xrSession || !xrRefSpace || !isDraggingFrame) return;

	const touch = event.touches[0];
	const dx = touch.clientX - initialTouchX;
	const dy = touch.clientY - initialTouchY;

	// Convertir el movimiento de la pantalla a movimiento en el espacio 3D
	// Esto es un desafío en AR porque no hay una relación 1:1 simple.
	// La forma más robusta es usar el resultado de un hit-test.

	// Solicitamos un hit test desde el centro de la pantalla (o desde el punto de toque)
	// en cada frame de movimiento para determinar la nueva posición.
	if (xrSession) {
		const frame = xrSession.lastFrame; // Obtener el último frame disponible
		if (frame) {
			// Crea un rayo desde el punto de toque en la pantalla
			const ray = new THREE.Vector2(
				(touch.clientX / window.innerWidth) * 2 - 1,
				-(touch.clientY / window.innerHeight) * 2 + 1
			);

			// Realiza el hit test
			const hitTestResults = frame.getHitTestResults(
				xrSession.requestHitTestSource({ space: xrRefSpace, ray: ray })
			);

			if (hitTestResults.length > 0) {
				lastHitResult = hitTestResults[0]; // El primer resultado es el más relevante
				const pose = lastHitResult.getPose(xrRefSpace);
				if (pose) {
					// Actualiza la posición del marco a la posición del hit-test
					frameMesh.position.copy(pose.transform.position);
					frameMesh.quaternion.copy(pose.transform.orientation);
					// Opcional: Alinear el marco con la superficie detectada
					frameMesh.rotation.setFromQuaternion(pose.transform.orientation);
					// Rotar si es necesario para que el marco esté "vertical"
					frameMesh.rotation.x = Math.PI / 2; // Ejemplo para alinear al suelo
				}
			}
		}
	}
}

function onTouchEnd(event) {
	isDraggingFrame = false;
	// Opcional: si la intención era fijar el marco en el lugar donde se soltó el dedo,
	// asegúrate de que el marco permanezca en `lastHitResult` si existió.
	// Si no hubo un hit-test exitoso, el marco podría volver a su posición anterior o permanecer donde estaba.
}

// --- 4. Bucle de Renderizado WebXR ---
function onXRFrame(time, frame) {
	if (!xrSession) return;

	const pose = frame.getViewerPose(xrRefSpace);

	if (pose) {
		// Actualiza la cámara de Three.js con la pose de la cámara AR
		camera.matrix.fromArray(pose.transform.matrix);
		camera.projectionMatrix.fromArray(pose.views[0].projectionMatrix); // Si hay múltiples vistas, usar la primera
		camera.updateMatrixWorld(true); // Actualiza la matriz mundial de la cámara

		// Si tenemos un resultado de hit-test, actualizamos la posición del marco
		// Solo si no estamos arrastrando el marco manualmente
		if (!isDraggingFrame && lastHitResult) {
			const hitPose = lastHitResult.getPose(xrRefSpace);
			if (hitPose) {
				frameMesh.position.copy(hitPose.transform.position);
				frameMesh.quaternion.copy(hitPose.transform.orientation);
				// Alinear el marco verticalmente si el hit test fue sobre un plano horizontal
				frameMesh.rotation.x = Math.PI / 2; // Ejemplo: alinear con el suelo
			}
		} else if (!isDraggingFrame && !lastHitResult) {
			// Si no hay hit-test, el marco puede permanecer inicialmente frente al usuario.
			// Una vez que el usuario lo mueva con un hit-test, se fijará.
			// Para posicionar el marco inicialmente frente al usuario sin hit-test:
			// Obtén la posición del espectador
			const viewerPosition = pose.transform.position;
			const viewerOrientation = pose.transform.orientation;

			// Crea un vector que apunta hacia adelante desde la cámara
			const forward = new THREE.Vector3(0, 0, -1); // -Z es hacia adelante en WebXR
			const viewerQuat = new THREE.Quaternion(
				viewerOrientation.x,
				viewerOrientation.y,
				viewerOrientation.z,
				viewerOrientation.w
			);
			forward.applyQuaternion(viewerQuat);

			// Posiciona el marco a una distancia fija frente a la cámara
			const distance = 1.0; // 1 metro frente a la cámara
			frameMesh.position
				.copy(viewerPosition)
				.add(forward.multiplyScalar(distance));
			frameMesh.quaternion.copy(viewerOrientation);
			// Asegúrate de que el marco esté vertical
			frameMesh.rotation.x = 0; // O la rotación que necesites para que esté vertical
		}

		// Renderiza la escena 3D
		gl.bindFramebuffer(
			gl.FRAMEBUFFER,
			xrSession.renderState.baseLayer.framebuffer
		);
		renderer.render(scene, camera);
	}

	xrSession.requestAnimationFrame(onXRFrame);
}

// --- 5. Captura de Pantalla ---
function takeScreenshot() {
	if (!gl || !arCanvas) {
		alert("No hay una sesión AR activa para tomar la captura.");
		return;
	}

	// La clave es que el WebGLRenderer debe estar configurado con preserveDrawingBuffer: true
	// y que la captura se haga DESPUÉS del renderizado del frame.

	// Simplemente obtenemos la URL de datos del canvas
	const dataURL = arCanvas.toDataURL("image/png");

	// Crea un enlace para descargar la imagen
	const a = document.createElement("a");
	a.href = dataURL;
	a.download = "captura_ar.png";
	document.body.appendChild(a);
	a.click();
	document.body.removeChild(a);

	alert("Captura de pantalla guardada!");
}

// Iniciar la verificación de compatibilidad al cargar la página
window.onload = () => {
	// Carga Three.js antes de iniciar
	const script = document.createElement("script");
	script.src =
		"https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"; // Usa una versión estable
	script.onload = initAR;
	document.head.appendChild(script);
};
