import React, { useState, useRef } from 'react';
import axios from 'axios';
import { Leaf, Scan, Cloud, Brain, MessageCircle, ShoppingCart, ShieldCheck } from 'lucide-react';

function App() {
  // --- LOGIN STATE ---
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showDashboard, setShowDashboard] = useState(false);
  const [loginData, setLoginData] = useState({ username: '', password: '' });

  // --- DASHBOARD STATES ---
  const [activeTab, setActiveTab] = useState('recommend');
  const [formData, setFormData] = useState({
    nitrogen: '', phosphorus: '', potassium: '',
    temperature: '', humidity: '', ph: '', rainfall: '',
    selectedMonth: new Date().getMonth()
  });
  
  // --- NEW FERTILIZER STATES ---
  // eslint-disable-next-line no-unused-vars
  const [fertForm, setFertForm] = useState({
    cropName: 'Banana',
    landSize: '',
    plantAge: '',
    soilType: 'Red Soil (ఎర్ర నేల)'
  });
  // eslint-disable-next-line no-unused-vars
  const [fertPlan, setFertPlan] = useState(null);

  // --- NEW WATER STATE ---
  // eslint-disable-next-line no-unused-vars
  const [waterResult, setWaterResult] = useState(null);
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);
  
  // వేర్వేరు స్టేట్స్ - దీనివల్ల ఫోటోలు మిక్స్ అవ్వవు
  const [selectedFile, setSelectedFile] = useState(null); // Crop Disease File
  const [preview, setPreview] = useState(null);           // Crop Disease Preview
  
  const [detectionResult, setDetectionResult] = useState(null);
  const [detecting, setDetecting] = useState(false);
  const [chatHistory, setChatHistory] = useState([{ role: 'bot', text: 'Hello! Ask me any farming questions.' }]);
  const [chatInput, setChatInput] = useState('');
  // eslint-disable-next-line no-unused-vars
  const [userInput, setUserInput] = useState("");
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [cameraActive, setCameraActive] = useState(false); // యూజర్ టైప్ చేసే మెసేజ్ కోసం

  // eslint-disable-next-line no-unused-vars
  const soilTypes = [
    { type: "Alluvial Soil (ఒండ్రు నేల)", n: "80", p: "45", k: "50", ph: "7.2", crops: "Rice, Wheat, Sugarcane" },
    { type: "Red Soil (ఎర్ర నేల)", n: "40", p: "20", k: "30", ph: "6.5", crops: "Groundnut, Cotton, Millets" },
    { type: "Black Soil (నల్ల రేగడి నేల)", n: "50", p: "30", k: "60", ph: "7.8", crops: "Cotton, Tobacco, Chilies" }
  ];

  // --- HANDLERS ---
  const handleLogin = (e) => {
    e.preventDefault();
    if (loginData.username && loginData.password) {
      setIsLoggedIn(true);
      setShowDashboard(true);
    } else {
      alert("Please enter both Username and Password!");
    }
  };

  // Crop Disease File Handler
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setPreview(URL.createObjectURL(file));
      setDetectionResult(null);
    }
  };

  // eslint-disable-next-line no-unused-vars
  const handleWaterTest = () => {
    setDetecting(true);
    setTimeout(() => {
      setWaterResult({
        ph: "7.2",
        tds: "450 ppm",
        hardness: "Moderate",
        recommendation: "నీరు సాగుకు అనుకూలంగా ఉంది. వరి మరియు పండ్ల తోటలకు వాడవచ్చు."
      });
      setDetecting(false);
    }, 2000);
  };

  const handleUpload = async () => {
    if (!selectedFile) return alert("Please select an image first!");
    setDetecting(true);
    const form = new FormData();
    form.append('file', selectedFile);
    try {
      const res = await axios.post('http://localhost:5000/predict-disease', form);
      setDetectionResult({
        disease: res.data.prediction,
        confidence: (res.data.confidence * 100).toFixed(2),
        remedy: "Apply recommended organic pesticides and ensure proper sunlight."
      });
    } catch (err) { alert("Error detecting disease. Make sure Flask is running!"); }
    setDetecting(false);
  };

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axios.post('http://127.0.0.1:5000/predict-crop', formData);
      setPrediction(res.data.prediction);
    } catch (err) { alert("Backend error! Make sure Flask server is running."); }
    setLoading(false);
  };

  const handleChat = async () => {
  const messageToSend = chatInput.trim();
  if (!messageToSend || loading) return;

  // 1. యూజర్ మెసేజ్‌ని వెంటనే చాట్ స్క్రీన్‌పై చూపించు
  setLoading(true);
  setChatHistory(prev => [...prev, { role: 'user', text: messageToSend }]);
  setChatInput(""); // ఇన్పుట్ బాక్స్ ఖాళీ చేయి

  try {
    const response = await fetch("http://127.0.0.1:5000/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message: messageToSend }),
    });

    if (!response.ok) throw new Error("సర్వర్ నుండి సరైన స్పందన రాలేదు.");

    const data = await response.json();

    // 2. AI సమాధానాన్ని హిస్టరీకి యాడ్ చేయి
    setChatHistory(prev => [...prev, { role: 'bot', text: data.response }]);
  } catch (error) {
    console.error("Fetch Error:", error);
    // ఎర్రర్ వస్తే యూజర్‌కి తెలియజేయి
    setChatHistory(prev => [...prev, { 
      role: 'bot', 
      text: "❌ క్షమించండి, AI బ్రెయిన్‌ను కనెక్ట్ చేయడంలో సమస్య ఉంది. దయచేసి మీ Flask సర్వర్ (Backend) రన్ అవుతుందో లేదో చూడండి." 
    }]);
  } finally {
    setLoading(false);
  }
};

  const FloatingBot = ({ onClick }) => (
  <div 
    onClick={onClick}
    style={{
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      backgroundColor: '#22c55e',
      width: '60px',
      height: '60px',
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'pointer',
      boxShadow: '0px 4px 15px rgba(0,0,0,0.3)',
      zIndex: 1000,
      transition: 'transform 0.2s'
    }}
    onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
    onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1.0)'}
  >
    <MessageCircle size={30} color="#000" />
    <span style={{ 
      position: 'absolute', 
      top: '-10px', 
      backgroundColor: '#fff', 
      color: '#000', 
      padding: '2px 8px', 
      borderRadius: '10px', 
      fontSize: '10px', 
      fontWeight: 'bold',
      border: '1px solid #22c55e'
    }}>AI Help</span>
  </div>
);

