import { Component, OnInit, HostListener, ElementRef, ViewChild, Renderer2 } from '@angular/core';
import { trigger, style, animate, transition, keyframes } from '@angular/animations';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  animations: [
    trigger('celebrate', [
      transition(':enter', [
        animate('0.5s ease-out', keyframes([
          style({ transform: 'scale(0)', offset: 0 }),
          style({ transform: 'scale(1.2)', offset: 0.5 }),
          style({ transform: 'scale(1)', offset: 1 })
        ]))
      ])
    ]),
    trigger('heartFloat', [
      transition(':enter', [
        animate('3s ease-out', keyframes([
          style({ transform: 'translateY(0) scale(1)', opacity: 1, offset: 0 }),
          style({ transform: 'translateY(-200px) scale(1.5)', opacity: 0, offset: 1 })
        ]))
      ])
    ]),
    trigger('shake', [
      transition('* => *', [
        animate('0.3s ease-in-out', keyframes([
          style({ transform: 'translateX(0)', offset: 0 }),
          style({ transform: 'translateX(-10px)', offset: 0.25 }),
          style({ transform: 'translateX(10px)', offset: 0.5 }),
          style({ transform: 'translateX(-5px)', offset: 0.75 }),
          style({ transform: 'translateX(0)', offset: 1 })
        ]))
      ])
    ])
  ]
})
export class AppComponent implements OnInit {
  @ViewChild('noButton') noButton!: ElementRef;
  @ViewChild('gifImage') gifImage!: ElementRef;
  
  forgiven = false;
  showCelebration = false;
  hearts: Array<{ id: number; left: string; duration: string; size: string; delay: string }> = [];
  movingHearts: Array<{ id: number; left: string; top: string; size: string; duration: string; delay: string }> = [];
  private heartCounter = 0;
  private movingHeartCounter = 0;
  private musicInterval: any;
  private isNoButtonFleeing = false;
  private gifRefreshInterval: any;
  
  // English apology messages
  apologies = [
    "👑 My King, I'm deeply sorry for my disrespectful words 👑",
    "😔 I was wrong and I regret every bad word I said 😔",
    "💝 You are my King and I should have treated you better 💝",
    "🌟 Please forgive this foolish heart that loves you so much 🌟",
    "🤴 A King deserves respect and I failed you - I'm sorry 🤴",
    "💫 Without your forgiveness, my world feels empty 💫",
    "🌹 I promise to be better, to speak with love and kindness 🌹"
  ];
  
  currentApology = 0;
  mouseX = 0;
  mouseY = 0;
  buttonAvoidDistance = 150;
  private audioContext: AudioContext | null = null;
  private isMusicPlaying = false;
  
  // GIFs - Utilisation d'emojis animés comme fallback + URLs fiables
  currentGifUrl = 'https://media0.giphy.com/media/v1.Y2lkPTc5MGI3NjExemt6bWlvMzA0ZmpxNWo0MnNsaXEwb2F0Z3pidnFxcGlvbWs2MG5jMSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/tT62urTtAGqicrZYou/giphy.gif';
  celebrationGifUrl = 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNm9qOWtteDVucG95NXA5cHN3c2ZyMHl0M2VxdTB0anUyaTRrcjBvZiZlcD12MV9naWZzX3NlYXJjaCZjdD1n/OfkGZ5H2H3f8Y/giphy.gif';
  
  // Liste de GIFs qui fonctionnent (CDN publics fiables)
  private gifList = [
    'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExc3JsMTk0OXNzZzN0bDczMDBjamJ5bHR4YWljNzM1YTFrN2FwcXJweSZlcD12MV9naWZzX3NlYXJjaCZjdD1n/burxw5NJkVdAhgFWKk/giphy.gif',
    'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExMTc4cDc5cWpmZ3pxNjVuMzY1eGtlNTMweHNrOGFxdmpmZmNqam0ydCZlcD12MV9naWZzX3NlYXJjaCZjdD1n/5Gb6pmAu8o0Ba/giphy.gif',
    'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExMTc4cDc5cWpmZ3pxNjVuMzY1eGtlNTMweHNrOGFxdmpmZmNqam0ydCZlcD12MV9naWZzX3NlYXJjaCZjdD1n/uGs3nvw76BfzPWnSv6/giphy.gif',
    'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExMTc4cDc5cWpmZ3pxNjVuMzY1eGtlNTMweHNrOGFxdmpmZmNqam0ydCZlcD12MV9naWZzX3NlYXJjaCZjdD1n/XYEEvoX0Ub69ZgN9ai/giphy.gif',
    'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExMTc4cDc5cWpmZ3pxNjVuMzY1eGtlNTMweHNrOGFxdmpmZmNqam0ydCZlcD12MV9naWZzX3NlYXJjaCZjdD1n/3ohs7Ys9J8XyFVheg0/giphy.gif'
  ];
  
