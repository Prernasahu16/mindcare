 // Animation on scroll
        document.addEventListener('DOMContentLoaded', function() {
            const animatedElements = document.querySelectorAll('.animate-on-scroll');
            
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('animated');
                    }
                });
            }, { threshold: 0.1 });
            
            animatedElements.forEach(element => {
                observer.observe(element);
            });

            // Header scroll effect
            window.addEventListener('scroll', function() {
                const header = document.querySelector('header');
                if (window.scrollY > 50) {
                    header.style.padding = '0.5rem 0';
                    header.style.boxShadow = '0 5px 20px rgba(0, 0, 0, 0.1)';
                } else {
                    header.style.padding = '1rem 0';
                    header.style.boxShadow = '0 2px 15px rgba(0, 0, 0, 0.1)';
                }
            });

            // Simple testimonial slider
            let currentTestimonial = 0;
            const testimonials = [
                {
                    content: "MindCare provided me with the tools and support I needed during a difficult time. The counselors are compassionate and truly care about your wellbeing.",
                    author: "Sarah Johnson",
                    joinDate: "Member since 2021"
                },
                {
                    content: "I was hesitant to seek help at first, but MindCare made it so accessible. The community support has been incredible in my recovery journey.",
                    author: "Michael Torres",
                    joinDate: "Member since 2020"
                },
                {
                    content: "The resources available through MindCare helped me understand what I was experiencing and gave me practical strategies to manage my anxiety.",
                    author: "Jessica Lee",
                    joinDate: "Member since 2022"
                }
            ];

            function changeTestimonial() {
                const testimonialElement = document.querySelector('.testimonial');
                testimonialElement.style.opacity = 0;
                
                setTimeout(() => {
                    testimonialElement.innerHTML = `
                        <div class="testimonial-content">
                            ${testimonials[currentTestimonial].content}
                        </div>
                        <div class="testimonial-author">
                            <div class="author-avatar">
                                <i class="fas fa-user"></i>
                            </div>
                            <div class="author-info">
                                <h4>${testimonials[currentTestimonial].author}</h4>
                                <p>${testimonials[currentTestimonial].joinDate}</p>
                            </div>
                        </div>
                    `;
                    testimonialElement.style.opacity = 1;
                    
                    currentTestimonial = (currentTestimonial + 1) % testimonials.length;
                }, 500);
            }

            // Change testimonial every 5 seconds
            setInterval(changeTestimonial, 5000);
        });