// --- కెమెరా ఫంక్షన్లు ---
  const startCamera = async () => {
    setCameraActive(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: "environment" } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Camera Error:", err);
      alert("కెమెరా పర్మిషన్ అవసరం!");
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject;
      stream.getTracks().forEach(track => track.stop());
    }
    setCameraActive(false);
  };

  const capturePhoto = (type) => { // 'crop' లేదా 'soil' అని పాస్ చేయాలి
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (video && canvas) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      canvas.getContext('2d').drawImage(video, 0, 0);
      const imageData = canvas.toDataURL('image/png');
      
      // మీరు ఏ బటన్ ద్వారా కెమెరా ఓపెన్ చేశారో దాన్ని బట్టి ఇక్కడ సెట్ చేయండి
      if (type === 'crop') {
        setPreview(imageData);
        setSelectedFile(imageData); // మీ backend base64 తీసుకుంటే ఇది ఓకే
      } else {
      }
      
      stopCamera();
    }
  };

 // --- RENDER CONTENT ---
const renderContent = () => {
  // 1. Voice Recognition Function
  // eslint-disable-next-line no-unused-vars
  const startListening = () => {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const recognition = new SpeechRecognition();
  
  recognition.lang = 'te-IN';
  recognition.interimResults = true; // ఇది మీ మాటలను వేగంగా గుర్తిస్తుంది

  recognition.onstart = () => {
    console.log("Listening...");
  };

  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript;
    setChatInput(transcript); 
  };

  recognition.onerror = (event) => {
    if (event.error === 'no-speech') {
      alert("మళ్ళీ ప్రయత్నించండి! బహుశా మీరు మైక్ కి దూరంగా ఉన్నారేమో.");
    }
  };

  recognition.start();
};

  // 2. Shared Media Button Component (File & Camera)
  const MediaButtons = ({ onFileSelect }) => (
    <div style={{ display: 'flex', justifyContent: 'center', gap: '15px', marginTop: '20px' }}>
      <label style={{ backgroundColor: '#242b26', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', border: '1px solid #22c55e', fontSize: '0.9rem' }}>
        📁 Choose File
        <input type="file" accept="image/*" onChange={onFileSelect} style={{ display: 'none' }} />
      </label>
      
      <button 
        onClick={startCamera}
        style={{ backgroundColor: '#242b26', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', border: '1px solid #22c55e', color: '#fff', fontSize: '0.9rem' }}
      >
        📸 Open Camera
      </button>

      {cameraActive && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.9)', zIndex: 1000, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <video ref={videoRef} autoPlay playsInline style={{ width: '90%', maxWidth: '500px', borderRadius: '10px', border: '2px solid #22c55e' }} />
          <canvas ref={canvasRef} style={{ display: 'none' }} />
          <div style={{ marginTop: '20px', display: 'flex', gap: '20px' }}>
            <button onClick={capturePhoto} style={{ backgroundColor: '#22c55e', color: '#000', padding: '12px 30px', borderRadius: '50px', border: 'none', fontWeight: 'bold' }}>📸 Take Photo</button>
            <button onClick={stopCamera} style={{ backgroundColor: '#ff4444', color: '#fff', padding: '12px 30px', borderRadius: '50px', border: 'none', fontWeight: 'bold' }}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );

  const askForRemedy = (diseaseInfo) => {
  // ఇంగ్లీష్ క్వరీ
  const query = `My plant is diagnosed with ${diseaseInfo.name}. Please provide immediate remedies and prevention tips for this.`;
  
  setChatInput(query); // అసిస్టెంట్ బాక్స్‌లో ప్రశ్నను సెట్ చేస్తుంది
  setActiveTab('assistant'); // అసిస్టెంట్ ట్యాబ్‌కి మారుస్తుంది
  
  // ఆటోమేటిక్‌గా అసిస్టెంట్ సమాధానం ఇవ్వడం కోసం:
  if(typeof handleChat === 'function') {
    setTimeout(() => {
      handleChat(query); 
    }, 500);
  }
};  
    switch (activeTab) {
      case 'scan':
  // 1. మీ ఫోల్డర్ పేర్లకు సరిగ్గా మ్యాచ్ అయ్యేలా అప్‌డేట్ చేసిన మ్యాపింగ్
  const diseaseMapping = {
    // Apple (యాపిల్)
    "Apple___Apple_scab": { name: "యాపిల్ స్కాబ్", remedy: "వ్యాధి సోకిన ఆకులను ఏరివేయండి. మాంకోజెబ్ లేదా వేప నూనె వాడండి." },
    "Apple___Black_rot": { name: "యాపిల్ బ్లాక్ రాట్ (నలుపు కుళ్ళు)", remedy: "ఎండిన కొమ్మలను కత్తిరించండి. కాపర్ ఆధారిత శిలీంద్రనాశకాలను వాడండి." },
    "Apple___Cedar_apple_rust": { name: "యాపిల్ తుప్పు తెగులు", remedy: "చుట్టుపక్కల ఉన్న జునిపెర్ మొక్కలను తొలగించండి. మైక్లోబ్యూటానిల్ పిచికారీ చేయండి." },
    "Apple___healthy": { name: "యాపిల్ (ఆరోగ్యంగా ఉంది)", remedy: "మొక్క చాలా బాగుంది! పోషకాలను అందిస్తూ జాగ్రత్తగా చూసుకోండి." },

    // Corn (మొక్కజొన్న)
    "Corn_(maize)___Cercospora_leaf_spot Gray_leaf_spot": { name: "మొక్కజొన్న ఆకు మచ్చ తెగులు", remedy: "పంట మార్పిడి చేయండి. గాలి వెలుతురు ఉండేలా చూడండి." },
    "Corn_(maize)___Common_rust_": { name: "మొక్కజొన్న తుప్పు తెగులు", remedy: "నిరోధక రకాలను వాడండి. తగిన శిలీంద్రనాశకాలు వాడండి." },
    "Corn_(maize)___Northern_Leaf_Blight": { name: "నార్తర్న్ లీఫ్ బ్లైట్", remedy: "సోకిన ఆకులను నాశనం చేయండి. పొలంలో నీరు నిల్వకుండా చూడండి." },
    "Corn_(maize)___healthy": { name: "మొక్కజొన్న (ఆరోగ్యంగా ఉంది)", remedy: "మొక్క ఆరోగ్యంగా ఉంది." },

    // Grape (ద్రాక్ష)
    "Grape___Black_rot": { name: "ద్రాక్ష నలుపు కుళ్ళు", remedy: "పండ్ల గుత్తులకు గాలి తగిలేలా కత్తిరింపులు చేయండి. కాపర్ ఫంగిసైడ్స్ వాడండి." },
    "Grape___Esca_(Black_Measles)": { name: "ద్రాక్ష ఎస్కా (నలుపు మచ్చలు)", remedy: "కత్తిరింపు తర్వాత గాయాలకు మందు రాయండి. సోకిన కొమ్మలను తొలగించండి." },
    "Grape___Leaf_blight_(Isariopsis_Leaf_Spot)": { name: "ద్రాక్ష ఆకు మాడ తెగులు", remedy: "సరైన తేమ ఉండేలా చూడండి. తగిన మందులు పిచికారీ చేయండి." },
    "Grape___healthy": { name: "ద్రాక్ష (ఆరోగ్యంగా ఉంది)", remedy: "మొక్క ఆరోగ్యంగా ఉంది." },

    // Potato (బంగాళదుంప)
    "Potato___Early_blight": { name: "బంగాళదుంప ముందస్తు మాడు తెగులు", remedy: "మొక్కల మధ్య సరైన దూరం పాటించండి. క్లోరోథలోనిల్ వాడండి." },
    "Potato___Late_blight": { name: "బంగాళదుంప లేట్ బ్లైట్", remedy: "వ్యాధి సోకిన మొక్కలను పీకి కాల్చివేయండి. తోటలో తేమ తగ్గించండి." },
    "Potato___healthy": { name: "బంగాళదుంప (ఆరోగ్యంగా ఉంది)", remedy: "మొక్క ఆరోగ్యంగా ఉంది." },

    // Tomato (టమాటా)
    "Tomato___Bacterial_spot": { name: "టమాటా బ్యాక్టీరియా మచ్చ తెగులు", remedy: "కాపర్ ఫంగిసైడ్ మరియు స్ట్రెప్టోమైసిన్ వాడండి." },
    "Tomato___Early_blight": { name: "టమాటా ముందస్తు మాడు తెగులు", remedy: "కింద ఉన్న పాత ఆకులను తీసివేయండి. మల్చింగ్ వాడండి." },
    "Tomato___Late_blight": { name: "టమాటా ఆకు మాడ తెగులు", remedy: "గాలిలో తేమను అదుపు చేయండి. తగిన మందులు వాడండి." },
    "Tomato___Leaf_Mold": { name: "ఆకు బూజు తెగులు", remedy: "గాలి వెలుతురు పెంచండి. మొక్క మొదళ్ల వద్ద నీరు పోయండి." },
    "Tomato___Septoria_leaf_spot": { name: "టమాటా సెప్టోరియా ఆకు మచ్చ", remedy: "సోకిన ఆకులను తీసివేయండి. పొలాన్ని శుభ్రంగా ఉంచండి." },
    "Tomato___Spider_mites Two-spotted_spider_mite": { name: "టమాటా ఎర్ర నల్లి", remedy: "వేప నూనె లేదా అబమెక్టిన్ పిచికారీ చేయండి." },
    "Tomato___Target_Spot": { name: "టార్గెట్ స్పాట్ తెగులు", remedy: "పంట మార్పిడి చేయండి. పొటాషియం ఎరువులు అందించండి." },
    "Tomato___Tomato_Yellow_Leaf_Curl_Virus": { name: "టమాటా ఆకు ముడత వైరస్", remedy: "తెల్ల దోమను (Whitefly) అదుపు చేయండి. నెట్లు వాడండి." },
    "Tomato___Tomato_mosaic_virus": { name: "టమాటా మొజాయిక్ వైరస్", remedy: "సోకిన మొక్కలను పీకి నాశనం చేయండి. పొగాకు ఉత్పత్తులు వాడకండి." },
    "Tomato___healthy": { name: "టమాటా (ఆరోగ్యంగా ఉంది)", remedy: "మొక్క చాలా ఆరోగ్యంగా ఉంది!" },
    
    // ఇతరులు (Peach, Pepper, Strawberry)
    "Peach___Bacterial_spot": { name: "పీచ్ బ్యాక్టీరియా మచ్చ తెగులు", remedy: "కాపర్ ఫంగిసైడ్స్ వాడండి." },
    "Pepper,_bell___Bacterial_spot": { name: "మిర్చి/బెల్ పెప్పర్ మచ్చ తెగులు", remedy: "నాణ్యమైన విత్తనాలు వాడండి. కాపర్ స్ప్రే చేయండి." },
    "Strawberry___Leaf_scorch": { name: "స్ట్రాబెర్రీ ఆకు మాడ తెగులు", remedy: "పాత ఆకులను తొలగించండి. అధిక నత్రజని వాడకండి." }
  };

  const resultInfo = detectionResult ? diseaseMapping[detectionResult.disease] : null;

  return (
    <div style={{ 
      position: 'relative', 
      minHeight: '80vh', 
      backgroundColor: '#161b18', 
      padding: '30px', 
      borderRadius: '15px', 
      textAlign: 'center' 
    }}>
      <Scan size={50} color="#22c55e" style={{ marginBottom: '15px' }} />
      <h2>AI Plant Disease Detection (మొక్కల వ్యాధి గుర్తింపు)</h2>
      
      {/* ఫోటో అప్‌లోడ్ సెక్షన్ */}
      <div style={{ border: '2px dashed #22c55e', padding: '20px', borderRadius: '12px', marginBottom: '20px', backgroundColor: '#0a0d0b' }}>
        {preview ? (
          <img src={preview} alt="Preview" style={{ maxWidth: '100%', maxHeight: '300px', borderRadius: '10px' }} />
        ) : (
          <div style={{ padding: '40px', opacity: 0.3 }}>
            <Scan size={40} /> 
            <p>No image selected (ఫోటో ఎంచుకోండి)</p>
          </div>
        )}
        <MediaButtons onFileSelect={handleFileChange} />
      </div>

      <button onClick={handleUpload} style={{ backgroundColor: '#22c55e', color: '#000', border: 'none', padding: '12px 30px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
        {detecting ? "Analyzing (విశ్లేషిస్తోంది...)" : "Scan Image (స్కాన్ చేయండి)"}
      </button>

      {/* ఫలితాల సెక్షన్ */}
      {detectionResult && (
        <>
          <div style={{ marginTop: '25px', padding: '20px', backgroundColor: '#242b26', borderRadius: '12px', borderLeft: '5px solid #22c55e', textAlign: 'left' }}>
            <h3 style={{ color: '#22c55e', marginBottom: '10px' }}>
              Result (ఫలితం): {resultInfo?.name || detectionResult.disease}
            </h3>
            <p><strong>Confidence (ఖచ్చితత్వం):</strong> {detectionResult.confidence}%</p>
            <hr style={{ opacity: 0.1, margin: '10px 0' }} />
            <p style={{ color: '#fff', lineHeight: '1.6', marginBottom: '15px' }}>
              <strong style={{ color: '#22c55e' }}>🌱 Remedy (నివారణ):</strong> <br />
              {resultInfo?.remedy || "తగిన జాగ్రత్తలు తీసుకోండి మరియు నిపుణులను సంప్రదించండి."}
            </p>

            {/* సాధారణ బటన్ */}
            <button 
              onClick={() => askForRemedy(resultInfo || { name: detectionResult.disease })}
              style={{ 
                backgroundColor: '#242b26', 
                color: '#22c55e', 
                border: '1px solid #22c55e', 
                padding: '10px 15px', 
                borderRadius: '8px', 
                cursor: 'pointer', 
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <MessageCircle size={18} /> అసిస్టెంట్‌ని మరిన్ని వివరాలు అడగండి
            </button>
          </div>

          {/* --- FLOATING BOT ICON --- */}
          <FloatingBot onClick={() => askForRemedy(resultInfo || { name: detectionResult.disease })} />
        </>
      )}
    </div>
  );
  
case 'pesticides':
  return (
    <div style={{ backgroundColor: '#161b18', padding: '30px', borderRadius: '15px' }}>
      <h2 style={{ color: '#22c55e' }}>Organic Pesticide Guide</h2>
      <div style={{ display: 'grid', gap: '15px', marginTop: '20px' }}>
        {[
          { name: "Neem Oil (వేప నూనె)", target: "Aphids, Whiteflies", prep: "5ml oil + 1L water + soap." },
          { name: "Ginger-Garlic-Chili (అల్లం-వెల్లుల్లి-మిర్చి)", target: "Caterpillars, Borers", prep: "500g each mix in 10L water." },
          { name: "Sour Buttermilk (పుల్లటి మజ్జిగ)", target: "Fungal diseases", prep: "1L old buttermilk + 10L water." },
          { name: "Neemasthram (నీమాస్త్రం)", target: "Sucking pests", prep: "Cow dung + Urine + Neem leaves." },
          { name: "Agniasthram (అగ్నిఅస్త్రం)", target: "Leaf rollers, Stem borer", prep: "Boil chili, garlic, neem in cow urine." },
          { name: "Brahmasthram (బ్రహ్మాస్త్రం)", target: "Big worms, caterpillars", prep: "Boil 5 bitter leaves in cow urine." },
          { name: "Dashaparni (దశపర్ణి కషాయం)", target: "All major pests", prep: "Mix of 10 types of medicinal leaves." },
          { name: "Tobacco Spray (పొగాకు కషాయం)", target: "Thrips, Aphids", prep: "Boil 1kg tobacco in 10L water." },
          { name: "Wood Ash (బూడిద)", target: "Beetles, Leaf miners", prep: "Dusting on leaves early morning." },
          { name: "Panchagavya (పంచగవ్య)", target: "Immunity & Growth", prep: "Cow dung, urine, milk, curd, ghee mix." },
          { name: "Aloe Vera Extract (కలబంద కషాయం)", target: "Viral diseases", prep: "Grind gel and mix with water." },
          { name: "Papaya Leaf (బొప్పాయి ఆకు)", target: "Fungus, Powdery mildew", prep: "Crushed leaves soaked in water." },
          { name: "Custard Apple Seed (సీతాఫలం గింజలు)", target: "Mealy bugs", prep: "Seed powder solution." },
          { name: "Marigold Extract (బంతి ఆకుల కషాయం)", target: "Nematodes", prep: "Boiled leaves extract." },
          { name: "Hing (ఇంగువ నీరు)", target: "Soil fungi", prep: "10g Hing in 10L water." },
          { name: "Turmeric Powder (పసుపు)", target: "Ants, Fungal infections", prep: "Dusting or mix with water." },
          { name: "Baking Soda Spray", target: "Powdery mildew", prep: "1 tsp soda + 1L water." },
          { name: "Milk Spray", target: "Tomato Blight", prep: "1 cup milk + 9 cups water." },
          { name: "Clove Oil (లవంగం నూనె)", target: "Flying insects", prep: "Few drops in water spray." },
          { name: "Cow Urine (పశువుల మూత్రం)", target: "General pests", prep: "1:10 ratio with water." },
          { name: "Eucalyptus Oil", target: "Flies and wasps", prep: "Dilute with water and spray." },
          { name: "Onion Peel Water", target: "Nutrient boost & pests", prep: "Soak peels for 24 hours." },
          { name: "Tomato Leaf Spray", target: "Aphids", prep: "Soak chopped leaves overnight." },
          { name: "Fish Oil Rosin Soap", target: "Sucking insects", prep: "Commercial or DIY mix." },
          { name: "Citrus Peel Spray", target: "Ants, Aphids", prep: "Boil orange peels in water." },
          { name: "Castor Oil Spray", target: "Mole crickets", prep: "Mix with soap and water." },
          { name: "Beauveria Bassiana", target: "Beetles, Moths", prep: "Apply as a spray or dust." },
        ].map((p, i) => (
          <div key={i} style={{ background: '#242b26', padding: '15px', borderRadius: '10px', borderLeft: '4px solid #22c55e' }}>
            <h4 style={{ margin: '0 0 5px 0', color: '#fff' }}>{p.name}</h4>
            <p style={{ fontSize: '0.85rem', color: '#22c55e' }}><strong>Target:</strong> {p.target}</p>
            <p style={{ fontSize: '0.85rem', opacity: 0.8 }}><strong>Preparation:</strong> {p.prep}</p>
          </div>
        ))}
      </div>
    </div>
  );

      case 'market':
        return (
          <div style={{ backgroundColor: '#161b18', padding: '30px', borderRadius: '15px' }}>
            <h2 style={{ color: '#22c55e' }}><ShoppingCart style={{ verticalAlign: 'middle', marginRight: '10px' }} /> Market Prices (Today)</h2>
            <table style={{ width: '100%', marginTop: '20px', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #242b26' }}>
                  <th style={{ padding: '10px' }}>Crop</th>
                  <th style={{ padding: '10px' }}>Price (Quintal)</th>
                  <th style={{ padding: '10px' }}>Trend</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { crop: "Paddy (వరి)", price: "₹2,200", trend: "↑ 2%" },
                  { crop: "Cotton (ప్రత్తి)", price: "₹7,500", trend: "↓ 1%" },
                  { crop: "Maize (మొక్కజొన్న)", price: "₹2,150", trend: "↑ 5%" },
                  { crop: "Chili (మిర్చి)", price: "₹18,000", trend: "Stable" }
                ].map((m, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #242b26' }}>
                    <td style={{ padding: '10px' }}>{m.crop}</td>
                    <td style={{ padding: '10px' }}>{m.price}</td>
                    <td style={{ padding: '10px', color: m.trend.includes('↑') ? '#22c55e' : m.trend.includes('↓') ? '#ef4444' : '#fff' }}>{m.trend}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      case 'assistant':
      return (
        <div style={{ backgroundColor: '#161b18', padding: '30px', borderRadius: '15px' }}>
          <h2 style={{ marginBottom: '15px' }}>AgriSense AI Assistant (అగ్రిసెన్స్ AI అసిస్టెంట్)</h2>
          <div style={{ height: '350px', backgroundColor: '#0a0d0b', borderRadius: '10px', padding: '15px', marginBottom: '15px', overflowY: 'auto', border: '1px solid #242b26' }}>
            {chatHistory.map((chat, i) => (
              <div key={i} style={{ textAlign: chat.role === 'user' ? 'right' : 'left', marginBottom: '12px' }}>
                <div style={{ display: 'inline-block', padding: '10px 15px', borderRadius: '12px', backgroundColor: chat.role === 'user' ? '#22c55e' : '#242b26', color: chat.role === 'user' ? '#000' : '#fff', maxWidth: '80%', fontSize: '0.9rem', whiteSpace: 'pre-wrap' }}>
                  <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>{chat.role === 'bot' ? '🌱 Assistant:' : '👤 You:'}</div>
                  <div>{chat.text}</div>
                </div>
              </div>
            ))}
          </div>
          
          <div style={{ display: 'flex', gap: '10px' }}>
            <input 
              value={chatInput} 
              onChange={(e) => setChatInput(e.target.value)} 
              onKeyDown={(e) => e.key === 'Enter' && handleChat()} 
              placeholder="ప్రశ్న అడగండి..." 
              style={{ flex: 1, padding: '12px', borderRadius: '8px', border: 'none', backgroundColor: '#242b26', color: '#fff', outline: 'none' }} 
            />
            
            {/* మైక్ బటన్ ఇక్కడ యాడ్ చేశాను */}
            

            <button 
              onClick={handleChat} 
              style={{ backgroundColor: '#22c55e', color: '#000', border: 'none', padding: '0 25px', borderRadius: '8px', fontWeight: 'bold' }}
            >
              Send
            </button>
          </div>
        </div>
      );

      case 'climate':
  const monthsTelugu = ["జనవరి", "ఫిబ్రవరి", "మార్చి", "ఏప్రిల్", "మే", "జూన్", "జూలై", "ఆగస్టు", "సెప్టెంబర్", "అక్టోబర్", "నవంబర్", "డిసెంబర్"];
  const monthsEnglish = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  const getMonthlyData = (monthIdx) => {
    const idx = parseInt(monthIdx);
    // వేసవి కాలం (Summer - Zaid)
    if (idx >= 2 && idx <= 5) return { 
      name: "వేసవి కాలం (Summer - Zaid)", 
      crops: "పుచ్చకాయ, కర్బూజా, దోసకాయ, మొక్కజొన్న", 
      tips: "తరచుగా నీటి పారుదల అందించడంపై దృష్టి పెట్టండి." 
    };
    // వర్షాకాలం (Monsoon - Kharif)
    if (idx >= 6 && idx <= 10) return { 
      name: "వర్షాకాలం (Monsoon - Kharif)", 
      crops: "వరి, జొన్నలు, సజ్జలు, ప్రత్తి, సోయాబీన్", 
      tips: "పొలంలో నీరు నిల్వకుండా సరైన డ్రైనేజీ సౌకర్యం కల్పించండి." 
    };
    // శీతాకాలం (Winter - Rabi)
    return { 
      name: "శీతాకాలం (Winter - Rabi)", 
      crops: "గోధుమలు, శనగలు, ఆవాలు, బార్లీ, బఠానీలు", 
      tips: "మితమైన నీరు సరిపోతుంది." 
    };
  };

  const currentMonthData = getMonthlyData(formData.selectedMonth);

  return (
    <div style={{ backgroundColor: '#161b18', padding: '30px', borderRadius: '15px' }}>
      <Cloud size={50} color="#22c55e" style={{ display: 'block', margin: '0 auto 10px' }} />
      <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>Seasonal Crop Planner (ఋతువుల వారీ పంటల ప్రణాళిక)</h2>

      <div style={{ marginBottom: '25px', textAlign: 'center' }}>
        <label style={{ display: 'block', marginBottom: '10px', opacity: 0.8 }}>నెలను ఎంచుకోండి:</label>
        <select 
          value={formData.selectedMonth} 
          onChange={(e) => setFormData({ ...formData, selectedMonth: e.target.value })} 
          style={{ width: '100%', maxWidth: '300px', padding: '12px', borderRadius: '8px', backgroundColor: '#242b26', color: '#fff', border: '1px solid #22c55e' }}
        >
          {monthsTelugu.map((m, index) => <option key={index} value={index}>{m} ({monthsEnglish[index]})</option>)}
        </select>
      </div>

      <div style={{ background: '#242b26', padding: '25px', borderRadius: '12px', borderLeft: '5px solid #22c55e' }}>
        <h3 style={{ color: '#22c55e' }}>ప్రస్తుత కాలం: {currentMonthData.name}</h3>
        <p style={{ marginTop: '10px' }}><strong>అనుకూలమైన పంటలు:</strong> {currentMonthData.crops}</p>
        <div style={{ fontSize: '0.9rem', opacity: 0.9, backgroundColor: '#161b18', padding: '15px', borderRadius: '8px', marginTop: '15px', border: '1px solid #333' }}>
          <p style={{ margin: 0 }}><strong>💡 వ్యవసాయ సూచన:</strong> {currentMonthData.tips}</p>
        </div>
      </div>
    </div>
  );

      default:
  // 1. పంటల పేర్ల మ్యాపింగ్ (English to Telugu)
  const cropData = {
    rice: { telugu: "వరి (Rice)"},
    maize: { telugu: "మొక్కజొన్న (Maize)"},
    chickpea: { telugu: "శనగలు (Chickpea)"},
    kidneybeans: { telugu: "రాజ్మా (Kidney Beans)"},
    pigeonpeas: { telugu: "కందులు (Pigeon Peas)"},
    mothbeans: { telugu: "మొలకలు (Moth Beans)"},
    mungbean: { telugu: "పెసలు (Mung Bean)"},
    blackgram: { telugu: "మినుములు (Black Gram)"},
    lentil: { telugu: "మసూర్ పప్పు (Lentil)" },
    pomegranate: { telugu: "దానిమ్మ (Pomegranate)" },
    banana: { telugu: "అరటి (Banana)"},
    mango: { telugu: "మామిడి (Mango)"},
    grapes: { telugu: "ద్రాక్ష (Grapes)"},
    watermelon: { telugu: "పుచ్చకాయ (Watermelon)"},
    muskmelon: { telugu: "కర్బూజా (Muskmelon)"},
    apple: { telugu: "యాపిల్ (Apple)"},
    orange: { telugu: "నారింజ (Orange)"},
    papaya: { telugu: "బొప్పాయి (Papaya)"},
    coconut: { telugu: "కొబ్బరి (Coconut)"},
    cotton: { telugu: "ప్రత్తి (Cotton)" },
    jute: { telugu: "జనపనార (Jute)"},
    coffee: { telugu: "కాఫీ (Coffee)"}
  };

  const fieldLabels = {
    nitrogen: { label: "Nitrogen (నత్రజని)", placeholder: "Eg: 0-140" },
    phosphorus: { label: "Phosphorus (భాస్వరం)", placeholder: "Eg: 5-145" },
    potassium: { label: "Potassium (పొటాషియం)", placeholder: "Eg: 5-205" },
    temperature: { label: "Temperature (ఉష్ణోగ్రత)", placeholder: "Eg: 10-50°C" },
    humidity: { label: "Humidity (తేమ)", placeholder: "Eg: 15-99%" },
    ph: { label: "pH Level (పి.హెచ్)", placeholder: "Eg: 3.5-9" },
    rainfall: { label: "Rainfall (వర్షపాతం)", placeholder: "Eg: 20-298mm" }
  };

  const predictedCropInfo = prediction ? cropData[prediction.toLowerCase()] : null;

  return (
    <div style={{ display: 'flex', gap: '30px', flexWrap: 'wrap' }}>
      {/* Form Section */}
      <div style={{ flex: 1, minWidth: '300px', backgroundColor: '#161b18', padding: '25px', borderRadius: '15px' }}>
        <h3 style={{ marginBottom: '20px', color: '#22c55e' }}>Soil & Environment Data (నేల మరియు పర్యావరణ వివరాలు)</h3>
        <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
          {Object.keys(formData).filter(k => k !== 'selectedMonth').map((key) => (
            <div key={key}>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.8rem', opacity: 0.9, color: '#22c55e' }}>
                {fieldLabels[key]?.label || key.toUpperCase()}
              </label>
              <input 
                type="number" 
                step="0.01"
                name={key} 
                value={formData[key]} 
                onChange={handleChange} 
                placeholder={fieldLabels[key]?.placeholder || "Value"}
                style={{ width: '90%', padding: '10px', borderRadius: '8px', border: '1px solid #333', backgroundColor: '#242b26', color: '#fff' }} 
                required 
              />
            </div>
          ))}
          <button type="submit" style={{ gridColumn: 'span 2', backgroundColor: '#22c55e', color: '#000', border: 'none', padding: '15px', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', transition: '0.3s' }}>
            {loading ? "Predicting... (విశ్లేషిస్తోంది...)" : "Predict Best Crop (సరైన పంటను సూచించు)"}
          </button>
        </form>
      </div>

      {/* Result Section */}
      <div style={{ flex: 0.5, minWidth: '300px', backgroundColor: '#161b18', padding: '25px', borderRadius: '15px', textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
        {prediction ? (
          <div>
            <div style={{ marginBottom: '15px', position: 'relative' }}>
               <img 
                 src={predictedCropInfo?.img || "https://cdn-icons-png.flaticon.com/512/685/685025.png"} 
                 alt={prediction} 
                 style={{ width: '120px', height: '120px', borderRadius: '50%', border: '4px solid #22c55e', objectFit: 'cover' }}
               />
               <div style={{ position: 'absolute', bottom: '0', right: '0', background: '#22c55e', borderRadius: '50%', padding: '5px' }}>
                  <Leaf size={20} color="#000" />
               </div>
            </div>
            <p style={{ color: '#aaa', margin: '0' }}>Recommended Crop (సూచించిన పంట):</p>
            <h1 style={{ color: '#22c55e', margin: '10px 0', fontSize: '2rem' }}>
              {predictedCropInfo?.telugu || prediction.toUpperCase()}
            </h1>
            <div style={{ backgroundColor: '#242b26', padding: '10px', borderRadius: '10px', marginTop: '10px' }}>
               <p style={{ fontSize: '0.8rem', color: '#22c55e' }}>సాగుకు అనుకూలమైన నేల లభించింది!</p>
            </div>
          </div>
        ) : (
          <div style={{ opacity: 0.3 }}>
            <Brain size={60} color="#fff" />
            <p style={{ color: '#fff', marginTop: '15px' }}>పంట వివరాల కోసం పైన ఉన్న ఫామ్ నింపండి</p>
          </div>
        )}
      </div>
    </div>
  );
    }
  };

  if (!isLoggedIn) {
    return (
      <div style={{ backgroundColor: '#0a0d0b', minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', fontFamily: 'sans-serif' }}>
        <div style={{ backgroundColor: '#161b18', padding: '40px', borderRadius: '20px', width: '100%', maxWidth: '400px', border: '1px solid #22c55e' }}>
          <div style={{ textAlign: 'center', marginBottom: '30px' }}>
            <Leaf color="#22c55e" size={50} style={{ marginBottom: '10px' }} />
            <h1 style={{ color: '#fff' }}>AgriSense AI</h1>
          </div>
          <form onSubmit={handleLogin}>
            <input type="text" placeholder="Username" style={{ width: '95%', padding: '10px', marginBottom: '15px', borderRadius: '8px', border: 'none', backgroundColor: '#242b26', color: '#fff' }} onChange={(e) => setLoginData({...loginData, username: e.target.value})} required />
            <input type="password" placeholder="Password" style={{ width: '95%', padding: '10px', marginBottom: '25px', borderRadius: '8px', border: 'none', backgroundColor: '#242b26', color: '#fff' }} onChange={(e) => setLoginData({...loginData, password: e.target.value})} required />
            <button type="submit" style={{ width: '100%', backgroundColor: '#22c55e', color: '#000', padding: '14px', borderRadius: '8px', border: 'none', fontWeight: 'bold' }}>Login</button>
          </form>
        </div>
      </div>
    );
  }

  if (isLoggedIn && showDashboard) {
    return (
      <div style={{ minHeight: "100vh", background: "radial-gradient(circle at top,#0f1a14,#050705)", display: "flex", justifyContent: "center", alignItems: "center", color: "#fff", fontFamily: "sans-serif" }}>
        <div style={{ maxWidth: "900px", width: "90%", textAlign: "center", padding: "60px 30px" }}>
          <div style={{ width: "90px", height: "90px", background: "rgba(34,197,94,0.15)", borderRadius: "50%", display: "flex", justifyContent: "center", alignItems: "center", margin: "0 auto 25px" }}><Leaf size={45} color="#22c55e" /></div>
          <h1 style={{ fontSize: "3rem", marginBottom: "15px", color: "#22c55e" }}>Welcome to AgriSense</h1>
          <p style={{ maxWidth: "650px", margin: "0 auto 45px", lineHeight: "1.7", opacity: 0.85 }}>Your all-in-one AI-powered agriculture companion. From predicting crops to detecting diseases, we help you grow smarter.</p>
          <button onClick={() => setShowDashboard(false)} style={{ background: "linear-gradient(135deg,#22c55e,#16a34a)", color: "#000", padding: "15px 45px", borderRadius: "50px", border: "none", fontSize: "1rem", fontWeight: "bold", cursor: "pointer", boxShadow: "0 0 25px rgba(34,197,94,0.5)" }}>Go to Dashboard</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: '#0a0d0b', color: '#e0e0e0', minHeight: '100vh', fontFamily: 'sans-serif', padding: '20px' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h1 onClick={() => { setShowDashboard(true); setActiveTab("recommend"); }} style={{ color: '#fff', margin: 0, cursor: 'pointer' }}><Leaf color="#22c55e" size={28} /> AgriSense AI</h1>
        <button onClick={() => { setIsLoggedIn(false); setShowDashboard(true); }} style={{ background: 'none', color: '#fff', border: '1px solid #22c55e', padding: '5px 15px', borderRadius: '5px', cursor: 'pointer' }}>Logout</button>
      </header>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: '15px', marginBottom: '40px' }}>
        {[
          { id: 'scan', icon: <Scan />, label: "Scan Crop" },
          { id: 'recommend', icon: <Leaf />, label: "Crop AI" },
          { id: 'pesticides', icon: <ShieldCheck />, label: "Pesticides" },
          { id: 'market', icon: <ShoppingCart />, label: "Market" },
          { id: 'assistant', icon: <MessageCircle />, label: "Assistant" },
          { id: 'climate', icon: <Cloud />, label: "Climate" },
        ].map((item) => (
          <div key={item.id} onClick={() => setActiveTab(item.id)} style={{ backgroundColor: activeTab === item.id ? '#166534' : '#161b18', padding: '15px', borderRadius: '12px', textAlign: 'center', cursor: 'pointer', border: activeTab === item.id ? '1px solid #22c55e' : '1px solid transparent', transition: '0.3s' }}>
            <div style={{ color: '#22c55e', marginBottom: '10px', display: 'flex', justifyContent: 'center' }}>{item.icon}</div>
            <span style={{ fontSize: '0.8rem' }}>{item.label}</span>
          </div>
        ))}
      </div>
      {renderContent()}
    </div>
  );
}

export default App;