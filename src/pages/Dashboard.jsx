import React, { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";
import {
  AlertTriangle,
  MapPin,
  Radio,
  Battery,
  Signal,
  Activity,
  ZoomIn,
  ZoomOut,
  Move,
} from "lucide-react";

// Simulate transmitter data with normalized coordinates
const generateTransmitterData = () => {
  const transmitters = [];
  // Base coordinates (Los Angeles area)
  const baseLocation = {
    lat: 34.0522,
    lng: -118.2437,
  };

  for (let i = 0; i < 5; i++) {
    // Generate points within radius
    const lat = baseLocation.lat + (Math.random() - 0.5) * 0.05;
    const lng = baseLocation.lng + (Math.random() - 0.5) * 0.05;

    transmitters.push({
      id: `TX-${i + 1}`,
      lat,
      lng,
      signalStrength: Math.floor(Math.random() * 100),
      battery: Math.floor(Math.random() * 100),
      temperature: Math.floor(Math.random() * 30 + 10),
      lastUpdate: new Date().toLocaleTimeString(),
      type: ["GPR", "Acoustic", "Ultrasound"][Math.floor(Math.random() * 3)],
      status: Math.random() > 0.8 ? "Alert" : "Normal",
    });
  }
  return transmitters;
};

// Custom Map Component
const InteractiveMap = ({ transmitters, onSelectTransmitter, selectedId }) => {
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Convert geo coordinates to SVG coordinates
  const geoToSvg = (lat, lng) => {
    const baseX = 400; // SVG width/2
    const baseY = 300; // SVG height/2
    const scale = zoom * 10000;

    return {
      x: baseX + (lng + 118.2437) * scale + offset.x,
      y: baseY + (lat - 34.0522) * -scale + offset.y,
    };
  };

  const handleMouseDown = (e) => {
    setIsDragging(true);
    setDragStart({
      x: e.clientX - offset.x,
      y: e.clientY - offset.y,
    });
  };

  const handleMouseMove = (e) => {
    if (isDragging) {
      setOffset({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  return (
    <div className="relative w-full h-full">
      {/* Map Controls */}
      <div className="absolute top-4 right-4 flex flex-col space-y-2 z-10">
        <button
          className="p-2 bg-gray-700 rounded hover:bg-gray-600"
          onClick={() => setZoom((z) => Math.min(z * 1.2, 5))}
        >
          <ZoomIn className="w-5 h-5" />
        </button>
        <button
          className="p-2 bg-gray-700 rounded hover:bg-gray-600"
          onClick={() => setZoom((z) => Math.max(z / 1.2, 0.5))}
        >
          <ZoomOut className="w-5 h-5" />
        </button>
      </div>

      <svg
        viewBox="0 0 800 600"
        className="w-full h-full bg-gray-700 cursor-move"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* Grid lines */}
        <g>
          {Array.from({ length: 20 }).map((_, i) => (
            <React.Fragment key={i}>
              <line
                x1={i * 40}
                y1="0"
                x2={i * 40}
                y2="600"
                stroke="#374151"
                strokeWidth="1"
              />
              <line
                x1="0"
                y1={i * 30}
                x2="800"
                y2={i * 30}
                stroke="#374151"
                strokeWidth="1"
              />
            </React.Fragment>
          ))}
        </g>

        {/* Transmitter markers */}
        {transmitters.map((tx) => {
          const pos = geoToSvg(tx.lat, tx.lng);
          return (
            <g
              key={tx.id}
              transform={`translate(${pos.x}, ${pos.y})`}
              onClick={() => onSelectTransmitter(tx)}
              className="cursor-pointer"
            >
              <circle
                r="8"
                fill={tx.status === "Alert" ? "#ef4444" : "#3b82f6"}
                stroke="white"
                strokeWidth="2"
                className={`${selectedId === tx.id ? "animate-pulse" : ""}`}
              />
              <text
                x="0"
                y="-12"
                textAnchor="middle"
                fill="white"
                fontSize="12"
                className="pointer-events-none"
              >
                {tx.id}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};

const Dashboard = () => {
  const [transmitters, setTransmitters] = useState(generateTransmitterData());
  const [selectedTransmitter, setSelectedTransmitter] = useState(null);
  const [historicalData, setHistoricalData] = useState([]);

  // Update data periodically
  useEffect(() => {
    const interval = setInterval(() => {
      const newData = generateTransmitterData();
      setTransmitters(newData);

      setHistoricalData((prev) => {
        const newPoint = {
          time: new Date().toLocaleTimeString(),
          avgSignal:
            newData.reduce((acc, curr) => acc + curr.signalStrength, 0) /
            newData.length,
        };
        return [...prev.slice(-20), newPoint];
      });
    }, [100000]);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Rescue Operations Dashboard</h1>
          <div className="flex items-center space-x-4">
            <Activity className="w-5 h-5 text-green-500" />
            <span>Live Updates</span>
            <div className="px-3 py-1 bg-green-500 rounded-full text-sm">
              Active
            </div>
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Map Section */}
          <div className="lg:col-span-2 bg-gray-800 p-4 rounded-lg">
            <h2 className="text-xl mb-4">Deployment Map</h2>
            <div className="h-[500px] rounded-lg overflow-hidden">
              <InteractiveMap
                transmitters={transmitters}
                onSelectTransmitter={setSelectedTransmitter}
                selectedId={selectedTransmitter?.id}
              />
            </div>
          </div>

          {/* Rest of the components remain the same */}
          {/* Transmitter List */}
          <div className="bg-gray-800 p-4 rounded-lg">
            <h2 className="text-xl mb-4">Active Transmitters</h2>
            <div className="space-y-4">
              {transmitters.map((tx) => (
                <div
                  key={tx.id}
                  className={`p-4 rounded-lg cursor-pointer
                    ${
                      selectedTransmitter?.id === tx.id
                        ? "bg-blue-900"
                        : "bg-gray-700"
                    }
                    hover:bg-blue-800 transition-colors`}
                  onClick={() => setSelectedTransmitter(tx)}
                >
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-bold">{tx.id}</span>
                    <div
                      className={`px-2 py-1 rounded-full text-xs
                      ${tx.status === "Alert" ? "bg-red-500" : "bg-green-500"}`}
                    >
                      {tx.status}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex items-center">
                      <MapPin className="w-4 h-4 mr-2" />
                      {tx.lat.toFixed(4)}, {tx.lng.toFixed(4)}
                    </div>
                    <div className="flex items-center">
                      <Signal className="w-4 h-4 mr-2" />
                      {tx.signalStrength}%
                    </div>
                    <div className="flex items-center">
                      <Battery className="w-4 h-4 mr-2" />
                      {tx.battery}%
                    </div>
                    <div className="flex items-center">
                      <Radio className="w-4 h-4 mr-2" />
                      {tx.type}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          {/* Signal Strength History */}
          <div className="bg-gray-800 p-4 rounded-lg">
            <h2 className="text-xl mb-4">Signal Strength History</h2>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={historicalData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="avgSignal"
                    stroke="#3b82f6"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Transmitter Distribution */}
          <div className="bg-gray-800 p-4 rounded-lg">
            <h2 className="text-xl mb-4">Transmitter Type Distribution</h2>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={[
                    {
                      type: "GPR",
                      count: transmitters.filter((t) => t.type === "GPR")
                        .length,
                    },
                    {
                      type: "Acoustic",
                      count: transmitters.filter((t) => t.type === "Acoustic")
                        .length,
                    },
                    {
                      type: "Ultrasound",
                      count: transmitters.filter((t) => t.type === "Ultrasound")
                        .length,
                    },
                  ]}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="type" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Selected Transmitter Details */}
        {selectedTransmitter && (
          <div className="mt-6 bg-gray-800 p-4 rounded-lg">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl">
                Transmitter Details: {selectedTransmitter.id}
              </h2>
              <button
                className="text-gray-400 hover:text-white"
                onClick={() => setSelectedTransmitter(null)}
              >
                Close
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gray-700 p-4 rounded-lg">
                <h3 className="text-lg mb-2">Location</h3>
                <div className="space-y-2">
                  <div>Latitude: {selectedTransmitter.lat.toFixed(6)}</div>
                  <div>Longitude: {selectedTransmitter.lng.toFixed(6)}</div>
                </div>
              </div>
              <div className="bg-gray-700 p-4 rounded-lg">
                <h3 className="text-lg mb-2">Status</h3>
                <div className="space-y-2">
                  <div>Signal: {selectedTransmitter.signalStrength}%</div>
                  <div>Battery: {selectedTransmitter.battery}%</div>
                </div>
              </div>
              <div className="bg-gray-700 p-4 rounded-lg">
                <h3 className="text-lg mb-2">Sensor Info</h3>
                <div className="space-y-2">
                  <div>Type: {selectedTransmitter.type}</div>
                  <div>Last Update: {selectedTransmitter.lastUpdate}</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
