// data/blog-posts.js
window.__BLOG_POSTS=[
  {
    id:"post-1",slug:"webgl-journey",
    title:{"zh-CN":"WebGL 创意开发之旅","en":"A Journey into Creative WebGL Development"},
    category:{"zh-CN":"技术","en":"Tech"},
    date:"2025-05-15",
    thumbnail:"assets/images/blog/post1-thumb.png",
    excerpt:{
      "zh-CN":"分享我学习 WebGL 和着色器编程的心得，从基础概念到实战项目，帮助前端开发者入门创意编程。",
      "en":"Sharing my experience learning WebGL and shader programming, from fundamentals to real projects, helping frontend developers get started with creative coding."
    },
    body:{
      "zh-CN":"## 为什么学习 WebGL？\n\nWebGL 为 Web 平台带来了 GPU 加速的图形渲染能力。与传统的 DOM/CSS 动画相比，它可以直接操作像素，实现以往只能在原生应用中看到的视觉效果。\n\n## 着色器入门\n\n着色器是 WebGL 的核心。顶点着色器处理几何形状，片元着色器决定每个像素的颜色。用 GLSL 语言编写，语法类似 C。\n\n### 最简单的片元着色器\n\n```glsl\nvoid main() {\n  gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0); // 纯红色\n}\n```\n\n## 实践项目\n\n从简单的色彩渐变开始，逐步加入噪声函数、鼠标交互和纹理采样，最终实现复杂的图像变形效果。\n\n关键在于理解：在着色器中，一切都是数字。0 到 1 之间的值决定了透明度、颜色混合和形状。",
      "en":"## Why Learn WebGL?\n\nWebGL brings GPU-accelerated graphics rendering to the web platform. Compared to traditional DOM/CSS animations, it operates directly on pixels, enabling visual effects previously only seen in native applications.\n\n## Getting Started with Shaders\n\nShaders are the core of WebGL. Vertex shaders handle geometry, while fragment shaders determine each pixel's color. Written in GLSL, the syntax is similar to C.\n\n### The Simplest Fragment Shader\n\n```glsl\nvoid main() {\n  gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0); // Pure red\n}\n```\n\n## Practical Projects\n\nStart with simple color gradients, gradually add noise functions, mouse interaction, and texture sampling, eventually achieving complex image distortion effects.\n\nKey insight: in shaders, everything is a number. Values between 0 and 1 determine opacity, color blending, and shapes."
    }
  },
  {
    id:"post-2",slug:"modern-frontend-architecture",
    title:{"zh-CN":"现代前端架构设计思考","en":"Thoughts on Modern Frontend Architecture"},
    category:{"zh-CN":"架构","en":"Architecture"},
    date:"2025-04-22",
    thumbnail:"assets/images/blog/post2-thumb.png",
    excerpt:{
      "zh-CN":"探讨微前端、组件化设计和状态管理等现代前端架构模式，分享在大型项目中的实践经验。",
      "en":"Discussing modern frontend architecture patterns like micro-frontends, component design, and state management, with practical insights from large-scale projects."
    },
    body:{
      "zh-CN":"## 前端架构的演进\n\n从 jQuery 时代到 SPA，再到如今的微前端和 Island Architecture，前端架构一直在演进。\n\n## 微前端的价值\n\n在大型团队中，微前端允许不同团队独立开发、测试和部署各自的功能模块。但也带来了性能开销和一致性问题。\n\n### 何时使用微前端\n\n- 多团队并行开发\n- 渐进式技术栈迁移\n- 独立部署需求\n\n## 状态管理的最佳实践\n\n服务端状态和客户端 UI 状态应该分开管理。React Query 和 SWR 等工具让服务端状态管理变得简单。\n\n## 总结\n\n好的架构不是最花哨的，而是最适合团队和业务的。简单、可维护、可测试永远是第一原则。",
      "en":"## The Evolution of Frontend Architecture\n\nFrom the jQuery era to SPAs, to today's micro-frontends and Island Architecture, frontend architecture continues to evolve.\n\n## The Value of Micro-Frontends\n\nIn large teams, micro-frontends allow different teams to independently develop, test, and deploy their feature modules. However, they also bring performance overhead and consistency challenges.\n\n### When to Use Micro-Frontends\n\n- Multi-team parallel development\n- Gradual tech stack migration\n- Independent deployment needs\n\n## Best Practices for State Management\n\nServer state and client UI state should be managed separately. Tools like React Query and SWR simplify server state management.\n\n## Summary\n\nGood architecture isn't the flashiest, but the one that best fits your team and business. Simple, maintainable, and testable are always the first principles."
    }
  },
  {
    id:"post-3",slug:"design-engineering",
    title:{"zh-CN":"设计工程：设计师与开发者的桥梁","en":"Design Engineering: Bridging Design and Development"},
    category:{"zh-CN":"设计","en":"Design"},
    date:"2025-03-10",
    thumbnail:"assets/images/blog/post3-thumb.png",
    excerpt:{
      "zh-CN":"作为一名设计工程师，我分享如何在设计与开发之间建立高效的协作流程，以及如何培养双重技能。",
      "en":"As a design engineer, I share how to build efficient collaboration between design and development, and how to cultivate dual skills."
    },
    body:{
      "zh-CN":"## 什么是设计工程？\n\n设计工程是连接设计和开发的桥梁。设计工程师既理解美学原则，又能编写生产级代码。\n\n## 核心能力\n\n### 1. 设计敏感度\n理解排版、间距、色彩理论和视觉层次。不需要成为专业设计师，但要能判断什么是「好」的设计。\n\n### 2. 技术深度\n不仅仅是写 HTML/CSS，还要理解浏览器渲染原理、性能优化和可访问性。\n\n### 3. 沟通能力\n能用设计师的语言讨论交互细节，也能用开发者的语言讨论实现方案。\n\n## 工作流程\n\n从 Figma 到代码，不是简单的「切图」。理解设计意图，在代码中还原设计的同时，考虑各种边界情况和响应式适配。\n\n## 总结\n\n设计工程不是妥协，而是将两个学科的最佳实践融合，创造更完整的产品。",
      "en":"## What is Design Engineering?\n\nDesign engineering bridges design and development. Design engineers understand aesthetic principles while being able to write production-grade code.\n\n## Core Competencies\n\n### 1. Design Sensitivity\nUnderstanding typography, spacing, color theory, and visual hierarchy. You don't need to be a professional designer, but you should judge what constitutes 'good' design.\n\n### 2. Technical Depth\nBeyond writing HTML/CSS, understanding browser rendering principles, performance optimization, and accessibility.\n\n### 3. Communication Skills\nAbility to discuss interaction details in a designer's language while also discussing implementation in a developer's language.\n\n## Workflow\n\nFrom Figma to code is not just about \"slicing.\" Understand design intent, faithfully reproduce the design in code while considering edge cases and responsive adaptation.\n\n## Summary\n\nDesign engineering isn't a compromise, but the fusion of best practices from both disciplines to create more complete products."
    }
  }
];