  private celebrationGifs = [
    'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNm9qOWtteDVucG95NXA5cHN3c2ZyMHl0M2VxdTB0anUyaTRrcjBvZiZlcD12MV9naWZzX3NlYXJjaCZjdD1n/OfkGZ5H2H3f8Y/giphy.gif',
    'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNTkxYW45czZwdG9uZXo5N2g1NHBxZndxcGU5dXRtOTNpaTVvZzVnYSZlcD12MV9naWZzX3NlYXJjaCZjdD1n/vmon3eAOp1WfK/giphy.gif',
    'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNTkxYW45czZwdG9uZXo5N2g1NHBxZndxcGU5dXRtOTNpaTVvZzVnYSZlcD12MV9naWZzX3NlYXJjaCZjdD1n/Q9FGOQewX92eRRO9Qi/giphy.gif'
  ];
  
  // Emoji arrays for visual effects
  emojis = ['😔', '💔', '🙏', '😢', '💕', '🤗', '🥺', '💝', '👑', '❤️', '💖', '✨'];
  
  constructor(private renderer: Renderer2, private sanitizer: DomSanitizer) {}
  
  ngOnInit() {
    this.startApologyRotation();
    this.startBackgroundMusic();
    this.createFloatingHearts();
    this.createMovingHearts();
    this.startGifRotation();
    
    // Démarrer le premier GIF
    this.currentGifUrl = this.gifList[0];
    this.celebrationGifUrl = this.celebrationGifs[0];
    
    // Rafraîchir les GIFs périodiquement pour éviter la disparition
    this.startGifRefresh();
  }
  
  startGifRefresh() {
    // Rafraîchir les URLs des GIFs toutes les 10 secondes
    this.gifRefreshInterval = setInterval(() => {
      if (!this.forgiven) {
        // Forcer le rechargement du GIF actuel
        const currentIndex = this.gifList.indexOf(this.currentGifUrl);
        if (currentIndex !== -1) {
          // Recharger le même GIF avec un timestamp pour éviter le cache
          this.currentGifUrl = this.gifList[currentIndex] + '?t=' + Date.now();
          setTimeout(() => {
            this.currentGifUrl = this.gifList[currentIndex];
          }, 100);
        }
      }
    }, 10000);
  }
  
  startGifRotation() {
    let index = 0;
    setInterval(() => {
      if (!this.forgiven) {
        index = (index + 1) % this.gifList.length;
        this.currentGifUrl = this.gifList[index];
      }
    }, 4000);
  }
  
  startApologyRotation() {
    setInterval(() => {
      if (!this.forgiven) {
        this.currentApology = (this.currentApology + 1) % this.apologies.length;
      }
    }, 3000);
  }
  
  startBackgroundMusic() {
    const startMusicOnInteraction = () => {
      if (!this.isMusicPlaying) {
        this.playRomanticMelody();
        this.isMusicPlaying = true;
        this.musicInterval = setInterval(() => {
          if (!this.forgiven && this.isMusicPlaying) {
            this.playRomanticMelody();
          }
        }, 8000);
      }
      document.removeEventListener('click', startMusicOnInteraction);
      document.removeEventListener('touchstart', startMusicOnInteraction);
    };
    
    document.addEventListener('click', startMusicOnInteraction);
    document.addEventListener('touchstart', startMusicOnInteraction);
    
    setTimeout(() => {
      if (!this.isMusicPlaying) {
        this.playRomanticMelody();
        this.isMusicPlaying = true;
        this.musicInterval = setInterval(() => {
          if (!this.forgiven && this.isMusicPlaying) {
            this.playRomanticMelody();
          }
        }, 8000);
      }
    }, 1000);
  }
  
