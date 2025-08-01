"use client"

import { useState, useEffect, useRef } from "react"
import {
  FiSearch,
  FiShoppingCart,
  FiTrendingUp,
  FiCamera,
  FiZap,
  FiHeart,
  FiLoader,
  FiStar,
  FiGift,
} from "react-icons/fi"

// Simple Button component since you might not have shadcn/ui
const Button = ({
  children,
  className = "",
  variant = "default",
  disabled = false,
  onClick,
  type = "button",
  ...props
}) => {
  const baseClasses =
    "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background"
  const variants = {
    default: "bg-primary text-primary-foreground hover:bg-primary/90",
    outline: "border border-input hover:bg-accent hover:text-accent-foreground",
  }

  return (
    <button
      type={type}
      className={`${baseClasses} ${variants[variant]} ${className}`}
      disabled={disabled}
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  )
}

// Simple Input component
const Input = ({ className = "", ...props }) => {
  return (
    <input
      className={`flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
      {...props}
    />
  )
}

export default function HomePage() {
  const [isVisible, setIsVisible] = useState(false)
  const [query, setQuery] = useState("")
  const [departmentQuery, setDepartmentQuery] = useState("")
  const [departmentResults, setDepartmentResults] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const fileInputRef = useRef(null)

  const navigateToSearch = (query) => {
    // You can replace this with your routing solution
    window.location.href = `/search?query=${encodeURIComponent(query)}`
  }

  useEffect(() => {
    setIsVisible(true)

    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY })
    }

    window.addEventListener("mousemove", handleMouseMove)
    return () => window.removeEventListener("mousemove", handleMouseMove)
  }, [])

  const handleSearch = (e) => {
    e.preventDefault()
    if (query.trim()) {
      navigateToSearch(query.trim())
    }
  }

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    const formData = new FormData()
    formData.append("file", file)

    try {
      const res = await fetch("http://127.0.0.1:8000/image-to-caption", {
        method: "POST",
        body: formData,
      })
      const data = await res.json()
      if (data.caption) {
        setQuery(data.caption)
        navigateToSearch(data.caption)
      }
    } catch (error) {
      console.error("Error uploading image:", error)
    }
  }

  const handleDepartmentSearch = async (e) => {
    e.preventDefault()
    if (!departmentQuery.trim()) return

    setIsLoading(true)
    try {
      const response = await fetch("http://localhost:8001/recommend", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          department: departmentQuery.trim(),
        }),
      })
      const data = await response.json()
      if (data.status === "success") {
        setDepartmentResults(data.recommendations)
      } else {
        setDepartmentResults("Sorry, no recommendations found. Please try a different query.")
      }
    } catch (error) {
      console.error("Error getting recommendations:", error)
      setDepartmentResults("Sorry, there was an error getting recommendations. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-yellow-50 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute w-64 h-64 bg-gradient-to-r from-blue-400/10 to-yellow-400/10 rounded-full blur-2xl animate-pulse"
          style={{
            left: mousePosition.x / 15,
            top: mousePosition.y / 15,
            transform: "translate(-50%, -50%)",
          }}
        />
        <div
          className="absolute top-20 right-20 w-72 h-72 bg-gradient-to-r from-yellow-300/10 to-blue-300/10 rounded-full blur-xl animate-pulse"
          style={{ animationDuration: "6s" }}
        />
        <div
          className="absolute bottom-20 left-20 w-80 h-80 bg-gradient-to-r from-blue-300/10 to-yellow-300/10 rounded-full blur-xl animate-pulse"
          style={{ animationDuration: "4s" }}
        />
      </div>

      {/* Floating Particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-gradient-to-r from-blue-400 to-yellow-400 rounded-full opacity-60 animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${3 + Math.random() * 4}s`,
            }}
          />
        ))}
      </div>

      {/* Hero Section */}
      <div className="relative z-10 pt-20 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div
              className={`transition-all duration-1000 transform ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
            >
              <div className="inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r from-blue-100 to-yellow-100 text-blue-800 text-sm font-medium mb-8 animate-pulse">
                <FiStar className="w-4 h-4 mr-2" />
                AI-Powered Smart Shopping Experience
              </div>

              <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-blue-600 via-blue-700 to-yellow-600 bg-clip-text text-transparent mb-6 leading-tight">
                Smart Shopping
                <br />
                <span className="text-4xl md:text-6xl">with Flipkart</span>
              </h1>

              <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-12 leading-relaxed">
                Discover millions of products with our revolutionary AI-powered semantic search engine that understands
                exactly what you're looking for, even before you do.
              </p>
            </div>

            {/* Enhanced Search Bar */}
            <div
              className={`max-w-4xl mx-auto mb-12 transition-all duration-1000 delay-300 transform ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
            >
              <form onSubmit={handleSearch} className="relative group">
                <div className="absolute -inset-2 bg-gradient-to-r from-blue-400 to-yellow-400 rounded-full blur opacity-25 group-hover:opacity-40 transition duration-1000 group-hover:duration-200 animate-pulse"></div>
                <div className="relative flex items-center bg-white rounded-full shadow-2xl border border-blue-200 overflow-hidden hover:shadow-3xl transition-all duration-300">
                  <FiSearch className="ml-6 text-blue-500 text-xl animate-pulse" />
                  <Input
                    type="text"
                    placeholder="What magical product are you seeking today?"
                    className="flex-1 py-6 px-4 text-lg border-none focus:ring-0 bg-transparent"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                  <div className="flex items-center">
                    <label
                      className="cursor-pointer px-4 hover:text-blue-600 transition-colors group"
                      title="Search with an image"
                    >
                      <FiCamera className="text-xl group-hover:scale-110 transition-transform" />
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                    </label>
                    <Button
                      type="submit"
                      className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-8 py-6 rounded-r-full font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                    >
                      Search Magic
                    </Button>
                  </div>
                </div>
              </form>
            </div>

            {/* CTA Buttons */}
            <div
              className={`flex flex-col sm:flex-row gap-6 justify-center items-center transition-all duration-1000 delay-500 transform ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
            >
              <Button className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-10 py-4 rounded-full font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 group">
                <FiShoppingCart className="w-5 h-5 mr-2 group-hover:animate-bounce" />
                Start Shopping Adventure
              </Button>
              <Button
                variant="outline"
                className="border-2 border-yellow-500 text-yellow-600 hover:bg-yellow-500 hover:text-white px-10 py-4 rounded-full font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 group bg-transparent"
              >
                <FiZap className="w-5 h-5 mr-2 group-hover:animate-pulse" />
                Discover More
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-20 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 to-yellow-600 bg-clip-text text-transparent mb-6">
              Why Choose Our Magic?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Experience shopping reimagined with cutting-edge technology
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: FiSearch,
                title: "AI-Powered Search",
                description:
                  "Our intelligent search understands context, intent, and even your emotions to find exactly what you need.",
                gradient: "from-blue-500 to-blue-600",
                delay: "delay-100",
              },
              {
                icon: FiShoppingCart,
                title: "Infinite Selection",
                description:
                  "Explore millions of products from thousands of verified sellers, all in one magical marketplace.",
                gradient: "from-yellow-500 to-yellow-600",
                delay: "delay-300",
              },
              {
                icon: FiTrendingUp,
                title: "Smart Recommendations",
                description: "Get personalized suggestions that evolve with your preferences and shopping journey.",
                gradient: "from-blue-500 to-yellow-500",
                delay: "delay-500",
              },
            ].map((feature, index) => (
              <div
                key={index}
                className={`group relative p-8 rounded-3xl bg-white/80 backdrop-blur-sm shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 cursor-pointer border border-white/20 ${feature.delay}`}
              >
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-400/20 to-yellow-400/20 rounded-3xl blur opacity-0 group-hover:opacity-100 transition duration-500"></div>
                <div className="relative">
                  <div
                    className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-r ${feature.gradient} text-white mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg`}
                  >
                    <feature.icon className="text-2xl" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4 group-hover:text-blue-600 transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Department Recommendation Section */}
      <div className="py-20 relative z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r from-yellow-100 to-blue-100 text-blue-800 text-sm font-medium mb-6">
              <FiHeart className="w-4 h-4 mr-2" />
              Personal Shopping Assistant
            </div>
            <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-yellow-600 to-blue-600 bg-clip-text text-transparent mb-6">
              Not Sure What You Need?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Just describe your situation, mood, or problem - our AI will recommend the perfect products for you!
            </p>
          </div>

          {/* Department Search Form */}
          <div className="mb-8">
            <form onSubmit={handleDepartmentSearch} className="relative group">
              <div className="absolute -inset-2 bg-gradient-to-r from-yellow-400 to-blue-400 rounded-full blur opacity-25 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
              <div className="relative flex items-center bg-white rounded-full shadow-2xl border border-yellow-200 overflow-hidden hover:shadow-3xl transition-all duration-300">
                <FiSearch className="ml-6 text-yellow-500 text-xl" />
                <Input
                  type="text"
                  placeholder="e.g., my back hurts, need something for cooking, want to stay fit, feeling stressed..."
                  className="flex-1 py-6 px-4 text-lg border-none focus:ring-0 bg-transparent"
                  value={departmentQuery}
                  onChange={(e) => setDepartmentQuery(e.target.value)}
                  disabled={isLoading}
                />
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 disabled:from-yellow-300 disabled:to-yellow-400 text-white px-8 py-6 rounded-r-full font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 relative overflow-hidden"
                >
                  {isLoading ? (
                    <div className="flex items-center">
                      <FiLoader className="animate-spin h-5 w-5 mr-2" />
                      Finding Magic...
                    </div>
                  ) : (
                    "Get Recommendations"
                  )}
                </Button>
              </div>
            </form>
          </div>

          {/* Enhanced Loading Animation */}
          {isLoading && (
            <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl p-8 border border-white/20 animate-fadeIn mb-8">
              <div className="text-center">
                <div className="relative inline-block mb-6">
                  <div className="w-16 h-16 border-4 border-yellow-200 border-t-yellow-500 rounded-full animate-spin mx-auto"></div>
                </div>

                <h3 className="text-2xl font-bold bg-gradient-to-r from-yellow-600 to-blue-600 bg-clip-text text-transparent mb-4">
                  🔮 AI Magic in Progress...
                </h3>

                <div className="space-y-3 mb-6">
                  <div className="flex items-center justify-center space-x-2 text-gray-600">
                    <FiStar className="w-5 h-5 text-yellow-500 animate-pulse" />
                    <span className="animate-pulse">Analyzing your needs...</span>
                  </div>
                  <div className="flex items-center justify-center space-x-2 text-gray-600">
                    <FiGift className="w-5 h-5 text-blue-500 animate-bounce" />
                    <span className="animate-pulse">Searching millions of products...</span>
                  </div>
                  <div className="flex items-center justify-center space-x-2 text-gray-600">
                    <FiStar className="w-5 h-5 text-yellow-500 animate-ping" />
                    <span className="animate-pulse">Crafting perfect recommendations...</span>
                  </div>
                </div>

                {/* Animated Progress Bar */}
                <div className="w-full bg-gray-200 rounded-full h-2 mb-4 overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-yellow-500 to-blue-500 rounded-full animate-pulse loading-bar"></div>
                </div>
              </div>
            </div>
          )}

          {/* Department Results */}
          {departmentResults && !isLoading && (
            <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl p-8 border border-white/20 animate-fadeIn">
              <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                <FiStar className="w-6 h-6 mr-2 text-yellow-500" />
                Your Personalized Recommendations
              </h3>
              <div className="bg-gradient-to-r from-blue-50 to-yellow-50 rounded-2xl p-6 mb-6">
                <pre className="whitespace-pre-wrap text-gray-700 leading-relaxed">{departmentResults}</pre>
              </div>
              <Button
                onClick={() => setDepartmentResults("")}
                variant="outline"
                className="border-yellow-500 text-yellow-600 hover:bg-yellow-500 hover:text-white transition-all duration-300"
              >
                Clear Results
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
