// 打卡特效模块
// 处理上班打卡的阳光特效和下班打卡的礼花特效
// 增强版：更炫酷的全屏动画效果

class ClockEffects {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) return;
        
        this.ctx = this.canvas.getContext('2d');
        this.particles = [];
        this.animationId = null;
        
        // 设置画布大小为全屏
        this.resize();
        window.addEventListener('resize', () => this.resize());
    }
    
    resize() {
        if (!this.canvas) return;
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }
    
    // 上班打卡 - 阳光特效（增强版）
    playSunshine() {
        this.clear();
        this.particles = [];
        
        // 创建更多的阳光粒子
        for (let i = 0; i < 100; i++) {
            this.particles.push({
                x: Math.random() * this.canvas.width,
                y: -Math.random() * this.canvas.height,
                size: Math.random() * 4 + 2,
                speedY: Math.random() * 1.5 + 0.5,
                speedX: (Math.random() - 0.5) * 0.5,
                alpha: Math.random() * 0.6 + 0.4,
                color: `hsla(${45 + Math.random() * 15}, 100%, ${60 + Math.random() * 20}%, `,
                life: 1,
                twinkle: Math.random() * Math.PI * 2
            });
        }
        
        // 添加大型光晕
        for (let i = 0; i < 10; i++) {
            this.particles.push({
                x: Math.random() * this.canvas.width,
                y: -Math.random() * this.canvas.height * 0.5,
                size: Math.random() * 20 + 30,
                speedY: Math.random() * 0.5 + 0.2,
                speedX: (Math.random() - 0.5) * 0.3,
                alpha: Math.random() * 0.2 + 0.1,
                color: `hsla(${50 + Math.random() * 10}, 100%, 70%, `,
                life: 1,
                twinkle: Math.random() * Math.PI * 2,
                isGlow: true
            });
        }
        
        this.animate('sunshine');
    }
    
    // 下班打卡 - 礼花特效（增强版）
    playFireworks() {
        this.clear();
        this.particles = [];
        
        const fireworksCount = 5;
        
        for (let i = 0; i < fireworksCount; i++) {
            setTimeout(() => {
                const x = this.canvas.width * (0.2 + i * 0.15);
                const y = this.canvas.height * (0.3 + Math.random() * 0.2);
                this.createFirework(x, y);
            }, i * 400);
        }
        
        this.animate('fireworks');
    }
    
    createFirework(x, y) {
        const particleCount = 80;
        const hue = Math.random() * 360;
        
        for (let i = 0; i < particleCount; i++) {
            const angle = (Math.PI * 2 * i) / particleCount;
            const speed = Math.random() * 4 + 2;
            
            this.particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: Math.random() * 3 + 2,
                color: `hsla(${hue + Math.random() * 60}, 100%, ${50 + Math.random() * 30}%, `,
                alpha: 1,
                gravity: 0.15,
                friction: 0.98,
                life: 1
            });
        }
        
        // 添加内圈闪光
        for (let i = 0; i < 20; i++) {
            const angle = (Math.PI * 2 * i) / 20;
            const speed = Math.random() * 2 + 1;
            
            this.particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: Math.random() * 5 + 3,
                color: `hsla(${hue}, 100%, 90%, `,
                alpha: 1,
                gravity: 0.1,
                friction: 0.95,
                life: 1,
                isCore: true
            });
        }
    }
    
    // 动画循环
    animate(type) {
        if (type === 'sunshine') {
            this.animateSunshine();
        } else if (type === 'fireworks') {
            this.animateFireworks();
        }
    }
    
    animateSunshine() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.particles = this.particles.filter(particle => {
            particle.y += particle.speedY;
            particle.x += particle.speedX;
            particle.twinkle += 0.05;
            
            // 闪烁效果
            const twinkleAlpha = Math.sin(particle.twinkle) * 0.3 + 0.7;
            const alpha = particle.alpha * twinkleAlpha;
            
            if (particle.isGlow) {
                // 绘制大型光晕
                const gradient = this.ctx.createRadialGradient(
                    particle.x, particle.y, 0,
                    particle.x, particle.y, particle.size
                );
                gradient.addColorStop(0, particle.color + alpha + ')');
                gradient.addColorStop(0.5, particle.color + (alpha * 0.5) + ')');
                gradient.addColorStop(1, particle.color + '0)');
                
                this.ctx.fillStyle = gradient;
                this.ctx.fillRect(
                    particle.x - particle.size,
                    particle.y - particle.size,
                    particle.size * 2,
                    particle.size * 2
                );
            } else {
                // 绘制小光点和光晕
                const gradient = this.ctx.createRadialGradient(
                    particle.x, particle.y, 0,
                    particle.x, particle.y, particle.size * 3
                );
                gradient.addColorStop(0, particle.color + alpha + ')');
                gradient.addColorStop(0.3, particle.color + (alpha * 0.6) + ')');
                gradient.addColorStop(1, particle.color + '0)');
                
                this.ctx.fillStyle = gradient;
                this.ctx.beginPath();
                this.ctx.arc(particle.x, particle.y, particle.size * 3, 0, Math.PI * 2);
                this.ctx.fill();
                
                // 核心亮点
                this.ctx.fillStyle = particle.color + (alpha * 1.5) + ')';
                this.ctx.beginPath();
                this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
                this.ctx.fill();
            }
            
            return particle.y < this.canvas.height + 50;
        });
        
        if (this.particles.length > 0) {
            this.animationId = requestAnimationFrame(() => this.animateSunshine());
        }
    }
    
    animateFireworks() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        

        this.particles = this.particles.filter(particle => {
            particle.vx *= particle.friction;
            particle.vy *= particle.friction;
            particle.vy += particle.gravity;
            
            particle.x += particle.vx;
            particle.y += particle.vy;
            
            particle.life -= 0.01;
            particle.alpha = particle.life;
            
            if (particle.alpha > 0) {
                if (particle.isCore) {
                    // 内圈闪光粒子
                    const gradient = this.ctx.createRadialGradient(
                        particle.x, particle.y, 0,
                        particle.x, particle.y, particle.size * 2
                    );
                    gradient.addColorStop(0, particle.color + particle.alpha + ')');
                    gradient.addColorStop(1, particle.color + '0)');
                    
                    this.ctx.fillStyle = gradient;
                    this.ctx.beginPath();
                    this.ctx.arc(particle.x, particle.y, particle.size * 2, 0, Math.PI * 2);
                    this.ctx.fill();
                }
                
                // 绘制粒子尾迹
                this.ctx.beginPath();
                this.ctx.moveTo(particle.x, particle.y);
                this.ctx.lineTo(particle.x - particle.vx * 3, particle.y - particle.vy * 3);
                this.ctx.strokeStyle = particle.color + (particle.alpha * 0.5) + ')';
                this.ctx.lineWidth = particle.size;
                this.ctx.lineCap = 'round';
                this.ctx.stroke();
                
                // 绘制粒子
                this.ctx.fillStyle = particle.color + particle.alpha + ')';
                this.ctx.beginPath();
                this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
                this.ctx.fill();
            }
            
            return particle.alpha > 0;
        });
        
        if (this.particles.length > 0) {
            this.animationId = requestAnimationFrame(() => this.animateFireworks());
        }
    }
    
    // 清除画布和动画
    clear() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        if (this.ctx && this.canvas) {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        }
        this.particles = [];
    }
}

// 导出到全局
if (typeof window !== 'undefined') {
    window.ClockEffects = ClockEffects;
}