  playRomanticMelody() {
    try {
      if (this.audioContext) {
        this.audioContext.close();
      }
      
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.audioContext.resume();
      
      const now = this.audioContext.currentTime;
      
      const notes = [523.25, 587.33, 659.25, 523.25, 493.88, 523.25, 587.33];
      const durations = [0.4, 0.4, 0.8, 0.4, 0.4, 0.4, 1];
      
      notes.forEach((freq, i) => {
        const oscillator = this.audioContext!.createOscillator();
        const gainNode = this.audioContext!.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext!.destination);
        
        oscillator.frequency.value = freq;
        oscillator.type = 'sine';
        
        let startTime = now;
        for(let j = 0; j < i; j++) {
          startTime += durations[j];
        }
        
        gainNode.gain.setValueAtTime(0.2, startTime);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + durations[i]);
        
        oscillator.start(startTime);
        oscillator.stop(startTime + durations[i]);
      });
    } catch(e) {
      console.log('Audio not supported');
    }
  }
  
  playCelebrationSound() {
    try {
      if (this.audioContext) {
        this.audioContext.close();
      }
      
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.audioContext.resume();
      
      const now = this.audioContext.currentTime;
      
      const melody = [523.25, 659.25, 783.99, 1046.50];
      melody.forEach((freq, i) => {
        const oscillator = this.audioContext!.createOscillator();
        const gainNode = this.audioContext!.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext!.destination);
        
        oscillator.frequency.value = freq;
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0.4, now + (i * 0.2));
        gainNode.gain.exponentialRampToValueAtTime(0.0001, now + (i * 0.2) + 0.3);
        
        oscillator.start(now + (i * 0.2));
        oscillator.stop(now + (i * 0.2) + 0.3);
      });
      
      if (this.musicInterval) {
        clearInterval(this.musicInterval);
        this.musicInterval = null;
      }
      
      setTimeout(() => {
        if (!this.forgiven) {
          this.startBackgroundMusic();
        }
      }, 5000);
      
    } catch(e) {
      console.log('Audio not supported');
    }
  }
  
  createFloatingHearts() {
    setInterval(() => {
      if (!this.forgiven) {
        const heart = {
          id: this.heartCounter++,
          left: Math.random() * 100 + '%',
          duration: (Math.random() * 4 + 2) + 's',
          size: (Math.random() * 30 + 20) + 'px',
          delay: (Math.random() * 2) + 's'
        };
        this.hearts.push(heart);
        setTimeout(() => {
          this.hearts = this.hearts.filter(h => h.id !== heart.id);
        }, 4000);
      }
    }, 400);
  }
  
  createMovingHearts() {
    setInterval(() => {
      if (!this.forgiven) {
        const heart = {
          id: this.movingHeartCounter++,
          left: Math.random() * 100 + '%',
          top: Math.random() * 100 + '%',
          size: (Math.random() * 35 + 20) + 'px',
          duration: (Math.random() * 8 + 4) + 's',
          delay: (Math.random() * 2) + 's'
        };
        this.movingHearts.push(heart);
        setTimeout(() => {
          this.movingHearts = this.movingHearts.filter(h => h.id !== heart.id);
        }, 8000);
      }
    }, 800);
  }
  
  onYes() {
    this.forgiven = true;
    this.showCelebration = true;
    this.playCelebrationSound();
    
    // Changer le GIF de célébration
    const randomGif = this.celebrationGifs[Math.floor(Math.random() * this.celebrationGifs.length)];
    this.celebrationGifUrl = randomGif;
    
    if (this.musicInterval) {
      clearInterval(this.musicInterval);
      this.musicInterval = null;
    }
    
    if (this.gifRefreshInterval) {
      clearInterval(this.gifRefreshInterval);
      this.gifRefreshInterval = null;
    }
    
    for(let i = 0; i < 40; i++) {
      setTimeout(() => {
        const heart = {
          id: this.heartCounter++,
          left: Math.random() * 100 + '%',
          duration: (Math.random() * 2 + 1) + 's',
          size: (Math.random() * 40 + 20) + 'px',
          delay: '0s'
        };
        this.hearts.push(heart);
        setTimeout(() => {
          this.hearts = this.hearts.filter(h => h.id !== heart.id);
        }, 2000);
      }, i * 80);
    }
    
    setTimeout(() => {
      this.showCelebration = false;
    }, 5000);
  }
  
  @HostListener('document:mousemove', ['$event'])
  onMouseMove(event: MouseEvent) {
    this.mouseX = event.clientX;
    this.mouseY = event.clientY;
    
    if (!this.forgiven && this.noButton && !this.isNoButtonFleeing) {
      this.isNoButtonFleeing = true;
      requestAnimationFrame(() => {
        this.fleeFromMouse();
        this.isNoButtonFleeing = false;
      });
    }
  }
  
  fleeFromMouse() {
    const button = this.noButton.nativeElement;
    const buttonRect = button.getBoundingClientRect();
    const buttonCenterX = buttonRect.left + buttonRect.width / 2;
    const buttonCenterY = buttonRect.top + buttonRect.height / 2;
    
    const dx = this.mouseX - buttonCenterX;
    const dy = this.mouseY - buttonCenterY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance < this.buttonAvoidDistance) {
      const angle = Math.atan2(dy, dx);
      const fleeDistance = this.buttonAvoidDistance * 1.5;
      const moveX = Math.cos(angle) * fleeDistance;
      const moveY = Math.sin(angle) * fleeDistance;
      
      let newX = buttonRect.left - moveX;
      let newY = buttonRect.top - moveY;
      
      const maxX = window.innerWidth - buttonRect.width - 20;
      const maxY = window.innerHeight - buttonRect.height - 20;
      
      newX = Math.max(20, Math.min(maxX, newX));
      newY = Math.max(20, Math.min(maxY, newY));
      
      this.renderer.setStyle(button, 'position', 'fixed');
      this.renderer.setStyle(button, 'left', newX + 'px');
      this.renderer.setStyle(button, 'top', newY + 'px');
      this.renderer.setStyle(button, 'zIndex', '1000');
      this.renderer.setStyle(button, 'transition', 'left 0.08s ease, top 0.08s ease');
    }
  }
  
  onNoHover() {
    if (!this.forgiven && this.noButton) {
      const button = this.noButton.nativeElement;
      const buttonRect = button.getBoundingClientRect();
      
      const maxX = window.innerWidth - buttonRect.width - 20;
      const maxY = window.innerHeight - buttonRect.height - 20;
      
      let newX = Math.random() * maxX;
      let newY = Math.random() * maxY;
      
      newX = Math.max(20, Math.min(maxX, newX));
      newY = Math.max(20, Math.min(maxY, newY));
      
      this.renderer.setStyle(button, 'position', 'fixed');
      this.renderer.setStyle(button, 'left', newX + 'px');
      this.renderer.setStyle(button, 'top', newY + 'px');
      this.renderer.setStyle(button, 'zIndex', '1000');
      this.renderer.setStyle(button, 'transition', 'left 0.05s ease, top 0.05s ease');
    }
  }
  
  // Méthode pour rafraîchir le GIF en cas d'erreur
  onGifError() {
    console.log('GIF failed to load, refreshing...');
    const currentIndex = this.gifList.indexOf(this.currentGifUrl.split('?')[0]);
    if (currentIndex !== -1) {
      // Passer au GIF suivant
      const nextIndex = (currentIndex + 1) % this.gifList.length;
      this.currentGifUrl = this.gifList[nextIndex];
    } else {
      // Si l'index n'est pas trouvé, prendre le premier
      this.currentGifUrl = this.gifList[0];
    }
  }
  
  onCelebrationGifError() {
    console.log('Celebration GIF failed to load, using fallback');
    const currentIndex = this.celebrationGifs.indexOf(this.celebrationGifUrl.split('?')[0]);
    if (currentIndex !== -1) {
      const nextIndex = (currentIndex + 1) % this.celebrationGifs.length;
      this.celebrationGifUrl = this.celebrationGifs[nextIndex];
    } else {
      this.celebrationGifUrl = this.celebrationGifs[0];
    }
  }
  
  resetApology() {
    this.forgiven = false;
    this.showCelebration = false;
    this.currentApology = 0;
    this.isMusicPlaying = false;
    
    if (this.noButton) {
      const button = this.noButton.nativeElement;
      this.renderer.setStyle(button, 'position', 'relative');
      this.renderer.setStyle(button, 'left', 'auto');
      this.renderer.setStyle(button, 'top', 'auto');
      this.renderer.setStyle(button, 'transition', 'none');
    }
    
    this.startBackgroundMusic();
    this.startGifRefresh();
  }
  
  ngOnDestroy() {
    if (this.musicInterval) {
      clearInterval(this.musicInterval);
    }
    if (this.gifRefreshInterval) {
      clearInterval(this.gifRefreshInterval);
    }
    if (this.audioContext) {
      this.audioContext.close();
    }
  }
}