/*! NOEMA WATCH Chamber stage. Bundles three.js (MIT, Copyright 2010-2026 three.js authors); see /assets/THREE-LICENSE.txt */
var On={LEFT:0,MIDDLE:1,RIGHT:2,ROTATE:0,DOLLY:1,PAN:2},Bn={ROTATE:0,PAN:1,DOLLY_PAN:2,DOLLY_ROTATE:3},Wl=0,Ha=1,Xl=2;var dn=1,ql=2,Gn=3,Ti=0,Ct=1,ii=2,Si=0,pn=1,Ai=2,Va=3,Wa=4,Yl=5;var mn=100,Kl=101,Zl=102,Jl=103,$l=104,Ql=200,jl=201,ec=202,tc=203,ds=204,ps=205,ic=206,nc=207,rc=208,oc=209,sc=210,ac=211,lc=212,cc=213,uc=214,oo=0,so=1,ao=2,gn=3,lo=4,co=5,uo=6,fo=7,ms=0,fc=1,hc=2,di=0,gs=1,_s=2,xs=3,rr=4,Ms=5,Ss=6,vs=7;var Xa=300,wi=301,$i=302,ys=303,bs=304,_n=306,xn=1e3,_i=1001,ho=1002,Dt=1003,dc=1004;var po=1005;var Ut=1006,Es=1007;var Ni=1008;var Bt=1009,Ts=1010,As=1011,Qi=1012,or=1013,Zt=1014,ni=1015,Jt=1016,sr=1017,ar=1018,ji=1020,ws=35902,Rs=35899,Cs=1021,Ps=1022,$t=1023,pi=1026,Ui=1027,Ls=1028,lr=1029,vi=1030,cr=1031;var ur=1033,fr=33776,hr=33777,dr=33778,pr=33779,mo=35840,go=35841,_o=35842,xo=35843,Mo=36196,So=37492,vo=37496,yo=37488,bo=37489,zn=37490,Eo=37491,To=37808,Ao=37809,wo=37810,Ro=37811,Co=37812,Po=37813,Lo=37814,Do=37815,Io=37816,No=37817,Uo=37818,Fo=37819,Oo=37820,Bo=37821,Go=36492,zo=36494,ko=36495,Ho=36283,Vo=36284,kn=36285,Wo=36286;var pc=3200;var Xo=0,mc=1,Ri="",Vt="srgb",Hn="srgb-linear",Vn="linear",dt="srgb";var Ds=7680;var gc=519,_c=512,xc=513,Mc=514,mr=515,Sc=516,vc=517,gr=518,yc=519,bc=35044;var qa="300 es",mi=2e3,en=2001;function Tc(n){for(let e=n.length-1;e>=0;--e)if(n[e]>=65535)return!0;return!1}function xr(n){return document.createElementNS("http://www.w3.org/1999/xhtml",n)}function Ac(){let n=xr("canvas");return n.style.display="block",n}var Ec={},_r=null;function Ya(...n){let e="THREE."+n.shift();_r?_r("log",e,...n):console.log(e,...n)}function wc(n){let e=n[0];if(typeof e=="string"&&e.startsWith("TSL:")){let t=n[1];t&&t.isStackTrace?n[0]+=" "+t.getLocation():n[1]='Stack trace not available. Enable "THREE.Node.captureStackTrace" to capture stack traces.'}return n}function Ue(...n){n=wc(n);let e="THREE."+n.shift();if(_r)_r("warn",e,...n);else{let t=n[0];t&&t.isStackTrace?console.warn(t.getError(e)):console.warn(e,...n)}}function nt(...n){n=wc(n);let e="THREE."+n.shift();if(_r)_r("error",e,...n);else{let t=n[0];t&&t.isStackTrace?console.error(t.getError(e)):console.error(e,...n)}}function Wi(...n){let e=n.join(" ");e in Ec||(Ec[e]=!0,Ue(...n))}function Rc(n,e,t){return new Promise(function(i,r){function o(){switch(n.clientWaitSync(e,n.SYNC_FLUSH_COMMANDS_BIT,0)){case n.WAIT_FAILED:r();break;case n.TIMEOUT_EXPIRED:setTimeout(o,t);break;default:i()}}setTimeout(o,t)})}var Cc={[oo]:so,[ao]:uo,[lo]:fo,[gn]:co,[so]:oo,[uo]:ao,[fo]:lo,[co]:gn};var Qt=class{addEventListener(e,t){this._listeners===void 0&&(this._listeners={});let i=this._listeners;i[e]===void 0&&(i[e]=[]),i[e].indexOf(t)===-1&&i[e].push(t)}hasEventListener(e,t){let i=this._listeners;return i===void 0?!1:i[e]!==void 0&&i[e].indexOf(t)!==-1}removeEventListener(e,t){let i=this._listeners;if(i===void 0)return;let r=i[e];if(r!==void 0){let o=r.indexOf(t);o!==-1&&r.splice(o,1)}}dispatchEvent(e){let t=this._listeners;if(t===void 0)return;let i=t[e.type];if(i!==void 0){e.target=this;let r=i.slice(0);for(let o=0,s=r.length;o<s;o++)r[o].call(this,e);e.target=null}}};var si=["00","01","02","03","04","05","06","07","08","09","0a","0b","0c","0d","0e","0f","10","11","12","13","14","15","16","17","18","19","1a","1b","1c","1d","1e","1f","20","21","22","23","24","25","26","27","28","29","2a","2b","2c","2d","2e","2f","30","31","32","33","34","35","36","37","38","39","3a","3b","3c","3d","3e","3f","40","41","42","43","44","45","46","47","48","49","4a","4b","4c","4d","4e","4f","50","51","52","53","54","55","56","57","58","59","5a","5b","5c","5d","5e","5f","60","61","62","63","64","65","66","67","68","69","6a","6b","6c","6d","6e","6f","70","71","72","73","74","75","76","77","78","79","7a","7b","7c","7d","7e","7f","80","81","82","83","84","85","86","87","88","89","8a","8b","8c","8d","8e","8f","90","91","92","93","94","95","96","97","98","99","9a","9b","9c","9d","9e","9f","a0","a1","a2","a3","a4","a5","a6","a7","a8","a9","aa","ab","ac","ad","ae","af","b0","b1","b2","b3","b4","b5","b6","b7","b8","b9","ba","bb","bc","bd","be","bf","c0","c1","c2","c3","c4","c5","c6","c7","c8","c9","ca","cb","cc","cd","ce","cf","d0","d1","d2","d3","d4","d5","d6","d7","d8","d9","da","db","dc","dd","de","df","e0","e1","e2","e3","e4","e5","e6","e7","e8","e9","ea","eb","ec","ed","ee","ef","f0","f1","f2","f3","f4","f5","f6","f7","f8","f9","fa","fb","fc","fd","fe","ff"],Pc=1234567,Mn=Math.PI/180,Wn=180/Math.PI;function Fi(){let n=Math.random()*4294967295|0,e=Math.random()*4294967295|0,t=Math.random()*4294967295|0,i=Math.random()*4294967295|0;return(si[n&255]+si[n>>8&255]+si[n>>16&255]+si[n>>24&255]+"-"+si[e&255]+si[e>>8&255]+"-"+si[e>>16&15|64]+si[e>>24&255]+"-"+si[t&63|128]+si[t>>8&255]+"-"+si[t>>16&255]+si[t>>24&255]+si[i&255]+si[i>>8&255]+si[i>>16&255]+si[i>>24&255]).toLowerCase()}function Qe(n,e,t){return Math.max(e,Math.min(t,n))}function Is(n,e){return(n%e+e)%e}function Lp(n,e,t,i,r){return i+(n-e)*(r-i)/(t-e)}function Dp(n,e,t){return n!==e?(t-n)/(e-n):0}function Mr(n,e,t){return(1-t)*n+t*e}function Ip(n,e,t,i){return Mr(n,e,1-Math.exp(-t*i))}function Np(n,e=1){return e-Math.abs(Is(n,e*2)-e)}function Up(n,e,t){return n<=e?0:n>=t?1:(n=(n-e)/(t-e),n*n*(3-2*n))}function Fp(n,e,t){return n<=e?0:n>=t?1:(n=(n-e)/(t-e),n*n*n*(n*(n*6-15)+10))}function Op(n,e){return n+Math.floor(Math.random()*(e-n+1))}function Bp(n,e){return n+Math.random()*(e-n)}function Gp(n){return n*(.5-Math.random())}function zp(n){n!==void 0&&(Pc=n);let e=Pc+=1831565813;return e=Math.imul(e^e>>>15,e|1),e^=e+Math.imul(e^e>>>7,e|61),((e^e>>>14)>>>0)/4294967296}function kp(n){return n*Mn}function Hp(n){return n*Wn}function Vp(n){return n>0&&Number.isInteger(n)&&2**Math.round(Math.log2(n))===n}function Wp(n){return Math.pow(2,Math.ceil(Math.log(n)/Math.LN2))}function Xp(n){return Math.pow(2,Math.floor(Math.log(n)/Math.LN2))}function qp(n,e,t,i,r){let o=Math.cos,s=Math.sin,a=o(t/2),c=s(t/2),l=o((e+i)/2),h=s((e+i)/2),m=o((e-i)/2),f=s((e-i)/2),g=o((i-e)/2),x=s((i-e)/2);switch(r){case"XYX":n.set(a*h,c*m,c*f,a*l);break;case"YZY":n.set(c*f,a*h,c*m,a*l);break;case"ZXZ":n.set(c*m,c*f,a*h,a*l);break;case"XZX":n.set(a*h,c*x,c*g,a*l);break;case"YXY":n.set(c*g,a*h,c*x,a*l);break;case"ZYZ":n.set(c*x,c*g,a*h,a*l);break;default:Ue("MathUtils: .setQuaternionFromProperEuler() encountered an unknown order: "+r)}}function Xn(n,e){switch(e.constructor){case Float32Array:return n;case Uint32Array:return n/4294967295;case Uint16Array:return n/65535;case Uint8Array:case Uint8ClampedArray:return n/255;case Int32Array:return Math.max(n/2147483647,-1);case Int16Array:return Math.max(n/32767,-1);case Int8Array:return Math.max(n/127,-1);default:throw new Error("THREE.MathUtils: Invalid component type.")}}function ai(n,e){switch(e.constructor){case Float32Array:return n;case Uint32Array:return Math.round(n*4294967295);case Uint16Array:return Math.round(n*65535);case Uint8Array:case Uint8ClampedArray:return Math.round(n*255);case Int32Array:return Math.round(n*2147483647);case Int16Array:return Math.round(n*32767);case Int8Array:return Math.round(n*127);default:throw new Error("THREE.MathUtils: Invalid component type.")}}var Ka={DEG2RAD:Mn,RAD2DEG:Wn,generateUUID:Fi,clamp:Qe,euclideanModulo:Is,mapLinear:Lp,inverseLerp:Dp,lerp:Mr,damp:Ip,pingpong:Np,smoothstep:Up,smootherstep:Fp,randInt:Op,randFloat:Bp,randFloatSpread:Gp,seededRandom:zp,degToRad:kp,radToDeg:Hp,isPowerOfTwo:Vp,ceilPowerOfTwo:Wp,floorPowerOfTwo:Xp,setQuaternionFromProperEuler:qp,normalize:ai,denormalize:Xn};var Ce=class n{static{n.prototype.isVector2=!0}constructor(e=0,t=0){this.x=e,this.y=t}get width(){return this.x}set width(e){this.x=e}get height(){return this.y}set height(e){this.y=e}set(e,t){return this.x=e,this.y=t,this}setScalar(e){return this.x=e,this.y=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;default:throw new Error("THREE.Vector2: index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;default:throw new Error("THREE.Vector2: index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y)}copy(e){return this.x=e.x,this.y=e.y,this}add(e){return this.x+=e.x,this.y+=e.y,this}addScalar(e){return this.x+=e,this.y+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this}subScalar(e){return this.x-=e,this.y-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this}multiply(e){return this.x*=e.x,this.y*=e.y,this}multiplyScalar(e){return this.x*=e,this.y*=e,this}divide(e){return this.x/=e.x,this.y/=e.y,this}divideScalar(e){return this.multiplyScalar(1/e)}applyMatrix3(e){let t=this.x,i=this.y,r=e.elements;return this.x=r[0]*t+r[3]*i+r[6],this.y=r[1]*t+r[4]*i+r[7],this}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this}clamp(e,t){return this.x=Qe(this.x,e.x,t.x),this.y=Qe(this.y,e.y,t.y),this}clampScalar(e,t){return this.x=Qe(this.x,e,t),this.y=Qe(this.y,e,t),this}clampLength(e,t){let i=this.length();return this.divideScalar(i||1).multiplyScalar(Qe(i,e,t))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this}negate(){return this.x=-this.x,this.y=-this.y,this}dot(e){return this.x*e.x+this.y*e.y}cross(e){return this.x*e.y-this.y*e.x}lengthSq(){return this.x*this.x+this.y*this.y}length(){return Math.sqrt(this.x*this.x+this.y*this.y)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)}normalize(){return this.divideScalar(this.length()||1)}angle(){return Math.atan2(-this.y,-this.x)+Math.PI}angleTo(e){let t=Math.sqrt(this.lengthSq()*e.lengthSq());if(t===0)return Math.PI/2;let i=this.dot(e)/t;return Math.acos(Qe(i,-1,1))}distanceTo(e){return Math.sqrt(this.distanceToSquared(e))}distanceToSquared(e){let t=this.x-e.x,i=this.y-e.y;return t*t+i*i}manhattanDistanceTo(e){return Math.abs(this.x-e.x)+Math.abs(this.y-e.y)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this}lerpVectors(e,t,i){return this.x=e.x+(t.x-e.x)*i,this.y=e.y+(t.y-e.y)*i,this}equals(e){return e.x===this.x&&e.y===this.y}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this}rotateAround(e,t){let i=Math.cos(t),r=Math.sin(t),o=this.x-e.x,s=this.y-e.y;return this.x=o*i-s*r+e.x,this.y=o*r+s*i+e.y,this}random(){return this.x=Math.random(),this.y=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y}};var li=class{constructor(e=0,t=0,i=0,r=1){this.isQuaternion=!0,this._x=e,this._y=t,this._z=i,this._w=r}static slerpFlat(e,t,i,r,o,s,a){let c=i[r+0],l=i[r+1],h=i[r+2],m=i[r+3],f=o[s+0],g=o[s+1],x=o[s+2],S=o[s+3];if(m!==S||c!==f||l!==g||h!==x){let _=c*f+l*g+h*x+m*S;_<0&&(f=-f,g=-g,x=-x,S=-S,_=-_);let p=1-a;if(_<.9995){let A=Math.acos(_),P=Math.sin(A);p=Math.sin(p*A)/P,a=Math.sin(a*A)/P,c=c*p+f*a,l=l*p+g*a,h=h*p+x*a,m=m*p+S*a}else{c=c*p+f*a,l=l*p+g*a,h=h*p+x*a,m=m*p+S*a;let A=1/Math.sqrt(c*c+l*l+h*h+m*m);c*=A,l*=A,h*=A,m*=A}}e[t]=c,e[t+1]=l,e[t+2]=h,e[t+3]=m}static multiplyQuaternionsFlat(e,t,i,r,o,s){let a=i[r],c=i[r+1],l=i[r+2],h=i[r+3],m=o[s],f=o[s+1],g=o[s+2],x=o[s+3];return e[t]=a*x+h*m+c*g-l*f,e[t+1]=c*x+h*f+l*m-a*g,e[t+2]=l*x+h*g+a*f-c*m,e[t+3]=h*x-a*m-c*f-l*g,e}get x(){return this._x}set x(e){this._x=e,this._onChangeCallback()}get y(){return this._y}set y(e){this._y=e,this._onChangeCallback()}get z(){return this._z}set z(e){this._z=e,this._onChangeCallback()}get w(){return this._w}set w(e){this._w=e,this._onChangeCallback()}set(e,t,i,r){return this._x=e,this._y=t,this._z=i,this._w=r,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._w)}copy(e){return this._x=e.x,this._y=e.y,this._z=e.z,this._w=e.w,this._onChangeCallback(),this}setFromEuler(e,t=!0){let i=e._x,r=e._y,o=e._z,s=e._order,a=Math.cos,c=Math.sin,l=a(i/2),h=a(r/2),m=a(o/2),f=c(i/2),g=c(r/2),x=c(o/2);switch(s){case"XYZ":this._x=f*h*m+l*g*x,this._y=l*g*m-f*h*x,this._z=l*h*x+f*g*m,this._w=l*h*m-f*g*x;break;case"YXZ":this._x=f*h*m+l*g*x,this._y=l*g*m-f*h*x,this._z=l*h*x-f*g*m,this._w=l*h*m+f*g*x;break;case"ZXY":this._x=f*h*m-l*g*x,this._y=l*g*m+f*h*x,this._z=l*h*x+f*g*m,this._w=l*h*m-f*g*x;break;case"ZYX":this._x=f*h*m-l*g*x,this._y=l*g*m+f*h*x,this._z=l*h*x-f*g*m,this._w=l*h*m+f*g*x;break;case"YZX":this._x=f*h*m+l*g*x,this._y=l*g*m+f*h*x,this._z=l*h*x-f*g*m,this._w=l*h*m-f*g*x;break;case"XZY":this._x=f*h*m-l*g*x,this._y=l*g*m-f*h*x,this._z=l*h*x+f*g*m,this._w=l*h*m+f*g*x;break;default:Ue("Quaternion: .setFromEuler() encountered an unknown order: "+s)}return t===!0&&this._onChangeCallback(),this}setFromAxisAngle(e,t){let i=t/2,r=Math.sin(i);return this._x=e.x*r,this._y=e.y*r,this._z=e.z*r,this._w=Math.cos(i),this._onChangeCallback(),this}setFromRotationMatrix(e){let t=e.elements,i=t[0],r=t[4],o=t[8],s=t[1],a=t[5],c=t[9],l=t[2],h=t[6],m=t[10],f=i+a+m;if(f>0){let g=.5/Math.sqrt(f+1);this._w=.25/g,this._x=(h-c)*g,this._y=(o-l)*g,this._z=(s-r)*g}else if(i>a&&i>m){let g=2*Math.sqrt(1+i-a-m);this._w=(h-c)/g,this._x=.25*g,this._y=(r+s)/g,this._z=(o+l)/g}else if(a>m){let g=2*Math.sqrt(1+a-i-m);this._w=(o-l)/g,this._x=(r+s)/g,this._y=.25*g,this._z=(c+h)/g}else{let g=2*Math.sqrt(1+m-i-a);this._w=(s-r)/g,this._x=(o+l)/g,this._y=(c+h)/g,this._z=.25*g}return this._onChangeCallback(),this}setFromUnitVectors(e,t){let i=e.dot(t)+1;return i<1e-8?(i=0,Math.abs(e.x)>Math.abs(e.z)?(this._x=-e.y,this._y=e.x,this._z=0,this._w=i):(this._x=0,this._y=-e.z,this._z=e.y,this._w=i)):(this._x=e.y*t.z-e.z*t.y,this._y=e.z*t.x-e.x*t.z,this._z=e.x*t.y-e.y*t.x,this._w=i),this.normalize()}angleTo(e){return 2*Math.acos(Math.abs(Qe(this.dot(e),-1,1)))}rotateTowards(e,t){let i=this.angleTo(e);if(i===0)return this;let r=Math.min(1,t/i);return this.slerp(e,r),this}identity(){return this.set(0,0,0,1)}invert(){return this.conjugate()}conjugate(){return this._x*=-1,this._y*=-1,this._z*=-1,this._onChangeCallback(),this}dot(e){return this._x*e._x+this._y*e._y+this._z*e._z+this._w*e._w}lengthSq(){return this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w}length(){return Math.sqrt(this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w)}normalize(){let e=this.length();return e===0?(this._x=0,this._y=0,this._z=0,this._w=1):(e=1/e,this._x=this._x*e,this._y=this._y*e,this._z=this._z*e,this._w=this._w*e),this._onChangeCallback(),this}multiply(e){return this.multiplyQuaternions(this,e)}premultiply(e){return this.multiplyQuaternions(e,this)}multiplyQuaternions(e,t){let i=e._x,r=e._y,o=e._z,s=e._w,a=t._x,c=t._y,l=t._z,h=t._w;return this._x=i*h+s*a+r*l-o*c,this._y=r*h+s*c+o*a-i*l,this._z=o*h+s*l+i*c-r*a,this._w=s*h-i*a-r*c-o*l,this._onChangeCallback(),this}slerp(e,t){let i=e._x,r=e._y,o=e._z,s=e._w,a=this.dot(e);a<0&&(i=-i,r=-r,o=-o,s=-s,a=-a);let c=1-t;if(a<.9995){let l=Math.acos(a),h=Math.sin(l);c=Math.sin(c*l)/h,t=Math.sin(t*l)/h,this._x=this._x*c+i*t,this._y=this._y*c+r*t,this._z=this._z*c+o*t,this._w=this._w*c+s*t,this._onChangeCallback()}else this._x=this._x*c+i*t,this._y=this._y*c+r*t,this._z=this._z*c+o*t,this._w=this._w*c+s*t,this.normalize();return this}slerpQuaternions(e,t,i){return this.copy(e).slerp(t,i)}random(){let e=2*Math.PI*Math.random(),t=2*Math.PI*Math.random(),i=Math.random(),r=Math.sqrt(1-i),o=Math.sqrt(i);return this.set(r*Math.sin(e),r*Math.cos(e),o*Math.sin(t),o*Math.cos(t))}equals(e){return e._x===this._x&&e._y===this._y&&e._z===this._z&&e._w===this._w}fromArray(e,t=0){return this._x=e[t],this._y=e[t+1],this._z=e[t+2],this._w=e[t+3],this._onChangeCallback(),this}toArray(e=[],t=0){return e[t]=this._x,e[t+1]=this._y,e[t+2]=this._z,e[t+3]=this._w,e}fromBufferAttribute(e,t){return this._x=e.getX(t),this._y=e.getY(t),this._z=e.getZ(t),this._w=e.getW(t),this._onChangeCallback(),this}toJSON(){return this.toArray()}_onChange(e){return this._onChangeCallback=e,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._w}};var D=class n{static{n.prototype.isVector3=!0}constructor(e=0,t=0,i=0){this.x=e,this.y=t,this.z=i}set(e,t,i){return i===void 0&&(i=this.z),this.x=e,this.y=t,this.z=i,this}setScalar(e){return this.x=e,this.y=e,this.z=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setZ(e){return this.z=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;case 2:this.z=t;break;default:throw new Error("THREE.Vector3: index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;case 2:return this.z;default:throw new Error("THREE.Vector3: index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y,this.z)}copy(e){return this.x=e.x,this.y=e.y,this.z=e.z,this}add(e){return this.x+=e.x,this.y+=e.y,this.z+=e.z,this}addScalar(e){return this.x+=e,this.y+=e,this.z+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this.z=e.z+t.z,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this.z+=e.z*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this.z-=e.z,this}subScalar(e){return this.x-=e,this.y-=e,this.z-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this.z=e.z-t.z,this}multiply(e){return this.x*=e.x,this.y*=e.y,this.z*=e.z,this}multiplyScalar(e){return this.x*=e,this.y*=e,this.z*=e,this}multiplyVectors(e,t){return this.x=e.x*t.x,this.y=e.y*t.y,this.z=e.z*t.z,this}applyEuler(e){return this.applyQuaternion(Lc.setFromEuler(e))}applyAxisAngle(e,t){return this.applyQuaternion(Lc.setFromAxisAngle(e,t))}applyMatrix3(e){let t=this.x,i=this.y,r=this.z,o=e.elements;return this.x=o[0]*t+o[3]*i+o[6]*r,this.y=o[1]*t+o[4]*i+o[7]*r,this.z=o[2]*t+o[5]*i+o[8]*r,this}applyNormalMatrix(e){return this.applyMatrix3(e).normalize()}applyMatrix4(e){let t=this.x,i=this.y,r=this.z,o=e.elements,s=1/(o[3]*t+o[7]*i+o[11]*r+o[15]);return this.x=(o[0]*t+o[4]*i+o[8]*r+o[12])*s,this.y=(o[1]*t+o[5]*i+o[9]*r+o[13])*s,this.z=(o[2]*t+o[6]*i+o[10]*r+o[14])*s,this}applyQuaternion(e){let t=this.x,i=this.y,r=this.z,o=e.x,s=e.y,a=e.z,c=e.w,l=2*(s*r-a*i),h=2*(a*t-o*r),m=2*(o*i-s*t);return this.x=t+c*l+s*m-a*h,this.y=i+c*h+a*l-o*m,this.z=r+c*m+o*h-s*l,this}project(e){return this.applyMatrix4(e.matrixWorldInverse).applyMatrix4(e.projectionMatrix)}unproject(e){return this.applyMatrix4(e.projectionMatrixInverse).applyMatrix4(e.matrixWorld)}transformDirection(e){let t=this.x,i=this.y,r=this.z,o=e.elements;return this.x=o[0]*t+o[4]*i+o[8]*r,this.y=o[1]*t+o[5]*i+o[9]*r,this.z=o[2]*t+o[6]*i+o[10]*r,this.normalize()}divide(e){return this.x/=e.x,this.y/=e.y,this.z/=e.z,this}divideScalar(e){return this.multiplyScalar(1/e)}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this.z=Math.min(this.z,e.z),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this.z=Math.max(this.z,e.z),this}clamp(e,t){return this.x=Qe(this.x,e.x,t.x),this.y=Qe(this.y,e.y,t.y),this.z=Qe(this.z,e.z,t.z),this}clampScalar(e,t){return this.x=Qe(this.x,e,t),this.y=Qe(this.y,e,t),this.z=Qe(this.z,e,t),this}clampLength(e,t){let i=this.length();return this.divideScalar(i||1).multiplyScalar(Qe(i,e,t))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this}dot(e){return this.x*e.x+this.y*e.y+this.z*e.z}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)}normalize(){return this.divideScalar(this.length()||1)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this.z+=(e.z-this.z)*t,this}lerpVectors(e,t,i){return this.x=e.x+(t.x-e.x)*i,this.y=e.y+(t.y-e.y)*i,this.z=e.z+(t.z-e.z)*i,this}cross(e){return this.crossVectors(this,e)}crossVectors(e,t){let i=e.x,r=e.y,o=e.z,s=t.x,a=t.y,c=t.z;return this.x=r*c-o*a,this.y=o*s-i*c,this.z=i*a-r*s,this}projectOnVector(e){let t=e.lengthSq();if(t===0)return this.set(0,0,0);let i=e.dot(this)/t;return this.copy(e).multiplyScalar(i)}projectOnPlane(e){return Za.copy(this).projectOnVector(e),this.sub(Za)}reflect(e){return this.sub(Za.copy(e).multiplyScalar(2*this.dot(e)))}angleTo(e){let t=Math.sqrt(this.lengthSq()*e.lengthSq());if(t===0)return Math.PI/2;let i=this.dot(e)/t;return Math.acos(Qe(i,-1,1))}distanceTo(e){return Math.sqrt(this.distanceToSquared(e))}distanceToSquared(e){let t=this.x-e.x,i=this.y-e.y,r=this.z-e.z;return t*t+i*i+r*r}manhattanDistanceTo(e){return Math.abs(this.x-e.x)+Math.abs(this.y-e.y)+Math.abs(this.z-e.z)}setFromSpherical(e){return this.setFromSphericalCoords(e.radius,e.phi,e.theta)}setFromSphericalCoords(e,t,i){let r=Math.sin(t)*e;return this.x=r*Math.sin(i),this.y=Math.cos(t)*e,this.z=r*Math.cos(i),this}setFromCylindrical(e){return this.setFromCylindricalCoords(e.radius,e.theta,e.y)}setFromCylindricalCoords(e,t,i){return this.x=e*Math.sin(t),this.y=i,this.z=e*Math.cos(t),this}setFromMatrixPosition(e){let t=e.elements;return this.x=t[12],this.y=t[13],this.z=t[14],this}setFromMatrixScale(e){let t=this.setFromMatrixColumn(e,0).length(),i=this.setFromMatrixColumn(e,1).length(),r=this.setFromMatrixColumn(e,2).length();return this.x=t,this.y=i,this.z=r,this}setFromMatrixColumn(e,t){return this.fromArray(e.elements,t*4)}setFromMatrix3Column(e,t){return this.fromArray(e.elements,t*3)}setFromEuler(e){return this.x=e._x,this.y=e._y,this.z=e._z,this}setFromColor(e){return this.x=e.r,this.y=e.g,this.z=e.b,this}equals(e){return e.x===this.x&&e.y===this.y&&e.z===this.z}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this.z=e[t+2],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e[t+2]=this.z,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this.z=e.getZ(t),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this}randomDirection(){let e=Math.random()*Math.PI*2,t=Math.random()*2-1,i=Math.sqrt(1-t*t);return this.x=i*Math.cos(e),this.y=t,this.z=i*Math.sin(e),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z}},Za=new D,Lc=new li;var qe=class n{static{n.prototype.isMatrix3=!0}constructor(e,t,i,r,o,s,a,c,l){this.elements=[1,0,0,0,1,0,0,0,1],e!==void 0&&this.set(e,t,i,r,o,s,a,c,l)}set(e,t,i,r,o,s,a,c,l){let h=this.elements;return h[0]=e,h[1]=r,h[2]=a,h[3]=t,h[4]=o,h[5]=c,h[6]=i,h[7]=s,h[8]=l,this}identity(){return this.set(1,0,0,0,1,0,0,0,1),this}copy(e){let t=this.elements,i=e.elements;return t[0]=i[0],t[1]=i[1],t[2]=i[2],t[3]=i[3],t[4]=i[4],t[5]=i[5],t[6]=i[6],t[7]=i[7],t[8]=i[8],this}extractBasis(e,t,i){return e.setFromMatrix3Column(this,0),t.setFromMatrix3Column(this,1),i.setFromMatrix3Column(this,2),this}setFromMatrix4(e){let t=e.elements;return this.set(t[0],t[4],t[8],t[1],t[5],t[9],t[2],t[6],t[10]),this}multiply(e){return this.multiplyMatrices(this,e)}premultiply(e){return this.multiplyMatrices(e,this)}multiplyMatrices(e,t){let i=e.elements,r=t.elements,o=this.elements,s=i[0],a=i[3],c=i[6],l=i[1],h=i[4],m=i[7],f=i[2],g=i[5],x=i[8],S=r[0],_=r[3],p=r[6],A=r[1],P=r[4],y=r[7],E=r[2],b=r[5],R=r[8];return o[0]=s*S+a*A+c*E,o[3]=s*_+a*P+c*b,o[6]=s*p+a*y+c*R,o[1]=l*S+h*A+m*E,o[4]=l*_+h*P+m*b,o[7]=l*p+h*y+m*R,o[2]=f*S+g*A+x*E,o[5]=f*_+g*P+x*b,o[8]=f*p+g*y+x*R,this}multiplyScalar(e){let t=this.elements;return t[0]*=e,t[3]*=e,t[6]*=e,t[1]*=e,t[4]*=e,t[7]*=e,t[2]*=e,t[5]*=e,t[8]*=e,this}determinant(){let e=this.elements,t=e[0],i=e[1],r=e[2],o=e[3],s=e[4],a=e[5],c=e[6],l=e[7],h=e[8];return t*s*h-t*a*l-i*o*h+i*a*c+r*o*l-r*s*c}invert(){let e=this.elements,t=e[0],i=e[1],r=e[2],o=e[3],s=e[4],a=e[5],c=e[6],l=e[7],h=e[8],m=h*s-a*l,f=a*c-h*o,g=l*o-s*c,x=t*m+i*f+r*g;if(x===0)return this.set(0,0,0,0,0,0,0,0,0);let S=1/x;return e[0]=m*S,e[1]=(r*l-h*i)*S,e[2]=(a*i-r*s)*S,e[3]=f*S,e[4]=(h*t-r*c)*S,e[5]=(r*o-a*t)*S,e[6]=g*S,e[7]=(i*c-l*t)*S,e[8]=(s*t-i*o)*S,this}transpose(){let e,t=this.elements;return e=t[1],t[1]=t[3],t[3]=e,e=t[2],t[2]=t[6],t[6]=e,e=t[5],t[5]=t[7],t[7]=e,this}getNormalMatrix(e){return this.setFromMatrix4(e).invert().transpose()}transposeIntoArray(e){let t=this.elements;return e[0]=t[0],e[1]=t[3],e[2]=t[6],e[3]=t[1],e[4]=t[4],e[5]=t[7],e[6]=t[2],e[7]=t[5],e[8]=t[8],this}setUvTransform(e,t,i,r,o,s,a){let c=Math.cos(o),l=Math.sin(o);return this.set(i*c,i*l,-i*(c*s+l*a)+s+e,-r*l,r*c,-r*(-l*s+c*a)+a+t,0,0,1),this}scale(e,t){return Wi("Matrix3: .scale() is deprecated. Use .makeScale() instead."),this.premultiply(Ja.makeScale(e,t)),this}rotate(e){return Wi("Matrix3: .rotate() is deprecated. Use .makeRotation() instead."),this.premultiply(Ja.makeRotation(-e)),this}translate(e,t){return Wi("Matrix3: .translate() is deprecated. Use .makeTranslation() instead."),this.premultiply(Ja.makeTranslation(e,t)),this}makeTranslation(e,t){return e.isVector2?this.set(1,0,e.x,0,1,e.y,0,0,1):this.set(1,0,e,0,1,t,0,0,1),this}makeRotation(e){let t=Math.cos(e),i=Math.sin(e);return this.set(t,-i,0,i,t,0,0,0,1),this}makeScale(e,t){return this.set(e,0,0,0,t,0,0,0,1),this}equals(e){let t=this.elements,i=e.elements;for(let r=0;r<9;r++)if(t[r]!==i[r])return!1;return!0}fromArray(e,t=0){for(let i=0;i<9;i++)this.elements[i]=e[i+t];return this}toArray(e=[],t=0){let i=this.elements;return e[t]=i[0],e[t+1]=i[1],e[t+2]=i[2],e[t+3]=i[3],e[t+4]=i[4],e[t+5]=i[5],e[t+6]=i[6],e[t+7]=i[7],e[t+8]=i[8],e}clone(){return new this.constructor().fromArray(this.elements)}},Ja=new qe;var Dc=new qe().set(.4123908,.3575843,.1804808,.212639,.7151687,.0721923,.0193308,.1191948,.9505322),Ic=new qe().set(3.2409699,-1.5373832,-.4986108,-.9692436,1.8759675,.0415551,.0556301,-.203977,1.0569715);function Yp(){let n={enabled:!0,workingColorSpace:Hn,spaces:{},convert:function(r,o,s){return this.enabled===!1||o===s||!o||!s||(this.spaces[o].transfer===dt&&(r.r=Oi(r.r),r.g=Oi(r.g),r.b=Oi(r.b)),this.spaces[o].primaries!==this.spaces[s].primaries&&(r.applyMatrix3(this.spaces[o].toXYZ),r.applyMatrix3(this.spaces[s].fromXYZ)),this.spaces[s].transfer===dt&&(r.r=qn(r.r),r.g=qn(r.g),r.b=qn(r.b))),r},workingToColorSpace:function(r,o){return this.convert(r,this.workingColorSpace,o)},colorSpaceToWorking:function(r,o){return this.convert(r,o,this.workingColorSpace)},getPrimaries:function(r){return this.spaces[r].primaries},getTransfer:function(r){return r===Ri?Vn:this.spaces[r].transfer},getToneMappingMode:function(r){return this.spaces[r].outputColorSpaceConfig.toneMappingMode||"standard"},getLuminanceCoefficients:function(r,o=this.workingColorSpace){return r.fromArray(this.spaces[o].luminanceCoefficients)},define:function(r){Object.assign(this.spaces,r)},_getMatrix:function(r,o,s){return r.copy(this.spaces[o].toXYZ).multiply(this.spaces[s].fromXYZ)},_getDrawingBufferColorSpace:function(r){return this.spaces[r].outputColorSpaceConfig.drawingBufferColorSpace},_getUnpackColorSpace:function(r=this.workingColorSpace){return this.spaces[r].workingColorSpaceConfig.unpackColorSpace},fromWorkingColorSpace:function(r,o){return Wi("ColorManagement: .fromWorkingColorSpace() has been renamed to .workingToColorSpace()."),n.workingToColorSpace(r,o)},toWorkingColorSpace:function(r,o){return Wi("ColorManagement: .toWorkingColorSpace() has been renamed to .colorSpaceToWorking()."),n.colorSpaceToWorking(r,o)}},e=[.64,.33,.3,.6,.15,.06],t=[.2126,.7152,.0722],i=[.3127,.329];return n.define({[Hn]:{primaries:e,whitePoint:i,transfer:Vn,toXYZ:Dc,fromXYZ:Ic,luminanceCoefficients:t,workingColorSpaceConfig:{unpackColorSpace:Vt},outputColorSpaceConfig:{drawingBufferColorSpace:Vt}},[Vt]:{primaries:e,whitePoint:i,transfer:dt,toXYZ:Dc,fromXYZ:Ic,luminanceCoefficients:t,outputColorSpaceConfig:{drawingBufferColorSpace:Vt}}}),n}var tt=Yp();function Oi(n){return n<.04045?n*.0773993808:Math.pow(n*.9478672986+.0521327014,2.4)}function qn(n){return n<.0031308?n*12.92:1.055*Math.pow(n,.41666)-.055}var Sr,Ns=class{static getDataURL(e,t="image/png"){if(/^data:/i.test(e.src)||typeof HTMLCanvasElement>"u")return e.src;let i;if(e instanceof HTMLCanvasElement)i=e;else{Sr===void 0&&(Sr=xr("canvas")),Sr.width=e.width,Sr.height=e.height;let r=Sr.getContext("2d");e instanceof ImageData?r.putImageData(e,0,0):r.drawImage(e,0,0,e.width,e.height),i=Sr}return i.toDataURL(t)}static sRGBToLinear(e){if(typeof HTMLImageElement<"u"&&e instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&e instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&e instanceof ImageBitmap){let t=xr("canvas");t.width=e.width,t.height=e.height;let i=t.getContext("2d");i.drawImage(e,0,0,e.width,e.height);let r=i.getImageData(0,0,e.width,e.height),o=r.data;for(let s=0;s<o.length;s++)o[s]=Oi(o[s]/255)*255;return i.putImageData(r,0,0),t}else if(e.data){let t=e.data.slice(0);for(let i=0;i<t.length;i++)t instanceof Uint8Array||t instanceof Uint8ClampedArray?t[i]=Math.floor(Oi(t[i]/255)*255):t[i]=Oi(t[i]);return{data:t,width:e.width,height:e.height}}else return Ue("ImageUtils.sRGBToLinear(): Unsupported image type. No color space conversion applied."),e}};var Kp=0,Sn=class{constructor(e=null){this.isTextureSource=!0,Object.defineProperty(this,"id",{value:Kp++}),this.uuid=Fi(),this.data=e,this.dataReady=!0,this.version=0}getSize(e){let t=this.data;return typeof HTMLVideoElement<"u"&&t instanceof HTMLVideoElement?e.set(t.videoWidth,t.videoHeight,0):typeof VideoFrame<"u"&&t instanceof VideoFrame?e.set(t.displayWidth,t.displayHeight,0):t!==null?e.set(t.width,t.height,t.depth||0):e.set(0,0,0),e}set needsUpdate(e){e===!0&&this.version++}toJSON(e){let t=e===void 0||typeof e=="string";if(!t&&e.images[this.uuid]!==void 0)return e.images[this.uuid];let i={uuid:this.uuid,url:""},r=this.data;if(r!==null){let o;if(Array.isArray(r)){o=[];for(let s=0,a=r.length;s<a;s++)r[s].isDataTexture?o.push($a(r[s].image)):o.push($a(r[s]))}else o=$a(r);i.url=o}return t||(e.images[this.uuid]=i),i}};function $a(n){return typeof HTMLImageElement<"u"&&n instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&n instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&n instanceof ImageBitmap?Ns.getDataURL(n):n.data?{data:Array.from(n.data),width:n.width,height:n.height,type:n.data.constructor.name}:(Ue("Texture: Unable to serialize Texture."),{})}var Zp=0,Qa=new D,Ft=class n extends Qt{constructor(e=n.DEFAULT_IMAGE,t=n.DEFAULT_MAPPING,i=_i,r=_i,o=Ut,s=Ni,a=$t,c=Bt,l=n.DEFAULT_ANISOTROPY,h=Ri){super(),this.isTexture=!0,Object.defineProperty(this,"id",{value:Zp++}),this.uuid=Fi(),this.name="",this.source=new Sn(e),this.mipmaps=[],this.mapping=t,this.channel=0,this.wrapS=i,this.wrapT=r,this.magFilter=o,this.minFilter=s,this.anisotropy=l,this.format=a,this.internalFormat=null,this.type=c,this.offset=new Ce(0,0),this.repeat=new Ce(1,1),this.center=new Ce(0,0),this.rotation=0,this.matrixAutoUpdate=!0,this.matrix=new qe,this.generateMipmaps=!0,this.premultiplyAlpha=!1,this.flipY=!0,this.unpackAlignment=4,this.colorSpace=h,this.userData={},this.updateRanges=[],this.version=0,this.onUpdate=null,this.renderTarget=null,this.isRenderTargetTexture=!1,this.isArrayTexture=!!(e&&e.depth&&e.depth>1),this.pmremVersion=0,this.normalized=!1}get width(){return this.source.getSize(Qa).x}get height(){return this.source.getSize(Qa).y}get depth(){return this.source.getSize(Qa).z}get image(){return this.source.data}set image(e){this.source.data=e}updateMatrix(){this.matrix.setUvTransform(this.offset.x,this.offset.y,this.repeat.x,this.repeat.y,this.rotation,this.center.x,this.center.y)}addUpdateRange(e,t){this.updateRanges.push({start:e,count:t})}clearUpdateRanges(){this.updateRanges.length=0}clone(){return new this.constructor().copy(this)}copy(e){return this.name=e.name,this.source=e.source,this.mipmaps=e.mipmaps.slice(0),this.mapping=e.mapping,this.channel=e.channel,this.wrapS=e.wrapS,this.wrapT=e.wrapT,this.magFilter=e.magFilter,this.minFilter=e.minFilter,this.anisotropy=e.anisotropy,this.format=e.format,this.internalFormat=e.internalFormat,this.type=e.type,this.normalized=e.normalized,this.offset.copy(e.offset),this.repeat.copy(e.repeat),this.center.copy(e.center),this.rotation=e.rotation,this.matrixAutoUpdate=e.matrixAutoUpdate,this.matrix.copy(e.matrix),this.generateMipmaps=e.generateMipmaps,this.premultiplyAlpha=e.premultiplyAlpha,this.flipY=e.flipY,this.unpackAlignment=e.unpackAlignment,this.colorSpace=e.colorSpace,this.renderTarget=e.renderTarget,this.isRenderTargetTexture=e.isRenderTargetTexture,this.isArrayTexture=e.isArrayTexture,this.userData=JSON.parse(JSON.stringify(e.userData)),this.needsUpdate=!0,this}setValues(e){for(let t in e){let i=e[t];if(i===void 0){Ue(`Texture.setValues(): parameter '${t}' has value of undefined.`);continue}let r=this[t];if(r===void 0){Ue(`Texture.setValues(): property '${t}' does not exist.`);continue}r&&i&&r.isVector2&&i.isVector2||r&&i&&r.isVector3&&i.isVector3||r&&i&&r.isMatrix3&&i.isMatrix3?r.copy(i):this[t]=i}}toJSON(e){let t=e===void 0||typeof e=="string";if(!t&&e.textures[this.uuid]!==void 0)return e.textures[this.uuid];let i={metadata:{version:4.7,type:"Texture",generator:"Texture.toJSON"},uuid:this.uuid,name:this.name,image:this.source.toJSON(e).uuid,mapping:this.mapping,channel:this.channel,repeat:[this.repeat.x,this.repeat.y],offset:[this.offset.x,this.offset.y],center:[this.center.x,this.center.y],rotation:this.rotation,wrap:[this.wrapS,this.wrapT],format:this.format,internalFormat:this.internalFormat,type:this.type,normalized:this.normalized,colorSpace:this.colorSpace,minFilter:this.minFilter,magFilter:this.magFilter,anisotropy:this.anisotropy,flipY:this.flipY,generateMipmaps:this.generateMipmaps,premultiplyAlpha:this.premultiplyAlpha,unpackAlignment:this.unpackAlignment};return Object.keys(this.userData).length>0&&(i.userData=this.userData),t||(e.textures[this.uuid]=i),i}dispose(){this.dispatchEvent({type:"dispose"})}transformUv(e){if(this.mapping!==Xa)return e;if(e.applyMatrix3(this.matrix),e.x<0||e.x>1)switch(this.wrapS){case xn:e.x=e.x-Math.floor(e.x);break;case _i:e.x=e.x<0?0:1;break;case ho:Math.abs(Math.floor(e.x)%2)===1?e.x=Math.ceil(e.x)-e.x:e.x=e.x-Math.floor(e.x);break}if(e.y<0||e.y>1)switch(this.wrapT){case xn:e.y=e.y-Math.floor(e.y);break;case _i:e.y=e.y<0?0:1;break;case ho:Math.abs(Math.floor(e.y)%2)===1?e.y=Math.ceil(e.y)-e.y:e.y=e.y-Math.floor(e.y);break}return this.flipY&&(e.y=1-e.y),e}set needsUpdate(e){e===!0&&(this.version++,this.source.needsUpdate=!0)}set needsPMREMUpdate(e){e===!0&&this.pmremVersion++}};Ft.DEFAULT_IMAGE=null;Ft.DEFAULT_MAPPING=Xa;Ft.DEFAULT_ANISOTROPY=1;var xt=class n{static{n.prototype.isVector4=!0}constructor(e=0,t=0,i=0,r=1){this.x=e,this.y=t,this.z=i,this.w=r}get width(){return this.z}set width(e){this.z=e}get height(){return this.w}set height(e){this.w=e}set(e,t,i,r){return this.x=e,this.y=t,this.z=i,this.w=r,this}setScalar(e){return this.x=e,this.y=e,this.z=e,this.w=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setZ(e){return this.z=e,this}setW(e){return this.w=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;case 2:this.z=t;break;case 3:this.w=t;break;default:throw new Error("THREE.Vector4: index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;case 2:return this.z;case 3:return this.w;default:throw new Error("THREE.Vector4: index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y,this.z,this.w)}copy(e){return this.x=e.x,this.y=e.y,this.z=e.z,this.w=e.w!==void 0?e.w:1,this}add(e){return this.x+=e.x,this.y+=e.y,this.z+=e.z,this.w+=e.w,this}addScalar(e){return this.x+=e,this.y+=e,this.z+=e,this.w+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this.z=e.z+t.z,this.w=e.w+t.w,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this.z+=e.z*t,this.w+=e.w*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this.z-=e.z,this.w-=e.w,this}subScalar(e){return this.x-=e,this.y-=e,this.z-=e,this.w-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this.z=e.z-t.z,this.w=e.w-t.w,this}multiply(e){return this.x*=e.x,this.y*=e.y,this.z*=e.z,this.w*=e.w,this}multiplyScalar(e){return this.x*=e,this.y*=e,this.z*=e,this.w*=e,this}applyMatrix4(e){let t=this.x,i=this.y,r=this.z,o=this.w,s=e.elements;return this.x=s[0]*t+s[4]*i+s[8]*r+s[12]*o,this.y=s[1]*t+s[5]*i+s[9]*r+s[13]*o,this.z=s[2]*t+s[6]*i+s[10]*r+s[14]*o,this.w=s[3]*t+s[7]*i+s[11]*r+s[15]*o,this}divide(e){return this.x/=e.x,this.y/=e.y,this.z/=e.z,this.w/=e.w,this}divideScalar(e){return this.multiplyScalar(1/e)}setAxisAngleFromQuaternion(e){this.w=2*Math.acos(e.w);let t=Math.sqrt(1-e.w*e.w);return t<1e-4?(this.x=1,this.y=0,this.z=0):(this.x=e.x/t,this.y=e.y/t,this.z=e.z/t),this}setAxisAngleFromRotationMatrix(e){let t,i,r,o,c=e.elements,l=c[0],h=c[4],m=c[8],f=c[1],g=c[5],x=c[9],S=c[2],_=c[6],p=c[10];if(Math.abs(h-f)<.01&&Math.abs(m-S)<.01&&Math.abs(x-_)<.01){if(Math.abs(h+f)<.1&&Math.abs(m+S)<.1&&Math.abs(x+_)<.1&&Math.abs(l+g+p-3)<.1)return this.set(1,0,0,0),this;t=Math.PI;let P=(l+1)/2,y=(g+1)/2,E=(p+1)/2,b=(h+f)/4,R=(m+S)/4,d=(x+_)/4;return P>y&&P>E?P<.01?(i=0,r=.707106781,o=.707106781):(i=Math.sqrt(P),r=b/i,o=R/i):y>E?y<.01?(i=.707106781,r=0,o=.707106781):(r=Math.sqrt(y),i=b/r,o=d/r):E<.01?(i=.707106781,r=.707106781,o=0):(o=Math.sqrt(E),i=R/o,r=d/o),this.set(i,r,o,t),this}let A=Math.sqrt((_-x)*(_-x)+(m-S)*(m-S)+(f-h)*(f-h));return Math.abs(A)<.001&&(A=1),this.x=(_-x)/A,this.y=(m-S)/A,this.z=(f-h)/A,this.w=Math.acos((l+g+p-1)/2),this}setFromMatrixPosition(e){let t=e.elements;return this.x=t[12],this.y=t[13],this.z=t[14],this.w=t[15],this}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this.z=Math.min(this.z,e.z),this.w=Math.min(this.w,e.w),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this.z=Math.max(this.z,e.z),this.w=Math.max(this.w,e.w),this}clamp(e,t){return this.x=Qe(this.x,e.x,t.x),this.y=Qe(this.y,e.y,t.y),this.z=Qe(this.z,e.z,t.z),this.w=Qe(this.w,e.w,t.w),this}clampScalar(e,t){return this.x=Qe(this.x,e,t),this.y=Qe(this.y,e,t),this.z=Qe(this.z,e,t),this.w=Qe(this.w,e,t),this}clampLength(e,t){let i=this.length();return this.divideScalar(i||1).multiplyScalar(Qe(i,e,t))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this.w=Math.floor(this.w),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this.w=Math.ceil(this.w),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this.w=Math.round(this.w),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this.w=Math.trunc(this.w),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this.w=-this.w,this}dot(e){return this.x*e.x+this.y*e.y+this.z*e.z+this.w*e.w}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)+Math.abs(this.w)}normalize(){return this.divideScalar(this.length()||1)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this.z+=(e.z-this.z)*t,this.w+=(e.w-this.w)*t,this}lerpVectors(e,t,i){return this.x=e.x+(t.x-e.x)*i,this.y=e.y+(t.y-e.y)*i,this.z=e.z+(t.z-e.z)*i,this.w=e.w+(t.w-e.w)*i,this}equals(e){return e.x===this.x&&e.y===this.y&&e.z===this.z&&e.w===this.w}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this.z=e[t+2],this.w=e[t+3],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e[t+2]=this.z,e[t+3]=this.w,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this.z=e.getZ(t),this.w=e.getW(t),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this.w=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z,yield this.w}};var Us=class extends Qt{constructor(e=1,t=1,i={}){super(),i=Object.assign({generateMipmaps:!1,internalFormat:null,minFilter:Ut,depthBuffer:!0,stencilBuffer:!1,resolveColorBuffer:!0,resolveDepthBuffer:!0,resolveStencilBuffer:!0,storeMultisampledColorBuffer:!0,storeMultisampledDepthBuffer:!0,storeMultisampledStencilBuffer:!0,depthTexture:null,samples:0,count:1,depth:1,multiview:!1,useArrayDepthTexture:!1},i),this.isRenderTarget=!0,this.width=e,this.height=t,this.depth=i.depth,this.scissor=new xt(0,0,e,t),this.scissorTest=!1,this.viewport=new xt(0,0,e,t),this.textures=[];let r={width:e,height:t,depth:i.depth},o=new Ft(r),s=i.count;for(let a=0;a<s;a++)this.textures[a]=o.clone(),this.textures[a].isRenderTargetTexture=!0,this.textures[a].renderTarget=this;this._setTextureOptions(i),this.depthBuffer=i.depthBuffer,this.stencilBuffer=i.stencilBuffer,this.resolveColorBuffer=i.resolveColorBuffer,this.resolveDepthBuffer=i.resolveDepthBuffer,this.resolveStencilBuffer=i.resolveStencilBuffer,this.storeMultisampledColorBuffer=i.storeMultisampledColorBuffer,this.storeMultisampledDepthBuffer=i.storeMultisampledDepthBuffer,this.storeMultisampledStencilBuffer=i.storeMultisampledStencilBuffer,this._depthTexture=null,this.depthTexture=i.depthTexture,this.samples=i.samples,this.multiview=i.multiview,this.useArrayDepthTexture=i.useArrayDepthTexture}_setTextureOptions(e={}){let t={minFilter:Ut,generateMipmaps:!1,flipY:!1,internalFormat:null};e.mapping!==void 0&&(t.mapping=e.mapping),e.wrapS!==void 0&&(t.wrapS=e.wrapS),e.wrapT!==void 0&&(t.wrapT=e.wrapT),e.wrapR!==void 0&&(t.wrapR=e.wrapR),e.magFilter!==void 0&&(t.magFilter=e.magFilter),e.minFilter!==void 0&&(t.minFilter=e.minFilter),e.format!==void 0&&(t.format=e.format),e.type!==void 0&&(t.type=e.type),e.anisotropy!==void 0&&(t.anisotropy=e.anisotropy),e.colorSpace!==void 0&&(t.colorSpace=e.colorSpace),e.flipY!==void 0&&(t.flipY=e.flipY),e.generateMipmaps!==void 0&&(t.generateMipmaps=e.generateMipmaps),e.internalFormat!==void 0&&(t.internalFormat=e.internalFormat);for(let i=0;i<this.textures.length;i++)this.textures[i].setValues(t)}get texture(){return this.textures[0]}set texture(e){this.textures[0]=e}set depthTexture(e){this._depthTexture!==null&&this._depthTexture.renderTarget===this&&(this._depthTexture.renderTarget=null),e!==null&&e.renderTarget===null&&(e.renderTarget=this),this._depthTexture=e}get depthTexture(){return this._depthTexture}setSize(e,t,i=1){if(this.width!==e||this.height!==t||this.depth!==i){this.width=e,this.height=t,this.depth=i;for(let r=0,o=this.textures.length;r<o;r++)this.textures[r].image.width=e,this.textures[r].image.height=t,this.textures[r].image.depth=i,this.textures[r].isData3DTexture!==!0&&(this.textures[r].isArrayTexture=this.textures[r].image.depth>1);this.dispose()}this.viewport.set(0,0,e,t),this.scissor.set(0,0,e,t)}clone(){return new this.constructor().copy(this)}copy(e){this.width=e.width,this.height=e.height,this.depth=e.depth,this.scissor.copy(e.scissor),this.scissorTest=e.scissorTest,this.viewport.copy(e.viewport),this.textures.length=0;for(let t=0,i=e.textures.length;t<i;t++){this.textures[t]=e.textures[t].clone(),this.textures[t].isRenderTargetTexture=!0,this.textures[t].renderTarget=this;let r=Object.assign({},e.textures[t].image);this.textures[t].source=new Sn(r)}if(this.depthBuffer=e.depthBuffer,this.stencilBuffer=e.stencilBuffer,this.resolveColorBuffer=e.resolveColorBuffer,this.resolveDepthBuffer=e.resolveDepthBuffer,this.resolveStencilBuffer=e.resolveStencilBuffer,this.storeMultisampledColorBuffer=e.storeMultisampledColorBuffer,this.storeMultisampledDepthBuffer=e.storeMultisampledDepthBuffer,this.storeMultisampledStencilBuffer=e.storeMultisampledStencilBuffer,e.depthTexture!==null)if(e.depthTexture.renderTarget===e){let t=e.depthTexture.clone();t.renderTarget=null,this.depthTexture=t}else this.depthTexture=e.depthTexture;return this.samples=e.samples,this.multiview=e.multiview,this.useArrayDepthTexture=e.useArrayDepthTexture,this}dispose(){this.dispatchEvent({type:"dispose"})}};var Wt=class extends Us{constructor(e=1,t=1,i={}){super(e,t,i),this.isWebGLRenderTarget=!0}};var vr=class extends Ft{constructor(e=null,t=1,i=1,r=1){super(null),this.isDataArrayTexture=!0,this.image={data:e,width:t,height:i,depth:r},this.magFilter=Dt,this.minFilter=Dt,this.wrapR=_i,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1,this.layerUpdates=new Set}copy(e){return super.copy(e),this.wrapR=e.wrapR,this}addLayerUpdate(e){this.layerUpdates.add(e)}clearLayerUpdates(){this.layerUpdates.clear()}};var Fs=class extends Ft{constructor(e=null,t=1,i=1,r=1){super(null),this.isData3DTexture=!0,this.image={data:e,width:t,height:i,depth:r},this.magFilter=Dt,this.minFilter=Dt,this.wrapR=_i,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}copy(e){return super.copy(e),this.wrapR=e.wrapR,this}};var it=class n{static{n.prototype.isMatrix4=!0}constructor(e,t,i,r,o,s,a,c,l,h,m,f,g,x,S,_){this.elements=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],e!==void 0&&this.set(e,t,i,r,o,s,a,c,l,h,m,f,g,x,S,_)}set(e,t,i,r,o,s,a,c,l,h,m,f,g,x,S,_){let p=this.elements;return p[0]=e,p[4]=t,p[8]=i,p[12]=r,p[1]=o,p[5]=s,p[9]=a,p[13]=c,p[2]=l,p[6]=h,p[10]=m,p[14]=f,p[3]=g,p[7]=x,p[11]=S,p[15]=_,this}identity(){return this.set(1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1),this}clone(){return new n().fromArray(this.elements)}copy(e){let t=this.elements,i=e.elements;return t[0]=i[0],t[1]=i[1],t[2]=i[2],t[3]=i[3],t[4]=i[4],t[5]=i[5],t[6]=i[6],t[7]=i[7],t[8]=i[8],t[9]=i[9],t[10]=i[10],t[11]=i[11],t[12]=i[12],t[13]=i[13],t[14]=i[14],t[15]=i[15],this}copyPosition(e){let t=this.elements,i=e.elements;return t[12]=i[12],t[13]=i[13],t[14]=i[14],this}setFromMatrix3(e){let t=e.elements;return this.set(t[0],t[3],t[6],0,t[1],t[4],t[7],0,t[2],t[5],t[8],0,0,0,0,1),this}extractBasis(e,t,i){return this.determinantAffine()===0?(e.set(1,0,0),t.set(0,1,0),i.set(0,0,1),this):(e.setFromMatrixColumn(this,0),t.setFromMatrixColumn(this,1),i.setFromMatrixColumn(this,2),this)}makeBasis(e,t,i){return this.set(e.x,t.x,i.x,0,e.y,t.y,i.y,0,e.z,t.z,i.z,0,0,0,0,1),this}extractRotation(e){if(e.determinantAffine()===0)return this.identity();let t=this.elements,i=e.elements,r=1/yr.setFromMatrixColumn(e,0).length(),o=1/yr.setFromMatrixColumn(e,1).length(),s=1/yr.setFromMatrixColumn(e,2).length();return t[0]=i[0]*r,t[1]=i[1]*r,t[2]=i[2]*r,t[3]=0,t[4]=i[4]*o,t[5]=i[5]*o,t[6]=i[6]*o,t[7]=0,t[8]=i[8]*s,t[9]=i[9]*s,t[10]=i[10]*s,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,this}makeRotationFromEuler(e){let t=this.elements,i=e.x,r=e.y,o=e.z,s=Math.cos(i),a=Math.sin(i),c=Math.cos(r),l=Math.sin(r),h=Math.cos(o),m=Math.sin(o);if(e.order==="XYZ"){let f=s*h,g=s*m,x=a*h,S=a*m;t[0]=c*h,t[4]=-c*m,t[8]=l,t[1]=g+x*l,t[5]=f-S*l,t[9]=-a*c,t[2]=S-f*l,t[6]=x+g*l,t[10]=s*c}else if(e.order==="YXZ"){let f=c*h,g=c*m,x=l*h,S=l*m;t[0]=f+S*a,t[4]=x*a-g,t[8]=s*l,t[1]=s*m,t[5]=s*h,t[9]=-a,t[2]=g*a-x,t[6]=S+f*a,t[10]=s*c}else if(e.order==="ZXY"){let f=c*h,g=c*m,x=l*h,S=l*m;t[0]=f-S*a,t[4]=-s*m,t[8]=x+g*a,t[1]=g+x*a,t[5]=s*h,t[9]=S-f*a,t[2]=-s*l,t[6]=a,t[10]=s*c}else if(e.order==="ZYX"){let f=s*h,g=s*m,x=a*h,S=a*m;t[0]=c*h,t[4]=x*l-g,t[8]=f*l+S,t[1]=c*m,t[5]=S*l+f,t[9]=g*l-x,t[2]=-l,t[6]=a*c,t[10]=s*c}else if(e.order==="YZX"){let f=s*c,g=s*l,x=a*c,S=a*l;t[0]=c*h,t[4]=S-f*m,t[8]=x*m+g,t[1]=m,t[5]=s*h,t[9]=-a*h,t[2]=-l*h,t[6]=g*m+x,t[10]=f-S*m}else if(e.order==="XZY"){let f=s*c,g=s*l,x=a*c,S=a*l;t[0]=c*h,t[4]=-m,t[8]=l*h,t[1]=f*m+S,t[5]=s*h,t[9]=g*m-x,t[2]=x*m-g,t[6]=a*h,t[10]=S*m+f}return t[3]=0,t[7]=0,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,this}makeRotationFromQuaternion(e){return this.compose(Jp,e,$p)}lookAt(e,t,i){let r=this.elements;return yi.subVectors(e,t),yi.lengthSq()===0&&(yi.z=1),yi.normalize(),vn.crossVectors(i,yi),vn.lengthSq()===0&&(Math.abs(i.z)===1?yi.x+=1e-4:yi.z+=1e-4,yi.normalize(),vn.crossVectors(i,yi)),vn.normalize(),Os.crossVectors(yi,vn),r[0]=vn.x,r[4]=Os.x,r[8]=yi.x,r[1]=vn.y,r[5]=Os.y,r[9]=yi.y,r[2]=vn.z,r[6]=Os.z,r[10]=yi.z,this}multiply(e){return this.multiplyMatrices(this,e)}premultiply(e){return this.multiplyMatrices(e,this)}multiplyMatrices(e,t){let i=e.elements,r=t.elements,o=this.elements,s=i[0],a=i[4],c=i[8],l=i[12],h=i[1],m=i[5],f=i[9],g=i[13],x=i[2],S=i[6],_=i[10],p=i[14],A=i[3],P=i[7],y=i[11],E=i[15],b=r[0],R=r[4],d=r[8],T=r[12],L=r[1],F=r[5],B=r[9],X=r[13],U=r[2],K=r[6],ee=r[10],j=r[14],le=r[3],te=r[7],he=r[11],pe=r[15];return o[0]=s*b+a*L+c*U+l*le,o[4]=s*R+a*F+c*K+l*te,o[8]=s*d+a*B+c*ee+l*he,o[12]=s*T+a*X+c*j+l*pe,o[1]=h*b+m*L+f*U+g*le,o[5]=h*R+m*F+f*K+g*te,o[9]=h*d+m*B+f*ee+g*he,o[13]=h*T+m*X+f*j+g*pe,o[2]=x*b+S*L+_*U+p*le,o[6]=x*R+S*F+_*K+p*te,o[10]=x*d+S*B+_*ee+p*he,o[14]=x*T+S*X+_*j+p*pe,o[3]=A*b+P*L+y*U+E*le,o[7]=A*R+P*F+y*K+E*te,o[11]=A*d+P*B+y*ee+E*he,o[15]=A*T+P*X+y*j+E*pe,this}multiplyScalar(e){let t=this.elements;return t[0]*=e,t[4]*=e,t[8]*=e,t[12]*=e,t[1]*=e,t[5]*=e,t[9]*=e,t[13]*=e,t[2]*=e,t[6]*=e,t[10]*=e,t[14]*=e,t[3]*=e,t[7]*=e,t[11]*=e,t[15]*=e,this}determinant(){let e=this.elements,t=e[0],i=e[4],r=e[8],o=e[12],s=e[1],a=e[5],c=e[9],l=e[13],h=e[2],m=e[6],f=e[10],g=e[14],x=e[3],S=e[7],_=e[11],p=e[15],A=c*g-l*f,P=a*g-l*m,y=a*f-c*m,E=s*g-l*h,b=s*f-c*h,R=s*m-a*h;return t*(S*A-_*P+p*y)-i*(x*A-_*E+p*b)+r*(x*P-S*E+p*R)-o*(x*y-S*b+_*R)}determinantAffine(){let e=this.elements,t=e[0],i=e[4],r=e[8],o=e[1],s=e[5],a=e[9],c=e[2],l=e[6],h=e[10];return t*(s*h-a*l)-i*(o*h-a*c)+r*(o*l-s*c)}transpose(){let e=this.elements,t;return t=e[1],e[1]=e[4],e[4]=t,t=e[2],e[2]=e[8],e[8]=t,t=e[6],e[6]=e[9],e[9]=t,t=e[3],e[3]=e[12],e[12]=t,t=e[7],e[7]=e[13],e[13]=t,t=e[11],e[11]=e[14],e[14]=t,this}setPosition(e,t,i){let r=this.elements;return e.isVector3?(r[12]=e.x,r[13]=e.y,r[14]=e.z):(r[12]=e,r[13]=t,r[14]=i),this}invert(){let e=this.elements,t=e[0],i=e[1],r=e[2],o=e[3],s=e[4],a=e[5],c=e[6],l=e[7],h=e[8],m=e[9],f=e[10],g=e[11],x=e[12],S=e[13],_=e[14],p=e[15],A=t*a-i*s,P=t*c-r*s,y=t*l-o*s,E=i*c-r*a,b=i*l-o*a,R=r*l-o*c,d=h*S-m*x,T=h*_-f*x,L=h*p-g*x,F=m*_-f*S,B=m*p-g*S,X=f*p-g*_,U=A*X-P*B+y*F+E*L-b*T+R*d;if(U===0)return this.set(0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0);let K=1/U;return e[0]=(a*X-c*B+l*F)*K,e[1]=(r*B-i*X-o*F)*K,e[2]=(S*R-_*b+p*E)*K,e[3]=(f*b-m*R-g*E)*K,e[4]=(c*L-s*X-l*T)*K,e[5]=(t*X-r*L+o*T)*K,e[6]=(_*y-x*R-p*P)*K,e[7]=(h*R-f*y+g*P)*K,e[8]=(s*B-a*L+l*d)*K,e[9]=(i*L-t*B-o*d)*K,e[10]=(x*b-S*y+p*A)*K,e[11]=(m*y-h*b-g*A)*K,e[12]=(a*T-s*F-c*d)*K,e[13]=(t*F-i*T+r*d)*K,e[14]=(S*P-x*E-_*A)*K,e[15]=(h*E-m*P+f*A)*K,this}scale(e){let t=this.elements,i=e.x,r=e.y,o=e.z;return t[0]*=i,t[4]*=r,t[8]*=o,t[1]*=i,t[5]*=r,t[9]*=o,t[2]*=i,t[6]*=r,t[10]*=o,t[3]*=i,t[7]*=r,t[11]*=o,this}getMaxScaleOnAxis(){let e=this.elements,t=e[0]*e[0]+e[1]*e[1]+e[2]*e[2],i=e[4]*e[4]+e[5]*e[5]+e[6]*e[6],r=e[8]*e[8]+e[9]*e[9]+e[10]*e[10];return Math.sqrt(Math.max(t,i,r))}makeTranslation(e,t,i){return e.isVector3?this.set(1,0,0,e.x,0,1,0,e.y,0,0,1,e.z,0,0,0,1):this.set(1,0,0,e,0,1,0,t,0,0,1,i,0,0,0,1),this}makeRotationX(e){let t=Math.cos(e),i=Math.sin(e);return this.set(1,0,0,0,0,t,-i,0,0,i,t,0,0,0,0,1),this}makeRotationY(e){let t=Math.cos(e),i=Math.sin(e);return this.set(t,0,i,0,0,1,0,0,-i,0,t,0,0,0,0,1),this}makeRotationZ(e){let t=Math.cos(e),i=Math.sin(e);return this.set(t,-i,0,0,i,t,0,0,0,0,1,0,0,0,0,1),this}makeRotationAxis(e,t){let i=Math.cos(t),r=Math.sin(t),o=1-i,s=e.x,a=e.y,c=e.z,l=o*s,h=o*a;return this.set(l*s+i,l*a-r*c,l*c+r*a,0,l*a+r*c,h*a+i,h*c-r*s,0,l*c-r*a,h*c+r*s,o*c*c+i,0,0,0,0,1),this}makeScale(e,t,i){return this.set(e,0,0,0,0,t,0,0,0,0,i,0,0,0,0,1),this}makeShear(e,t,i,r,o,s){return this.set(1,i,o,0,e,1,s,0,t,r,1,0,0,0,0,1),this}compose(e,t,i){let r=this.elements,o=t._x,s=t._y,a=t._z,c=t._w,l=o+o,h=s+s,m=a+a,f=o*l,g=o*h,x=o*m,S=s*h,_=s*m,p=a*m,A=c*l,P=c*h,y=c*m,E=i.x,b=i.y,R=i.z;return r[0]=(1-(S+p))*E,r[1]=(g+y)*E,r[2]=(x-P)*E,r[3]=0,r[4]=(g-y)*b,r[5]=(1-(f+p))*b,r[6]=(_+A)*b,r[7]=0,r[8]=(x+P)*R,r[9]=(_-A)*R,r[10]=(1-(f+S))*R,r[11]=0,r[12]=e.x,r[13]=e.y,r[14]=e.z,r[15]=1,this}decompose(e,t,i){let r=this.elements;e.x=r[12],e.y=r[13],e.z=r[14];let o=this.determinantAffine();if(o===0)return i.set(1,1,1),t.identity(),this;let s=yr.set(r[0],r[1],r[2]).length(),a=yr.set(r[4],r[5],r[6]).length(),c=yr.set(r[8],r[9],r[10]).length();o<0&&(s=-s),Bi.copy(this);let l=1/s,h=1/a,m=1/c;return Bi.elements[0]*=l,Bi.elements[1]*=l,Bi.elements[2]*=l,Bi.elements[4]*=h,Bi.elements[5]*=h,Bi.elements[6]*=h,Bi.elements[8]*=m,Bi.elements[9]*=m,Bi.elements[10]*=m,t.setFromRotationMatrix(Bi),i.x=s,i.y=a,i.z=c,this}makePerspective(e,t,i,r,o,s,a=mi,c=!1){let l=this.elements,h=2*o/(t-e),m=2*o/(i-r),f=(t+e)/(t-e),g=(i+r)/(i-r),x,S;if(c)x=o/(s-o),S=s*o/(s-o);else if(a===mi)x=-(s+o)/(s-o),S=-2*s*o/(s-o);else if(a===en)x=-s/(s-o),S=-s*o/(s-o);else throw new Error("THREE.Matrix4.makePerspective(): Invalid coordinate system: "+a);return l[0]=h,l[4]=0,l[8]=f,l[12]=0,l[1]=0,l[5]=m,l[9]=g,l[13]=0,l[2]=0,l[6]=0,l[10]=x,l[14]=S,l[3]=0,l[7]=0,l[11]=-1,l[15]=0,this}makeOrthographic(e,t,i,r,o,s,a=mi,c=!1){let l=this.elements,h=2/(t-e),m=2/(i-r),f=-(t+e)/(t-e),g=-(i+r)/(i-r),x,S;if(c)x=1/(s-o),S=s/(s-o);else if(a===mi)x=-2/(s-o),S=-(s+o)/(s-o);else if(a===en)x=-1/(s-o),S=-o/(s-o);else throw new Error("THREE.Matrix4.makeOrthographic(): Invalid coordinate system: "+a);return l[0]=h,l[4]=0,l[8]=0,l[12]=f,l[1]=0,l[5]=m,l[9]=0,l[13]=g,l[2]=0,l[6]=0,l[10]=x,l[14]=S,l[3]=0,l[7]=0,l[11]=0,l[15]=1,this}equals(e){let t=this.elements,i=e.elements;for(let r=0;r<16;r++)if(t[r]!==i[r])return!1;return!0}fromArray(e,t=0){for(let i=0;i<16;i++)this.elements[i]=e[i+t];return this}toArray(e=[],t=0){let i=this.elements;return e[t]=i[0],e[t+1]=i[1],e[t+2]=i[2],e[t+3]=i[3],e[t+4]=i[4],e[t+5]=i[5],e[t+6]=i[6],e[t+7]=i[7],e[t+8]=i[8],e[t+9]=i[9],e[t+10]=i[10],e[t+11]=i[11],e[t+12]=i[12],e[t+13]=i[13],e[t+14]=i[14],e[t+15]=i[15],e}},yr=new D,Bi=new it,Jp=new D(0,0,0),$p=new D(1,1,1),vn=new D,Os=new D,yi=new D;var Nc=new it,Uc=new li,Ci=class n{constructor(e=0,t=0,i=0,r=n.DEFAULT_ORDER){this.isEuler=!0,this._x=e,this._y=t,this._z=i,this._order=r}get x(){return this._x}set x(e){this._x=e,this._onChangeCallback()}get y(){return this._y}set y(e){this._y=e,this._onChangeCallback()}get z(){return this._z}set z(e){this._z=e,this._onChangeCallback()}get order(){return this._order}set order(e){this._order=e,this._onChangeCallback()}set(e,t,i,r=this._order){return this._x=e,this._y=t,this._z=i,this._order=r,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._order)}copy(e){return this._x=e._x,this._y=e._y,this._z=e._z,this._order=e._order,this._onChangeCallback(),this}setFromRotationMatrix(e,t=this._order,i=!0){let r=e.elements,o=r[0],s=r[4],a=r[8],c=r[1],l=r[5],h=r[9],m=r[2],f=r[6],g=r[10];switch(t){case"XYZ":this._y=Math.asin(Qe(a,-1,1)),Math.abs(a)<.9999999?(this._x=Math.atan2(-h,g),this._z=Math.atan2(-s,o)):(this._x=Math.atan2(f,l),this._z=0);break;case"YXZ":this._x=Math.asin(-Qe(h,-1,1)),Math.abs(h)<.9999999?(this._y=Math.atan2(a,g),this._z=Math.atan2(c,l)):(this._y=Math.atan2(-m,o),this._z=0);break;case"ZXY":this._x=Math.asin(Qe(f,-1,1)),Math.abs(f)<.9999999?(this._y=Math.atan2(-m,g),this._z=Math.atan2(-s,l)):(this._y=0,this._z=Math.atan2(c,o));break;case"ZYX":this._y=Math.asin(-Qe(m,-1,1)),Math.abs(m)<.9999999?(this._x=Math.atan2(f,g),this._z=Math.atan2(c,o)):(this._x=0,this._z=Math.atan2(-s,l));break;case"YZX":this._z=Math.asin(Qe(c,-1,1)),Math.abs(c)<.9999999?(this._x=Math.atan2(-h,l),this._y=Math.atan2(-m,o)):(this._x=0,this._y=Math.atan2(a,g));break;case"XZY":this._z=Math.asin(-Qe(s,-1,1)),Math.abs(s)<.9999999?(this._x=Math.atan2(f,l),this._y=Math.atan2(a,o)):(this._x=Math.atan2(-h,g),this._y=0);break;default:Ue("Euler: .setFromRotationMatrix() encountered an unknown order: "+t)}return this._order=t,i===!0&&this._onChangeCallback(),this}setFromQuaternion(e,t,i){return Nc.makeRotationFromQuaternion(e),this.setFromRotationMatrix(Nc,t,i)}setFromVector3(e,t=this._order){return this.set(e.x,e.y,e.z,t)}reorder(e){return Uc.setFromEuler(this),this.setFromQuaternion(Uc,e)}equals(e){return e._x===this._x&&e._y===this._y&&e._z===this._z&&e._order===this._order}fromArray(e){return this._x=e[0],this._y=e[1],this._z=e[2],e[3]!==void 0&&(this._order=e[3]),this._onChangeCallback(),this}toArray(e=[],t=0){return e[t]=this._x,e[t+1]=this._y,e[t+2]=this._z,e[t+3]=this._order,e}_onChange(e){return this._onChangeCallback=e,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._order}};Ci.DEFAULT_ORDER="XYZ";var yn=class{constructor(){this.mask=1}set(e){this.mask=(1<<e|0)>>>0}enable(e){this.mask|=1<<e|0}enableAll(){this.mask=-1}toggle(e){this.mask^=1<<e|0}disable(e){this.mask&=~(1<<e|0)}disableAll(){this.mask=0}test(e){return(this.mask&e.mask)!==0}isEnabled(e){return(this.mask&(1<<e|0))!==0}};var Qp=0,Fc=new D,br=new li,tn=new it,Bs=new D,qo=new D,jp=new D,em=new li,Oc=new D(1,0,0),Bc=new D(0,1,0),Gc=new D(0,0,1),zc={type:"added"},tm={type:"removed"},Er={type:"childadded",child:null},ja={type:"childremoved",child:null},St=class n extends Qt{constructor(){super(),this.isObject3D=!0,Object.defineProperty(this,"id",{value:Qp++}),this.uuid=Fi(),this.name="",this.type="Object3D",this.parent=null,this.children=[],this.up=n.DEFAULT_UP.clone();let e=new D,t=new Ci,i=new li,r=new D(1,1,1);function o(){i.setFromEuler(t,!1)}function s(){t.setFromQuaternion(i,void 0,!1)}t._onChange(o),i._onChange(s),Object.defineProperties(this,{position:{configurable:!0,enumerable:!0,value:e},rotation:{configurable:!0,enumerable:!0,value:t},quaternion:{configurable:!0,enumerable:!0,value:i},scale:{configurable:!0,enumerable:!0,value:r},modelViewMatrix:{value:new it},normalMatrix:{value:new qe}}),this.matrix=new it,this.matrixWorld=new it,this.matrixAutoUpdate=n.DEFAULT_MATRIX_AUTO_UPDATE,this.matrixWorldAutoUpdate=n.DEFAULT_MATRIX_WORLD_AUTO_UPDATE,this.matrixWorldNeedsUpdate=!1,this.layers=new yn,this.visible=!0,this.castShadow=!1,this.receiveShadow=!1,this.frustumCulled=!0,this.renderOrder=0,this.animations=[],this.customDepthMaterial=void 0,this.customDistanceMaterial=void 0,this.static=!1,this.userData={},this.pivot=null}onBeforeShadow(){}onAfterShadow(){}onBeforeRender(){}onAfterRender(){}applyMatrix4(e){this.matrixAutoUpdate&&this.updateMatrix(),this.matrix.premultiply(e),this.matrix.decompose(this.position,this.quaternion,this.scale)}applyQuaternion(e){return this.quaternion.premultiply(e),this}setRotationFromAxisAngle(e,t){this.quaternion.setFromAxisAngle(e,t)}setRotationFromEuler(e){this.quaternion.setFromEuler(e,!0)}setRotationFromMatrix(e){this.quaternion.setFromRotationMatrix(e)}setRotationFromQuaternion(e){this.quaternion.copy(e)}rotateOnAxis(e,t){return br.setFromAxisAngle(e,t),this.quaternion.multiply(br),this}rotateOnWorldAxis(e,t){return br.setFromAxisAngle(e,t),this.quaternion.premultiply(br),this}rotateX(e){return this.rotateOnAxis(Oc,e)}rotateY(e){return this.rotateOnAxis(Bc,e)}rotateZ(e){return this.rotateOnAxis(Gc,e)}translateOnAxis(e,t){return Fc.copy(e).applyQuaternion(this.quaternion),this.position.add(Fc.multiplyScalar(t)),this}translateX(e){return this.translateOnAxis(Oc,e)}translateY(e){return this.translateOnAxis(Bc,e)}translateZ(e){return this.translateOnAxis(Gc,e)}localToWorld(e){return this.updateWorldMatrix(!0,!1),e.applyMatrix4(this.matrixWorld)}worldToLocal(e){return this.updateWorldMatrix(!0,!1),e.applyMatrix4(tn.copy(this.matrixWorld).invert())}lookAt(e,t,i){e.isVector3?Bs.copy(e):Bs.set(e,t,i);let r=this.parent;this.updateWorldMatrix(!0,!1),qo.setFromMatrixPosition(this.matrixWorld),this.isCamera||this.isLight?tn.lookAt(qo,Bs,this.up):tn.lookAt(Bs,qo,this.up),this.quaternion.setFromRotationMatrix(tn),r&&(tn.extractRotation(r.matrixWorld),br.setFromRotationMatrix(tn),this.quaternion.premultiply(br.invert()))}add(e){if(arguments.length>1){for(let t=0;t<arguments.length;t++)this.add(arguments[t]);return this}return e===this?(nt("Object3D.add: object can't be added as a child of itself.",e),this):(e&&e.isObject3D?(e.removeFromParent(),e.parent=this,this.children.push(e),e.dispatchEvent(zc),Er.child=e,this.dispatchEvent(Er),Er.child=null):nt("Object3D.add: object not an instance of THREE.Object3D.",e),this)}remove(e){if(arguments.length>1){for(let i=0;i<arguments.length;i++)this.remove(arguments[i]);return this}let t=this.children.indexOf(e);return t!==-1&&(e.parent=null,this.children.splice(t,1),e.dispatchEvent(tm),ja.child=e,this.dispatchEvent(ja),ja.child=null),this}removeFromParent(){let e=this.parent;return e!==null&&e.remove(this),this}clear(){return this.remove(...this.children)}attach(e){return this.updateWorldMatrix(!0,!1),tn.copy(this.matrixWorld).invert(),e.parent!==null&&(e.parent.updateWorldMatrix(!0,!1),tn.multiply(e.parent.matrixWorld)),e.applyMatrix4(tn),e.removeFromParent(),e.parent=this,this.children.push(e),e.updateWorldMatrix(!1,!0),e.dispatchEvent(zc),Er.child=e,this.dispatchEvent(Er),Er.child=null,this}getObjectById(e){return this.getObjectByProperty("id",e)}getObjectByName(e){return this.getObjectByProperty("name",e)}getObjectByProperty(e,t){if(this[e]===t)return this;for(let i=0,r=this.children.length;i<r;i++){let s=this.children[i].getObjectByProperty(e,t);if(s!==void 0)return s}}getObjectsByProperty(e,t,i=[]){this[e]===t&&i.push(this);let r=this.children;for(let o=0,s=r.length;o<s;o++)r[o].getObjectsByProperty(e,t,i);return i}getWorldPosition(e){return this.updateWorldMatrix(!0,!1),e.setFromMatrixPosition(this.matrixWorld)}getWorldQuaternion(e){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(qo,e,jp),e}getWorldScale(e){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(qo,em,e),e}getWorldDirection(e){this.updateWorldMatrix(!0,!1);let t=this.matrixWorld.elements;return e.set(t[8],t[9],t[10]).normalize()}raycast(){}intersectsFrustum(){}traverse(e){e(this);let t=this.children;for(let i=0,r=t.length;i<r;i++)t[i].traverse(e)}traverseVisible(e){if(this.visible===!1)return;e(this);let t=this.children;for(let i=0,r=t.length;i<r;i++)t[i].traverseVisible(e)}traverseAncestors(e){let t=this.parent;t!==null&&(e(t),t.traverseAncestors(e))}updateMatrix(){this.matrix.compose(this.position,this.quaternion,this.scale);let e=this.pivot;if(e!==null){let t=e.x,i=e.y,r=e.z,o=this.matrix.elements;o[12]+=t-o[0]*t-o[4]*i-o[8]*r,o[13]+=i-o[1]*t-o[5]*i-o[9]*r,o[14]+=r-o[2]*t-o[6]*i-o[10]*r}this.matrixWorldNeedsUpdate=!0}updateMatrixWorld(e){this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||e)&&(this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),this.matrixWorldNeedsUpdate=!1,e=!0);let t=this.children;for(let i=0,r=t.length;i<r;i++)t[i].updateMatrixWorld(e)}updateWorldMatrix(e,t,i=!1){let r=this.parent;if(e===!0&&r!==null&&r.updateWorldMatrix(!0,!1),this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||i)&&(this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),this.matrixWorldNeedsUpdate=!1,i=!0),t===!0){let o=this.children;for(let s=0,a=o.length;s<a;s++)o[s].updateWorldMatrix(!1,!0,i)}}toJSON(e){let t=e===void 0||typeof e=="string",i={};t&&(e={geometries:{},materials:{},textures:{},images:{},shapes:{},skeletons:{},animations:{},nodes:{}},i.metadata={version:4.7,type:"Object",generator:"Object3D.toJSON"});let r={};r.uuid=this.uuid,r.type=this.type,r.name=this.name,r.castShadow=this.castShadow,r.receiveShadow=this.receiveShadow,r.visible=this.visible,r.frustumCulled=this.frustumCulled,r.renderOrder=this.renderOrder,r.static=this.static,r.matrixAutoUpdate=this.matrixAutoUpdate,Object.keys(this.userData).length>0&&(r.userData=this.userData),r.layers=this.layers.mask,r.matrix=this.matrix.toArray(),r.up=this.up.toArray(),this.pivot!==null&&(r.pivot=this.pivot.toArray()),this.morphTargetDictionary!==void 0&&(r.morphTargetDictionary=Object.assign({},this.morphTargetDictionary)),this.morphTargetInfluences!==void 0&&(r.morphTargetInfluences=this.morphTargetInfluences.slice()),this.isInstancedMesh&&(r.type="InstancedMesh",r.count=this.count,r.instanceMatrix=this.instanceMatrix.toJSON(),this.instanceColor!==null&&(r.instanceColor=this.instanceColor.toJSON())),this.isBatchedMesh&&(r.type="BatchedMesh",r.perObjectFrustumCulled=this.perObjectFrustumCulled,r.sortObjects=this.sortObjects,r.drawRanges=this._drawRanges,r.reservedRanges=this._reservedRanges,r.geometryInfo=this._geometryInfo.map(a=>({...a,boundingBox:a.boundingBox?a.boundingBox.toJSON():void 0,boundingSphere:a.boundingSphere?a.boundingSphere.toJSON():void 0})),r.instanceInfo=this._instanceInfo.map(a=>({...a})),r.availableInstanceIds=this._availableInstanceIds.slice(),r.availableGeometryIds=this._availableGeometryIds.slice(),r.nextIndexStart=this._nextIndexStart,r.nextVertexStart=this._nextVertexStart,r.geometryCount=this._geometryCount,r.maxInstanceCount=this._maxInstanceCount,r.maxVertexCount=this._maxVertexCount,r.maxIndexCount=this._maxIndexCount,r.geometryInitialized=this._geometryInitialized,r.matricesTexture=this._matricesTexture.toJSON(e),r.indirectTexture=this._indirectTexture.toJSON(e),this._colorsTexture!==null&&(r.colorsTexture=this._colorsTexture.toJSON(e)),this.boundingSphere!==null&&(r.boundingSphere=this.boundingSphere.toJSON()),this.boundingBox!==null&&(r.boundingBox=this.boundingBox.toJSON()));function o(a,c){return a[c.uuid]===void 0&&(a[c.uuid]=c.toJSON(e)),c.uuid}if(this.isScene)this.background&&(this.background.isColor?r.background=this.background.toJSON():this.background.isTexture&&(r.background=this.background.toJSON(e).uuid)),this.environment&&this.environment.isTexture&&this.environment.isRenderTargetTexture!==!0&&(r.environment=this.environment.toJSON(e).uuid);else if(this.isMesh||this.isLine||this.isPoints){r.geometry=o(e.geometries,this.geometry);let a=this.geometry.parameters;if(a!==void 0&&a.shapes!==void 0){let c=a.shapes;if(Array.isArray(c))for(let l=0,h=c.length;l<h;l++){let m=c[l];o(e.shapes,m)}else o(e.shapes,c)}}if(this.isSkinnedMesh&&(r.bindMode=this.bindMode,r.bindMatrix=this.bindMatrix.toArray(),this.skeleton!==void 0&&(o(e.skeletons,this.skeleton),r.skeleton=this.skeleton.uuid)),this.material!==void 0)if(Array.isArray(this.material)){let a=[];for(let c=0,l=this.material.length;c<l;c++)a.push(o(e.materials,this.material[c]));r.material=a}else r.material=o(e.materials,this.material);if(this.children.length>0){r.children=[];for(let a=0;a<this.children.length;a++)r.children.push(this.children[a].toJSON(e).object)}if(this.animations.length>0){r.animations=[];for(let a=0;a<this.animations.length;a++){let c=this.animations[a];r.animations.push(o(e.animations,c))}}if(t){let a=s(e.geometries),c=s(e.materials),l=s(e.textures),h=s(e.images),m=s(e.shapes),f=s(e.skeletons),g=s(e.animations),x=s(e.nodes);a.length>0&&(i.geometries=a),c.length>0&&(i.materials=c),l.length>0&&(i.textures=l),h.length>0&&(i.images=h),m.length>0&&(i.shapes=m),f.length>0&&(i.skeletons=f),g.length>0&&(i.animations=g),x.length>0&&(i.nodes=x)}return i.object=r,i;function s(a){let c=[];for(let l in a){let h=a[l];delete h.metadata,c.push(h)}return c}}clone(e){return new this.constructor().copy(this,e)}copy(e,t=!0){if(this.name=e.name,this.up.copy(e.up),this.position.copy(e.position),this.rotation.order=e.rotation.order,this.quaternion.copy(e.quaternion),this.scale.copy(e.scale),this.pivot=e.pivot!==null?e.pivot.clone():null,this.matrix.copy(e.matrix),this.matrixWorld.copy(e.matrixWorld),this.matrixAutoUpdate=e.matrixAutoUpdate,this.matrixWorldAutoUpdate=e.matrixWorldAutoUpdate,this.matrixWorldNeedsUpdate=e.matrixWorldNeedsUpdate,this.layers.mask=e.layers.mask,this.visible=e.visible,this.castShadow=e.castShadow,this.receiveShadow=e.receiveShadow,this.frustumCulled=e.frustumCulled,this.renderOrder=e.renderOrder,this.static=e.static,this.animations=e.animations.slice(),this.userData=JSON.parse(JSON.stringify(e.userData)),t===!0)for(let i=0;i<e.children.length;i++){let r=e.children[i];this.add(r.clone())}return this}dispose(){this.dispatchEvent({type:"dispose"})}};St.DEFAULT_UP=new D(0,1,0);St.DEFAULT_MATRIX_AUTO_UPDATE=!0;St.DEFAULT_MATRIX_WORLD_AUTO_UPDATE=!0;var Gt=class extends St{constructor(){super(),this.isGroup=!0,this.type="Group"}};var im={type:"move"},Tr=class{constructor(){this._targetRay=null,this._grip=null,this._hand=null}getHandSpace(){return this._hand===null&&(this._hand=new Gt,this._hand.matrixAutoUpdate=!1,this._hand.visible=!1,this._hand.joints={},this._hand.inputState={pinching:!1}),this._hand}getTargetRaySpace(){return this._targetRay===null&&(this._targetRay=new Gt,this._targetRay.matrixAutoUpdate=!1,this._targetRay.visible=!1,this._targetRay.hasLinearVelocity=!1,this._targetRay.linearVelocity=new D,this._targetRay.hasAngularVelocity=!1,this._targetRay.angularVelocity=new D),this._targetRay}getGripSpace(){return this._grip===null&&(this._grip=new Gt,this._grip.matrixAutoUpdate=!1,this._grip.visible=!1,this._grip.hasLinearVelocity=!1,this._grip.linearVelocity=new D,this._grip.hasAngularVelocity=!1,this._grip.angularVelocity=new D,this._grip.eventsEnabled=!1),this._grip}dispatchEvent(e){return this._targetRay!==null&&this._targetRay.dispatchEvent(e),this._grip!==null&&this._grip.dispatchEvent(e),this._hand!==null&&this._hand.dispatchEvent(e),this}connect(e){if(e&&e.hand){let t=this._hand;if(t)for(let i of e.hand.values())this._getHandJoint(t,i)}return this.dispatchEvent({type:"connected",data:e}),this}disconnect(e){return this.dispatchEvent({type:"disconnected",data:e}),this._targetRay!==null&&(this._targetRay.visible=!1),this._grip!==null&&(this._grip.visible=!1),this._hand!==null&&(this._hand.visible=!1),this}update(e,t,i){let r=null,o=null,s=null,a=this._targetRay,c=this._grip,l=this._hand;if(e&&t.session.visibilityState!=="visible-blurred"){if(l&&e.hand){s=!0;for(let S of e.hand.values()){let _=t.getJointPose(S,i),p=this._getHandJoint(l,S);_!==null&&(p.matrix.fromArray(_.transform.matrix),p.matrix.decompose(p.position,p.rotation,p.scale),p.matrixWorldNeedsUpdate=!0,p.jointRadius=_.radius),p.visible=_!==null}let h=l.joints["index-finger-tip"],m=l.joints["thumb-tip"],f=h.position.distanceTo(m.position),g=.02,x=.005;l.inputState.pinching&&f>g+x?(l.inputState.pinching=!1,this.dispatchEvent({type:"pinchend",handedness:e.handedness,target:this})):!l.inputState.pinching&&f<=g-x&&(l.inputState.pinching=!0,this.dispatchEvent({type:"pinchstart",handedness:e.handedness,target:this}))}else c!==null&&e.gripSpace&&(o=t.getPose(e.gripSpace,i),o!==null&&(c.matrix.fromArray(o.transform.matrix),c.matrix.decompose(c.position,c.rotation,c.scale),c.matrixWorldNeedsUpdate=!0,o.linearVelocity?(c.hasLinearVelocity=!0,c.linearVelocity.copy(o.linearVelocity)):c.hasLinearVelocity=!1,o.angularVelocity?(c.hasAngularVelocity=!0,c.angularVelocity.copy(o.angularVelocity)):c.hasAngularVelocity=!1,c.eventsEnabled&&c.dispatchEvent({type:"gripUpdated",data:e,target:this})));a!==null&&(r=t.getPose(e.targetRaySpace,i),r===null&&o!==null&&(r=o),r!==null&&(a.matrix.fromArray(r.transform.matrix),a.matrix.decompose(a.position,a.rotation,a.scale),a.matrixWorldNeedsUpdate=!0,r.linearVelocity?(a.hasLinearVelocity=!0,a.linearVelocity.copy(r.linearVelocity)):a.hasLinearVelocity=!1,r.angularVelocity?(a.hasAngularVelocity=!0,a.angularVelocity.copy(r.angularVelocity)):a.hasAngularVelocity=!1,this.dispatchEvent(im)))}return a!==null&&(a.visible=r!==null),c!==null&&(c.visible=o!==null),l!==null&&(l.visible=s!==null),this}_getHandJoint(e,t){if(e.joints[t.jointName]===void 0){let i=new Gt;i.matrixAutoUpdate=!1,i.visible=!1,e.joints[t.jointName]=i,e.add(i)}return e.joints[t.jointName]}};var kc={aliceblue:15792383,antiquewhite:16444375,aqua:65535,aquamarine:8388564,azure:15794175,beige:16119260,bisque:16770244,black:0,blanchedalmond:16772045,blue:255,blueviolet:9055202,brown:10824234,burlywood:14596231,cadetblue:6266528,chartreuse:8388352,chocolate:13789470,coral:16744272,cornflowerblue:6591981,cornsilk:16775388,crimson:14423100,cyan:65535,darkblue:139,darkcyan:35723,darkgoldenrod:12092939,darkgray:11119017,darkgreen:25600,darkgrey:11119017,darkkhaki:12433259,darkmagenta:9109643,darkolivegreen:5597999,darkorange:16747520,darkorchid:10040012,darkred:9109504,darksalmon:15308410,darkseagreen:9419919,darkslateblue:4734347,darkslategray:3100495,darkslategrey:3100495,darkturquoise:52945,darkviolet:9699539,deeppink:16716947,deepskyblue:49151,dimgray:6908265,dimgrey:6908265,dodgerblue:2003199,firebrick:11674146,floralwhite:16775920,forestgreen:2263842,fuchsia:16711935,gainsboro:14474460,ghostwhite:16316671,gold:16766720,goldenrod:14329120,gray:8421504,green:32768,greenyellow:11403055,grey:8421504,honeydew:15794160,hotpink:16738740,indianred:13458524,indigo:4915330,ivory:16777200,khaki:15787660,lavender:15132410,lavenderblush:16773365,lawngreen:8190976,lemonchiffon:16775885,lightblue:11393254,lightcoral:15761536,lightcyan:14745599,lightgoldenrodyellow:16448210,lightgray:13882323,lightgreen:9498256,lightgrey:13882323,lightpink:16758465,lightsalmon:16752762,lightseagreen:2142890,lightskyblue:8900346,lightslategray:7833753,lightslategrey:7833753,lightsteelblue:11584734,lightyellow:16777184,lime:65280,limegreen:3329330,linen:16445670,magenta:16711935,maroon:8388608,mediumaquamarine:6737322,mediumblue:205,mediumorchid:12211667,mediumpurple:9662683,mediumseagreen:3978097,mediumslateblue:8087790,mediumspringgreen:64154,mediumturquoise:4772300,mediumvioletred:13047173,midnightblue:1644912,mintcream:16121850,mistyrose:16770273,moccasin:16770229,navajowhite:16768685,navy:128,oldlace:16643558,olive:8421376,olivedrab:7048739,orange:16753920,orangered:16729344,orchid:14315734,palegoldenrod:15657130,palegreen:10025880,paleturquoise:11529966,palevioletred:14381203,papayawhip:16773077,peachpuff:16767673,peru:13468991,pink:16761035,plum:14524637,powderblue:11591910,purple:8388736,rebeccapurple:6697881,red:16711680,rosybrown:12357519,royalblue:4286945,saddlebrown:9127187,salmon:16416882,sandybrown:16032864,seagreen:3050327,seashell:16774638,sienna:10506797,silver:12632256,skyblue:8900331,slateblue:6970061,slategray:7372944,slategrey:7372944,snow:16775930,springgreen:65407,steelblue:4620980,tan:13808780,teal:32896,thistle:14204888,tomato:16737095,turquoise:4251856,violet:15631086,wheat:16113331,white:16777215,whitesmoke:16119285,yellow:16776960,yellowgreen:10145074},bn={h:0,s:0,l:0},Gs={h:0,s:0,l:0};function el(n,e,t){return t<0&&(t+=1),t>1&&(t-=1),t<1/6?n+(e-n)*6*t:t<1/2?e:t<2/3?n+(e-n)*6*(2/3-t):n}var Le=class{constructor(e,t,i){return this.isColor=!0,this.r=1,this.g=1,this.b=1,this.set(e,t,i)}set(e,t,i){if(t===void 0&&i===void 0){let r=e;r&&r.isColor?this.copy(r):typeof r=="number"?this.setHex(r):typeof r=="string"&&this.setStyle(r)}else this.setRGB(e,t,i);return this}setScalar(e){return this.r=e,this.g=e,this.b=e,this}setHex(e,t=Vt){return e=Math.floor(e),this.r=(e>>16&255)/255,this.g=(e>>8&255)/255,this.b=(e&255)/255,tt.colorSpaceToWorking(this,t),this}setRGB(e,t,i,r=tt.workingColorSpace){return this.r=e,this.g=t,this.b=i,tt.colorSpaceToWorking(this,r),this}setHSL(e,t,i,r=tt.workingColorSpace){if(e=Is(e,1),t=Qe(t,0,1),i=Qe(i,0,1),t===0)this.r=this.g=this.b=i;else{let o=i<=.5?i*(1+t):i+t-i*t,s=2*i-o;this.r=el(s,o,e+1/3),this.g=el(s,o,e),this.b=el(s,o,e-1/3)}return tt.colorSpaceToWorking(this,r),this}setStyle(e,t=Vt){function i(o){o!==void 0&&parseFloat(o)<1&&Ue("Color: Alpha component of "+e+" will be ignored.")}let r;if(r=/^(\w+)\(([^\)]*)\)/.exec(e)){let o,s=r[1],a=r[2];switch(s){case"rgb":case"rgba":if(o=/^\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(a))return i(o[4]),this.setRGB(Math.min(255,parseInt(o[1],10))/255,Math.min(255,parseInt(o[2],10))/255,Math.min(255,parseInt(o[3],10))/255,t);if(o=/^\s*(\d+)\%\s*,\s*(\d+)\%\s*,\s*(\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(a))return i(o[4]),this.setRGB(Math.min(100,parseInt(o[1],10))/100,Math.min(100,parseInt(o[2],10))/100,Math.min(100,parseInt(o[3],10))/100,t);break;case"hsl":case"hsla":if(o=/^\s*(\d*\.?\d+)\s*,\s*(\d*\.?\d+)\%\s*,\s*(\d*\.?\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(a))return i(o[4]),this.setHSL(parseFloat(o[1])/360,parseFloat(o[2])/100,parseFloat(o[3])/100,t);break;default:Ue("Color: Unknown color model "+e)}}else if(r=/^\#([A-Fa-f\d]+)$/.exec(e)){let o=r[1],s=o.length;if(s===3)return this.setRGB(parseInt(o.charAt(0),16)/15,parseInt(o.charAt(1),16)/15,parseInt(o.charAt(2),16)/15,t);if(s===6)return this.setHex(parseInt(o,16),t);Ue("Color: Invalid hex color "+e)}else if(e&&e.length>0)return this.setColorName(e,t);return this}setColorName(e,t=Vt){let i=kc[e.toLowerCase()];return i!==void 0?this.setHex(i,t):Ue("Color: Unknown color "+e),this}clone(){return new this.constructor(this.r,this.g,this.b)}copy(e){return this.r=e.r,this.g=e.g,this.b=e.b,this}copySRGBToLinear(e){return this.r=Oi(e.r),this.g=Oi(e.g),this.b=Oi(e.b),this}copyLinearToSRGB(e){return this.r=qn(e.r),this.g=qn(e.g),this.b=qn(e.b),this}convertSRGBToLinear(){return this.copySRGBToLinear(this),this}convertLinearToSRGB(){return this.copyLinearToSRGB(this),this}getHex(e=Vt){return tt.workingToColorSpace(ci.copy(this),e),Math.round(Qe(ci.r*255,0,255))*65536+Math.round(Qe(ci.g*255,0,255))*256+Math.round(Qe(ci.b*255,0,255))}getHexString(e=Vt){return("000000"+this.getHex(e).toString(16)).slice(-6)}getHSL(e,t=tt.workingColorSpace){tt.workingToColorSpace(ci.copy(this),t);let i=ci.r,r=ci.g,o=ci.b,s=Math.max(i,r,o),a=Math.min(i,r,o),c,l,h=(a+s)/2;if(a===s)c=0,l=0;else{let m=s-a;switch(l=h<=.5?m/(s+a):m/(2-s-a),s){case i:c=(r-o)/m+(r<o?6:0);break;case r:c=(o-i)/m+2;break;case o:c=(i-r)/m+4;break}c/=6}return e.h=c,e.s=l,e.l=h,e}getRGB(e,t=tt.workingColorSpace){return tt.workingToColorSpace(ci.copy(this),t),e.r=ci.r,e.g=ci.g,e.b=ci.b,e}getStyle(e=Vt){tt.workingToColorSpace(ci.copy(this),e);let t=ci.r,i=ci.g,r=ci.b;return e!==Vt?`color(${e} ${t.toFixed(3)} ${i.toFixed(3)} ${r.toFixed(3)})`:`rgb(${Math.round(t*255)},${Math.round(i*255)},${Math.round(r*255)})`}offsetHSL(e,t,i){return this.getHSL(bn),this.setHSL(bn.h+e,bn.s+t,bn.l+i)}add(e){return this.r+=e.r,this.g+=e.g,this.b+=e.b,this}addColors(e,t){return this.r=e.r+t.r,this.g=e.g+t.g,this.b=e.b+t.b,this}addScalar(e){return this.r+=e,this.g+=e,this.b+=e,this}sub(e){return this.r=Math.max(0,this.r-e.r),this.g=Math.max(0,this.g-e.g),this.b=Math.max(0,this.b-e.b),this}multiply(e){return this.r*=e.r,this.g*=e.g,this.b*=e.b,this}multiplyScalar(e){return this.r*=e,this.g*=e,this.b*=e,this}lerp(e,t){return this.r+=(e.r-this.r)*t,this.g+=(e.g-this.g)*t,this.b+=(e.b-this.b)*t,this}lerpColors(e,t,i){return this.r=e.r+(t.r-e.r)*i,this.g=e.g+(t.g-e.g)*i,this.b=e.b+(t.b-e.b)*i,this}lerpHSL(e,t){this.getHSL(bn),e.getHSL(Gs);let i=Mr(bn.h,Gs.h,t),r=Mr(bn.s,Gs.s,t),o=Mr(bn.l,Gs.l,t);return this.setHSL(i,r,o),this}setFromVector3(e){return this.r=e.x,this.g=e.y,this.b=e.z,this}applyMatrix3(e){let t=this.r,i=this.g,r=this.b,o=e.elements;return this.r=o[0]*t+o[3]*i+o[6]*r,this.g=o[1]*t+o[4]*i+o[7]*r,this.b=o[2]*t+o[5]*i+o[8]*r,this}equals(e){return e.r===this.r&&e.g===this.g&&e.b===this.b}fromArray(e,t=0){return this.r=e[t],this.g=e[t+1],this.b=e[t+2],this}toArray(e=[],t=0){return e[t]=this.r,e[t+1]=this.g,e[t+2]=this.b,e}fromBufferAttribute(e,t){return this.r=e.getX(t),this.g=e.getY(t),this.b=e.getZ(t),this}toJSON(){return this.getHex()}*[Symbol.iterator](){yield this.r,yield this.g,yield this.b}},ci=new Le;Le.NAMES=kc;var Yo=class n{constructor(e,t=25e-5){this.isFogExp2=!0,this.name="",this.color=new Le(e),this.density=t}clone(){return new n(this.color,this.density)}toJSON(){return{type:"FogExp2",name:this.name,color:this.color.getHex(),density:this.density}}};var Ko=class extends St{constructor(){super(),this.isScene=!0,this.type="Scene",this.background=null,this.environment=null,this.fog=null,this.backgroundBlurriness=0,this.backgroundIntensity=1,this.backgroundRotation=new Ci,this.environmentIntensity=1,this.environmentRotation=new Ci,this.overrideMaterial=null,typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}copy(e,t){return super.copy(e,t),e.background!==null&&(this.background=e.background.clone()),e.environment!==null&&(this.environment=e.environment.clone()),e.fog!==null&&(this.fog=e.fog.clone()),this.backgroundBlurriness=e.backgroundBlurriness,this.backgroundIntensity=e.backgroundIntensity,this.backgroundRotation.copy(e.backgroundRotation),this.environmentIntensity=e.environmentIntensity,this.environmentRotation.copy(e.environmentRotation),e.overrideMaterial!==null&&(this.overrideMaterial=e.overrideMaterial.clone()),this.matrixAutoUpdate=e.matrixAutoUpdate,this}toJSON(e){let t=super.toJSON(e);return this.fog!==null&&(t.object.fog=this.fog.toJSON()),t.object.backgroundBlurriness=this.backgroundBlurriness,t.object.backgroundIntensity=this.backgroundIntensity,t.object.backgroundRotation=this.backgroundRotation.toArray(),t.object.environmentIntensity=this.environmentIntensity,t.object.environmentRotation=this.environmentRotation.toArray(),t}};var Gi=new D,nn=new D,tl=new D,rn=new D,Ar=new D,wr=new D,Hc=new D,il=new D,nl=new D,rl=new D,ol=new xt,sl=new xt,al=new xt,Xi=class n{constructor(e=new D,t=new D,i=new D){this.a=e,this.b=t,this.c=i}static getNormal(e,t,i,r){r.subVectors(i,t),Gi.subVectors(e,t),r.cross(Gi);let o=r.lengthSq();return o>0?r.multiplyScalar(1/Math.sqrt(o)):r.set(0,0,0)}static getBarycoord(e,t,i,r,o){Gi.subVectors(r,t),nn.subVectors(i,t),tl.subVectors(e,t);let s=Gi.dot(Gi),a=Gi.dot(nn),c=Gi.dot(tl),l=nn.dot(nn),h=nn.dot(tl),m=s*l-a*a;if(m===0)return o.set(0,0,0),null;let f=1/m,g=(l*c-a*h)*f,x=(s*h-a*c)*f;return o.set(1-g-x,x,g)}static containsPoint(e,t,i,r){return this.getBarycoord(e,t,i,r,rn)===null?!1:rn.x>=0&&rn.y>=0&&rn.x+rn.y<=1}static getInterpolation(e,t,i,r,o,s,a,c){return this.getBarycoord(e,t,i,r,rn)===null?(c.x=0,c.y=0,"z"in c&&(c.z=0),"w"in c&&(c.w=0),null):(c.setScalar(0),c.addScaledVector(o,rn.x),c.addScaledVector(s,rn.y),c.addScaledVector(a,rn.z),c)}static getInterpolatedAttribute(e,t,i,r,o,s){return ol.setScalar(0),sl.setScalar(0),al.setScalar(0),ol.fromBufferAttribute(e,t),sl.fromBufferAttribute(e,i),al.fromBufferAttribute(e,r),s.setScalar(0),s.addScaledVector(ol,o.x),s.addScaledVector(sl,o.y),s.addScaledVector(al,o.z),s}static isFrontFacing(e,t,i,r){return Gi.subVectors(i,t),nn.subVectors(e,t),Gi.cross(nn).dot(r)<0}set(e,t,i){return this.a.copy(e),this.b.copy(t),this.c.copy(i),this}setFromPointsAndIndices(e,t,i,r){return this.a.copy(e[t]),this.b.copy(e[i]),this.c.copy(e[r]),this}setFromAttributeAndIndices(e,t,i,r){return this.a.fromBufferAttribute(e,t),this.b.fromBufferAttribute(e,i),this.c.fromBufferAttribute(e,r),this}clone(){return new this.constructor().copy(this)}copy(e){return this.a.copy(e.a),this.b.copy(e.b),this.c.copy(e.c),this}getArea(){return Gi.subVectors(this.c,this.b),nn.subVectors(this.a,this.b),Gi.cross(nn).length()*.5}getMidpoint(e){return e.addVectors(this.a,this.b).add(this.c).multiplyScalar(1/3)}getNormal(e){return n.getNormal(this.a,this.b,this.c,e)}getPlane(e){return e.setFromCoplanarPoints(this.a,this.b,this.c)}getBarycoord(e,t){return n.getBarycoord(e,this.a,this.b,this.c,t)}getInterpolation(e,t,i,r,o){return n.getInterpolation(e,this.a,this.b,this.c,t,i,r,o)}containsPoint(e){return n.containsPoint(e,this.a,this.b,this.c)}isFrontFacing(e){return n.isFrontFacing(this.a,this.b,this.c,e)}intersectsBox(e){return e.intersectsTriangle(this)}closestPointToPoint(e,t){let i=this.a,r=this.b,o=this.c,s,a;Ar.subVectors(r,i),wr.subVectors(o,i),il.subVectors(e,i);let c=Ar.dot(il),l=wr.dot(il);if(c<=0&&l<=0)return t.copy(i);nl.subVectors(e,r);let h=Ar.dot(nl),m=wr.dot(nl);if(h>=0&&m<=h)return t.copy(r);let f=c*m-h*l;if(f<=0&&c>=0&&h<=0)return s=c/(c-h),t.copy(i).addScaledVector(Ar,s);rl.subVectors(e,o);let g=Ar.dot(rl),x=wr.dot(rl);if(x>=0&&g<=x)return t.copy(o);let S=g*l-c*x;if(S<=0&&l>=0&&x<=0)return a=l/(l-x),t.copy(i).addScaledVector(wr,a);let _=h*x-g*m;if(_<=0&&m-h>=0&&g-x>=0)return Hc.subVectors(o,r),a=(m-h)/(m-h+(g-x)),t.copy(r).addScaledVector(Hc,a);let p=1/(_+S+f);return s=S*p,a=f*p,t.copy(i).addScaledVector(Ar,s).addScaledVector(wr,a)}equals(e){return e.a.equals(this.a)&&e.b.equals(this.b)&&e.c.equals(this.c)}};var sn=class{constructor(e=new D(1/0,1/0,1/0),t=new D(-1/0,-1/0,-1/0)){this.isBox3=!0,this.min=e,this.max=t}set(e,t){return this.min.copy(e),this.max.copy(t),this}setFromArray(e){this.makeEmpty();for(let t=0,i=e.length;t<i;t+=3)this.expandByPoint(zi.fromArray(e,t));return this}setFromBufferAttribute(e){this.makeEmpty();for(let t=0,i=e.count;t<i;t++)this.expandByPoint(zi.fromBufferAttribute(e,t));return this}setFromPoints(e){this.makeEmpty();for(let t=0,i=e.length;t<i;t++)this.expandByPoint(e[t]);return this}setFromCenterAndSize(e,t){let i=zi.copy(t).multiplyScalar(.5);return this.min.copy(e).sub(i),this.max.copy(e).add(i),this}setFromObject(e,t=!1){return this.makeEmpty(),this.expandByObject(e,t)}clone(){return new this.constructor().copy(this)}copy(e){return this.min.copy(e.min),this.max.copy(e.max),this}makeEmpty(){return this.min.x=this.min.y=this.min.z=1/0,this.max.x=this.max.y=this.max.z=-1/0,this}isEmpty(){return this.max.x<this.min.x||this.max.y<this.min.y||this.max.z<this.min.z}getCenter(e){return this.isEmpty()?e.set(0,0,0):e.addVectors(this.min,this.max).multiplyScalar(.5)}getSize(e){return this.isEmpty()?e.set(0,0,0):e.subVectors(this.max,this.min)}expandByPoint(e){return this.min.min(e),this.max.max(e),this}expandByVector(e){return this.min.sub(e),this.max.add(e),this}expandByScalar(e){return this.min.addScalar(-e),this.max.addScalar(e),this}expandByObject(e,t=!1){e.updateWorldMatrix(!1,!1);let i=e.geometry;if(i!==void 0){let o=i.getAttribute("position");if(t===!0&&o!==void 0&&e.isInstancedMesh!==!0)for(let s=0,a=o.count;s<a;s++)e.isMesh===!0?e.getVertexPosition(s,zi):zi.fromBufferAttribute(o,s),zi.applyMatrix4(e.matrixWorld),this.expandByPoint(zi);else e.boundingBox!==void 0?(e.boundingBox===null&&e.computeBoundingBox(),zs.copy(e.boundingBox)):(i.boundingBox===null&&i.computeBoundingBox(),zs.copy(i.boundingBox)),zs.applyMatrix4(e.matrixWorld),this.union(zs)}let r=e.children;for(let o=0,s=r.length;o<s;o++)this.expandByObject(r[o],t);return this}containsPoint(e){return e.x>=this.min.x&&e.x<=this.max.x&&e.y>=this.min.y&&e.y<=this.max.y&&e.z>=this.min.z&&e.z<=this.max.z}containsBox(e){return this.min.x<=e.min.x&&e.max.x<=this.max.x&&this.min.y<=e.min.y&&e.max.y<=this.max.y&&this.min.z<=e.min.z&&e.max.z<=this.max.z}getParameter(e,t){return t.set((e.x-this.min.x)/(this.max.x-this.min.x),(e.y-this.min.y)/(this.max.y-this.min.y),(e.z-this.min.z)/(this.max.z-this.min.z))}intersectsBox(e){return e.max.x>=this.min.x&&e.min.x<=this.max.x&&e.max.y>=this.min.y&&e.min.y<=this.max.y&&e.max.z>=this.min.z&&e.min.z<=this.max.z}intersectsSphere(e){return this.clampPoint(e.center,zi),zi.distanceToSquared(e.center)<=e.radius*e.radius}intersectsPlane(e){let t,i;return e.normal.x>0?(t=e.normal.x*this.min.x,i=e.normal.x*this.max.x):(t=e.normal.x*this.max.x,i=e.normal.x*this.min.x),e.normal.y>0?(t+=e.normal.y*this.min.y,i+=e.normal.y*this.max.y):(t+=e.normal.y*this.max.y,i+=e.normal.y*this.min.y),e.normal.z>0?(t+=e.normal.z*this.min.z,i+=e.normal.z*this.max.z):(t+=e.normal.z*this.max.z,i+=e.normal.z*this.min.z),t<=-e.constant&&i>=-e.constant}intersectsTriangle(e){if(this.isEmpty())return!1;this.getCenter(Zo),ks.subVectors(this.max,Zo),Rr.subVectors(e.a,Zo),Cr.subVectors(e.b,Zo),Pr.subVectors(e.c,Zo),En.subVectors(Cr,Rr),Tn.subVectors(Pr,Cr),Yn.subVectors(Rr,Pr);let t=[0,-En.z,En.y,0,-Tn.z,Tn.y,0,-Yn.z,Yn.y,En.z,0,-En.x,Tn.z,0,-Tn.x,Yn.z,0,-Yn.x,-En.y,En.x,0,-Tn.y,Tn.x,0,-Yn.y,Yn.x,0];return!ll(t,Rr,Cr,Pr,ks)||(t=[1,0,0,0,1,0,0,0,1],!ll(t,Rr,Cr,Pr,ks))?!1:(Hs.crossVectors(En,Tn),t=[Hs.x,Hs.y,Hs.z],ll(t,Rr,Cr,Pr,ks))}clampPoint(e,t){return t.copy(e).clamp(this.min,this.max)}distanceToPoint(e){return this.clampPoint(e,zi).distanceTo(e)}getBoundingSphere(e){return this.isEmpty()?e.makeEmpty():(this.getCenter(e.center),e.radius=this.getSize(zi).length()*.5),e}intersect(e){return this.min.max(e.min),this.max.min(e.max),this.isEmpty()&&this.makeEmpty(),this}union(e){return this.min.min(e.min),this.max.max(e.max),this}applyMatrix4(e){return this.isEmpty()?this:(on[0].set(this.min.x,this.min.y,this.min.z).applyMatrix4(e),on[1].set(this.min.x,this.min.y,this.max.z).applyMatrix4(e),on[2].set(this.min.x,this.max.y,this.min.z).applyMatrix4(e),on[3].set(this.min.x,this.max.y,this.max.z).applyMatrix4(e),on[4].set(this.max.x,this.min.y,this.min.z).applyMatrix4(e),on[5].set(this.max.x,this.min.y,this.max.z).applyMatrix4(e),on[6].set(this.max.x,this.max.y,this.min.z).applyMatrix4(e),on[7].set(this.max.x,this.max.y,this.max.z).applyMatrix4(e),this.setFromPoints(on),this)}translate(e){return this.min.add(e),this.max.add(e),this}equals(e){return e.min.equals(this.min)&&e.max.equals(this.max)}toJSON(){return{min:this.min.toArray(),max:this.max.toArray()}}fromJSON(e){return this.min.fromArray(e.min),this.max.fromArray(e.max),this}},on=[new D,new D,new D,new D,new D,new D,new D,new D],zi=new D,zs=new sn,Rr=new D,Cr=new D,Pr=new D,En=new D,Tn=new D,Yn=new D,Zo=new D,ks=new D,Hs=new D,Kn=new D;function ll(n,e,t,i,r){for(let o=0,s=n.length-3;o<=s;o+=3){Kn.fromArray(n,o);let a=r.x*Math.abs(Kn.x)+r.y*Math.abs(Kn.y)+r.z*Math.abs(Kn.z),c=e.dot(Kn),l=t.dot(Kn),h=i.dot(Kn);if(Math.max(-Math.max(c,l,h),Math.min(c,l,h))>a)return!1}return!0}var kt=new D,Vs=new Ce,nm=0,ri=class extends Qt{constructor(e,t,i=!1){if(super(),Array.isArray(e))throw new TypeError("THREE.BufferAttribute: array should be a Typed Array.");this.isBufferAttribute=!0,Object.defineProperty(this,"id",{value:nm++}),this.name="",this.array=e,this.itemSize=t,this.count=e!==void 0?e.length/t:0,this.normalized=i,this.usage=bc,this.updateRanges=[],this.gpuType=ni,this.version=0}onUploadCallback(){}set needsUpdate(e){e===!0&&this.version++}setUsage(e){return this.usage=e,this}addUpdateRange(e,t){this.updateRanges.push({start:e,count:t})}clearUpdateRanges(){this.updateRanges.length=0}copy(e){return this.name=e.name,this.array=new e.array.constructor(e.array),this.itemSize=e.itemSize,this.count=e.count,this.normalized=e.normalized,this.usage=e.usage,this.gpuType=e.gpuType,this}copyAt(e,t,i){e*=this.itemSize,i*=t.itemSize;for(let r=0,o=this.itemSize;r<o;r++)this.array[e+r]=t.array[i+r];return this}copyArray(e){return this.array.set(e),this}applyMatrix3(e){if(this.itemSize===2)for(let t=0,i=this.count;t<i;t++)Vs.fromBufferAttribute(this,t),Vs.applyMatrix3(e),this.setXY(t,Vs.x,Vs.y);else if(this.itemSize===3)for(let t=0,i=this.count;t<i;t++)kt.fromBufferAttribute(this,t),kt.applyMatrix3(e),this.setXYZ(t,kt.x,kt.y,kt.z);return this}applyMatrix4(e){for(let t=0,i=this.count;t<i;t++)kt.fromBufferAttribute(this,t),kt.applyMatrix4(e),this.setXYZ(t,kt.x,kt.y,kt.z);return this}applyNormalMatrix(e){for(let t=0,i=this.count;t<i;t++)kt.fromBufferAttribute(this,t),kt.applyNormalMatrix(e),this.setXYZ(t,kt.x,kt.y,kt.z);return this}transformDirection(e){for(let t=0,i=this.count;t<i;t++)kt.fromBufferAttribute(this,t),kt.transformDirection(e),this.setXYZ(t,kt.x,kt.y,kt.z);return this}set(e,t=0){return this.array.set(e,t),this}getComponent(e,t){let i=this.array[e*this.itemSize+t];return this.normalized&&(i=Xn(i,this.array)),i}setComponent(e,t,i){return this.normalized&&(i=ai(i,this.array)),this.array[e*this.itemSize+t]=i,this}getX(e){let t=this.array[e*this.itemSize];return this.normalized&&(t=Xn(t,this.array)),t}setX(e,t){return this.normalized&&(t=ai(t,this.array)),this.array[e*this.itemSize]=t,this}getY(e){let t=this.array[e*this.itemSize+1];return this.normalized&&(t=Xn(t,this.array)),t}setY(e,t){return this.normalized&&(t=ai(t,this.array)),this.array[e*this.itemSize+1]=t,this}getZ(e){let t=this.array[e*this.itemSize+2];return this.normalized&&(t=Xn(t,this.array)),t}setZ(e,t){return this.normalized&&(t=ai(t,this.array)),this.array[e*this.itemSize+2]=t,this}getW(e){let t=this.array[e*this.itemSize+3];return this.normalized&&(t=Xn(t,this.array)),t}setW(e,t){return this.normalized&&(t=ai(t,this.array)),this.array[e*this.itemSize+3]=t,this}setXY(e,t,i){return e*=this.itemSize,this.normalized&&(t=ai(t,this.array),i=ai(i,this.array)),this.array[e+0]=t,this.array[e+1]=i,this}setXYZ(e,t,i,r){return e*=this.itemSize,this.normalized&&(t=ai(t,this.array),i=ai(i,this.array),r=ai(r,this.array)),this.array[e+0]=t,this.array[e+1]=i,this.array[e+2]=r,this}setXYZW(e,t,i,r,o){return e*=this.itemSize,this.normalized&&(t=ai(t,this.array),i=ai(i,this.array),r=ai(r,this.array),o=ai(o,this.array)),this.array[e+0]=t,this.array[e+1]=i,this.array[e+2]=r,this.array[e+3]=o,this}onUpload(e){return this.onUploadCallback=e,this}clone(){return new this.constructor(this.array,this.itemSize).copy(this)}toJSON(){let e={itemSize:this.itemSize,type:this.array.constructor.name,array:Array.from(this.array),normalized:this.normalized};return e.name=this.name,e.usage=this.usage,e.gpuType=this.gpuType,e}dispose(){this.dispatchEvent({type:"dispose"})}};var Lr=class extends ri{constructor(e,t,i){super(new Uint16Array(e),t,i)}};var Dr=class extends ri{constructor(e,t,i){super(new Uint32Array(e),t,i)}};var ft=class extends ri{constructor(e,t,i){super(new Float32Array(e),t,i)}};var rm=new sn,Jo=new D,cl=new D,Pi=class{constructor(e=new D,t=-1){this.isSphere=!0,this.center=e,this.radius=t}set(e,t){return this.center.copy(e),this.radius=t,this}setFromPoints(e,t){let i=this.center;t!==void 0?i.copy(t):rm.setFromPoints(e).getCenter(i);let r=0;for(let o=0,s=e.length;o<s;o++)r=Math.max(r,i.distanceToSquared(e[o]));return this.radius=Math.sqrt(r),this}copy(e){return this.center.copy(e.center),this.radius=e.radius,this}isEmpty(){return this.radius<0}makeEmpty(){return this.center.set(0,0,0),this.radius=-1,this}containsPoint(e){return e.distanceToSquared(this.center)<=this.radius*this.radius}distanceToPoint(e){return e.distanceTo(this.center)-this.radius}intersectsSphere(e){let t=this.radius+e.radius;return e.center.distanceToSquared(this.center)<=t*t}intersectsBox(e){return e.intersectsSphere(this)}intersectsPlane(e){return Math.abs(e.distanceToPoint(this.center))<=this.radius}clampPoint(e,t){let i=this.center.distanceToSquared(e);return t.copy(e),i>this.radius*this.radius&&(t.sub(this.center).normalize(),t.multiplyScalar(this.radius).add(this.center)),t}getBoundingBox(e){return this.isEmpty()?(e.makeEmpty(),e):(e.set(this.center,this.center),e.expandByScalar(this.radius),e)}applyMatrix4(e){return this.center.applyMatrix4(e),this.radius=this.radius*e.getMaxScaleOnAxis(),this}translate(e){return this.center.add(e),this}expandByPoint(e){if(this.isEmpty())return this.center.copy(e),this.radius=0,this;Jo.subVectors(e,this.center);let t=Jo.lengthSq();if(t>this.radius*this.radius){let i=Math.sqrt(t),r=(i-this.radius)*.5;this.center.addScaledVector(Jo,r/i),this.radius+=r}return this}union(e){return e.isEmpty()?this:this.isEmpty()?(this.copy(e),this):(this.center.equals(e.center)===!0?this.radius=Math.max(this.radius,e.radius):(cl.subVectors(e.center,this.center).setLength(e.radius),this.expandByPoint(Jo.copy(e.center).add(cl)),this.expandByPoint(Jo.copy(e.center).sub(cl))),this)}equals(e){return e.center.equals(this.center)&&e.radius===this.radius}clone(){return new this.constructor().copy(this)}toJSON(){return{radius:this.radius,center:this.center.toArray()}}fromJSON(e){return this.radius=e.radius,this.center.fromArray(e.center),this}};var om=0,Li=new it,ul=new St,Ir=new D,bi=new sn,$o=new sn,jt=new D,gt=class n extends Qt{constructor(){super(),this.isBufferGeometry=!0,Object.defineProperty(this,"id",{value:om++}),this.uuid=Fi(),this.name="",this.type="BufferGeometry",this.index=null,this.indirect=null,this.indirectOffset=0,this.attributes={},this.morphAttributes={},this.morphTargetsRelative=!1,this.groups=[],this.boundingBox=null,this.boundingSphere=null,this.drawRange={start:0,count:1/0},this.userData={},this._transformed=!1}getIndex(){return this.index}setIndex(e){return Array.isArray(e)?this.index=new(Tc(e)?Dr:Lr)(e,1):this.index=e,this}setIndirect(e,t=0){return this.indirect=e,this.indirectOffset=t,this}getIndirect(){return this.indirect}getAttribute(e){return this.attributes[e]}setAttribute(e,t){return this.attributes[e]=t,this}deleteAttribute(e){return delete this.attributes[e],this}hasAttribute(e){return this.attributes[e]!==void 0}addGroup(e,t,i=0){this.groups.push({start:e,count:t,materialIndex:i})}clearGroups(){this.groups=[]}setDrawRange(e,t){this.drawRange.start=e,this.drawRange.count=t}applyMatrix4(e){let t=this.attributes.position;t!==void 0&&(t.applyMatrix4(e),t.needsUpdate=!0);let i=this.attributes.normal;if(i!==void 0){let o=new qe().getNormalMatrix(e);i.applyNormalMatrix(o),i.needsUpdate=!0}let r=this.attributes.tangent;return r!==void 0&&(r.transformDirection(e),r.needsUpdate=!0),this.boundingBox!==null&&this.computeBoundingBox(),this.boundingSphere!==null&&this.computeBoundingSphere(),this._transformed=!0,this}applyQuaternion(e){return Li.makeRotationFromQuaternion(e),this.applyMatrix4(Li),this}rotateX(e){return Li.makeRotationX(e),this.applyMatrix4(Li),this}rotateY(e){return Li.makeRotationY(e),this.applyMatrix4(Li),this}rotateZ(e){return Li.makeRotationZ(e),this.applyMatrix4(Li),this}translate(e,t,i){return Li.makeTranslation(e,t,i),this.applyMatrix4(Li),this}scale(e,t,i){return Li.makeScale(e,t,i),this.applyMatrix4(Li),this}lookAt(e){return ul.lookAt(e),ul.updateMatrix(),this.applyMatrix4(ul.matrix),this}center(){return this.computeBoundingBox(),this.boundingBox.getCenter(Ir).negate(),this.translate(Ir.x,Ir.y,Ir.z),this}setFromPoints(e){let t=this.getAttribute("position");if(t===void 0){let i=[];for(let r=0,o=e.length;r<o;r++){let s=e[r];i.push(s.x,s.y,s.z||0)}this.setAttribute("position",new ft(i,3))}else{let i=Math.min(e.length,t.count);for(let r=0;r<i;r++){let o=e[r];t.setXYZ(r,o.x,o.y,o.z||0)}e.length>t.count&&Ue("BufferGeometry: Buffer size too small for points data. Use .dispose() and create a new geometry."),t.needsUpdate=!0}return this}computeBoundingBox(){this.boundingBox===null&&(this.boundingBox=new sn);let e=this.attributes.position,t=this.morphAttributes.position;if(e&&e.isGLBufferAttribute){nt("BufferGeometry.computeBoundingBox(): GLBufferAttribute requires a manual bounding box.",this),this.boundingBox.set(new D(-1/0,-1/0,-1/0),new D(1/0,1/0,1/0));return}if(e!==void 0){if(this.boundingBox.setFromBufferAttribute(e),t)for(let i=0,r=t.length;i<r;i++){let o=t[i];bi.setFromBufferAttribute(o),this.morphTargetsRelative?(jt.addVectors(this.boundingBox.min,bi.min),this.boundingBox.expandByPoint(jt),jt.addVectors(this.boundingBox.max,bi.max),this.boundingBox.expandByPoint(jt)):(this.boundingBox.expandByPoint(bi.min),this.boundingBox.expandByPoint(bi.max))}}else this.boundingBox.makeEmpty();(isNaN(this.boundingBox.min.x)||isNaN(this.boundingBox.min.y)||isNaN(this.boundingBox.min.z))&&nt('BufferGeometry.computeBoundingBox(): Computed min/max have NaN values. The "position" attribute is likely to have NaN values.',this)}computeBoundingSphere(){this.boundingSphere===null&&(this.boundingSphere=new Pi);let e=this.attributes.position,t=this.morphAttributes.position;if(e&&e.isGLBufferAttribute){nt("BufferGeometry.computeBoundingSphere(): GLBufferAttribute requires a manual bounding sphere.",this),this.boundingSphere.set(new D,1/0);return}if(e){let i=this.boundingSphere.center;if(bi.setFromBufferAttribute(e),t)for(let o=0,s=t.length;o<s;o++){let a=t[o];$o.setFromBufferAttribute(a),this.morphTargetsRelative?(jt.addVectors(bi.min,$o.min),bi.expandByPoint(jt),jt.addVectors(bi.max,$o.max),bi.expandByPoint(jt)):(bi.expandByPoint($o.min),bi.expandByPoint($o.max))}bi.getCenter(i);let r=0;for(let o=0,s=e.count;o<s;o++)jt.fromBufferAttribute(e,o),r=Math.max(r,i.distanceToSquared(jt));if(t)for(let o=0,s=t.length;o<s;o++){let a=t[o],c=this.morphTargetsRelative;for(let l=0,h=a.count;l<h;l++)jt.fromBufferAttribute(a,l),c&&(Ir.fromBufferAttribute(e,l),jt.add(Ir)),r=Math.max(r,i.distanceToSquared(jt))}this.boundingSphere.radius=Math.sqrt(r),isNaN(this.boundingSphere.radius)&&nt('BufferGeometry.computeBoundingSphere(): Computed radius is NaN. The "position" attribute is likely to have NaN values.',this)}}computeTangents(){let e=this.index,t=this.attributes;if(e===null||t.position===void 0||t.normal===void 0||t.uv===void 0){nt("BufferGeometry: .computeTangents() failed. Missing required attributes (index, position, normal or uv)");return}let i=t.position,r=t.normal,o=t.uv,s=this.getAttribute("tangent");(s===void 0||s.count!==i.count)&&(s=new ri(new Float32Array(4*i.count),4),this.setAttribute("tangent",s));let a=[],c=[];for(let d=0;d<i.count;d++)a[d]=new D,c[d]=new D;let l=new D,h=new D,m=new D,f=new Ce,g=new Ce,x=new Ce,S=new D,_=new D;function p(d,T,L){l.fromBufferAttribute(i,d),h.fromBufferAttribute(i,T),m.fromBufferAttribute(i,L),f.fromBufferAttribute(o,d),g.fromBufferAttribute(o,T),x.fromBufferAttribute(o,L),h.sub(l),m.sub(l),g.sub(f),x.sub(f);let F=1/(g.x*x.y-x.x*g.y);isFinite(F)&&(S.copy(h).multiplyScalar(x.y).addScaledVector(m,-g.y).multiplyScalar(F),_.copy(m).multiplyScalar(g.x).addScaledVector(h,-x.x).multiplyScalar(F),a[d].add(S),a[T].add(S),a[L].add(S),c[d].add(_),c[T].add(_),c[L].add(_))}let A=this.groups;A.length===0&&(A=[{start:0,count:e.count}]);for(let d=0,T=A.length;d<T;++d){let L=A[d],F=L.start,B=L.count;for(let X=F,U=F+B;X<U;X+=3)p(e.getX(X+0),e.getX(X+1),e.getX(X+2))}let P=new D,y=new D,E=new D,b=new D;function R(d){E.fromBufferAttribute(r,d),b.copy(E);let T=a[d];P.copy(T),P.sub(E.multiplyScalar(E.dot(T))).normalize(),y.crossVectors(b,T);let F=y.dot(c[d])<0?-1:1;s.setXYZW(d,P.x,P.y,P.z,F)}for(let d=0,T=A.length;d<T;++d){let L=A[d],F=L.start,B=L.count;for(let X=F,U=F+B;X<U;X+=3)R(e.getX(X+0)),R(e.getX(X+1)),R(e.getX(X+2))}this._transformed=!0}computeVertexNormals(){let e=this.index,t=this.getAttribute("position");if(t!==void 0){let i=this.getAttribute("normal");if(i===void 0||i.count!==t.count)i=new ri(new Float32Array(t.count*3),3),this.setAttribute("normal",i);else for(let f=0,g=i.count;f<g;f++)i.setXYZ(f,0,0,0);let r=new D,o=new D,s=new D,a=new D,c=new D,l=new D,h=new D,m=new D;if(e)for(let f=0,g=e.count;f<g;f+=3){let x=e.getX(f+0),S=e.getX(f+1),_=e.getX(f+2);r.fromBufferAttribute(t,x),o.fromBufferAttribute(t,S),s.fromBufferAttribute(t,_),h.subVectors(s,o),m.subVectors(r,o),h.cross(m),a.fromBufferAttribute(i,x),c.fromBufferAttribute(i,S),l.fromBufferAttribute(i,_),a.add(h),c.add(h),l.add(h),i.setXYZ(x,a.x,a.y,a.z),i.setXYZ(S,c.x,c.y,c.z),i.setXYZ(_,l.x,l.y,l.z)}else for(let f=0,g=t.count;f<g;f+=3)r.fromBufferAttribute(t,f+0),o.fromBufferAttribute(t,f+1),s.fromBufferAttribute(t,f+2),h.subVectors(s,o),m.subVectors(r,o),h.cross(m),i.setXYZ(f+0,h.x,h.y,h.z),i.setXYZ(f+1,h.x,h.y,h.z),i.setXYZ(f+2,h.x,h.y,h.z);this.normalizeNormals(),i.needsUpdate=!0}}normalizeNormals(){let e=this.attributes.normal;for(let t=0,i=e.count;t<i;t++)jt.fromBufferAttribute(e,t),jt.normalize(),e.setXYZ(t,jt.x,jt.y,jt.z)}toNonIndexed(){function e(a,c){let l=a.array,h=a.itemSize,m=a.normalized,f=new l.constructor(c.length*h),g=0,x=0;for(let S=0,_=c.length;S<_;S++){a.isInterleavedBufferAttribute?g=c[S]*a.data.stride+a.offset:g=c[S]*h;for(let p=0;p<h;p++)f[x++]=l[g++]}return new ri(f,h,m)}if(this.index===null)return Ue("BufferGeometry.toNonIndexed(): BufferGeometry is already non-indexed."),this;let t=new n,i=this.index.array,r=this.attributes;for(let a in r){let c=r[a],l=e(c,i);t.setAttribute(a,l)}let o=this.morphAttributes;for(let a in o){let c=[],l=o[a];for(let h=0,m=l.length;h<m;h++){let f=l[h],g=e(f,i);c.push(g)}t.morphAttributes[a]=c}t.morphTargetsRelative=this.morphTargetsRelative;let s=this.groups;for(let a=0,c=s.length;a<c;a++){let l=s[a];t.addGroup(l.start,l.count,l.materialIndex)}return t}toJSON(){let e={metadata:{version:4.7,type:"BufferGeometry",generator:"BufferGeometry.toJSON"}};if(e.uuid=this.uuid,e.type=this.parameters!==void 0&&this._transformed===!0?"BufferGeometry":this.type,e.name=this.name,Object.keys(this.userData).length>0&&(e.userData=this.userData),this.parameters!==void 0&&this._transformed!==!0){let c=this.parameters;for(let l in c)c[l]!==void 0&&(e[l]=c[l]);return e}e.data={attributes:{}};let t=this.index;t!==null&&(e.data.index={type:t.array.constructor.name,array:Array.prototype.slice.call(t.array)});let i=this.attributes;for(let c in i){let l=i[c];e.data.attributes[c]=l.toJSON(e.data)}let r={},o=!1;for(let c in this.morphAttributes){let l=this.morphAttributes[c],h=[];for(let m=0,f=l.length;m<f;m++){let g=l[m];h.push(g.toJSON(e.data))}h.length>0&&(r[c]=h,o=!0)}o&&(e.data.morphAttributes=r,e.data.morphTargetsRelative=this.morphTargetsRelative);let s=this.groups;s.length>0&&(e.data.groups=JSON.parse(JSON.stringify(s)));let a=this.boundingSphere;return a!==null&&(e.data.boundingSphere=a.toJSON()),e}clone(){return new this.constructor().copy(this)}copy(e){this.index=null,this.attributes={},this.morphAttributes={},this.groups=[],this.boundingBox=null,this.boundingSphere=null;let t={};this.name=e.name;let i=e.index;i!==null&&this.setIndex(i.clone());let r=e.attributes;for(let l in r){let h=r[l];this.setAttribute(l,h.clone(t))}let o=e.morphAttributes;for(let l in o){let h=[],m=o[l];for(let f=0,g=m.length;f<g;f++)h.push(m[f].clone(t));this.morphAttributes[l]=h}this.morphTargetsRelative=e.morphTargetsRelative;let s=e.groups;for(let l=0,h=s.length;l<h;l++){let m=s[l];this.addGroup(m.start,m.count,m.materialIndex)}let a=e.boundingBox;a!==null&&(this.boundingBox=a.clone());let c=e.boundingSphere;return c!==null&&(this.boundingSphere=c.clone()),this.drawRange.start=e.drawRange.start,this.drawRange.count=e.drawRange.count,this.userData=e.userData,this._transformed=e._transformed,this}dispose(){this.dispatchEvent({type:"dispose"})}};var fl=new D,sm=new D,am=new qe,ui=class{constructor(e=new D(1,0,0),t=0){this.isPlane=!0,this.normal=e,this.constant=t}set(e,t){return this.normal.copy(e),this.constant=t,this}setComponents(e,t,i,r){return this.normal.set(e,t,i),this.constant=r,this}setFromNormalAndCoplanarPoint(e,t){return this.normal.copy(e),this.constant=-t.dot(this.normal),this}setFromCoplanarPoints(e,t,i){let r=fl.subVectors(i,t).cross(sm.subVectors(e,t)).normalize();return this.setFromNormalAndCoplanarPoint(r,e),this}copy(e){return this.normal.copy(e.normal),this.constant=e.constant,this}normalize(){let e=1/this.normal.length();return this.normal.multiplyScalar(e),this.constant*=e,this}negate(){return this.constant*=-1,this.normal.negate(),this}distanceToPoint(e){return this.normal.dot(e)+this.constant}distanceToSphere(e){return this.distanceToPoint(e.center)-e.radius}projectPoint(e,t){return t.copy(e).addScaledVector(this.normal,-this.distanceToPoint(e))}intersectLine(e,t,i=!0){let r=e.delta(fl),o=this.normal.dot(r);if(o===0)return this.distanceToPoint(e.start)===0?t.copy(e.start):null;let s=-(e.start.dot(this.normal)+this.constant)/o;return i===!0&&(s<0||s>1)?null:t.copy(e.start).addScaledVector(r,s)}intersectsLine(e){let t=this.distanceToPoint(e.start),i=this.distanceToPoint(e.end);return t<0&&i>0||i<0&&t>0}intersectsBox(e){return e.intersectsPlane(this)}intersectsSphere(e){return e.intersectsPlane(this)}coplanarPoint(e){return e.copy(this.normal).multiplyScalar(-this.constant)}applyMatrix4(e,t){let i=t||am.getNormalMatrix(e),r=this.coplanarPoint(fl).applyMatrix4(e),o=this.normal.applyMatrix3(i).normalize();return this.constant=-r.dot(o),this}translate(e){return this.constant-=e.dot(this.normal),this}equals(e){return e.normal.equals(this.normal)&&e.constant===this.constant}clone(){return new this.constructor().copy(this)}toJSON(){return{normal:this.normal.toArray(),constant:this.constant}}fromJSON(e){return this.normal.fromArray(e.normal),this.constant=e.constant,this}};var lm=0,fi=class extends Qt{constructor(){super(),this.isMaterial=!0,Object.defineProperty(this,"id",{value:lm++}),this.uuid=Fi(),this.name="",this.type="Material",this.blending=pn,this.side=Ti,this.vertexColors=!1,this.opacity=1,this.transparent=!1,this.alphaHash=!1,this.blendSrc=ds,this.blendDst=ps,this.blendEquation=mn,this.blendSrcAlpha=null,this.blendDstAlpha=null,this.blendEquationAlpha=null,this.blendColor=new Le(0,0,0),this.blendAlpha=0,this.depthFunc=gn,this.depthTest=!0,this.depthWrite=!0,this.stencilWriteMask=255,this.stencilFunc=gc,this.stencilRef=0,this.stencilFuncMask=255,this.stencilFail=Ds,this.stencilZFail=Ds,this.stencilZPass=Ds,this.stencilWrite=!1,this.clippingPlanes=null,this.clipIntersection=!1,this.clipShadows=!1,this.shadowSide=null,this.colorWrite=!0,this.precision=null,this.polygonOffset=!1,this.polygonOffsetFactor=0,this.polygonOffsetUnits=0,this.dithering=!1,this.alphaToCoverage=!1,this.premultipliedAlpha=!1,this.forceSinglePass=!1,this.allowOverride=!0,this.visible=!0,this.toneMapped=!0,this.userData={},this.version=0,this._alphaTest=0}get alphaTest(){return this._alphaTest}set alphaTest(e){this._alphaTest>0!=e>0&&this.version++,this._alphaTest=e}onBeforeRender(){}onBeforeCompile(){}customProgramCacheKey(){return this.onBeforeCompile.toString()}setValues(e){if(e!==void 0)for(let t in e){let i=e[t];if(i===void 0){Ue(`Material: parameter '${t}' has value of undefined.`);continue}let r=this[t];if(r===void 0){Ue(`Material: '${t}' is not a property of THREE.${this.type}.`);continue}r&&r.isColor?r.set(i):r&&r.isVector2&&i&&i.isVector2||r&&r.isEuler&&i&&i.isEuler||r&&r.isVector3&&i&&i.isVector3?r.copy(i):this[t]=i}}toJSON(e){let t=e===void 0||typeof e=="string";t&&(e={textures:{},images:{}});let i={metadata:{version:4.7,type:"Material",generator:"Material.toJSON"}};i.uuid=this.uuid,i.type=this.type,i.blending=this.blending,i.side=this.side,i.shadowSide=this.shadowSide,i.vertexColors=this.vertexColors,i.opacity=this.opacity,i.transparent=this.transparent,i.blendSrc=this.blendSrc,i.blendDst=this.blendDst,i.blendEquation=this.blendEquation,i.blendSrcAlpha=this.blendSrcAlpha,i.blendDstAlpha=this.blendDstAlpha,i.blendEquationAlpha=this.blendEquationAlpha,i.blendColor=this.blendColor.getHex(),i.blendAlpha=this.blendAlpha,i.depthFunc=this.depthFunc,i.depthTest=this.depthTest,i.depthWrite=this.depthWrite,i.colorWrite=this.colorWrite,i.clipIntersection=this.clipIntersection,i.clipShadows=this.clipShadows,i.stencilWriteMask=this.stencilWriteMask,i.stencilFunc=this.stencilFunc,i.stencilRef=this.stencilRef,i.stencilFuncMask=this.stencilFuncMask,i.stencilFail=this.stencilFail,i.stencilZFail=this.stencilZFail,i.stencilZPass=this.stencilZPass,i.stencilWrite=this.stencilWrite,i.polygonOffset=this.polygonOffset,i.polygonOffsetFactor=this.polygonOffsetFactor,i.polygonOffsetUnits=this.polygonOffsetUnits,i.dithering=this.dithering,i.alphaTest=this.alphaTest,i.alphaHash=this.alphaHash,i.alphaToCoverage=this.alphaToCoverage,i.premultipliedAlpha=this.premultipliedAlpha,i.forceSinglePass=this.forceSinglePass,i.allowOverride=this.allowOverride,i.visible=this.visible,i.toneMapped=this.toneMapped,i.name=this.name,this.color&&this.color.isColor&&(i.color=this.color.getHex()),this.roughness!==void 0&&(i.roughness=this.roughness),this.metalness!==void 0&&(i.metalness=this.metalness),this.sheen!==void 0&&(i.sheen=this.sheen),this.sheenColor&&this.sheenColor.isColor&&(i.sheenColor=this.sheenColor.getHex()),this.sheenRoughness!==void 0&&(i.sheenRoughness=this.sheenRoughness),this.emissive&&this.emissive.isColor&&(i.emissive=this.emissive.getHex()),this.emissiveIntensity!==void 0&&(i.emissiveIntensity=this.emissiveIntensity),this.specular&&this.specular.isColor&&(i.specular=this.specular.getHex()),this.specularIntensity!==void 0&&(i.specularIntensity=this.specularIntensity),this.specularColor&&this.specularColor.isColor&&(i.specularColor=this.specularColor.getHex()),this.shininess!==void 0&&(i.shininess=this.shininess),this.clearcoat!==void 0&&(i.clearcoat=this.clearcoat),this.clearcoatRoughness!==void 0&&(i.clearcoatRoughness=this.clearcoatRoughness),this.clearcoatMap&&this.clearcoatMap.isTexture&&(i.clearcoatMap=this.clearcoatMap.toJSON(e).uuid),this.clearcoatRoughnessMap&&this.clearcoatRoughnessMap.isTexture&&(i.clearcoatRoughnessMap=this.clearcoatRoughnessMap.toJSON(e).uuid),this.clearcoatNormalMap&&this.clearcoatNormalMap.isTexture&&(i.clearcoatNormalMap=this.clearcoatNormalMap.toJSON(e).uuid,i.clearcoatNormalScale=this.clearcoatNormalScale.toArray()),this.sheenColorMap&&this.sheenColorMap.isTexture&&(i.sheenColorMap=this.sheenColorMap.toJSON(e).uuid),this.sheenRoughnessMap&&this.sheenRoughnessMap.isTexture&&(i.sheenRoughnessMap=this.sheenRoughnessMap.toJSON(e).uuid),this.dispersion!==void 0&&(i.dispersion=this.dispersion),this.retroreflectivity!==void 0&&(i.retroreflectivity=this.retroreflectivity),this.iridescence!==void 0&&(i.iridescence=this.iridescence),this.iridescenceIOR!==void 0&&(i.iridescenceIOR=this.iridescenceIOR),this.iridescenceThicknessRange!==void 0&&(i.iridescenceThicknessRange=this.iridescenceThicknessRange),this.iridescenceMap&&this.iridescenceMap.isTexture&&(i.iridescenceMap=this.iridescenceMap.toJSON(e).uuid),this.iridescenceThicknessMap&&this.iridescenceThicknessMap.isTexture&&(i.iridescenceThicknessMap=this.iridescenceThicknessMap.toJSON(e).uuid),this.anisotropy!==void 0&&(i.anisotropy=this.anisotropy),this.anisotropyRotation!==void 0&&(i.anisotropyRotation=this.anisotropyRotation),this.anisotropyMap&&this.anisotropyMap.isTexture&&(i.anisotropyMap=this.anisotropyMap.toJSON(e).uuid),this.map&&this.map.isTexture&&(i.map=this.map.toJSON(e).uuid),this.matcap&&this.matcap.isTexture&&(i.matcap=this.matcap.toJSON(e).uuid),this.alphaMap&&this.alphaMap.isTexture&&(i.alphaMap=this.alphaMap.toJSON(e).uuid),this.lightMap&&this.lightMap.isTexture&&(i.lightMap=this.lightMap.toJSON(e).uuid,i.lightMapIntensity=this.lightMapIntensity),this.aoMap&&this.aoMap.isTexture&&(i.aoMap=this.aoMap.toJSON(e).uuid,i.aoMapIntensity=this.aoMapIntensity),this.bumpMap&&this.bumpMap.isTexture&&(i.bumpMap=this.bumpMap.toJSON(e).uuid,i.bumpScale=this.bumpScale),this.normalMap&&this.normalMap.isTexture&&(i.normalMap=this.normalMap.toJSON(e).uuid,i.normalMapType=this.normalMapType,i.normalScale=this.normalScale.toArray()),this.displacementMap&&this.displacementMap.isTexture&&(i.displacementMap=this.displacementMap.toJSON(e).uuid,i.displacementScale=this.displacementScale,i.displacementBias=this.displacementBias),this.roughnessMap&&this.roughnessMap.isTexture&&(i.roughnessMap=this.roughnessMap.toJSON(e).uuid),this.metalnessMap&&this.metalnessMap.isTexture&&(i.metalnessMap=this.metalnessMap.toJSON(e).uuid),this.emissiveMap&&this.emissiveMap.isTexture&&(i.emissiveMap=this.emissiveMap.toJSON(e).uuid),this.specularMap&&this.specularMap.isTexture&&(i.specularMap=this.specularMap.toJSON(e).uuid),this.specularIntensityMap&&this.specularIntensityMap.isTexture&&(i.specularIntensityMap=this.specularIntensityMap.toJSON(e).uuid),this.specularColorMap&&this.specularColorMap.isTexture&&(i.specularColorMap=this.specularColorMap.toJSON(e).uuid),this.envMap&&this.envMap.isTexture&&(i.envMap=this.envMap.toJSON(e).uuid,this.combine!==void 0&&(i.combine=this.combine)),this.envMapRotation!==void 0&&(i.envMapRotation=this.envMapRotation.toArray()),this.envMapIntensity!==void 0&&(i.envMapIntensity=this.envMapIntensity),this.reflectivity!==void 0&&(i.reflectivity=this.reflectivity),this.refractionRatio!==void 0&&(i.refractionRatio=this.refractionRatio),this.gradientMap&&this.gradientMap.isTexture&&(i.gradientMap=this.gradientMap.toJSON(e).uuid),this.transmission!==void 0&&(i.transmission=this.transmission),this.transmissionMap&&this.transmissionMap.isTexture&&(i.transmissionMap=this.transmissionMap.toJSON(e).uuid),this.thickness!==void 0&&(i.thickness=this.thickness),this.thicknessMap&&this.thicknessMap.isTexture&&(i.thicknessMap=this.thicknessMap.toJSON(e).uuid),this.attenuationDistance!==void 0&&(i.attenuationDistance=this.attenuationDistance),this.attenuationColor!==void 0&&(i.attenuationColor=this.attenuationColor.getHex()),this.size!==void 0&&(i.size=this.size),this.sizeAttenuation!==void 0&&(i.sizeAttenuation=this.sizeAttenuation),Array.isArray(this.clippingPlanes)&&this.clippingPlanes.length>0&&(i.clippingPlanes=this.clippingPlanes.map(o=>o.toJSON())),this.rotation!==void 0&&(i.rotation=this.rotation),this.depthPacking!==void 0&&(i.depthPacking=this.depthPacking),this.linewidth!==void 0&&(i.linewidth=this.linewidth),this.linecap!==void 0&&(i.linecap=this.linecap),this.linejoin!==void 0&&(i.linejoin=this.linejoin),this.dashSize!==void 0&&(i.dashSize=this.dashSize),this.gapSize!==void 0&&(i.gapSize=this.gapSize),this.scale!==void 0&&(i.scale=this.scale),this.wireframe!==void 0&&(i.wireframe=this.wireframe),this.wireframeLinewidth!==void 0&&(i.wireframeLinewidth=this.wireframeLinewidth),this.wireframeLinecap!==void 0&&(i.wireframeLinecap=this.wireframeLinecap),this.wireframeLinejoin!==void 0&&(i.wireframeLinejoin=this.wireframeLinejoin),this.flatShading!==void 0&&(i.flatShading=this.flatShading),this.fog!==void 0&&(i.fog=this.fog),Object.keys(this.userData).length>0&&(i.userData=this.userData);function r(o){let s=[];for(let a in o){let c=o[a];delete c.metadata,s.push(c)}return s}if(t){let o=r(e.textures),s=r(e.images);o.length>0&&(i.textures=o),s.length>0&&(i.images=s)}return i}fromJSON(e,t){if(e.uuid!==void 0&&(this.uuid=e.uuid),e.name!==void 0&&(this.name=e.name),e.color!==void 0&&this.color!==void 0&&this.color.setHex(e.color),e.roughness!==void 0&&(this.roughness=e.roughness),e.metalness!==void 0&&(this.metalness=e.metalness),e.sheen!==void 0&&(this.sheen=e.sheen),e.sheenColor!==void 0&&(this.sheenColor=new Le().setHex(e.sheenColor)),e.sheenRoughness!==void 0&&(this.sheenRoughness=e.sheenRoughness),e.emissive!==void 0&&this.emissive!==void 0&&this.emissive.setHex(e.emissive),e.specular!==void 0&&this.specular!==void 0&&this.specular.setHex(e.specular),e.specularIntensity!==void 0&&(this.specularIntensity=e.specularIntensity),e.specularColor!==void 0&&this.specularColor!==void 0&&this.specularColor.setHex(e.specularColor),e.shininess!==void 0&&(this.shininess=e.shininess),e.clearcoat!==void 0&&(this.clearcoat=e.clearcoat),e.clearcoatRoughness!==void 0&&(this.clearcoatRoughness=e.clearcoatRoughness),e.dispersion!==void 0&&(this.dispersion=e.dispersion),e.retroreflectivity!==void 0&&(this.retroreflectivity=e.retroreflectivity),e.iridescence!==void 0&&(this.iridescence=e.iridescence),e.iridescenceIOR!==void 0&&(this.iridescenceIOR=e.iridescenceIOR),e.iridescenceThicknessRange!==void 0&&(this.iridescenceThicknessRange=e.iridescenceThicknessRange),e.transmission!==void 0&&(this.transmission=e.transmission),e.thickness!==void 0&&(this.thickness=e.thickness),e.attenuationDistance!==void 0&&(this.attenuationDistance=e.attenuationDistance),e.attenuationColor!==void 0&&this.attenuationColor!==void 0&&this.attenuationColor.setHex(e.attenuationColor),e.anisotropy!==void 0&&(this.anisotropy=e.anisotropy),e.anisotropyRotation!==void 0&&(this.anisotropyRotation=e.anisotropyRotation),e.fog!==void 0&&(this.fog=e.fog),e.flatShading!==void 0&&(this.flatShading=e.flatShading),e.blending!==void 0&&(this.blending=e.blending),e.combine!==void 0&&(this.combine=e.combine),e.side!==void 0&&(this.side=e.side),e.shadowSide!==void 0&&(this.shadowSide=e.shadowSide),e.opacity!==void 0&&(this.opacity=e.opacity),e.transparent!==void 0&&(this.transparent=e.transparent),e.alphaTest!==void 0&&(this.alphaTest=e.alphaTest),e.alphaHash!==void 0&&(this.alphaHash=e.alphaHash),e.depthFunc!==void 0&&(this.depthFunc=e.depthFunc),e.depthTest!==void 0&&(this.depthTest=e.depthTest),e.depthWrite!==void 0&&(this.depthWrite=e.depthWrite),e.colorWrite!==void 0&&(this.colorWrite=e.colorWrite),e.clippingPlanes!==void 0&&(this.clippingPlanes=e.clippingPlanes.map(i=>new ui().fromJSON(i))),e.clipIntersection!==void 0&&(this.clipIntersection=e.clipIntersection),e.clipShadows!==void 0&&(this.clipShadows=e.clipShadows),e.depthPacking!==void 0&&(this.depthPacking=e.depthPacking),e.blendSrc!==void 0&&(this.blendSrc=e.blendSrc),e.blendDst!==void 0&&(this.blendDst=e.blendDst),e.blendEquation!==void 0&&(this.blendEquation=e.blendEquation),e.blendSrcAlpha!==void 0&&(this.blendSrcAlpha=e.blendSrcAlpha),e.blendDstAlpha!==void 0&&(this.blendDstAlpha=e.blendDstAlpha),e.blendEquationAlpha!==void 0&&(this.blendEquationAlpha=e.blendEquationAlpha),e.blendColor!==void 0&&this.blendColor!==void 0&&this.blendColor.setHex(e.blendColor),e.blendAlpha!==void 0&&(this.blendAlpha=e.blendAlpha),e.stencilWriteMask!==void 0&&(this.stencilWriteMask=e.stencilWriteMask),e.stencilFunc!==void 0&&(this.stencilFunc=e.stencilFunc),e.stencilRef!==void 0&&(this.stencilRef=e.stencilRef),e.stencilFuncMask!==void 0&&(this.stencilFuncMask=e.stencilFuncMask),e.stencilFail!==void 0&&(this.stencilFail=e.stencilFail),e.stencilZFail!==void 0&&(this.stencilZFail=e.stencilZFail),e.stencilZPass!==void 0&&(this.stencilZPass=e.stencilZPass),e.stencilWrite!==void 0&&(this.stencilWrite=e.stencilWrite),e.wireframe!==void 0&&(this.wireframe=e.wireframe),e.wireframeLinewidth!==void 0&&(this.wireframeLinewidth=e.wireframeLinewidth),e.wireframeLinecap!==void 0&&(this.wireframeLinecap=e.wireframeLinecap),e.wireframeLinejoin!==void 0&&(this.wireframeLinejoin=e.wireframeLinejoin),e.rotation!==void 0&&(this.rotation=e.rotation),e.linewidth!==void 0&&(this.linewidth=e.linewidth),e.linecap!==void 0&&(this.linecap=e.linecap),e.linejoin!==void 0&&(this.linejoin=e.linejoin),e.dashSize!==void 0&&(this.dashSize=e.dashSize),e.gapSize!==void 0&&(this.gapSize=e.gapSize),e.scale!==void 0&&(this.scale=e.scale),e.polygonOffset!==void 0&&(this.polygonOffset=e.polygonOffset),e.polygonOffsetFactor!==void 0&&(this.polygonOffsetFactor=e.polygonOffsetFactor),e.polygonOffsetUnits!==void 0&&(this.polygonOffsetUnits=e.polygonOffsetUnits),e.dithering!==void 0&&(this.dithering=e.dithering),e.alphaToCoverage!==void 0&&(this.alphaToCoverage=e.alphaToCoverage),e.premultipliedAlpha!==void 0&&(this.premultipliedAlpha=e.premultipliedAlpha),e.forceSinglePass!==void 0&&(this.forceSinglePass=e.forceSinglePass),e.allowOverride!==void 0&&(this.allowOverride=e.allowOverride),e.visible!==void 0&&(this.visible=e.visible),e.toneMapped!==void 0&&(this.toneMapped=e.toneMapped),e.userData!==void 0&&(this.userData=e.userData),e.vertexColors!==void 0&&(typeof e.vertexColors=="number"?this.vertexColors=e.vertexColors>0:this.vertexColors=e.vertexColors),e.size!==void 0&&(this.size=e.size),e.sizeAttenuation!==void 0&&(this.sizeAttenuation=e.sizeAttenuation),e.map!==void 0&&(this.map=t[e.map]||null),e.matcap!==void 0&&(this.matcap=t[e.matcap]||null),e.alphaMap!==void 0&&(this.alphaMap=t[e.alphaMap]||null),e.bumpMap!==void 0&&(this.bumpMap=t[e.bumpMap]||null),e.bumpScale!==void 0&&(this.bumpScale=e.bumpScale),e.normalMap!==void 0&&(this.normalMap=t[e.normalMap]||null),e.normalMapType!==void 0&&(this.normalMapType=e.normalMapType),e.normalScale!==void 0){let i=e.normalScale;Array.isArray(i)===!1&&(i=[i,i]),this.normalScale=new Ce().fromArray(i)}return e.displacementMap!==void 0&&(this.displacementMap=t[e.displacementMap]||null),e.displacementScale!==void 0&&(this.displacementScale=e.displacementScale),e.displacementBias!==void 0&&(this.displacementBias=e.displacementBias),e.roughnessMap!==void 0&&(this.roughnessMap=t[e.roughnessMap]||null),e.metalnessMap!==void 0&&(this.metalnessMap=t[e.metalnessMap]||null),e.emissiveMap!==void 0&&(this.emissiveMap=t[e.emissiveMap]||null),e.emissiveIntensity!==void 0&&(this.emissiveIntensity=e.emissiveIntensity),e.specularMap!==void 0&&(this.specularMap=t[e.specularMap]||null),e.specularIntensityMap!==void 0&&(this.specularIntensityMap=t[e.specularIntensityMap]||null),e.specularColorMap!==void 0&&(this.specularColorMap=t[e.specularColorMap]||null),e.envMap!==void 0&&(this.envMap=t[e.envMap]||null),e.envMapRotation!==void 0&&this.envMapRotation.fromArray(e.envMapRotation),e.envMapIntensity!==void 0&&(this.envMapIntensity=e.envMapIntensity),e.reflectivity!==void 0&&(this.reflectivity=e.reflectivity),e.refractionRatio!==void 0&&(this.refractionRatio=e.refractionRatio),e.lightMap!==void 0&&(this.lightMap=t[e.lightMap]||null),e.lightMapIntensity!==void 0&&(this.lightMapIntensity=e.lightMapIntensity),e.aoMap!==void 0&&(this.aoMap=t[e.aoMap]||null),e.aoMapIntensity!==void 0&&(this.aoMapIntensity=e.aoMapIntensity),e.gradientMap!==void 0&&(this.gradientMap=t[e.gradientMap]||null),e.clearcoatMap!==void 0&&(this.clearcoatMap=t[e.clearcoatMap]||null),e.clearcoatRoughnessMap!==void 0&&(this.clearcoatRoughnessMap=t[e.clearcoatRoughnessMap]||null),e.clearcoatNormalMap!==void 0&&(this.clearcoatNormalMap=t[e.clearcoatNormalMap]||null),e.clearcoatNormalScale!==void 0&&(this.clearcoatNormalScale=new Ce().fromArray(e.clearcoatNormalScale)),e.iridescenceMap!==void 0&&(this.iridescenceMap=t[e.iridescenceMap]||null),e.iridescenceThicknessMap!==void 0&&(this.iridescenceThicknessMap=t[e.iridescenceThicknessMap]||null),e.transmissionMap!==void 0&&(this.transmissionMap=t[e.transmissionMap]||null),e.thicknessMap!==void 0&&(this.thicknessMap=t[e.thicknessMap]||null),e.anisotropyMap!==void 0&&(this.anisotropyMap=t[e.anisotropyMap]||null),e.sheenColorMap!==void 0&&(this.sheenColorMap=t[e.sheenColorMap]||null),e.sheenRoughnessMap!==void 0&&(this.sheenRoughnessMap=t[e.sheenRoughnessMap]||null),this}clone(){return new this.constructor().copy(this)}copy(e){this.name=e.name,this.blending=e.blending,this.side=e.side,this.vertexColors=e.vertexColors,this.opacity=e.opacity,this.transparent=e.transparent,this.blendSrc=e.blendSrc,this.blendDst=e.blendDst,this.blendEquation=e.blendEquation,this.blendSrcAlpha=e.blendSrcAlpha,this.blendDstAlpha=e.blendDstAlpha,this.blendEquationAlpha=e.blendEquationAlpha,this.blendColor.copy(e.blendColor),this.blendAlpha=e.blendAlpha,this.depthFunc=e.depthFunc,this.depthTest=e.depthTest,this.depthWrite=e.depthWrite,this.stencilWriteMask=e.stencilWriteMask,this.stencilFunc=e.stencilFunc,this.stencilRef=e.stencilRef,this.stencilFuncMask=e.stencilFuncMask,this.stencilFail=e.stencilFail,this.stencilZFail=e.stencilZFail,this.stencilZPass=e.stencilZPass,this.stencilWrite=e.stencilWrite;let t=e.clippingPlanes,i=null;if(t!==null){let r=t.length;i=new Array(r);for(let o=0;o!==r;++o)i[o]=t[o].clone()}return this.clippingPlanes=i,this.clipIntersection=e.clipIntersection,this.clipShadows=e.clipShadows,this.shadowSide=e.shadowSide,this.colorWrite=e.colorWrite,this.precision=e.precision,this.polygonOffset=e.polygonOffset,this.polygonOffsetFactor=e.polygonOffsetFactor,this.polygonOffsetUnits=e.polygonOffsetUnits,this.dithering=e.dithering,this.alphaTest=e.alphaTest,this.alphaHash=e.alphaHash,this.alphaToCoverage=e.alphaToCoverage,this.premultipliedAlpha=e.premultipliedAlpha,this.forceSinglePass=e.forceSinglePass,this.allowOverride=e.allowOverride,this.visible=e.visible,this.toneMapped=e.toneMapped,this.userData=JSON.parse(JSON.stringify(e.userData)),this}dispose(){this.dispatchEvent({type:"dispose"})}set needsUpdate(e){e===!0&&this.version++}};var an=new D,hl=new D,Ws=new D,Xs=new D,Ei=class{constructor(e=new D,t=new D(0,0,-1)){this.origin=e,this.direction=t}set(e,t){return this.origin.copy(e),this.direction.copy(t),this}copy(e){return this.origin.copy(e.origin),this.direction.copy(e.direction),this}at(e,t){return t.copy(this.origin).addScaledVector(this.direction,e)}lookAt(e){return this.direction.copy(e).sub(this.origin).normalize(),this}recast(e){return this.origin.copy(this.at(e,an)),this}closestPointToPoint(e,t){t.subVectors(e,this.origin);let i=t.dot(this.direction);return i<0?t.copy(this.origin):t.copy(this.origin).addScaledVector(this.direction,i)}distanceToPoint(e){return Math.sqrt(this.distanceSqToPoint(e))}distanceSqToPoint(e){let t=an.subVectors(e,this.origin).dot(this.direction);return t<0?this.origin.distanceToSquared(e):(an.copy(this.origin).addScaledVector(this.direction,t),an.distanceToSquared(e))}distanceSqToSegment(e,t,i,r){hl.copy(e).add(t).multiplyScalar(.5),Ws.copy(t).sub(e).normalize(),Xs.copy(this.origin).sub(hl);let o=e.distanceTo(t)*.5,s=-this.direction.dot(Ws),a=Xs.dot(this.direction),c=-Xs.dot(Ws),l=Xs.lengthSq(),h=Math.abs(1-s*s),m,f,g,x;if(h>0)if(m=s*c-a,f=s*a-c,x=o*h,m>=0)if(f>=-x)if(f<=x){let S=1/h;m*=S,f*=S,g=m*(m+s*f+2*a)+f*(s*m+f+2*c)+l}else f=o,m=Math.max(0,-(s*f+a)),g=-m*m+f*(f+2*c)+l;else f=-o,m=Math.max(0,-(s*f+a)),g=-m*m+f*(f+2*c)+l;else f<=-x?(m=Math.max(0,-(-s*o+a)),f=m>0?-o:Math.min(Math.max(-o,-c),o),g=-m*m+f*(f+2*c)+l):f<=x?(m=0,f=Math.min(Math.max(-o,-c),o),g=f*(f+2*c)+l):(m=Math.max(0,-(s*o+a)),f=m>0?o:Math.min(Math.max(-o,-c),o),g=-m*m+f*(f+2*c)+l);else f=s>0?-o:o,m=Math.max(0,-(s*f+a)),g=-m*m+f*(f+2*c)+l;return i&&i.copy(this.origin).addScaledVector(this.direction,m),r&&r.copy(hl).addScaledVector(Ws,f),g}intersectSphere(e,t){if(e.radius<0)return null;an.subVectors(e.center,this.origin);let i=an.dot(this.direction),r=an.dot(an)-i*i,o=e.radius*e.radius;if(r>o)return null;let s=Math.sqrt(o-r),a=i-s,c=i+s;return c<0?null:a<0?this.at(c,t):this.at(a,t)}intersectsSphere(e){return e.radius<0?!1:this.distanceSqToPoint(e.center)<=e.radius*e.radius}distanceToPlane(e){let t=e.normal.dot(this.direction);if(t===0)return e.distanceToPoint(this.origin)===0?0:null;let i=-(this.origin.dot(e.normal)+e.constant)/t;return i>=0?i:null}intersectPlane(e,t){let i=this.distanceToPlane(e);return i===null?null:this.at(i,t)}intersectsPlane(e){let t=e.distanceToPoint(this.origin);return t===0||e.normal.dot(this.direction)*t<0}intersectBox(e,t){let i,r,o,s,a,c,l=1/this.direction.x,h=1/this.direction.y,m=1/this.direction.z,f=this.origin;return l>=0?(i=(e.min.x-f.x)*l,r=(e.max.x-f.x)*l):(i=(e.max.x-f.x)*l,r=(e.min.x-f.x)*l),h>=0?(o=(e.min.y-f.y)*h,s=(e.max.y-f.y)*h):(o=(e.max.y-f.y)*h,s=(e.min.y-f.y)*h),i>s||o>r||((o>i||isNaN(i))&&(i=o),(s<r||isNaN(r))&&(r=s),m>=0?(a=(e.min.z-f.z)*m,c=(e.max.z-f.z)*m):(a=(e.max.z-f.z)*m,c=(e.min.z-f.z)*m),i>c||a>r)||((a>i||i!==i)&&(i=a),(c<r||r!==r)&&(r=c),r<0)?null:this.at(i>=0?i:r,t)}intersectsBox(e){return this.intersectBox(e,an)!==null}intersectTriangle(e,t,i,r,o){let s=this.origin,a=this.direction,c=a.x,l=a.y,h=a.z,m=e.x-s.x,f=e.y-s.y,g=e.z-s.z,x=t.x-s.x,S=t.y-s.y,_=t.z-s.z,p=i.x-s.x,A=i.y-s.y,P=i.z-s.z,y=Math.abs(c),E=Math.abs(l),b=Math.abs(h),R,d,T,L,F,B,X,U,K,ee,j,le;if(y>=E&&y>=b?(T=c,B=m,K=x,le=p,c>=0?(R=l,d=h,L=f,F=g,X=S,U=_,ee=A,j=P):(R=h,d=l,L=g,F=f,X=_,U=S,ee=P,j=A)):E>=b?(T=l,B=f,K=S,le=A,l>=0?(R=h,d=c,L=g,F=m,X=_,U=x,ee=P,j=p):(R=c,d=h,L=m,F=g,X=x,U=_,ee=p,j=P)):(T=h,B=g,K=_,le=P,h>=0?(R=c,d=l,L=m,F=f,X=x,U=S,ee=p,j=A):(R=l,d=c,L=f,F=m,X=S,U=x,ee=A,j=p)),T===0)return null;let te=R/T,he=d/T,pe=1/T,We=L-te*B,ze=F-he*B,pt=X-te*K,at=U-he*K,ht=ee-te*le,$=j-he*le,de=ht*at-$*pt,Ne=We*$-ze*ht,Je=pt*ze-at*We;if(r){if(de<0||Ne<0||Je<0)return null}else if((de<0||Ne<0||Je<0)&&(de>0||Ne>0||Je>0))return null;let Fe=de+Ne+Je;if(Fe===0)return null;let Ye=pe*(de*B+Ne*K+Je*le);return(Fe>0?Ye<0:Ye>0)?null:this.at(Ye/Fe,o)}applyMatrix4(e){return this.origin.applyMatrix4(e),this.direction.transformDirection(e),this}equals(e){return e.origin.equals(this.origin)&&e.direction.equals(this.direction)}clone(){return new this.constructor().copy(this)}};var ei=class extends fi{constructor(e){super(),this.isMeshBasicMaterial=!0,this.type="MeshBasicMaterial",this.color=new Le(16777215),this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.specularMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new Ci,this.combine=ms,this.reflectivity=1,this.refractionRatio=.98,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.lightMap=e.lightMap,this.lightMapIntensity=e.lightMapIntensity,this.aoMap=e.aoMap,this.aoMapIntensity=e.aoMapIntensity,this.specularMap=e.specularMap,this.alphaMap=e.alphaMap,this.envMap=e.envMap,this.envMapRotation.copy(e.envMapRotation),this.combine=e.combine,this.reflectivity=e.reflectivity,this.refractionRatio=e.refractionRatio,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.wireframeLinecap=e.wireframeLinecap,this.wireframeLinejoin=e.wireframeLinejoin,this.fog=e.fog,this}};var Vc=new it,Zn=new Ei,qs=new Pi,Wc=new D,Ys=new D,Ks=new D,Zs=new D,dl=new D,Js=new D,Xc=new D,$s=new D,Se=class extends St{constructor(e=new gt,t=new ei){super(),this.isMesh=!0,this.type="Mesh",this.geometry=e,this.material=t,this.morphTargetDictionary=void 0,this.morphTargetInfluences=void 0,this.count=1,this.updateMorphTargets()}copy(e,t){return super.copy(e,t),e.morphTargetInfluences!==void 0&&(this.morphTargetInfluences=e.morphTargetInfluences.slice()),e.morphTargetDictionary!==void 0&&(this.morphTargetDictionary=Object.assign({},e.morphTargetDictionary)),this.material=Array.isArray(e.material)?e.material.slice():e.material,this.geometry=e.geometry,this}updateMorphTargets(){let t=this.geometry.morphAttributes,i=Object.keys(t);if(i.length>0){let r=t[i[0]];if(r!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let o=0,s=r.length;o<s;o++){let a=r[o].name||String(o);this.morphTargetInfluences.push(0),this.morphTargetDictionary[a]=o}}}}getVertexPosition(e,t){let i=this.geometry,r=i.attributes.position,o=i.morphAttributes.position,s=i.morphTargetsRelative;t.fromBufferAttribute(r,e);let a=this.morphTargetInfluences;if(o&&a){Js.set(0,0,0);for(let c=0,l=o.length;c<l;c++){let h=a[c],m=o[c];h!==0&&(dl.fromBufferAttribute(m,e),s?Js.addScaledVector(dl,h):Js.addScaledVector(dl.sub(t),h))}t.add(Js)}return t}intersectsFrustum(e){return e.intersectsObject(this)}raycast(e,t){let i=this.geometry,r=this.material,o=this.matrixWorld;r!==void 0&&(i.boundingSphere===null&&i.computeBoundingSphere(),qs.copy(i.boundingSphere),qs.applyMatrix4(o),Zn.copy(e.ray).recast(e.near),!(qs.containsPoint(Zn.origin)===!1&&(Zn.intersectSphere(qs,Wc)===null||Zn.origin.distanceToSquared(Wc)>(e.far-e.near)**2))&&(Vc.copy(o).invert(),Zn.copy(e.ray).applyMatrix4(Vc),!(i.boundingBox!==null&&Zn.intersectsBox(i.boundingBox)===!1)&&this._computeIntersections(e,t,Zn)))}_computeIntersections(e,t,i){let r,o=this.geometry,s=this.material,a=o.index,c=o.attributes.position,l=o.attributes.uv,h=o.attributes.uv1,m=o.attributes.normal,f=o.groups,g=o.drawRange;if(a!==null)if(Array.isArray(s))for(let x=0,S=f.length;x<S;x++){let _=f[x],p=s[_.materialIndex],A=Math.max(_.start,g.start),P=Math.min(a.count,Math.min(_.start+_.count,g.start+g.count));for(let y=A,E=P;y<E;y+=3){let b=a.getX(y),R=a.getX(y+1),d=a.getX(y+2);r=Qs(this,p,e,i,l,h,m,b,R,d),r&&(r.faceIndex=Math.floor(y/3),r.face.materialIndex=_.materialIndex,t.push(r))}}else{let x=Math.max(0,g.start),S=Math.min(a.count,g.start+g.count);for(let _=x,p=S;_<p;_+=3){let A=a.getX(_),P=a.getX(_+1),y=a.getX(_+2);r=Qs(this,s,e,i,l,h,m,A,P,y),r&&(r.faceIndex=Math.floor(_/3),t.push(r))}}else if(c!==void 0)if(Array.isArray(s))for(let x=0,S=f.length;x<S;x++){let _=f[x],p=s[_.materialIndex],A=Math.max(_.start,g.start),P=Math.min(c.count,Math.min(_.start+_.count,g.start+g.count));for(let y=A,E=P;y<E;y+=3){let b=y,R=y+1,d=y+2;r=Qs(this,p,e,i,l,h,m,b,R,d),r&&(r.faceIndex=Math.floor(y/3),r.face.materialIndex=_.materialIndex,t.push(r))}}else{let x=Math.max(0,g.start),S=Math.min(c.count,g.start+g.count);for(let _=x,p=S;_<p;_+=3){let A=_,P=_+1,y=_+2;r=Qs(this,s,e,i,l,h,m,A,P,y),r&&(r.faceIndex=Math.floor(_/3),t.push(r))}}}};function cm(n,e,t,i,r,o,s,a){let c;if(e.side===Ct?c=i.intersectTriangle(s,o,r,!0,a):c=i.intersectTriangle(r,o,s,e.side===Ti,a),c===null)return null;$s.copy(a),$s.applyMatrix4(n.matrixWorld);let l=t.ray.origin.distanceTo($s);return l<t.near||l>t.far?null:{distance:l,point:$s.clone(),object:n}}function Qs(n,e,t,i,r,o,s,a,c,l){n.getVertexPosition(a,Ys),n.getVertexPosition(c,Ks),n.getVertexPosition(l,Zs);let h=cm(n,e,t,i,Ys,Ks,Zs,Xc);if(h){let m=new D;Xi.getBarycoord(Xc,Ys,Ks,Zs,m),r&&(h.uv=Xi.getInterpolatedAttribute(r,a,c,l,m,new Ce)),o&&(h.uv1=Xi.getInterpolatedAttribute(o,a,c,l,m,new Ce)),s&&(h.normal=Xi.getInterpolatedAttribute(s,a,c,l,m,new D),h.normal.dot(i.direction)>0&&h.normal.multiplyScalar(-1));let f={a,b:c,c:l,normal:new D,materialIndex:0};Xi.getNormal(Ys,Ks,Zs,f.normal),h.face=f,h.barycoord=m}return h}var js=class extends Ft{constructor(e=null,t=1,i=1,r,o,s,a,c,l=Dt,h=Dt,m,f){super(null,s,a,c,l,h,r,o,m,f),this.isDataTexture=!0,this.image={data:e,width:t,height:i},this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}};var Jn=new Pi,um=new Ce(.5,.5),ea=new D,An=class{constructor(e=new ui,t=new ui,i=new ui,r=new ui,o=new ui,s=new ui){this.planes=[e,t,i,r,o,s]}set(e,t,i,r,o,s){let a=this.planes;return a[0].copy(e),a[1].copy(t),a[2].copy(i),a[3].copy(r),a[4].copy(o),a[5].copy(s),this}copy(e){let t=this.planes;for(let i=0;i<6;i++)t[i].copy(e.planes[i]);return this}setFromProjectionMatrix(e,t=mi,i=!1){let r=this.planes,o=e.elements,s=o[0],a=o[1],c=o[2],l=o[3],h=o[4],m=o[5],f=o[6],g=o[7],x=o[8],S=o[9],_=o[10],p=o[11],A=o[12],P=o[13],y=o[14],E=o[15];if(r[0].setComponents(l-s,g-h,p-x,E-A).normalize(),r[1].setComponents(l+s,g+h,p+x,E+A).normalize(),r[2].setComponents(l+a,g+m,p+S,E+P).normalize(),r[3].setComponents(l-a,g-m,p-S,E-P).normalize(),i)r[4].setComponents(c,f,_,y).normalize(),r[5].setComponents(l-c,g-f,p-_,E-y).normalize();else if(r[4].setComponents(l-c,g-f,p-_,E-y).normalize(),t===mi)r[5].setComponents(l+c,g+f,p+_,E+y).normalize();else if(t===en)r[5].setComponents(c,f,_,y).normalize();else throw new Error("THREE.Frustum.setFromProjectionMatrix(): Invalid coordinate system: "+t);return this}intersectsObject(e){if(e.boundingSphere!==void 0)e.boundingSphere===null&&e.computeBoundingSphere(),Jn.copy(e.boundingSphere).applyMatrix4(e.matrixWorld);else{let t=e.geometry;t.boundingSphere===null&&t.computeBoundingSphere(),Jn.copy(t.boundingSphere).applyMatrix4(e.matrixWorld)}return this.intersectsSphere(Jn)}intersectsSprite(e){Jn.center.set(0,0,0);let t=um.distanceTo(e.center);return Jn.radius=.7071067811865476+t,Jn.applyMatrix4(e.matrixWorld),this.intersectsSphere(Jn)}intersectsSphere(e){let t=this.planes,i=e.center,r=-e.radius;for(let o=0;o<6;o++)if(t[o].distanceToPoint(i)<r)return!1;return!0}intersectsBox(e){let t=this.planes;for(let i=0;i<6;i++){let r=t[i];if(ea.x=r.normal.x>0?e.max.x:e.min.x,ea.y=r.normal.y>0?e.max.y:e.min.y,ea.z=r.normal.z>0?e.max.z:e.min.z,r.distanceToPoint(ea)<0)return!1}return!0}containsPoint(e){let t=this.planes;for(let i=0;i<6;i++)if(t[i].distanceToPoint(e)<0)return!1;return!0}clone(){return new this.constructor().copy(this)}};var ln=class extends fi{constructor(e){super(),this.isLineBasicMaterial=!0,this.type="LineBasicMaterial",this.color=new Le(16777215),this.map=null,this.linewidth=1,this.linecap="round",this.linejoin="round",this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.linewidth=e.linewidth,this.linecap=e.linecap,this.linejoin=e.linejoin,this.fog=e.fog,this}};var na=new D,ra=new D,qc=new it,Qo=new Ei,ta=new Pi,pl=new D,Yc=new D,oa=class extends St{constructor(e=new gt,t=new ln){super(),this.isLine=!0,this.type="Line",this.geometry=e,this.material=t,this.morphTargetDictionary=void 0,this.morphTargetInfluences=void 0,this.updateMorphTargets()}copy(e,t){return super.copy(e,t),this.material=Array.isArray(e.material)?e.material.slice():e.material,this.geometry=e.geometry,this}computeLineDistances(){let e=this.geometry;if(e.index===null){let t=e.attributes.position,i=[0];for(let r=1,o=t.count;r<o;r++)na.fromBufferAttribute(t,r-1),ra.fromBufferAttribute(t,r),i[r]=i[r-1],i[r]+=na.distanceTo(ra);e.setAttribute("lineDistance",new ft(i,1))}else Ue("Line.computeLineDistances(): Computation only possible with non-indexed BufferGeometry.");return this}intersectsFrustum(e){return e.intersectsObject(this)}raycast(e,t){let i=this.geometry,r=this.matrixWorld,o=e.params.Line.threshold,s=i.drawRange;if(i.boundingSphere===null&&i.computeBoundingSphere(),ta.copy(i.boundingSphere),ta.applyMatrix4(r),ta.radius+=o,e.ray.intersectsSphere(ta)===!1)return;qc.copy(r).invert(),Qo.copy(e.ray).applyMatrix4(qc);let a=o/((this.scale.x+this.scale.y+this.scale.z)/3),c=a*a,l=this.isLineSegments?2:1,h=i.index,f=i.attributes.position;if(h!==null){let g=Math.max(0,s.start),x=Math.min(h.count,s.start+s.count);for(let S=g,_=x-1;S<_;S+=l){let p=h.getX(S),A=h.getX(S+1),P=ia(this,e,Qo,c,p,A,S);P&&t.push(P)}if(this.isLineLoop){let S=h.getX(x-1),_=h.getX(g),p=ia(this,e,Qo,c,S,_,x-1);p&&t.push(p)}}else{let g=Math.max(0,s.start),x=Math.min(f.count,s.start+s.count);for(let S=g,_=x-1;S<_;S+=l){let p=ia(this,e,Qo,c,S,S+1,S);p&&t.push(p)}if(this.isLineLoop){let S=ia(this,e,Qo,c,x-1,g,x-1);S&&t.push(S)}}}updateMorphTargets(){let t=this.geometry.morphAttributes,i=Object.keys(t);if(i.length>0){let r=t[i[0]];if(r!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let o=0,s=r.length;o<s;o++){let a=r[o].name||String(o);this.morphTargetInfluences.push(0),this.morphTargetDictionary[a]=o}}}}};function ia(n,e,t,i,r,o,s){let a=n.geometry.attributes.position;if(na.fromBufferAttribute(a,r),ra.fromBufferAttribute(a,o),t.distanceSqToSegment(na,ra,pl,Yc)>i)return;pl.applyMatrix4(n.matrixWorld);let l=e.ray.origin.distanceTo(pl);if(!(l<e.near||l>e.far))return{distance:l,point:Yc.clone().applyMatrix4(n.matrixWorld),index:s,face:null,faceIndex:null,barycoord:null,object:n}}var Kc=new D,Zc=new D,$n=class extends oa{constructor(e,t){super(e,t),this.isLineSegments=!0,this.type="LineSegments"}computeLineDistances(){let e=this.geometry;if(e.index===null){let t=e.attributes.position,i=[];for(let r=0,o=t.count;r<o;r+=2)Kc.fromBufferAttribute(t,r),Zc.fromBufferAttribute(t,r+1),i[r]=r===0?0:i[r-1],i[r+1]=i[r]+Kc.distanceTo(Zc);e.setAttribute("lineDistance",new ft(i,1))}else Ue("LineSegments.computeLineDistances(): Computation only possible with non-indexed BufferGeometry.");return this}};var Qn=class extends fi{constructor(e){super(),this.isPointsMaterial=!0,this.type="PointsMaterial",this.color=new Le(16777215),this.map=null,this.alphaMap=null,this.size=1,this.sizeAttenuation=!0,this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.alphaMap=e.alphaMap,this.size=e.size,this.sizeAttenuation=e.sizeAttenuation,this.fog=e.fog,this}};var Jc=new it,ml=new Ei,sa=new Pi,aa=new D,jo=class extends St{constructor(e=new gt,t=new Qn){super(),this.isPoints=!0,this.type="Points",this.geometry=e,this.material=t,this.morphTargetDictionary=void 0,this.morphTargetInfluences=void 0,this.updateMorphTargets()}copy(e,t){return super.copy(e,t),this.material=Array.isArray(e.material)?e.material.slice():e.material,this.geometry=e.geometry,this}intersectsFrustum(e){return e.intersectsObject(this)}raycast(e,t){let i=this.geometry,r=this.matrixWorld,o=e.params.Points.threshold,s=i.drawRange;if(i.boundingSphere===null&&i.computeBoundingSphere(),sa.copy(i.boundingSphere),sa.applyMatrix4(r),sa.radius+=o,e.ray.intersectsSphere(sa)===!1)return;Jc.copy(r).invert(),ml.copy(e.ray).applyMatrix4(Jc);let a=o/((this.scale.x+this.scale.y+this.scale.z)/3),c=a*a,l=i.index,m=i.attributes.position;if(l!==null){let f=Math.max(0,s.start),g=Math.min(l.count,s.start+s.count);for(let x=f,S=g;x<S;x++){let _=l.getX(x);aa.fromBufferAttribute(m,_),$c(aa,_,c,r,e,t,this)}}else{let f=Math.max(0,s.start),g=Math.min(m.count,s.start+s.count);for(let x=f,S=g;x<S;x++)aa.fromBufferAttribute(m,x),$c(aa,x,c,r,e,t,this)}}updateMorphTargets(){let t=this.geometry.morphAttributes,i=Object.keys(t);if(i.length>0){let r=t[i[0]];if(r!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let o=0,s=r.length;o<s;o++){let a=r[o].name||String(o);this.morphTargetInfluences.push(0),this.morphTargetDictionary[a]=o}}}}};function $c(n,e,t,i,r,o,s){let a=ml.distanceSqToPoint(n);if(a<t){let c=new D;ml.closestPointToPoint(n,c),c.applyMatrix4(i);let l=r.ray.origin.distanceTo(c);if(l<r.near||l>r.far)return;o.push({distance:l,distanceToRay:Math.sqrt(a),point:c,index:e,face:null,faceIndex:null,barycoord:null,object:s})}}var Nr=class extends Ft{constructor(e=[],t=wi,i,r,o,s,a,c,l,h){super(e,t,i,r,o,s,a,c,l,h),this.isCubeTexture=!0,this.flipY=!1}get images(){return this.image}set images(e){this.image=e}};var ki=class extends Ft{constructor(e,t,i,r,o,s,a,c,l){super(e,t,i,r,o,s,a,c,l),this.isCanvasTexture=!0,this.needsUpdate=!0}};var Hi=class extends Ft{constructor(e,t,i=Zt,r,o,s,a=Dt,c=Dt,l,h=pi,m=1){if(h!==pi&&h!==Ui)throw new Error("THREE.DepthTexture: format must be either THREE.DepthFormat or THREE.DepthStencilFormat");let f={width:e,height:t,depth:m};super(f,r,o,s,a,c,h,i,l),this.isDepthTexture=!0,this.flipY=!1,this.generateMipmaps=!1,this.compareFunction=null}copy(e){return super.copy(e),this.source=new Sn(Object.assign({},e.image)),this.compareFunction=e.compareFunction,this}toJSON(e){let t=super.toJSON(e);return t.compareFunction=this.compareFunction,t}};var la=class extends Hi{constructor(e,t=Zt,i=wi,r,o,s=Dt,a=Dt,c,l=pi){let h={width:e,height:e,depth:1},m=[h,h,h,h,h,h];super(e,e,t,i,r,o,s,a,c,l),this.image=m,this.isCubeDepthTexture=!0,this.isCubeTexture=!0}get images(){return this.image}set images(e){this.image=e}};var Ur=class extends Ft{constructor(e=null){super(),this.sourceTexture=e,this.isExternalTexture=!0}copy(e){return super.copy(e),this.sourceTexture=e.sourceTexture,this}};var wt=class n extends gt{constructor(e=1,t=1,i=1,r=1,o=1,s=1){super(),this.type="BoxGeometry",this.parameters={width:e,height:t,depth:i,widthSegments:r,heightSegments:o,depthSegments:s};let a=this;r=Math.floor(r),o=Math.floor(o),s=Math.floor(s);let c=[],l=[],h=[],m=[],f=0,g=0;x("z","y","x",-1,-1,i,t,e,s,o,0),x("z","y","x",1,-1,i,t,-e,s,o,1),x("x","z","y",1,1,e,i,t,r,s,2),x("x","z","y",1,-1,e,i,-t,r,s,3),x("x","y","z",1,-1,e,t,i,r,o,4),x("x","y","z",-1,-1,e,t,-i,r,o,5),this.setIndex(c),this.setAttribute("position",new ft(l,3)),this.setAttribute("normal",new ft(h,3)),this.setAttribute("uv",new ft(m,2));function x(S,_,p,A,P,y,E,b,R,d,T){let L=y/R,F=E/d,B=y/2,X=E/2,U=b/2,K=R+1,ee=d+1,j=0,le=0,te=new D;for(let he=0;he<ee;he++){let pe=he*F-X;for(let We=0;We<K;We++){let ze=We*L-B;te[S]=ze*A,te[_]=pe*P,te[p]=U,l.push(te.x,te.y,te.z),te[S]=0,te[_]=0,te[p]=b>0?1:-1,h.push(te.x,te.y,te.z),m.push(We/R),m.push(1-he/d),j+=1}}for(let he=0;he<d;he++)for(let pe=0;pe<R;pe++){let We=f+pe+K*he,ze=f+pe+K*(he+1),pt=f+(pe+1)+K*(he+1),at=f+(pe+1)+K*he;c.push(We,ze,at),c.push(ze,pt,at),le+=6}a.addGroup(g,le,T),g+=le,f+=j}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new n(e.width,e.height,e.depth,e.widthSegments,e.heightSegments,e.depthSegments)}};var Di=class n extends gt{constructor(e=1,t=1,i=1,r=32,o=1,s=!1,a=0,c=Math.PI*2){super(),this.type="CylinderGeometry",this.parameters={radiusTop:e,radiusBottom:t,height:i,radialSegments:r,heightSegments:o,openEnded:s,thetaStart:a,thetaLength:c};let l=this;r=Math.floor(r),o=Math.floor(o);let h=[],m=[],f=[],g=[],x=0,S=[],_=i/2,p=0;A(),s===!1&&(e>0&&P(!0),t>0&&P(!1)),this.setIndex(h),this.setAttribute("position",new ft(m,3)),this.setAttribute("normal",new ft(f,3)),this.setAttribute("uv",new ft(g,2));function A(){let y=new D,E=new D,b=0,R=(t-e)/i;for(let d=0;d<=o;d++){let T=[],L=d/o,F=L*(t-e)+e;for(let B=0;B<=r;B++){let X=B/r,U=X*c+a,K=Math.sin(U),ee=Math.cos(U);E.x=F*K,E.y=-L*i+_,E.z=F*ee,m.push(E.x,E.y,E.z),y.set(K,R,ee).normalize(),f.push(y.x,y.y,y.z),g.push(X,1-L),T.push(x++)}S.push(T)}for(let d=0;d<r;d++)for(let T=0;T<o;T++){let L=S[T][d],F=S[T+1][d],B=S[T+1][d+1],X=S[T][d+1];(e>0||T!==0)&&(h.push(L,F,X),b+=3),(t>0||T!==o-1)&&(h.push(F,B,X),b+=3)}l.addGroup(p,b,0),p+=b}function P(y){let E=x,b=new Ce,R=new D,d=0,T=y===!0?e:t,L=y===!0?1:-1;for(let B=1;B<=r;B++)m.push(0,_*L,0),f.push(0,L,0),g.push(.5,.5),x++;let F=x;for(let B=0;B<=r;B++){let U=B/r*c+a,K=Math.cos(U),ee=Math.sin(U);R.x=T*ee,R.y=_*L,R.z=T*K,m.push(R.x,R.y,R.z),f.push(0,L,0),b.x=K*.5+.5,b.y=ee*.5*L+.5,g.push(b.x,b.y),x++}for(let B=0;B<r;B++){let X=E+B,U=F+B;y===!0?h.push(U,U+1,X):h.push(U+1,U,X),d+=3}l.addGroup(p,d,y===!0?1:2),p+=d}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new n(e.radiusTop,e.radiusBottom,e.height,e.radialSegments,e.heightSegments,e.openEnded,e.thetaStart,e.thetaLength)}};var es=class n extends Di{constructor(e=1,t=1,i=32,r=1,o=!1,s=0,a=Math.PI*2){super(0,e,t,i,r,o,s,a),this.type="ConeGeometry",this.parameters={radius:e,height:t,radialSegments:i,heightSegments:r,openEnded:o,thetaStart:s,thetaLength:a}}static fromJSON(e){return new n(e.radius,e.height,e.radialSegments,e.heightSegments,e.openEnded,e.thetaStart,e.thetaLength)}};var ca=class n extends gt{constructor(e=[],t=[],i=1,r=0){super(),this.type="PolyhedronGeometry",this.parameters={vertices:e,indices:t,radius:i,detail:r};let o=[],s=[];a(r),l(i),h(),this.setAttribute("position",new ft(o,3)),this.setAttribute("normal",new ft(o.slice(),3)),this.setAttribute("uv",new ft(s,2)),r===0?this.computeVertexNormals():this.normalizeNormals();function a(A){let P=new D,y=new D,E=new D;for(let b=0;b<t.length;b+=3)g(t[b+0],P),g(t[b+1],y),g(t[b+2],E),c(P,y,E,A)}function c(A,P,y,E){let b=E+1,R=[];for(let d=0;d<=b;d++){R[d]=[];let T=A.clone().lerp(y,d/b),L=P.clone().lerp(y,d/b),F=b-d;for(let B=0;B<=F;B++)B===0&&d===b?R[d][B]=T:R[d][B]=T.clone().lerp(L,B/F)}for(let d=0;d<b;d++)for(let T=0;T<2*(b-d)-1;T++){let L=Math.floor(T/2);T%2===0?(f(R[d][L+1]),f(R[d+1][L]),f(R[d][L])):(f(R[d][L+1]),f(R[d+1][L+1]),f(R[d+1][L]))}}function l(A){let P=new D;for(let y=0;y<o.length;y+=3)P.x=o[y+0],P.y=o[y+1],P.z=o[y+2],P.normalize().multiplyScalar(A),o[y+0]=P.x,o[y+1]=P.y,o[y+2]=P.z}function h(){let A=new D;for(let P=0;P<o.length;P+=3){A.x=o[P+0],A.y=o[P+1],A.z=o[P+2];let y=_(A)/2/Math.PI+.5,E=p(A)/Math.PI+.5;s.push(y,1-E)}x(),m()}function m(){for(let A=0;A<s.length;A+=6){let P=s[A+0],y=s[A+2],E=s[A+4],b=Math.max(P,y,E),R=Math.min(P,y,E);b>.9&&R<.1&&(P<.2&&(s[A+0]+=1),y<.2&&(s[A+2]+=1),E<.2&&(s[A+4]+=1))}}function f(A){o.push(A.x,A.y,A.z)}function g(A,P){let y=A*3;P.x=e[y+0],P.y=e[y+1],P.z=e[y+2]}function x(){let A=new D,P=new D,y=new D,E=new D,b=new Ce,R=new Ce,d=new Ce;for(let T=0,L=0;T<o.length;T+=9,L+=6){A.set(o[T+0],o[T+1],o[T+2]),P.set(o[T+3],o[T+4],o[T+5]),y.set(o[T+6],o[T+7],o[T+8]),b.set(s[L+0],s[L+1]),R.set(s[L+2],s[L+3]),d.set(s[L+4],s[L+5]),E.copy(A).add(P).add(y).divideScalar(3);let F=_(E);S(b,L+0,A,F),S(R,L+2,P,F),S(d,L+4,y,F)}}function S(A,P,y,E){E<0&&A.x===1&&(s[P]=A.x-1),y.x===0&&y.z===0&&(s[P]=E/2/Math.PI+.5)}function _(A){return Math.atan2(A.z,-A.x)}function p(A){return Math.atan2(-A.y,Math.sqrt(A.x*A.x+A.z*A.z))}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new n(e.vertices,e.indices,e.radius,e.detail)}};var ua=new D,fa=new D,gl=new D,ha=new Xi,Fr=class extends gt{constructor(e=null,t=1){if(super(),this.type="EdgesGeometry",this.parameters={geometry:e,thresholdAngle:t},e!==null){let r=Math.pow(10,4),o=Math.cos(Mn*t),s=e.getIndex(),a=e.getAttribute("position"),c=s?s.count:a.count,l=[0,0,0],h=["a","b","c"],m=new Array(3),f={},g=[];for(let x=0;x<c;x+=3){s?(l[0]=s.getX(x),l[1]=s.getX(x+1),l[2]=s.getX(x+2)):(l[0]=x,l[1]=x+1,l[2]=x+2);let{a:S,b:_,c:p}=ha;if(S.fromBufferAttribute(a,l[0]),_.fromBufferAttribute(a,l[1]),p.fromBufferAttribute(a,l[2]),ha.getNormal(gl),m[0]=`${Math.round(S.x*r)},${Math.round(S.y*r)},${Math.round(S.z*r)}`,m[1]=`${Math.round(_.x*r)},${Math.round(_.y*r)},${Math.round(_.z*r)}`,m[2]=`${Math.round(p.x*r)},${Math.round(p.y*r)},${Math.round(p.z*r)}`,!(m[0]===m[1]||m[1]===m[2]||m[2]===m[0]))for(let A=0;A<3;A++){let P=(A+1)%3,y=m[A],E=m[P],b=ha[h[A]],R=ha[h[P]],d=`${y}_${E}`,T=`${E}_${y}`;T in f&&f[T]?(gl.dot(f[T].normal)<=o&&(g.push(b.x,b.y,b.z),g.push(R.x,R.y,R.z)),f[T]=null):d in f||(f[d]={index0:l[A],index1:l[P],normal:gl.clone()})}}for(let x in f)if(f[x]){let{index0:S,index1:_}=f[x];ua.fromBufferAttribute(a,S),fa.fromBufferAttribute(a,_),g.push(ua.x,ua.y,ua.z),g.push(fa.x,fa.y,fa.z)}this.setAttribute("position",new ft(g,3))}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}};var jn=class n extends ca{constructor(e=1,t=0){let i=[1,0,0,-1,0,0,0,1,0,0,-1,0,0,0,1,0,0,-1],r=[0,2,4,0,4,3,0,3,5,0,5,2,1,2,5,1,5,3,1,3,4,1,4,2];super(i,r,e,t),this.type="OctahedronGeometry",this.parameters={radius:e,detail:t}}static fromJSON(e){return new n(e.radius,e.detail)}};var cn=class n extends gt{constructor(e=1,t=1,i=1,r=1){super(),this.type="PlaneGeometry",this.parameters={width:e,height:t,widthSegments:i,heightSegments:r};let o=e/2,s=t/2,a=Math.floor(i),c=Math.floor(r),l=a+1,h=c+1,m=e/a,f=t/c,g=[],x=[],S=[],_=[];for(let p=0;p<h;p++){let A=p*f-s;for(let P=0;P<l;P++){let y=P*m-o;x.push(y,-A,0),S.push(0,0,1),_.push(P/a),_.push(1-p/c)}}for(let p=0;p<c;p++)for(let A=0;A<a;A++){let P=A+l*p,y=A+l*(p+1),E=A+1+l*(p+1),b=A+1+l*p;g.push(P,y,b),g.push(y,E,b)}this.setIndex(g),this.setAttribute("position",new ft(x,3)),this.setAttribute("normal",new ft(S,3)),this.setAttribute("uv",new ft(_,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new n(e.width,e.height,e.widthSegments,e.heightSegments)}};var wn=class n extends gt{constructor(e=.5,t=1,i=32,r=1,o=0,s=Math.PI*2){super(),this.type="RingGeometry",this.parameters={innerRadius:e,outerRadius:t,thetaSegments:i,phiSegments:r,thetaStart:o,thetaLength:s},i=Math.max(3,i),r=Math.max(1,r);let a=[],c=[],l=[],h=[],m=e,f=(t-e)/r,g=new D,x=new Ce;for(let S=0;S<=r;S++){for(let _=0;_<=i;_++){let p=o+_/i*s;g.x=m*Math.cos(p),g.y=m*Math.sin(p),c.push(g.x,g.y,g.z),l.push(0,0,1),x.x=(g.x/t+1)/2,x.y=(g.y/t+1)/2,h.push(x.x,x.y)}m+=f}for(let S=0;S<r;S++){let _=S*(i+1);for(let p=0;p<i;p++){let A=p+_,P=A,y=A+i+1,E=A+i+2,b=A+1;a.push(P,y,b),a.push(y,E,b)}}this.setIndex(a),this.setAttribute("position",new ft(c,3)),this.setAttribute("normal",new ft(l,3)),this.setAttribute("uv",new ft(h,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new n(e.innerRadius,e.outerRadius,e.thetaSegments,e.phiSegments,e.thetaStart,e.thetaLength)}};var Or=class n extends gt{constructor(e=1,t=.4,i=12,r=48,o=Math.PI*2,s=0,a=Math.PI*2){super(),this.type="TorusGeometry",this.parameters={radius:e,tube:t,radialSegments:i,tubularSegments:r,arc:o,thetaStart:s,thetaLength:a},i=Math.floor(i),r=Math.floor(r);let c=[],l=[],h=[],m=[],f=new D,g=new D,x=new D;for(let S=0;S<=i;S++){let _=s+S/i*a;for(let p=0;p<=r;p++){let A=p/r*o;g.x=(e+t*Math.cos(_))*Math.cos(A),g.y=(e+t*Math.cos(_))*Math.sin(A),g.z=t*Math.sin(_),l.push(g.x,g.y,g.z),f.x=e*Math.cos(A),f.y=e*Math.sin(A),x.subVectors(g,f).normalize(),h.push(x.x,x.y,x.z),m.push(p/r),m.push(S/i)}}for(let S=1;S<=i;S++)for(let _=1;_<=r;_++){let p=(r+1)*S+_-1,A=(r+1)*(S-1)+_-1,P=(r+1)*(S-1)+_,y=(r+1)*S+_;c.push(p,A,y),c.push(A,P,y)}this.setIndex(c),this.setAttribute("position",new ft(l,3)),this.setAttribute("normal",new ft(h,3)),this.setAttribute("uv",new ft(m,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new n(e.radius,e.tube,e.radialSegments,e.tubularSegments,e.arc,e.thetaStart,e.thetaLength)}};function un(n){let e={};for(let t in n){e[t]={};for(let i in n[t]){let r=n[t][i];if(Qc(r))r.isRenderTargetTexture?(Ue("UniformsUtils: Textures of render targets cannot be cloned via cloneUniforms() or mergeUniforms()."),e[t][i]=null):e[t][i]=r.clone();else if(Array.isArray(r))if(Qc(r[0])){let o=[];for(let s=0,a=r.length;s<a;s++)o[s]=r[s].clone();e[t][i]=o}else e[t][i]=r.slice();else e[t][i]=r}}return e}function hi(n){let e={};for(let t=0;t<n.length;t++){let i=un(n[t]);for(let r in i)e[r]=i[r]}return e}function Qc(n){return n&&(n.isColor||n.isMatrix3||n.isMatrix4||n.isVector2||n.isVector3||n.isVector4||n.isTexture||n.isQuaternion)}function jc(n){let e=[];for(let t=0;t<n.length;t++)e.push(n[t].clone());return e}function da(n){let e=n.getRenderTarget();return e===null?n.outputColorSpace:e.isXRRenderTarget===!0?e.texture.colorSpace:tt.workingColorSpace}var eu={clone:un,merge:hi};var tu=`
void main() {
gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}
`;var iu=`
void main() {
gl_FragColor = vec4( 1.0, 0.0, 0.0, 1.0 );
}
`;var ti=class extends fi{constructor(e){super(),this.isShaderMaterial=!0,this.type="ShaderMaterial",this.defines={},this.uniforms={},this.uniformsGroups=[],this.vertexShader=tu,this.fragmentShader=iu,this.linewidth=1,this.wireframe=!1,this.wireframeLinewidth=1,this.fog=!1,this.lights=!1,this.clipping=!1,this.forceSinglePass=!0,this.extensions={clipCullDistance:!1,multiDraw:!1},this.defaultAttributeValues={color:[1,1,1],uv:[0,0],uv1:[0,0]},this.index0AttributeName=void 0,this.uniformsNeedUpdate=!1,this.glslVersion=null,e!==void 0&&this.setValues(e)}copy(e){return super.copy(e),this.fragmentShader=e.fragmentShader,this.vertexShader=e.vertexShader,this.uniforms=un(e.uniforms),this.uniformsGroups=jc(e.uniformsGroups),this.defines=Object.assign({},e.defines),this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.fog=e.fog,this.lights=e.lights,this.clipping=e.clipping,this.extensions=Object.assign({},e.extensions),this.glslVersion=e.glslVersion,this.defaultAttributeValues=Object.assign({},e.defaultAttributeValues),this.index0AttributeName=e.index0AttributeName,this.uniformsNeedUpdate=e.uniformsNeedUpdate,this}toJSON(e){let t=super.toJSON(e);t.glslVersion=this.glslVersion,t.uniforms={};for(let r in this.uniforms){let s=this.uniforms[r].value;s&&s.isTexture?t.uniforms[r]={type:"t",value:s.toJSON(e).uuid}:s&&s.isColor?t.uniforms[r]={type:"c",value:s.getHex()}:s&&s.isVector2?t.uniforms[r]={type:"v2",value:s.toArray()}:s&&s.isVector3?t.uniforms[r]={type:"v3",value:s.toArray()}:s&&s.isVector4?t.uniforms[r]={type:"v4",value:s.toArray()}:s&&s.isMatrix3?t.uniforms[r]={type:"m3",value:s.toArray()}:s&&s.isMatrix4?t.uniforms[r]={type:"m4",value:s.toArray()}:t.uniforms[r]={value:s}}Object.keys(this.defines).length>0&&(t.defines=this.defines),t.vertexShader=this.vertexShader,t.fragmentShader=this.fragmentShader,t.lights=this.lights,t.clipping=this.clipping;let i={};for(let r in this.extensions)this.extensions[r]===!0&&(i[r]=!0);return Object.keys(i).length>0&&(t.extensions=i),t}fromJSON(e,t){if(super.fromJSON(e,t),e.uniforms!==void 0)for(let i in e.uniforms){let r=e.uniforms[i];switch(this.uniforms[i]={},r.type){case"t":this.uniforms[i].value=t[r.value]||null;break;case"c":this.uniforms[i].value=new Le().setHex(r.value);break;case"v2":this.uniforms[i].value=new Ce().fromArray(r.value);break;case"v3":this.uniforms[i].value=new D().fromArray(r.value);break;case"v4":this.uniforms[i].value=new xt().fromArray(r.value);break;case"m3":this.uniforms[i].value=new qe().fromArray(r.value);break;case"m4":this.uniforms[i].value=new it().fromArray(r.value);break;default:this.uniforms[i].value=r.value}}if(e.defines!==void 0&&(this.defines=e.defines),e.vertexShader!==void 0&&(this.vertexShader=e.vertexShader),e.fragmentShader!==void 0&&(this.fragmentShader=e.fragmentShader),e.glslVersion!==void 0&&(this.glslVersion=e.glslVersion),e.extensions!==void 0)for(let i in e.extensions)this.extensions[i]=e.extensions[i];return e.lights!==void 0&&(this.lights=e.lights),e.clipping!==void 0&&(this.clipping=e.clipping),this}};var pa=class extends ti{constructor(e){super(e),this.isRawShaderMaterial=!0,this.type="RawShaderMaterial"}};var je=class extends fi{constructor(e){super(),this.isMeshStandardMaterial=!0,this.type="MeshStandardMaterial",this.defines={STANDARD:""},this.color=new Le(16777215),this.roughness=1,this.metalness=0,this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.emissive=new Le(0),this.emissiveIntensity=1,this.emissiveMap=null,this.bumpMap=null,this.bumpScale=1,this.normalMap=null,this.normalMapType=Xo,this.normalScale=new Ce(1,1),this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.roughnessMap=null,this.metalnessMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new Ci,this.envMapIntensity=1,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.flatShading=!1,this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.defines={STANDARD:""},this.color.copy(e.color),this.roughness=e.roughness,this.metalness=e.metalness,this.map=e.map,this.lightMap=e.lightMap,this.lightMapIntensity=e.lightMapIntensity,this.aoMap=e.aoMap,this.aoMapIntensity=e.aoMapIntensity,this.emissive.copy(e.emissive),this.emissiveMap=e.emissiveMap,this.emissiveIntensity=e.emissiveIntensity,this.bumpMap=e.bumpMap,this.bumpScale=e.bumpScale,this.normalMap=e.normalMap,this.normalMapType=e.normalMapType,this.normalScale.copy(e.normalScale),this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this.roughnessMap=e.roughnessMap,this.metalnessMap=e.metalnessMap,this.alphaMap=e.alphaMap,this.envMap=e.envMap,this.envMapRotation.copy(e.envMapRotation),this.envMapIntensity=e.envMapIntensity,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.wireframeLinecap=e.wireframeLinecap,this.wireframeLinejoin=e.wireframeLinejoin,this.flatShading=e.flatShading,this.fog=e.fog,this}};var ma=class extends fi{constructor(e){super(),this.isMeshDepthMaterial=!0,this.type="MeshDepthMaterial",this.depthPacking=pc,this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.wireframe=!1,this.wireframeLinewidth=1,this.setValues(e)}copy(e){return super.copy(e),this.depthPacking=e.depthPacking,this.map=e.map,this.alphaMap=e.alphaMap,this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this}};var ga=class extends fi{constructor(e){super(),this.isMeshDistanceMaterial=!0,this.type="MeshDistanceMaterial",this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.setValues(e)}copy(e){return super.copy(e),this.map=e.map,this.alphaMap=e.alphaMap,this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this}};var Br=class extends ln{constructor(e){super(),this.isLineDashedMaterial=!0,this.type="LineDashedMaterial",this.scale=1,this.dashSize=3,this.gapSize=1,this.setValues(e)}copy(e){return super.copy(e),this.scale=e.scale,this.dashSize=e.dashSize,this.gapSize=e.gapSize,this}};var Rn=class extends St{constructor(e,t=1){super(),this.isLight=!0,this.type="Light",this.color=new Le(e),this.intensity=t}copy(e,t){return super.copy(e,t),this.color.copy(e.color),this.intensity=e.intensity,this}toJSON(e){let t=super.toJSON(e);return t.object.color=this.color.getHex(),t.object.intensity=this.intensity,t}};var ts=class extends Rn{constructor(e,t,i){super(e,i),this.isHemisphereLight=!0,this.type="HemisphereLight",this.position.copy(St.DEFAULT_UP),this.updateMatrix(),this.groundColor=new Le(t)}copy(e,t){return super.copy(e,t),this.groundColor.copy(e.groundColor),this}toJSON(e){let t=super.toJSON(e);return t.object.groundColor=this.groundColor.getHex(),t}};var _l=new it,nu=new D,ru=new D,Gr=class{constructor(e){this.camera=e,this.intensity=1,this.bias=0,this.biasNode=null,this.normalBias=0,this.radius=1,this.blurSamples=8,this.mapSize=new Ce(512,512),this.mapType=Bt,this.map=null,this.mapPass=null,this.matrix=new it,this.autoUpdate=!0,this.needsUpdate=!1,this._frustum=new An,this._frameExtents=new Ce(1,1),this._viewportCount=1,this._viewports=[new xt(0,0,1,1)]}getViewportCount(){return this._viewportCount}getCamera(){return this.camera}getFrustum(){return this._frustum}updateMatrices(e){let t=this.camera;nu.setFromMatrixPosition(e.matrixWorld),t.position.copy(nu),ru.setFromMatrixPosition(e.target.matrixWorld),t.lookAt(ru),t.updateMatrixWorld(),this._updateMatrix(t,this.matrix,this._frustum)}_updateMatrix(e,t,i,r){_l.multiplyMatrices(e.projectionMatrix,e.matrixWorldInverse),i.setFromProjectionMatrix(_l,e.coordinateSystem,e.reversedDepth);let o=this._frameExtents,s=r?r.z/o.x:1,a=r?r.w/o.y:1,c=r?r.x/o.x:0,l=r?r.y/o.y:0;e.coordinateSystem===en||e.reversedDepth?t.set(.5*s,0,0,.5*s+c,0,.5*a,0,.5*a+l,0,0,1,0,0,0,0,1):t.set(.5*s,0,0,.5*s+c,0,.5*a,0,.5*a+l,0,0,.5,.5,0,0,0,1),t.multiply(_l)}getViewport(e){return this._viewports[e]}getFrameExtents(){return this._frameExtents}dispose(){this.map&&this.map.dispose(),this.mapPass&&this.mapPass.dispose()}copy(e){return this.camera=e.camera.clone(),this.intensity=e.intensity,this.bias=e.bias,this.radius=e.radius,this.autoUpdate=e.autoUpdate,this.needsUpdate=e.needsUpdate,this.normalBias=e.normalBias,this.blurSamples=e.blurSamples,this.mapSize.copy(e.mapSize),this.biasNode=e.biasNode,this}clone(){return new this.constructor().copy(this)}toJSON(){let e={};return e.intensity=this.intensity,e.bias=this.bias,e.normalBias=this.normalBias,e.radius=this.radius,e.blurSamples=this.blurSamples,e.mapSize=this.mapSize.toArray(),e.camera=this.camera.toJSON(!1).object,delete e.camera.matrix,e}};var _a=new D,xa=new li,qi=new D,zr=class extends St{constructor(){super(),this.isCamera=!0,this.type="Camera",this.matrixWorldInverse=new it,this.projectionMatrix=new it,this.projectionMatrixInverse=new it,this.coordinateSystem=mi,this._reversedDepth=!1}get reversedDepth(){return this._reversedDepth}copy(e,t){return super.copy(e,t),this.matrixWorldInverse.copy(e.matrixWorldInverse),this.projectionMatrix.copy(e.projectionMatrix),this.projectionMatrixInverse.copy(e.projectionMatrixInverse),this.coordinateSystem=e.coordinateSystem,this}getWorldDirection(e){return super.getWorldDirection(e).negate()}updateMatrixWorld(e){super.updateMatrixWorld(e),this.matrixWorld.decompose(_a,xa,qi),qi.x===1&&qi.y===1&&qi.z===1?this.matrixWorldInverse.copy(this.matrixWorld).invert():this.matrixWorldInverse.compose(_a,xa,qi.set(1,1,1)).invert()}updateWorldMatrix(e,t,i=!1){super.updateWorldMatrix(e,t,i),this.matrixWorld.decompose(_a,xa,qi),qi.x===1&&qi.y===1&&qi.z===1?this.matrixWorldInverse.copy(this.matrixWorld).invert():this.matrixWorldInverse.compose(_a,xa,qi.set(1,1,1)).invert()}clone(){return new this.constructor().copy(this)}};var Cn=new D,ou=new Ce,su=new Ce,Ot=class extends zr{constructor(e=50,t=1,i=.1,r=2e3){super(),this.isPerspectiveCamera=!0,this.type="PerspectiveCamera",this.fov=e,this.zoom=1,this.near=i,this.far=r,this.focus=10,this.aspect=t,this.view=null,this.filmGauge=35,this.filmOffset=0,this.updateProjectionMatrix()}copy(e,t){return super.copy(e,t),this.fov=e.fov,this.zoom=e.zoom,this.near=e.near,this.far=e.far,this.focus=e.focus,this.aspect=e.aspect,this.view=e.view===null?null:Object.assign({},e.view),this.filmGauge=e.filmGauge,this.filmOffset=e.filmOffset,this}setFocalLength(e){let t=.5*this.getFilmHeight()/e;this.fov=Wn*2*Math.atan(t),this.updateProjectionMatrix()}getFocalLength(){let e=Math.tan(Mn*.5*this.fov);return .5*this.getFilmHeight()/e}getEffectiveFOV(){return Wn*2*Math.atan(Math.tan(Mn*.5*this.fov)/this.zoom)}getFilmWidth(){return this.filmGauge*Math.min(this.aspect,1)}getFilmHeight(){return this.filmGauge/Math.max(this.aspect,1)}getViewBounds(e,t,i){Cn.set(-1,-1,.5).applyMatrix4(this.projectionMatrixInverse),t.set(Cn.x,Cn.y).multiplyScalar(-e/Cn.z),Cn.set(1,1,.5).applyMatrix4(this.projectionMatrixInverse),i.set(Cn.x,Cn.y).multiplyScalar(-e/Cn.z)}getViewSize(e,t){return this.getViewBounds(e,ou,su),t.subVectors(su,ou)}setViewOffset(e,t,i,r,o,s){this.aspect=e/t,this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=e,this.view.fullHeight=t,this.view.offsetX=i,this.view.offsetY=r,this.view.width=o,this.view.height=s,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){let e=this.near,t=e*Math.tan(Mn*.5*this.fov)/this.zoom,i=2*t,r=this.aspect*i,o=-.5*r,s=this.view;if(this.view!==null&&this.view.enabled){let c=s.fullWidth,l=s.fullHeight;o+=s.offsetX*r/c,t-=s.offsetY*i/l,r*=s.width/c,i*=s.height/l}let a=this.filmOffset;a!==0&&(o+=e*a/this.getFilmWidth()),this.projectionMatrix.makePerspective(o,o+r,t,t-i,e,this.far,this.coordinateSystem,this.reversedDepth),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(e){let t=super.toJSON(e);return t.object.fov=this.fov,t.object.zoom=this.zoom,t.object.near=this.near,t.object.far=this.far,t.object.focus=this.focus,t.object.aspect=this.aspect,this.view!==null&&(t.object.view=Object.assign({},this.view)),t.object.filmGauge=this.filmGauge,t.object.filmOffset=this.filmOffset,t}};var Ma=class extends Gr{constructor(){super(new Ot(90,1,.5,500)),this.isPointLightShadow=!0}};var is=class extends Rn{constructor(e,t,i=0,r=2){super(e,t),this.isPointLight=!0,this.type="PointLight",this.distance=i,this.decay=r,this.shadow=new Ma}get power(){return this.intensity*4*Math.PI}set power(e){this.intensity=e/(4*Math.PI)}dispose(){super.dispose(),this.shadow.dispose()}copy(e,t){return super.copy(e,t),this.distance=e.distance,this.decay=e.decay,this.shadow=e.shadow.clone(),this}toJSON(e){let t=super.toJSON(e);return t.object.distance=this.distance,t.object.decay=this.decay,t.object.shadow=this.shadow.toJSON(),t}};var Pn=class extends zr{constructor(e=-1,t=1,i=1,r=-1,o=.1,s=2e3){super(),this.isOrthographicCamera=!0,this.type="OrthographicCamera",this.zoom=1,this.view=null,this.left=e,this.right=t,this.top=i,this.bottom=r,this.near=o,this.far=s,this.updateProjectionMatrix()}copy(e,t){return super.copy(e,t),this.left=e.left,this.right=e.right,this.top=e.top,this.bottom=e.bottom,this.near=e.near,this.far=e.far,this.zoom=e.zoom,this.view=e.view===null?null:Object.assign({},e.view),this}setViewOffset(e,t,i,r,o,s){this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=e,this.view.fullHeight=t,this.view.offsetX=i,this.view.offsetY=r,this.view.width=o,this.view.height=s,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){let e=(this.right-this.left)/(2*this.zoom),t=(this.top-this.bottom)/(2*this.zoom),i=(this.right+this.left)/2,r=(this.top+this.bottom)/2,o=i-e,s=i+e,a=r+t,c=r-t;if(this.view!==null&&this.view.enabled){let l=(this.right-this.left)/this.view.fullWidth/this.zoom,h=(this.top-this.bottom)/this.view.fullHeight/this.zoom;o+=l*this.view.offsetX,s=o+l*this.view.width,a-=h*this.view.offsetY,c=a-h*this.view.height}this.projectionMatrix.makeOrthographic(o,s,a,c,this.near,this.far,this.coordinateSystem,this.reversedDepth),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(e){let t=super.toJSON(e);return t.object.zoom=this.zoom,t.object.left=this.left,t.object.right=this.right,t.object.top=this.top,t.object.bottom=this.bottom,t.object.near=this.near,t.object.far=this.far,this.view!==null&&(t.object.view=Object.assign({},this.view)),t}};var Sa=class extends Gr{constructor(){super(new Pn(-5,5,5,-5,.5,500)),this.isDirectionalLightShadow=!0}};var kr=class extends Rn{constructor(e,t){super(e,t),this.isDirectionalLight=!0,this.type="DirectionalLight",this.position.copy(St.DEFAULT_UP),this.updateMatrix(),this.target=new St,this.shadow=new Sa}dispose(){super.dispose(),this.shadow.dispose()}copy(e){return super.copy(e),this.target=e.target.clone(),this.shadow=e.shadow.clone(),this}toJSON(e){let t=super.toJSON(e);return t.object.shadow=this.shadow.toJSON(),t.object.target=this.target.uuid,t}};var Hr=-90,Vr=1,va=class extends St{constructor(e,t,i){super(),this.type="CubeCamera",this.renderTarget=i,this.coordinateSystem=null,this.activeMipmapLevel=0;let r=new Ot(Hr,Vr,e,t);r.layers=this.layers,this.add(r);let o=new Ot(Hr,Vr,e,t);o.layers=this.layers,this.add(o);let s=new Ot(Hr,Vr,e,t);s.layers=this.layers,this.add(s);let a=new Ot(Hr,Vr,e,t);a.layers=this.layers,this.add(a);let c=new Ot(Hr,Vr,e,t);c.layers=this.layers,this.add(c);let l=new Ot(Hr,Vr,e,t);l.layers=this.layers,this.add(l)}updateCoordinateSystem(){let e=this.coordinateSystem,t=this.children.concat(),[i,r,o,s,a,c]=t;for(let l of t)this.remove(l);if(e===mi)i.up.set(0,1,0),i.lookAt(1,0,0),r.up.set(0,1,0),r.lookAt(-1,0,0),o.up.set(0,0,-1),o.lookAt(0,1,0),s.up.set(0,0,1),s.lookAt(0,-1,0),a.up.set(0,1,0),a.lookAt(0,0,1),c.up.set(0,1,0),c.lookAt(0,0,-1);else if(e===en)i.up.set(0,-1,0),i.lookAt(-1,0,0),r.up.set(0,-1,0),r.lookAt(1,0,0),o.up.set(0,0,1),o.lookAt(0,1,0),s.up.set(0,0,-1),s.lookAt(0,-1,0),a.up.set(0,-1,0),a.lookAt(0,0,1),c.up.set(0,-1,0),c.lookAt(0,0,-1);else throw new Error("THREE.CubeCamera.updateCoordinateSystem(): Invalid coordinate system: "+e);for(let l of t)this.add(l),l.updateMatrixWorld()}update(e,t){this.parent===null&&this.updateMatrixWorld();let{renderTarget:i,activeMipmapLevel:r}=this;this.coordinateSystem!==e.coordinateSystem&&(this.coordinateSystem=e.coordinateSystem,this.updateCoordinateSystem());let[o,s,a,c,l,h]=this.children,m=e.getRenderTarget(),f=e.getActiveCubeFace(),g=e.getActiveMipmapLevel(),x=e.xr.enabled;e.xr.enabled=!1;let S=i.texture.generateMipmaps;i.texture.generateMipmaps=!1;let _=!1;e.isWebGLRenderer===!0?_=e.state.buffers.depth.getReversed():_=e.reversedDepthBuffer,e.setRenderTarget(i,0,r),_&&e.autoClear===!1&&e.clearDepth(),e.render(t,o),e.setRenderTarget(i,1,r),_&&e.autoClear===!1&&e.clearDepth(),e.render(t,s),e.setRenderTarget(i,2,r),_&&e.autoClear===!1&&e.clearDepth(),e.render(t,a),e.setRenderTarget(i,3,r),_&&e.autoClear===!1&&e.clearDepth(),e.render(t,c),e.setRenderTarget(i,4,r),_&&e.autoClear===!1&&e.clearDepth(),e.render(t,l),i.texture.generateMipmaps=S,e.setRenderTarget(i,5,r),_&&e.autoClear===!1&&e.clearDepth(),e.render(t,h),e.setRenderTarget(m,f,g),e.xr.enabled=x,i.texture.needsPMREMUpdate=!0}};var ya=class extends Ot{constructor(e=[]){super(),this.isArrayCamera=!0,this.isMultiViewCamera=!1,this.cameras=e}};var au=new it,ns=class{constructor(e,t,i=0,r=1/0){this.ray=new Ei(e,t),this.near=i,this.far=r,this.camera=null,this.layers=new yn,this.params={Mesh:{},Line:{threshold:1},LOD:{},Points:{threshold:1},Sprite:{}}}set(e,t){this.ray.set(e,t)}setFromCamera(e,t){t.isPerspectiveCamera?(this.ray.origin.setFromMatrixPosition(t.matrixWorld),this.ray.direction.set(e.x,e.y,.5).unproject(t).sub(this.ray.origin).normalize(),this.camera=t):t.isOrthographicCamera?(this.ray.origin.set(e.x,e.y,t.projectionMatrix.elements[14]).unproject(t),this.ray.direction.set(0,0,-1).transformDirection(t.matrixWorld),this.camera=t):nt("Raycaster: Unsupported camera type: "+t.type)}setFromXRController(e){return au.identity().extractRotation(e.matrixWorld),this.ray.origin.setFromMatrixPosition(e.matrixWorld),this.ray.direction.set(0,0,-1).applyMatrix4(au),this}intersectObject(e,t=!0,i=[]){return xl(e,this,i,t),i.sort(lu),i}intersectObjects(e,t=!0,i=[]){for(let r=0,o=e.length;r<o;r++)xl(e[r],this,i,t);return i.sort(lu),i}};function lu(n,e){return n.distance-e.distance}function xl(n,e,t,i){let r=!0;if(n.layers.test(e.layers)&&n.raycast(e,t)===!1&&(r=!1),r===!0&&i===!0){let o=n.children;for(let s=0,a=o.length;s<a;s++)xl(o[s],e,t,!0)}}var Wr=class{constructor(e=1,t=0,i=0){this.radius=e,this.phi=t,this.theta=i}set(e,t,i){return this.radius=e,this.phi=t,this.theta=i,this}copy(e){return this.radius=e.radius,this.phi=e.phi,this.theta=e.theta,this}makeSafe(){return this.phi=Qe(this.phi,1e-6,Math.PI-1e-6),this}setFromVector3(e){return this.setFromCartesianCoords(e.x,e.y,e.z)}setFromCartesianCoords(e,t,i){return this.radius=Math.sqrt(e*e+t*t+i*i),this.radius===0?(this.theta=0,this.phi=0):(this.theta=Math.atan2(e,i),this.phi=Math.acos(Qe(t/this.radius,-1,1))),this}clone(){return new this.constructor().copy(this)}};var rs=class extends Qt{constructor(e,t=null){super(),this.object=e,this.domElement=t,this.enabled=!0,this.state=-1,this.keys={},this.mouseButtons={LEFT:null,MIDDLE:null,RIGHT:null},this.touches={ONE:null,TWO:null}}connect(e){this.domElement!==null&&this.disconnect(),this.domElement=e}disconnect(){}dispose(){}update(){}};function Ml(n,e,t,i){let r=fm(i);switch(t){case Cs:return n*e;case Ls:return n*e/r.components*r.byteLength;case lr:return n*e/r.components*r.byteLength;case vi:return n*e*2/r.components*r.byteLength;case cr:return n*e*2/r.components*r.byteLength;case Ps:return n*e*3/r.components*r.byteLength;case $t:return n*e*4/r.components*r.byteLength;case ur:return n*e*4/r.components*r.byteLength;case fr:case hr:return Math.floor((n+3)/4)*Math.floor((e+3)/4)*8;case dr:case pr:return Math.floor((n+3)/4)*Math.floor((e+3)/4)*16;case go:case xo:return Math.max(n,16)*Math.max(e,8)/4;case mo:case _o:return Math.max(n,8)*Math.max(e,8)/2;case Mo:case So:case yo:case bo:return Math.floor((n+3)/4)*Math.floor((e+3)/4)*8;case vo:case zn:case Eo:return Math.floor((n+3)/4)*Math.floor((e+3)/4)*16;case To:return Math.floor((n+3)/4)*Math.floor((e+3)/4)*16;case Ao:return Math.floor((n+4)/5)*Math.floor((e+3)/4)*16;case wo:return Math.floor((n+4)/5)*Math.floor((e+4)/5)*16;case Ro:return Math.floor((n+5)/6)*Math.floor((e+4)/5)*16;case Co:return Math.floor((n+5)/6)*Math.floor((e+5)/6)*16;case Po:return Math.floor((n+7)/8)*Math.floor((e+4)/5)*16;case Lo:return Math.floor((n+7)/8)*Math.floor((e+5)/6)*16;case Do:return Math.floor((n+7)/8)*Math.floor((e+7)/8)*16;case Io:return Math.floor((n+9)/10)*Math.floor((e+4)/5)*16;case No:return Math.floor((n+9)/10)*Math.floor((e+5)/6)*16;case Uo:return Math.floor((n+9)/10)*Math.floor((e+7)/8)*16;case Fo:return Math.floor((n+9)/10)*Math.floor((e+9)/10)*16;case Oo:return Math.floor((n+11)/12)*Math.floor((e+9)/10)*16;case Bo:return Math.floor((n+11)/12)*Math.floor((e+11)/12)*16;case Go:case zo:case ko:return Math.ceil(n/4)*Math.ceil(e/4)*16;case Ho:case Vo:return Math.ceil(n/4)*Math.ceil(e/4)*8;case kn:case Wo:return Math.ceil(n/4)*Math.ceil(e/4)*16}throw new Error(`Unable to determine texture byte length for ${t} format.`)}function fm(n){switch(n){case Bt:case Ts:return{byteLength:1,components:1};case Qi:case As:case Jt:return{byteLength:2,components:1};case sr:case ar:return{byteLength:2,components:4};case Zt:case or:case ni:return{byteLength:4,components:1};case ws:case Rs:return{byteLength:4,components:3}}throw new Error(`THREE.TextureUtils: Unknown texture type ${n}.`)}typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("register",{detail:{revision:"186"}}));typeof window<"u"&&(window.__THREE__?Ue("WARNING: Multiple instances of Three.js being imported."):window.__THREE__="186");function ba(){let n=null,e=!1,t=null,i=null;function r(o,s){i=n.requestAnimationFrame(r),t(o,s)}return{start:function(){e!==!0&&t!==null&&n!==null&&(i=n.requestAnimationFrame(r),e=!0)},stop:function(){n!==null&&n.cancelAnimationFrame(i),e=!1},setAnimationLoop:function(o){t=o},setContext:function(o){n=o}}}function cu(n){let e=new WeakMap;function t(a,c){let l=a.array,h=a.usage,m=l.byteLength,f=n.createBuffer();n.bindBuffer(c,f),n.bufferData(c,l,h),a.onUploadCallback();let g;if(l instanceof Float32Array)g=n.FLOAT;else if(typeof Float16Array<"u"&&l instanceof Float16Array)g=n.HALF_FLOAT;else if(l instanceof Uint16Array)a.isFloat16BufferAttribute?g=n.HALF_FLOAT:g=n.UNSIGNED_SHORT;else if(l instanceof Int16Array)g=n.SHORT;else if(l instanceof Uint32Array)g=n.UNSIGNED_INT;else if(l instanceof Int32Array)g=n.INT;else if(l instanceof Int8Array)g=n.BYTE;else if(l instanceof Uint8Array)g=n.UNSIGNED_BYTE;else if(l instanceof Uint8ClampedArray)g=n.UNSIGNED_BYTE;else throw new Error("THREE.WebGLAttributes: Unsupported buffer data format: "+l);return{buffer:f,type:g,bytesPerElement:l.BYTES_PER_ELEMENT,version:a.version,size:m}}function i(a,c,l){let h=c.array,m=c.updateRanges;if(n.bindBuffer(l,a),m.length===0)n.bufferSubData(l,0,h);else{m.sort((g,x)=>g.start-x.start);let f=0;for(let g=1;g<m.length;g++){let x=m[f],S=m[g];S.start<=x.start+x.count+1?x.count=Math.max(x.count,S.start+S.count-x.start):(++f,m[f]=S)}m.length=f+1;for(let g=0,x=m.length;g<x;g++){let S=m[g];n.bufferSubData(l,S.start*h.BYTES_PER_ELEMENT,h,S.start,S.count)}c.clearUpdateRanges()}c.onUploadCallback()}function r(a){return a.isInterleavedBufferAttribute&&(a=a.data),e.get(a)}function o(a){a.isInterleavedBufferAttribute&&(a=a.data);let c=e.get(a);c&&(n.deleteBuffer(c.buffer),e.delete(a))}function s(a,c){if(a.isInterleavedBufferAttribute&&(a=a.data),a.isGLBufferAttribute){let h=e.get(a);(!h||h.version<a.version)&&e.set(a,{buffer:a.buffer,type:a.type,bytesPerElement:a.elementSize,version:a.version});return}let l=e.get(a);if(l===void 0)e.set(a,t(a,c));else if(l.version<a.version){if(l.size!==a.array.byteLength)throw new Error("THREE.WebGLAttributes: The size of the buffer attribute's array buffer does not match the original size. Resizing buffer attributes is not supported.");i(l.buffer,a,c),l.version=a.version}}return{get:r,remove:o,update:s}}var uu=`
#ifdef USE_ALPHAHASH
if ( diffuseColor.a < getAlphaHashThreshold( vPosition ) ) discard;
#endif
`;var fu=`
#ifdef USE_ALPHAHASH
const float ALPHA_HASH_SCALE = 0.05;
float hash2D( vec2 value ) {
return fract( 1.0e4 * sin( 17.0 * value.x + 0.1 * value.y ) * ( 0.1 + abs( sin( 13.0 * value.y + value.x ) ) ) );
}
float hash3D( vec3 value ) {
return hash2D( vec2( hash2D( value.xy ), value.z ) );
}
float getAlphaHashThreshold( vec3 position ) {
float maxDeriv = max(
length( dFdx( position.xyz ) ),
length( dFdy( position.xyz ) )
);
float pixScale = 1.0 / ( ALPHA_HASH_SCALE * maxDeriv );
vec2 pixScales = vec2(
exp2( floor( log2( pixScale ) ) ),
exp2( ceil( log2( pixScale ) ) )
);
vec2 alpha = vec2(
hash3D( floor( pixScales.x * position.xyz ) ),
hash3D( floor( pixScales.y * position.xyz ) )
);
float lerpFactor = fract( log2( pixScale ) );
float x = ( 1.0 - lerpFactor ) * alpha.x + lerpFactor * alpha.y;
float a = min( lerpFactor, 1.0 - lerpFactor );
vec3 cases = vec3(
x * x / ( 2.0 * a * ( 1.0 - a ) ),
( x - 0.5 * a ) / ( 1.0 - a ),
1.0 - ( ( 1.0 - x ) * ( 1.0 - x ) / ( 2.0 * a * ( 1.0 - a ) ) )
);
float threshold = ( x < ( 1.0 - a ) )
? ( ( x < a ) ? cases.x : cases.y )
: cases.z;
return clamp( threshold , 1.0e-6, 1.0 );
}
#endif
`;var hu=`
#ifdef USE_ALPHAMAP
diffuseColor.a *= texture2D( alphaMap, vAlphaMapUv ).g;
#endif
`;var du=`
#ifdef USE_ALPHAMAP
uniform sampler2D alphaMap;
#endif
`;var pu=`
#ifdef USE_ALPHATEST
#ifdef ALPHA_TO_COVERAGE
diffuseColor.a = smoothstep( alphaTest, alphaTest + fwidth( diffuseColor.a ), diffuseColor.a );
if ( diffuseColor.a == 0.0 ) discard;
#else
if ( diffuseColor.a < alphaTest ) discard;
#endif
#endif
`;var mu=`
#ifdef USE_ALPHATEST
uniform float alphaTest;
#endif
`;var gu=`
#ifdef USE_AOMAP
float ambientOcclusion = ( texture2D( aoMap, vAoMapUv ).r - 1.0 ) * aoMapIntensity + 1.0;
reflectedLight.indirectDiffuse *= ambientOcclusion;
#if defined( USE_CLEARCOAT )
clearcoatSpecularIndirect *= ambientOcclusion;
#endif
#if defined( USE_SHEEN )
sheenSpecularIndirect *= ambientOcclusion;
#endif
#if defined( USE_ENVMAP ) && defined( STANDARD )
float dotNV = saturate( dot( geometryNormal, geometryViewDir ) );
reflectedLight.indirectSpecular *= computeSpecularOcclusion( dotNV, ambientOcclusion, material.roughness );
#endif
#endif
`;var _u=`
#ifdef USE_AOMAP
uniform sampler2D aoMap;
uniform float aoMapIntensity;
#endif
`;var xu=`
#ifdef USE_BATCHING
#if ! defined( GL_ANGLE_multi_draw )
#define gl_DrawID _gl_DrawID
uniform int _gl_DrawID;
#endif
uniform highp sampler2D batchingTexture;
uniform highp usampler2D batchingIdTexture;
mat4 getBatchingMatrix( const in float i ) {
int size = textureSize( batchingTexture, 0 ).x;
int j = int( i ) * 4;
int x = j % size;
int y = j / size;
vec4 v1 = texelFetch( batchingTexture, ivec2( x, y ), 0 );
vec4 v2 = texelFetch( batchingTexture, ivec2( x + 1, y ), 0 );
vec4 v3 = texelFetch( batchingTexture, ivec2( x + 2, y ), 0 );
vec4 v4 = texelFetch( batchingTexture, ivec2( x + 3, y ), 0 );
return mat4( v1, v2, v3, v4 );
}
float getIndirectIndex( const in int i ) {
int size = textureSize( batchingIdTexture, 0 ).x;
int x = i % size;
int y = i / size;
return float( texelFetch( batchingIdTexture, ivec2( x, y ), 0 ).r );
}
#endif
#ifdef USE_BATCHING_COLOR
uniform sampler2D batchingColorTexture;
vec4 getBatchingColor( const in float i ) {
int size = textureSize( batchingColorTexture, 0 ).x;
int j = int( i );
int x = j % size;
int y = j / size;
return texelFetch( batchingColorTexture, ivec2( x, y ), 0 );
}
#endif
`;var Mu=`
#ifdef USE_BATCHING
mat4 batchingMatrix = getBatchingMatrix( getIndirectIndex( gl_DrawID ) );
#endif
`;var Su=`
vec3 transformed = vec3( position );
#ifdef USE_ALPHAHASH
vPosition = vec3( position );
#endif
`;var vu=`
vec3 objectNormal = vec3( normal );
#ifdef USE_TANGENT
vec3 objectTangent = vec3( tangent.xyz );
#endif
`;var yu=`
float G_BlinnPhong_Implicit( ) {
return 0.25;
}
float D_BlinnPhong( const in float shininess, const in float dotNH ) {
return RECIPROCAL_PI * ( shininess * 0.5 + 1.0 ) * pow( dotNH, shininess );
}
vec3 BRDF_BlinnPhong( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in vec3 specularColor, const in float shininess ) {
vec3 halfDir = normalize( lightDir + viewDir );
float dotNH = saturate( dot( normal, halfDir ) );
float dotVH = saturate( dot( viewDir, halfDir ) );
vec3 F = F_Schlick( specularColor, 1.0, dotVH );
float G = G_BlinnPhong_Implicit( );
float D = D_BlinnPhong( shininess, dotNH );
return F * ( G * D );
}
`;var bu=`
#ifdef USE_IRIDESCENCE
const mat3 XYZ_TO_REC709 = mat3(
3.2404542, -0.9692660, 0.0556434,
-1.5371385, 1.8760108, -0.2040259,
-0.4985314, 0.0415560, 1.0572252
);
vec3 Fresnel0ToIor( vec3 fresnel0 ) {
vec3 sqrtF0 = sqrt( fresnel0 );
return ( vec3( 1.0 ) + sqrtF0 ) / ( vec3( 1.0 ) - sqrtF0 );
}
vec3 IorToFresnel0( vec3 transmittedIor, float incidentIor ) {
return pow2( ( transmittedIor - vec3( incidentIor ) ) / ( transmittedIor + vec3( incidentIor ) ) );
}
float IorToFresnel0( float transmittedIor, float incidentIor ) {
return pow2( ( transmittedIor - incidentIor ) / ( transmittedIor + incidentIor ));
}
vec3 evalSensitivity( float OPD, vec3 shift ) {
float phase = 2.0 * PI * OPD * 1.0e-9;
vec3 val = vec3( 5.4856e-13, 4.4201e-13, 5.2481e-13 );
vec3 pos = vec3( 1.6810e+06, 1.7953e+06, 2.2084e+06 );
vec3 var = vec3( 4.3278e+09, 9.3046e+09, 6.6121e+09 );
vec3 xyz = val * sqrt( 2.0 * PI * var ) * cos( pos * phase + shift ) * exp( - pow2( phase ) * var );
xyz.x += 9.7470e-14 * sqrt( 2.0 * PI * 4.5282e+09 ) * cos( 2.2399e+06 * phase + shift[ 0 ] ) * exp( - 4.5282e+09 * pow2( phase ) );
xyz /= 1.0685e-7;
vec3 rgb = XYZ_TO_REC709 * xyz;
return rgb;
}
vec3 evalIridescence( float outsideIOR, float eta2, float cosTheta1, float thinFilmThickness, vec3 baseF0 ) {
vec3 I;
float iridescenceIOR = mix( outsideIOR, eta2, smoothstep( 0.0, 0.03, thinFilmThickness ) );
float sinTheta2Sq = pow2( outsideIOR / iridescenceIOR ) * ( 1.0 - pow2( cosTheta1 ) );
float cosTheta2Sq = 1.0 - sinTheta2Sq;
if ( cosTheta2Sq < 0.0 ) {
return vec3( 1.0 );
}
float cosTheta2 = sqrt( cosTheta2Sq );
float R0 = IorToFresnel0( iridescenceIOR, outsideIOR );
float R12 = F_Schlick( R0, 1.0, cosTheta1 );
float T121 = 1.0 - R12;
float phi12 = 0.0;
if ( iridescenceIOR < outsideIOR ) phi12 = PI;
float phi21 = PI - phi12;
vec3 baseIOR = Fresnel0ToIor( clamp( baseF0, 0.0, 0.9999 ) );
vec3 R1 = IorToFresnel0( baseIOR, iridescenceIOR );
vec3 R23 = F_Schlick( R1, 1.0, cosTheta2 );
vec3 phi23 = vec3( 0.0 );
if ( baseIOR[ 0 ] < iridescenceIOR ) phi23[ 0 ] = PI;
if ( baseIOR[ 1 ] < iridescenceIOR ) phi23[ 1 ] = PI;
if ( baseIOR[ 2 ] < iridescenceIOR ) phi23[ 2 ] = PI;
float OPD = 2.0 * iridescenceIOR * thinFilmThickness * cosTheta2;
vec3 phi = vec3( phi21 ) + phi23;
vec3 R123 = clamp( R12 * R23, 1e-5, 0.9999 );
vec3 r123 = sqrt( R123 );
vec3 Rs = pow2( T121 ) * R23 / ( vec3( 1.0 ) - R123 );
vec3 C0 = R12 + Rs;
I = C0;
vec3 Cm = Rs - T121;
for ( int m = 1; m <= 2; ++ m ) {
Cm *= r123;
vec3 Sm = 2.0 * evalSensitivity( float( m ) * OPD, float( m ) * phi );
I += Cm * Sm;
}
return max( I, vec3( 0.0 ) );
}
#endif
`;var Eu=`
#ifdef USE_BUMPMAP
uniform sampler2D bumpMap;
uniform float bumpScale;
vec2 dHdxy_fwd() {
vec2 dSTdx = dFdx( vBumpMapUv );
vec2 dSTdy = dFdy( vBumpMapUv );
float Hll = bumpScale * texture2D( bumpMap, vBumpMapUv ).x;
float dBx = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdx ).x - Hll;
float dBy = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdy ).x - Hll;
return vec2( dBx, dBy );
}
vec3 perturbNormalArb( vec3 surf_pos, vec3 surf_norm, vec2 dHdxy, float faceDirection ) {
vec3 vSigmaX = normalize( dFdx( surf_pos.xyz ) );
vec3 vSigmaY = normalize( dFdy( surf_pos.xyz ) );
vec3 vN = surf_norm;
vec3 R1 = cross( vSigmaY, vN );
vec3 R2 = cross( vN, vSigmaX );
float fDet = dot( vSigmaX, R1 ) * faceDirection;
vec3 vGrad = sign( fDet ) * ( dHdxy.x * R1 + dHdxy.y * R2 );
return normalize( abs( fDet ) * surf_norm - vGrad );
}
#endif
`;var Tu=`
#if NUM_CLIPPING_PLANES > 0
vec4 plane;
#ifdef ALPHA_TO_COVERAGE
float distanceToPlane, distanceGradient;
float clipOpacity = 1.0;
#pragma unroll_loop_start
for ( int i = 0; i < UNION_CLIPPING_PLANES; i ++ ) {
plane = clippingPlanes[ i ];
distanceToPlane = - dot( vClipPosition, plane.xyz ) + plane.w;
distanceGradient = fwidth( distanceToPlane ) / 2.0;
clipOpacity *= smoothstep( - distanceGradient, distanceGradient, distanceToPlane );
if ( clipOpacity == 0.0 ) discard;
}
#pragma unroll_loop_end
#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES
float unionClipOpacity = 1.0;
#pragma unroll_loop_start
for ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; i ++ ) {
plane = clippingPlanes[ i ];
distanceToPlane = - dot( vClipPosition, plane.xyz ) + plane.w;
distanceGradient = fwidth( distanceToPlane ) / 2.0;
unionClipOpacity *= 1.0 - smoothstep( - distanceGradient, distanceGradient, distanceToPlane );
}
#pragma unroll_loop_end
clipOpacity *= 1.0 - unionClipOpacity;
#endif
diffuseColor.a *= clipOpacity;
if ( diffuseColor.a == 0.0 ) discard;
#else
#pragma unroll_loop_start
for ( int i = 0; i < UNION_CLIPPING_PLANES; i ++ ) {
plane = clippingPlanes[ i ];
if ( dot( vClipPosition, plane.xyz ) > plane.w ) discard;
}
#pragma unroll_loop_end
#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES
bool clipped = true;
#pragma unroll_loop_start
for ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; i ++ ) {
plane = clippingPlanes[ i ];
clipped = ( dot( vClipPosition, plane.xyz ) > plane.w ) && clipped;
}
#pragma unroll_loop_end
if ( clipped ) discard;
#endif
#endif
#endif
`;var Au=`
#if NUM_CLIPPING_PLANES > 0
varying vec3 vClipPosition;
uniform vec4 clippingPlanes[ NUM_CLIPPING_PLANES ];
#endif
`;var wu=`
#if NUM_CLIPPING_PLANES > 0
varying vec3 vClipPosition;
#endif
`;var Ru=`
#if NUM_CLIPPING_PLANES > 0
vClipPosition = - mvPosition.xyz;
#endif
`;var Cu=`
#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA )
diffuseColor *= vColor;
#endif
`;var Pu=`
#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA )
varying vec4 vColor;
#endif
`;var Lu=`
#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
varying vec4 vColor;
#endif
`;var Du=`
#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
vColor = vec4( 1.0 );
#endif
#ifdef USE_COLOR_ALPHA
vColor *= color;
#elif defined( USE_COLOR )
vColor.rgb *= color;
#endif
#ifdef USE_INSTANCING_COLOR
vColor.rgb *= instanceColor.rgb;
#endif
#ifdef USE_BATCHING_COLOR
vColor *= getBatchingColor( getIndirectIndex( gl_DrawID ) );
#endif
`;var Iu=`
#define PI 3.141592653589793
#define PI2 6.283185307179586
#define PI_HALF 1.5707963267948966
#define RECIPROCAL_PI 0.3183098861837907
#define RECIPROCAL_PI2 0.15915494309189535
#define EPSILON 1e-6
#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
#define whiteComplement( a ) ( 1.0 - saturate( a ) )
float pow2( const in float x ) { return x*x; }
vec3 pow2( const in vec3 x ) { return x*x; }
float pow3( const in float x ) { return x*x*x; }
float pow4( const in float x ) { float x2 = x*x; return x2*x2; }
float max3( const in vec3 v ) { return max( max( v.x, v.y ), v.z ); }
float average( const in vec3 v ) { return dot( v, vec3( 0.3333333 ) ); }
highp float rand( const in vec2 uv ) {
const highp float a = 12.9898, b = 78.233, c = 43758.5453;
highp float dt = dot( uv.xy, vec2( a,b ) ), sn = mod( dt, PI );
return fract( sin( sn ) * c );
}
#ifdef HIGH_PRECISION
float precisionSafeLength( vec3 v ) { return length( v ); }
#else
float precisionSafeLength( vec3 v ) {
float maxComponent = max3( abs( v ) );
return length( v / maxComponent ) * maxComponent;
}
#endif
struct IncidentLight {
vec3 color;
vec3 direction;
bool visible;
};
struct ReflectedLight {
vec3 directDiffuse;
vec3 directSpecular;
vec3 indirectDiffuse;
vec3 indirectSpecular;
};
#ifdef USE_ALPHAHASH
varying vec3 vPosition;
#endif
vec3 transformDirection( in vec3 dir, in mat4 matrix ) {
return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );
}
#define inverseTransformDirection transformDirectionByInverseViewMatrix
vec3 transformNormalByInverseViewMatrix( in vec3 normal, in mat4 viewMatrix ) {
return normalize( ( vec4( normal, 0.0 ) * viewMatrix ).xyz );
}
vec3 transformDirectionByInverseViewMatrix( in vec3 dir, in mat4 viewMatrix ) {
return normalize( ( vec4( dir, 0.0 ) * viewMatrix ).xyz );
}
bool isPerspectiveMatrix( mat4 m ) {
return m[ 2 ][ 3 ] == - 1.0;
}
vec2 equirectUv( in vec3 dir ) {
float u = atan( dir.z, dir.x ) * RECIPROCAL_PI2 + 0.5;
float v = asin( clamp( dir.y, - 1.0, 1.0 ) ) * RECIPROCAL_PI + 0.5;
return vec2( u, v );
}
vec3 BRDF_Lambert( const in vec3 diffuseColor ) {
return RECIPROCAL_PI * diffuseColor;
}
vec3 F_Schlick( const in vec3 f0, const in float f90, const in float dotVH ) {
float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
}
float F_Schlick( const in float f0, const in float f90, const in float dotVH ) {
float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
}
`;var Nu=`
#ifdef ENVMAP_TYPE_CUBE_UV
#define cubeUV_minMipLevel 4.0
#define cubeUV_minTileSize 16.0
float getFace( vec3 direction ) {
vec3 absDirection = abs( direction );
float face = - 1.0;
if ( absDirection.x > absDirection.z ) {
if ( absDirection.x > absDirection.y )
face = direction.x > 0.0 ? 0.0 : 3.0;
else
face = direction.y > 0.0 ? 1.0 : 4.0;
} else {
if ( absDirection.z > absDirection.y )
face = direction.z > 0.0 ? 2.0 : 5.0;
else
face = direction.y > 0.0 ? 1.0 : 4.0;
}
return face;
}
vec2 getUV( vec3 direction, float face ) {
vec2 uv;
if ( face == 0.0 ) {
uv = vec2( direction.z, direction.y ) / abs( direction.x );
} else if ( face == 1.0 ) {
uv = vec2( - direction.x, - direction.z ) / abs( direction.y );
} else if ( face == 2.0 ) {
uv = vec2( - direction.x, direction.y ) / abs( direction.z );
} else if ( face == 3.0 ) {
uv = vec2( - direction.z, direction.y ) / abs( direction.x );
} else if ( face == 4.0 ) {
uv = vec2( - direction.x, direction.z ) / abs( direction.y );
} else {
uv = vec2( direction.x, direction.y ) / abs( direction.z );
}
return 0.5 * ( uv + 1.0 );
}
vec3 bilinearCubeUV( sampler2D envMap, vec3 direction, float mipInt ) {
float face = getFace( direction );
float filterInt = max( cubeUV_minMipLevel - mipInt, 0.0 );
mipInt = max( mipInt, cubeUV_minMipLevel );
float faceSize = exp2( mipInt );
highp vec2 uv = getUV( direction, face ) * ( faceSize - 2.0 ) + 1.0;
if ( face > 2.0 ) {
uv.y += faceSize;
face -= 3.0;
}
uv.x += face * faceSize;
uv.x += filterInt * 3.0 * cubeUV_minTileSize;
uv.y += 4.0 * ( exp2( CUBEUV_MAX_MIP ) - faceSize );
uv.x *= CUBEUV_TEXEL_WIDTH;
uv.y *= CUBEUV_TEXEL_HEIGHT;
#ifdef texture2DGradEXT
return texture2DGradEXT( envMap, uv, vec2( 0.0 ), vec2( 0.0 ) ).rgb;
#else
return texture2D( envMap, uv ).rgb;
#endif
}
#define cubeUV_r0 1.0
#define cubeUV_m0 - 2.0
#define cubeUV_r1 0.8
#define cubeUV_m1 - 1.0
#define cubeUV_r4 0.4
#define cubeUV_m4 2.0
#define cubeUV_r5 0.305
#define cubeUV_m5 3.0
#define cubeUV_r6 0.21
#define cubeUV_m6 4.0
float roughnessToMip( float roughness ) {
float mip = 0.0;
if ( roughness >= cubeUV_r1 ) {
mip = ( cubeUV_r0 - roughness ) * ( cubeUV_m1 - cubeUV_m0 ) / ( cubeUV_r0 - cubeUV_r1 ) + cubeUV_m0;
} else if ( roughness >= cubeUV_r4 ) {
mip = ( cubeUV_r1 - roughness ) * ( cubeUV_m4 - cubeUV_m1 ) / ( cubeUV_r1 - cubeUV_r4 ) + cubeUV_m1;
} else if ( roughness >= cubeUV_r5 ) {
mip = ( cubeUV_r4 - roughness ) * ( cubeUV_m5 - cubeUV_m4 ) / ( cubeUV_r4 - cubeUV_r5 ) + cubeUV_m4;
} else if ( roughness >= cubeUV_r6 ) {
mip = ( cubeUV_r5 - roughness ) * ( cubeUV_m6 - cubeUV_m5 ) / ( cubeUV_r5 - cubeUV_r6 ) + cubeUV_m5;
} else {
mip = - 2.0 * log2( 1.16 * roughness );
}
return mip;
}
vec4 textureCubeUV( sampler2D envMap, vec3 sampleDir, float roughness ) {
float mip = clamp( roughnessToMip( roughness ), cubeUV_m0, CUBEUV_MAX_MIP );
float mipF = fract( mip );
float mipInt = floor( mip );
vec3 color0 = bilinearCubeUV( envMap, sampleDir, mipInt );
if ( mipF == 0.0 ) {
return vec4( color0, 1.0 );
} else {
vec3 color1 = bilinearCubeUV( envMap, sampleDir, mipInt + 1.0 );
return vec4( mix( color0, color1, mipF ), 1.0 );
}
}
#endif
`;var Uu=`
vec3 transformedNormal = objectNormal;
#ifdef USE_TANGENT
vec3 transformedTangent = objectTangent;
#endif
#ifdef USE_BATCHING
mat3 bm = mat3( batchingMatrix );
transformedNormal /= vec3( dot( bm[ 0 ], bm[ 0 ] ), dot( bm[ 1 ], bm[ 1 ] ), dot( bm[ 2 ], bm[ 2 ] ) );
transformedNormal = bm * transformedNormal;
#ifdef USE_TANGENT
transformedTangent = bm * transformedTangent;
#endif
#endif
#ifdef USE_INSTANCING
mat3 im = mat3( instanceMatrix );
transformedNormal /= vec3( dot( im[ 0 ], im[ 0 ] ), dot( im[ 1 ], im[ 1 ] ), dot( im[ 2 ], im[ 2 ] ) );
transformedNormal = im * transformedNormal;
#ifdef USE_TANGENT
transformedTangent = im * transformedTangent;
#endif
#endif
transformedNormal = normalMatrix * transformedNormal;
#ifdef FLIP_SIDED
transformedNormal = - transformedNormal;
#endif
#ifdef USE_TANGENT
transformedTangent = ( modelViewMatrix * vec4( transformedTangent, 0.0 ) ).xyz;
#endif
`;var Fu=`
#ifdef USE_DISPLACEMENTMAP
uniform sampler2D displacementMap;
uniform float displacementScale;
uniform float displacementBias;
#endif
`;var Ou=`
#ifdef USE_DISPLACEMENTMAP
transformed += normalize( objectNormal ) * ( texture2D( displacementMap, vDisplacementMapUv ).x * displacementScale + displacementBias );
#endif
`;var Bu=`
#ifdef USE_EMISSIVEMAP
vec4 emissiveColor = texture2D( emissiveMap, vEmissiveMapUv );
#ifdef DECODE_VIDEO_TEXTURE_EMISSIVE
emissiveColor = sRGBTransferEOTF( emissiveColor );
#endif
totalEmissiveRadiance *= emissiveColor.rgb;
#endif
`;var Gu=`
#ifdef USE_EMISSIVEMAP
uniform sampler2D emissiveMap;
#endif
`;var zu=`
gl_FragColor = linearToOutputTexel( gl_FragColor );
`;var ku=`
vec4 LinearTransferOETF( in vec4 value ) {
return value;
}
vec4 sRGBTransferEOTF( in vec4 value ) {
return vec4( mix( pow( value.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), value.rgb * 0.0773993808, vec3( lessThanEqual( value.rgb, vec3( 0.04045 ) ) ) ), value.a );
}
vec4 sRGBTransferOETF( in vec4 value ) {
return vec4( mix( pow( value.rgb, vec3( 0.41666 ) ) * 1.055 - vec3( 0.055 ), value.rgb * 12.92, vec3( lessThanEqual( value.rgb, vec3( 0.0031308 ) ) ) ), value.a );
}
`;var Hu=`
#ifdef USE_ENVMAP
#ifdef ENV_WORLDPOS
vec3 cameraToFrag;
if ( isOrthographic ) {
cameraToFrag = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
} else {
cameraToFrag = normalize( vWorldPosition - cameraPosition );
}
vec3 worldNormal = transformNormalByInverseViewMatrix( normal, viewMatrix );
#ifdef ENVMAP_MODE_REFLECTION
vec3 reflectVec = reflect( cameraToFrag, worldNormal );
#else
vec3 reflectVec = refract( cameraToFrag, worldNormal, refractionRatio );
#endif
#else
vec3 reflectVec = vReflect;
#endif
#ifdef ENVMAP_TYPE_CUBE
vec4 envColor = textureCube( envMap, envMapRotation * reflectVec );
#ifdef ENVMAP_BLENDING_MULTIPLY
outgoingLight = mix( outgoingLight, outgoingLight * envColor.xyz, specularStrength * reflectivity );
#elif defined( ENVMAP_BLENDING_MIX )
outgoingLight = mix( outgoingLight, envColor.xyz, specularStrength * reflectivity );
#elif defined( ENVMAP_BLENDING_ADD )
outgoingLight += envColor.xyz * specularStrength * reflectivity;
#endif
#endif
#endif
`;var Vu=`
#ifdef USE_ENVMAP
uniform float envMapIntensity;
uniform mat3 envMapRotation;
#ifdef ENVMAP_TYPE_CUBE
uniform samplerCube envMap;
#else
uniform sampler2D envMap;
#endif
#endif
`;var Wu=`
#ifdef USE_ENVMAP
uniform float reflectivity;
#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
#define ENV_WORLDPOS
#endif
#ifdef ENV_WORLDPOS
varying vec3 vWorldPosition;
uniform float refractionRatio;
#else
varying vec3 vReflect;
#endif
#endif
`;var Xu=`
#ifdef USE_ENVMAP
#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
#define ENV_WORLDPOS
#endif
#ifdef ENV_WORLDPOS
varying vec3 vWorldPosition;
#else
varying vec3 vReflect;
uniform float refractionRatio;
#endif
#endif
`;var qu=`
#ifdef USE_ENVMAP
#ifdef ENV_WORLDPOS
vWorldPosition = worldPosition.xyz;
#else
vec3 cameraToVertex;
if ( isOrthographic ) {
cameraToVertex = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
} else {
cameraToVertex = normalize( worldPosition.xyz - cameraPosition );
}
vec3 worldNormal = transformNormalByInverseViewMatrix( transformedNormal, viewMatrix );
#ifdef ENVMAP_MODE_REFLECTION
vReflect = reflect( cameraToVertex, worldNormal );
#else
vReflect = refract( cameraToVertex, worldNormal, refractionRatio );
#endif
#endif
#endif
`;var Yu=`
#ifdef USE_FOG
vFogDepth = - mvPosition.z;
#endif
`;var Ku=`
#ifdef USE_FOG
varying float vFogDepth;
#endif
`;var Zu=`
#ifdef USE_FOG
#ifdef FOG_EXP2
float fogFactor = 1.0 - exp( - fogDensity * fogDensity * vFogDepth * vFogDepth );
#else
float fogFactor = smoothstep( fogNear, fogFar, vFogDepth );
#endif
gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );
#endif
`;var Ju=`
#ifdef USE_FOG
uniform vec3 fogColor;
varying float vFogDepth;
#ifdef FOG_EXP2
uniform float fogDensity;
#else
uniform float fogNear;
uniform float fogFar;
#endif
#endif
`;var $u=`
#ifdef USE_GRADIENTMAP
uniform sampler2D gradientMap;
#endif
vec3 getGradientIrradiance( vec3 normal, vec3 lightDirection ) {
float dotNL = dot( normal, lightDirection );
vec2 coord = vec2( dotNL * 0.5 + 0.5, 0.0 );
#ifdef USE_GRADIENTMAP
return vec3( texture2D( gradientMap, coord ).r );
#else
vec2 fw = fwidth( coord ) * 0.5;
return mix( vec3( 0.7 ), vec3( 1.0 ), smoothstep( 0.7 - fw.x, 0.7 + fw.x, coord.x ) );
#endif
}
`;var Qu=`
#ifdef USE_LIGHTMAP
uniform sampler2D lightMap;
uniform float lightMapIntensity;
#endif
`;var ju=`
LambertMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularStrength = specularStrength;
`;var ef=`
varying vec3 vViewPosition;
struct LambertMaterial {
vec3 diffuseColor;
float specularStrength;
};
void RE_Direct_Lambert( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
vec3 irradiance = dotNL * directLight.color;
reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Lambert( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct RE_Direct_Lambert
#define RE_IndirectDiffuse RE_IndirectDiffuse_Lambert
`;var tf=`
uniform bool receiveShadow;
uniform vec3 ambientLightColor;
#if defined( USE_LIGHT_PROBES )
uniform vec3 lightProbe[ 9 ];
#endif
vec3 shGetIrradianceAt( in vec3 normal, in vec3 shCoefficients[ 9 ] ) {
float x = normal.x, y = normal.y, z = normal.z;
vec3 result = shCoefficients[ 0 ] * 0.886227;
result += shCoefficients[ 1 ] * 2.0 * 0.511664 * y;
result += shCoefficients[ 2 ] * 2.0 * 0.511664 * z;
result += shCoefficients[ 3 ] * 2.0 * 0.511664 * x;
result += shCoefficients[ 4 ] * 2.0 * 0.429043 * x * y;
result += shCoefficients[ 5 ] * 2.0 * 0.429043 * y * z;
result += shCoefficients[ 6 ] * ( 0.743125 * z * z - 0.247708 );
result += shCoefficients[ 7 ] * 2.0 * 0.429043 * x * z;
result += shCoefficients[ 8 ] * 0.429043 * ( x * x - y * y );
return result;
}
vec3 getLightProbeIrradiance( const in vec3 lightProbe[ 9 ], const in vec3 normal ) {
vec3 worldNormal = transformNormalByInverseViewMatrix( normal, viewMatrix );
vec3 irradiance = shGetIrradianceAt( worldNormal, lightProbe );
return irradiance;
}
vec3 getAmbientLightIrradiance( const in vec3 ambientLightColor ) {
vec3 irradiance = ambientLightColor;
return irradiance;
}
float getDistanceAttenuation( const in float lightDistance, const in float cutoffDistance, const in float decayExponent ) {
float distanceFalloff = 1.0 / max( pow( lightDistance, decayExponent ), 0.01 );
if ( cutoffDistance > 0.0 ) {
distanceFalloff *= pow2( saturate( 1.0 - pow4( lightDistance / cutoffDistance ) ) );
}
return distanceFalloff;
}
float getSpotAttenuation( const in float coneCosine, const in float penumbraCosine, const in float angleCosine ) {
return smoothstep( coneCosine, penumbraCosine, angleCosine );
}
#if NUM_SUN_LIGHTS > 0
struct SunLight {
vec3 direction;
vec3 color;
};
uniform SunLight sunLights[ NUM_SUN_LIGHTS ];
void getSunLightInfo( const in SunLight sunLight, out IncidentLight light ) {
light.color = sunLight.color;
light.direction = sunLight.direction;
light.visible = true;
}
#endif
#if NUM_DIR_LIGHTS > 0
struct DirectionalLight {
vec3 direction;
vec3 color;
};
uniform DirectionalLight directionalLights[ NUM_DIR_LIGHTS ];
void getDirectionalLightInfo( const in DirectionalLight directionalLight, out IncidentLight light ) {
light.color = directionalLight.color;
light.direction = directionalLight.direction;
light.visible = true;
}
#endif
#if NUM_POINT_LIGHTS > 0
struct PointLight {
vec3 position;
vec3 color;
float distance;
float decay;
};
uniform PointLight pointLights[ NUM_POINT_LIGHTS ];
void getPointLightInfo( const in PointLight pointLight, const in vec3 geometryPosition, out IncidentLight light ) {
vec3 lVector = pointLight.position - geometryPosition;
light.direction = normalize( lVector );
float lightDistance = length( lVector );
light.color = pointLight.color;
light.color *= getDistanceAttenuation( lightDistance, pointLight.distance, pointLight.decay );
light.visible = ( light.color != vec3( 0.0 ) );
}
#endif
#if NUM_SPOT_LIGHTS > 0
struct SpotLight {
vec3 position;
vec3 direction;
vec3 color;
float distance;
float decay;
float coneCos;
float penumbraCos;
};
uniform SpotLight spotLights[ NUM_SPOT_LIGHTS ];
void getSpotLightInfo( const in SpotLight spotLight, const in vec3 geometryPosition, out IncidentLight light ) {
vec3 lVector = spotLight.position - geometryPosition;
light.direction = normalize( lVector );
float angleCos = dot( light.direction, spotLight.direction );
float spotAttenuation = getSpotAttenuation( spotLight.coneCos, spotLight.penumbraCos, angleCos );
if ( spotAttenuation > 0.0 ) {
float lightDistance = length( lVector );
light.color = spotLight.color * spotAttenuation;
light.color *= getDistanceAttenuation( lightDistance, spotLight.distance, spotLight.decay );
light.visible = ( light.color != vec3( 0.0 ) );
} else {
light.color = vec3( 0.0 );
light.visible = false;
}
}
#endif
#if NUM_RECT_AREA_LIGHTS > 0
struct RectAreaLight {
vec3 color;
vec3 position;
vec3 halfWidth;
vec3 halfHeight;
};
uniform sampler2D ltc_1;
uniform sampler2D ltc_2;
uniform RectAreaLight rectAreaLights[ NUM_RECT_AREA_LIGHTS ];
#endif
#if NUM_HEMI_LIGHTS > 0
struct HemisphereLight {
vec3 direction;
vec3 skyColor;
vec3 groundColor;
};
uniform HemisphereLight hemisphereLights[ NUM_HEMI_LIGHTS ];
vec3 getHemisphereLightIrradiance( const in HemisphereLight hemiLight, const in vec3 normal ) {
float dotNL = dot( normal, hemiLight.direction );
float hemiDiffuseWeight = 0.5 * dotNL + 0.5;
vec3 irradiance = mix( hemiLight.groundColor, hemiLight.skyColor, hemiDiffuseWeight );
return irradiance;
}
#endif
#include <lightprobes_pars_fragment>
`;var nf=`
#ifdef USE_ENVMAP
vec3 getIBLIrradiance( const in vec3 normal ) {
#ifdef ENVMAP_TYPE_CUBE_UV
vec3 worldNormal = transformNormalByInverseViewMatrix( normal, viewMatrix );
vec4 envMapColor = textureCubeUV( envMap, envMapRotation * worldNormal, 1.0 );
return PI * envMapColor.rgb * envMapIntensity;
#else
return vec3( 0.0 );
#endif
}
vec3 getIBLRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness ) {
#ifdef ENVMAP_TYPE_CUBE_UV
vec3 reflectVec = reflect( - viewDir, normal );
reflectVec = normalize( mix( reflectVec, normal, pow4( roughness ) ) );
reflectVec = transformDirectionByInverseViewMatrix( reflectVec, viewMatrix );
vec4 envMapColor = textureCubeUV( envMap, envMapRotation * reflectVec, roughness );
return envMapColor.rgb * envMapIntensity;
#else
return vec3( 0.0 );
#endif
}
#ifdef USE_RETROREFLECTION
vec3 getIBLRetroRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness ) {
#ifdef ENVMAP_TYPE_CUBE_UV
vec3 retroVec = normalize( mix( viewDir, normal, pow4( roughness ) ) );
retroVec = transformDirectionByInverseViewMatrix( retroVec, viewMatrix );
vec4 envMapColor = textureCubeUV( envMap, envMapRotation * retroVec, roughness );
return envMapColor.rgb * envMapIntensity;
#else
return vec3( 0.0 );
#endif
}
#endif
#ifdef USE_ANISOTROPY
vec3 getIBLAnisotropyRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness, const in vec3 bitangent, const in float anisotropy ) {
#ifdef ENVMAP_TYPE_CUBE_UV
vec3 bentNormal = cross( bitangent, viewDir );
bentNormal = normalize( cross( bentNormal, bitangent ) );
bentNormal = normalize( mix( bentNormal, normal, pow2( pow2( 1.0 - anisotropy * ( 1.0 - roughness ) ) ) ) );
return getIBLRadiance( viewDir, bentNormal, roughness );
#else
return vec3( 0.0 );
#endif
}
#ifdef USE_RETROREFLECTION
vec3 getIBLAnisotropyRetroRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness, const in vec3 bitangent, const in float anisotropy ) {
#ifdef ENVMAP_TYPE_CUBE_UV
vec3 bentNormal = cross( bitangent, viewDir );
bentNormal = normalize( cross( bentNormal, bitangent ) );
bentNormal = normalize( mix( bentNormal, normal, pow2( pow2( 1.0 - anisotropy * ( 1.0 - roughness ) ) ) ) );
return getIBLRetroRadiance( viewDir, bentNormal, roughness );
#else
return vec3( 0.0 );
#endif
}
#endif
#endif
#endif
`;var rf=`
ToonMaterial material;
material.diffuseColor = diffuseColor.rgb;
`;var of=`
varying vec3 vViewPosition;
struct ToonMaterial {
vec3 diffuseColor;
};
void RE_Direct_Toon( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
vec3 irradiance = getGradientIrradiance( geometryNormal, directLight.direction ) * directLight.color;
reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Toon( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct RE_Direct_Toon
#define RE_IndirectDiffuse RE_IndirectDiffuse_Toon
`;var sf=`
BlinnPhongMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularColor = specular;
material.specularShininess = shininess;
material.specularStrength = specularStrength;
`;var af=`
varying vec3 vViewPosition;
struct BlinnPhongMaterial {
vec3 diffuseColor;
vec3 specularColor;
float specularShininess;
float specularStrength;
};
void RE_Direct_BlinnPhong( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
vec3 irradiance = dotNL * directLight.color;
reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
reflectedLight.directSpecular += irradiance * BRDF_BlinnPhong( directLight.direction, geometryViewDir, geometryNormal, material.specularColor, material.specularShininess ) * material.specularStrength;
}
void RE_IndirectDiffuse_BlinnPhong( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct RE_Direct_BlinnPhong
#define RE_IndirectDiffuse RE_IndirectDiffuse_BlinnPhong
`;var lf=`
PhysicalMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.diffuseContribution = diffuseColor.rgb * ( 1.0 - metalnessFactor );
material.metalness = metalnessFactor;
vec3 dxy = max( abs( dFdx( nonPerturbedNormal ) ), abs( dFdy( nonPerturbedNormal ) ) );
float geometryRoughness = max( max( dxy.x, dxy.y ), dxy.z );
material.roughness = max( roughnessFactor, 0.0525 );
material.roughness += geometryRoughness;
material.roughness = min( material.roughness, 1.0 );
#ifdef IOR
material.ior = ior;
#ifdef USE_SPECULAR
float specularIntensityFactor = specularIntensity;
vec3 specularColorFactor = specularColor;
#ifdef USE_SPECULAR_COLORMAP
specularColorFactor *= texture2D( specularColorMap, vSpecularColorMapUv ).rgb;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
specularIntensityFactor *= texture2D( specularIntensityMap, vSpecularIntensityMapUv ).a;
#endif
material.specularF90 = mix( specularIntensityFactor, 1.0, metalnessFactor );
#else
float specularIntensityFactor = 1.0;
vec3 specularColorFactor = vec3( 1.0 );
material.specularF90 = 1.0;
#endif
material.specularColor = min( pow2( ( material.ior - 1.0 ) / ( material.ior + 1.0 ) ) * specularColorFactor, vec3( 1.0 ) ) * specularIntensityFactor;
material.specularColorBlended = mix( material.specularColor, diffuseColor.rgb, metalnessFactor );
#else
material.specularColor = vec3( 0.04 );
material.specularColorBlended = mix( material.specularColor, diffuseColor.rgb, metalnessFactor );
material.specularF90 = 1.0;
#endif
#ifdef USE_CLEARCOAT
material.clearcoat = clearcoat;
material.clearcoatRoughness = clearcoatRoughness;
material.clearcoatF0 = vec3( 0.04 );
material.clearcoatF90 = 1.0;
#ifdef USE_CLEARCOATMAP
material.clearcoat *= texture2D( clearcoatMap, vClearcoatMapUv ).x;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
material.clearcoatRoughness *= texture2D( clearcoatRoughnessMap, vClearcoatRoughnessMapUv ).y;
#endif
material.clearcoat = saturate( material.clearcoat );
material.clearcoatRoughness = max( material.clearcoatRoughness, 0.0525 );
material.clearcoatRoughness += geometryRoughness;
material.clearcoatRoughness = min( material.clearcoatRoughness, 1.0 );
#endif
#ifdef USE_DISPERSION
material.dispersion = dispersion;
#endif
#ifdef USE_RETROREFLECTION
material.retroreflectivity = retroreflectivity;
#endif
#ifdef USE_IRIDESCENCE
material.iridescence = iridescence;
material.iridescenceIOR = iridescenceIOR;
#ifdef USE_IRIDESCENCEMAP
material.iridescence *= texture2D( iridescenceMap, vIridescenceMapUv ).r;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
material.iridescenceThickness = (iridescenceThicknessMaximum - iridescenceThicknessMinimum) * texture2D( iridescenceThicknessMap, vIridescenceThicknessMapUv ).g + iridescenceThicknessMinimum;
#else
material.iridescenceThickness = iridescenceThicknessMaximum;
#endif
#endif
#ifdef USE_SHEEN
material.sheenColor = sheenColor;
#ifdef USE_SHEEN_COLORMAP
material.sheenColor *= texture2D( sheenColorMap, vSheenColorMapUv ).rgb;
#endif
material.sheenRoughness = clamp( sheenRoughness, 0.0001, 1.0 );
#ifdef USE_SHEEN_ROUGHNESSMAP
material.sheenRoughness *= texture2D( sheenRoughnessMap, vSheenRoughnessMapUv ).a;
#endif
#endif
#ifdef USE_ANISOTROPY
#ifdef USE_ANISOTROPYMAP
mat2 anisotropyMat = mat2( anisotropyVector.x, anisotropyVector.y, - anisotropyVector.y, anisotropyVector.x );
vec3 anisotropyPolar = texture2D( anisotropyMap, vAnisotropyMapUv ).rgb;
vec2 anisotropyV = anisotropyMat * normalize( 2.0 * anisotropyPolar.rg - vec2( 1.0 ) ) * anisotropyPolar.b;
#else
vec2 anisotropyV = anisotropyVector;
#endif
material.anisotropy = length( anisotropyV );
if( material.anisotropy == 0.0 ) {
anisotropyV = vec2( 1.0, 0.0 );
} else {
anisotropyV /= material.anisotropy;
material.anisotropy = saturate( material.anisotropy );
}
material.alphaT = mix( pow2( material.roughness ), 1.0, pow2( material.anisotropy ) );
material.anisotropyT = tbn[ 0 ] * anisotropyV.x + tbn[ 1 ] * anisotropyV.y;
material.anisotropyB = tbn[ 1 ] * anisotropyV.x - tbn[ 0 ] * anisotropyV.y;
#endif
`;var cf=`
uniform sampler2D dfgLUT;
struct PhysicalMaterial {
vec3 diffuseColor;
vec3 diffuseContribution;
vec3 specularColor;
vec3 specularColorBlended;
float roughness;
float metalness;
float specularF90;
float dispersion;
vec2 dfg;
vec3 multiScatteringCompensation;
#ifdef USE_RETROREFLECTION
float retroreflectivity;
#endif
#ifdef USE_CLEARCOAT
float clearcoat;
float clearcoatRoughness;
vec3 clearcoatF0;
float clearcoatF90;
#endif
#ifdef USE_IRIDESCENCE
float iridescence;
float iridescenceIOR;
float iridescenceThickness;
vec3 iridescenceFresnel;
vec3 iridescenceF0Dielectric;
vec3 iridescenceF0Metallic;
#endif
#ifdef USE_SHEEN
vec3 sheenColor;
float sheenRoughness;
#endif
#ifdef IOR
float ior;
#endif
#ifdef USE_TRANSMISSION
float transmission;
float transmissionAlpha;
float thickness;
float attenuationDistance;
vec3 attenuationColor;
#endif
#ifdef USE_ANISOTROPY
float anisotropy;
float alphaT;
vec3 anisotropyT;
vec3 anisotropyB;
#endif
};
vec3 clearcoatSpecularDirect = vec3( 0.0 );
vec3 clearcoatSpecularIndirect = vec3( 0.0 );
vec3 sheenSpecularDirect = vec3( 0.0 );
vec3 sheenSpecularIndirect = vec3(0.0 );
vec3 Schlick_to_F0( const in vec3 f, const in float f90, const in float dotVH ) {
float x = clamp( 1.0 - dotVH, 0.0, 1.0 );
float x2 = x * x;
float x5 = clamp( x * x2 * x2, 0.0, 0.9999 );
return ( f - vec3( f90 ) * x5 ) / ( 1.0 - x5 );
}
float V_GGX_SmithCorrelated( const in float alpha, const in float dotNL, const in float dotNV ) {
float a2 = pow2( alpha );
float gv = dotNL * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNV ) );
float gl = dotNV * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNL ) );
return 0.5 / max( gv + gl, EPSILON );
}
float D_GGX( const in float alpha, const in float dotNH ) {
float a2 = pow2( alpha );
float denom = pow2( dotNH ) * ( a2 - 1.0 ) + 1.0;
return RECIPROCAL_PI * a2 / pow2( denom );
}
#ifdef USE_ANISOTROPY
float V_GGX_SmithCorrelated_Anisotropic( const in float alphaT, const in float alphaB, const in float dotTV, const in float dotBV, const in float dotTL, const in float dotBL, const in float dotNV, const in float dotNL ) {
float gv = dotNL * length( vec3( alphaT * dotTV, alphaB * dotBV, dotNV ) );
float gl = dotNV * length( vec3( alphaT * dotTL, alphaB * dotBL, dotNL ) );
return 0.5 / max( gv + gl, EPSILON );
}
float D_GGX_Anisotropic( const in float alphaT, const in float alphaB, const in float dotNH, const in float dotTH, const in float dotBH ) {
float a2 = alphaT * alphaB;
highp vec3 v = vec3( alphaB * dotTH, alphaT * dotBH, a2 * dotNH );
highp float v2 = dot( v, v );
float w2 = a2 / v2;
return RECIPROCAL_PI * a2 * pow2 ( w2 );
}
#endif
#ifdef USE_CLEARCOAT
vec3 BRDF_GGX_Clearcoat( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material) {
vec3 f0 = material.clearcoatF0;
float f90 = material.clearcoatF90;
float roughness = material.clearcoatRoughness;
float alpha = pow2( roughness );
vec3 halfDir = normalize( lightDir + viewDir );
float dotNL = saturate( dot( normal, lightDir ) );
float dotNV = saturate( dot( normal, viewDir ) );
float dotNH = saturate( dot( normal, halfDir ) );
float dotVH = saturate( dot( viewDir, halfDir ) );
vec3 F = F_Schlick( f0, f90, dotVH );
float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );
float D = D_GGX( alpha, dotNH );
return F * ( V * D );
}
#endif
vec3 BRDF_GGX( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material ) {
vec3 f0 = material.specularColorBlended;
float f90 = material.specularF90;
float roughness = material.roughness;
float alpha = pow2( roughness );
vec3 halfDir = normalize( lightDir + viewDir );
float dotNL = saturate( dot( normal, lightDir ) );
float dotNV = saturate( dot( normal, viewDir ) );
float dotNH = saturate( dot( normal, halfDir ) );
float dotVH = saturate( dot( viewDir, halfDir ) );
vec3 F = F_Schlick( f0, f90, dotVH );
#ifdef USE_IRIDESCENCE
F = mix( F, material.iridescenceFresnel, material.iridescence );
#endif
#ifdef USE_ANISOTROPY
float dotTL = dot( material.anisotropyT, lightDir );
float dotTV = dot( material.anisotropyT, viewDir );
float dotTH = dot( material.anisotropyT, halfDir );
float dotBL = dot( material.anisotropyB, lightDir );
float dotBV = dot( material.anisotropyB, viewDir );
float dotBH = dot( material.anisotropyB, halfDir );
float V = V_GGX_SmithCorrelated_Anisotropic( material.alphaT, alpha, dotTV, dotBV, dotTL, dotBL, dotNV, dotNL );
float D = D_GGX_Anisotropic( material.alphaT, alpha, dotNH, dotTH, dotBH );
#else
float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );
float D = D_GGX( alpha, dotNH );
#endif
return F * ( V * D );
}
vec2 LTC_Uv( const in vec3 N, const in vec3 V, const in float roughness ) {
const float LUT_SIZE = 64.0;
const float LUT_SCALE = ( LUT_SIZE - 1.0 ) / LUT_SIZE;
const float LUT_BIAS = 0.5 / LUT_SIZE;
float dotNV = saturate( dot( N, V ) );
vec2 uv = vec2( roughness, sqrt( 1.0 - dotNV ) );
uv = uv * LUT_SCALE + LUT_BIAS;
return uv;
}
float LTC_ClippedSphereFormFactor( const in vec3 f ) {
float l = length( f );
return max( ( l * l + f.z ) / ( l + 1.0 ), 0.0 );
}
vec3 LTC_EdgeVectorFormFactor( const in vec3 v1, const in vec3 v2 ) {
float x = dot( v1, v2 );
float y = abs( x );
float a = 0.8543985 + ( 0.4965155 + 0.0145206 * y ) * y;
float b = 3.4175940 + ( 4.1616724 + y ) * y;
float v = a / b;
float theta_sintheta = ( x > 0.0 ) ? v : 0.5 * inversesqrt( max( 1.0 - x * x, 1e-7 ) ) - v;
return cross( v1, v2 ) * theta_sintheta;
}
vec3 LTC_Evaluate( const in vec3 N, const in vec3 V, const in vec3 P, const in mat3 mInv, const in vec3 rectCoords[ 4 ] ) {
vec3 v1 = rectCoords[ 1 ] - rectCoords[ 0 ];
vec3 v2 = rectCoords[ 3 ] - rectCoords[ 0 ];
vec3 lightNormal = cross( v1, v2 );
if( dot( lightNormal, P - rectCoords[ 0 ] ) < 0.0 ) return vec3( 0.0 );
vec3 T1, T2;
T1 = normalize( V - N * dot( V, N ) );
T2 = - cross( N, T1 );
mat3 mat = mInv * transpose( mat3( T1, T2, N ) );
vec3 coords[ 4 ];
coords[ 0 ] = mat * ( rectCoords[ 0 ] - P );
coords[ 1 ] = mat * ( rectCoords[ 1 ] - P );
coords[ 2 ] = mat * ( rectCoords[ 2 ] - P );
coords[ 3 ] = mat * ( rectCoords[ 3 ] - P );
coords[ 0 ] = normalize( coords[ 0 ] );
coords[ 1 ] = normalize( coords[ 1 ] );
coords[ 2 ] = normalize( coords[ 2 ] );
coords[ 3 ] = normalize( coords[ 3 ] );
vec3 vectorFormFactor = vec3( 0.0 );
vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 0 ], coords[ 1 ] );
vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 1 ], coords[ 2 ] );
vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 2 ], coords[ 3 ] );
vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 3 ], coords[ 0 ] );
float result = LTC_ClippedSphereFormFactor( vectorFormFactor );
return vec3( result );
}
#if defined( USE_SHEEN )
float D_Charlie( float roughness, float dotNH ) {
float alpha = pow2( roughness );
float invAlpha = 1.0 / alpha;
float cos2h = dotNH * dotNH;
float sin2h = max( 1.0 - cos2h, 0.0078125 );
return ( 2.0 + invAlpha ) * pow( sin2h, invAlpha * 0.5 ) / ( 2.0 * PI );
}
float V_Neubelt( float dotNV, float dotNL ) {
return saturate( 1.0 / ( 4.0 * ( dotNL + dotNV - dotNL * dotNV ) ) );
}
vec3 BRDF_Sheen( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, vec3 sheenColor, const in float sheenRoughness ) {
vec3 halfDir = normalize( lightDir + viewDir );
float dotNL = saturate( dot( normal, lightDir ) );
float dotNV = saturate( dot( normal, viewDir ) );
float dotNH = saturate( dot( normal, halfDir ) );
float D = D_Charlie( sheenRoughness, dotNH );
float V = V_Neubelt( dotNV, dotNL );
return sheenColor * ( D * V );
}
#endif
float IBLSheenBRDF( const in vec3 normal, const in vec3 viewDir, const in float roughness ) {
float dotNV = saturate( dot( normal, viewDir ) );
float r2 = roughness * roughness;
float rInv = 1.0 / ( roughness + 0.1 );
float a = -1.9362 + 1.0678 * roughness + 0.4573 * r2 - 0.8469 * rInv;
float b = -0.6014 + 0.5538 * roughness - 0.4670 * r2 - 0.1255 * rInv;
float DG = exp( a * dotNV + b );
return saturate( DG );
}
vec3 EnvironmentBRDF( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float roughness ) {
float dotNV = saturate( dot( normal, viewDir ) );
vec2 fab = texture2D( dfgLUT, vec2( roughness, dotNV ) ).rg;
return specularColor * fab.x + specularF90 * fab.y;
}
#ifdef USE_IRIDESCENCE
void computeMultiscatteringIridescence( const in vec2 fab, const in vec3 specularColor, const in float specularF90, const in float iridescence, const in vec3 iridescenceF0, inout vec3 singleScatter, inout vec3 multiScatter ) {
#else
void computeMultiscattering( const in vec2 fab, const in vec3 specularColor, const in float specularF90, inout vec3 singleScatter, inout vec3 multiScatter ) {
#endif
#ifdef USE_IRIDESCENCE
vec3 Fr = mix( specularColor, iridescenceF0, iridescence );
#else
vec3 Fr = specularColor;
#endif
vec3 FssEss = Fr * fab.x + specularF90 * fab.y;
float Ess = fab.x + fab.y;
float Ems = 1.0 - Ess;
vec3 Favg = Fr + ( 1.0 - Fr ) * 0.047619;
vec3 Fms = FssEss * Favg / ( 1.0 - Ems * Favg );
singleScatter += FssEss;
multiScatter += Fms * Ems;
}
#if NUM_RECT_AREA_LIGHTS > 0
void RE_Direct_RectArea_Physical( const in RectAreaLight rectAreaLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
vec3 normal = geometryNormal;
vec3 viewDir = geometryViewDir;
vec3 position = geometryPosition;
vec3 lightPos = rectAreaLight.position;
vec3 halfWidth = rectAreaLight.halfWidth;
vec3 halfHeight = rectAreaLight.halfHeight;
vec3 lightColor = rectAreaLight.color;
float roughness = material.roughness;
vec3 rectCoords[ 4 ];
rectCoords[ 0 ] = lightPos + halfWidth - halfHeight;
rectCoords[ 1 ] = lightPos - halfWidth - halfHeight;
rectCoords[ 2 ] = lightPos - halfWidth + halfHeight;
rectCoords[ 3 ] = lightPos + halfWidth + halfHeight;
vec2 uv = LTC_Uv( normal, viewDir, roughness );
vec4 t1 = texture2D( ltc_1, uv );
vec4 t2 = texture2D( ltc_2, uv );
mat3 mInv = mat3(
vec3( t1.x, 0, t1.y ),
vec3( 0, 1, 0 ),
vec3( t1.z, 0, t1.w )
);
vec3 fresnel = ( material.specularColorBlended * t2.x + ( material.specularF90 - material.specularColorBlended ) * t2.y );
reflectedLight.directSpecular += lightColor * fresnel * LTC_Evaluate( normal, viewDir, position, mInv, rectCoords );
reflectedLight.directDiffuse += lightColor * material.diffuseContribution * LTC_Evaluate( normal, viewDir, position, mat3( 1.0 ), rectCoords );
#ifdef USE_CLEARCOAT
vec3 Ncc = geometryClearcoatNormal;
vec2 uvClearcoat = LTC_Uv( Ncc, viewDir, material.clearcoatRoughness );
vec4 t1Clearcoat = texture2D( ltc_1, uvClearcoat );
vec4 t2Clearcoat = texture2D( ltc_2, uvClearcoat );
mat3 mInvClearcoat = mat3(
vec3( t1Clearcoat.x, 0, t1Clearcoat.y ),
vec3( 0, 1, 0 ),
vec3( t1Clearcoat.z, 0, t1Clearcoat.w )
);
vec3 fresnelClearcoat = material.clearcoatF0 * t2Clearcoat.x + ( material.clearcoatF90 - material.clearcoatF0 ) * t2Clearcoat.y;
clearcoatSpecularDirect += lightColor * fresnelClearcoat * LTC_Evaluate( Ncc, viewDir, position, mInvClearcoat, rectCoords );
#endif
}
#endif
void RE_Direct_Physical( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
vec3 irradiance = dotNL * directLight.color;
#ifdef USE_CLEARCOAT
float dotNLcc = saturate( dot( geometryClearcoatNormal, directLight.direction ) );
vec3 ccIrradiance = dotNLcc * directLight.color;
clearcoatSpecularDirect += ccIrradiance * BRDF_GGX_Clearcoat( directLight.direction, geometryViewDir, geometryClearcoatNormal, material );
#endif
#ifdef USE_SHEEN
sheenSpecularDirect += irradiance * BRDF_Sheen( directLight.direction, geometryViewDir, geometryNormal, material.sheenColor, material.sheenRoughness );
float sheenAlbedoV = IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
float sheenAlbedoL = IBLSheenBRDF( geometryNormal, directLight.direction, material.sheenRoughness );
float sheenEnergyComp = 1.0 - max3( material.sheenColor ) * max( sheenAlbedoV, sheenAlbedoL );
irradiance *= sheenEnergyComp;
#endif
vec3 specularBRDF = BRDF_GGX( directLight.direction, geometryViewDir, geometryNormal, material );
#ifdef USE_RETROREFLECTION
vec3 retroViewDir = reflect( - geometryViewDir, geometryNormal );
vec3 retroSpecularBRDF = BRDF_GGX( directLight.direction, retroViewDir, geometryNormal, material );
specularBRDF = mix( specularBRDF, retroSpecularBRDF, saturate( material.retroreflectivity ) );
#endif
reflectedLight.directSpecular += irradiance * specularBRDF * material.multiScatteringCompensation;
vec3 halfDir = normalize( directLight.direction + geometryViewDir );
float dotVH = saturate( dot( geometryViewDir, halfDir ) );
vec3 F = F_Schlick( material.specularColor, material.specularF90, dotVH );
#ifdef USE_RETROREFLECTION
vec3 retroHalfDir = normalize( directLight.direction + retroViewDir );
float dotRetroVH = saturate( dot( retroViewDir, retroHalfDir ) );
vec3 retroF = F_Schlick( material.specularColor, material.specularF90, dotRetroVH );
F = mix( F, retroF, saturate( material.retroreflectivity ) );
#endif
reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseContribution ) * ( 1.0 - F );
}
void RE_IndirectDiffuse_Physical( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
vec3 singleScattering = vec3( 0.0 );
vec3 multiScattering = vec3( 0.0 );
#ifdef USE_IRIDESCENCE
computeMultiscatteringIridescence( material.dfg, material.specularColor, material.specularF90, material.iridescence, material.iridescenceF0Dielectric, singleScattering, multiScattering );
#else
computeMultiscattering( material.dfg, material.specularColor, material.specularF90, singleScattering, multiScattering );
#endif
vec3 diffuse = irradiance * BRDF_Lambert( material.diffuseContribution ) * ( 1.0 - singleScattering - multiScattering );
#ifdef USE_SHEEN
float sheenAlbedo = IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
sheenSpecularIndirect += irradiance * material.sheenColor * sheenAlbedo * RECIPROCAL_PI;
float sheenEnergyComp = 1.0 - max3( material.sheenColor ) * sheenAlbedo;
diffuse *= sheenEnergyComp;
#endif
reflectedLight.indirectDiffuse += diffuse;
}
void RE_IndirectSpecular_Physical( const in vec3 radiance, const in vec3 irradiance, const in vec3 clearcoatRadiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight) {
#ifdef USE_CLEARCOAT
clearcoatSpecularIndirect += clearcoatRadiance * EnvironmentBRDF( geometryClearcoatNormal, geometryViewDir, material.clearcoatF0, material.clearcoatF90, material.clearcoatRoughness );
#endif
#ifdef USE_SHEEN
sheenSpecularIndirect += irradiance * material.sheenColor * IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness ) * RECIPROCAL_PI;
#endif
vec3 singleScatteringDielectric = vec3( 0.0 );
vec3 multiScatteringDielectric = vec3( 0.0 );
vec3 singleScatteringMetallic = vec3( 0.0 );
vec3 multiScatteringMetallic = vec3( 0.0 );
#ifdef USE_IRIDESCENCE
computeMultiscatteringIridescence( material.dfg, material.specularColor, material.specularF90, material.iridescence, material.iridescenceF0Dielectric, singleScatteringDielectric, multiScatteringDielectric );
computeMultiscatteringIridescence( material.dfg, material.diffuseColor, material.specularF90, material.iridescence, material.iridescenceF0Metallic, singleScatteringMetallic, multiScatteringMetallic );
#else
computeMultiscattering( material.dfg, material.specularColor, material.specularF90, singleScatteringDielectric, multiScatteringDielectric );
computeMultiscattering( material.dfg, material.diffuseColor, material.specularF90, singleScatteringMetallic, multiScatteringMetallic );
#endif
vec3 singleScattering = mix( singleScatteringDielectric, singleScatteringMetallic, material.metalness );
vec3 multiScattering = mix( multiScatteringDielectric, multiScatteringMetallic, material.metalness );
vec3 totalScatteringDielectric = singleScatteringDielectric + multiScatteringDielectric;
vec3 diffuse = material.diffuseContribution * ( 1.0 - totalScatteringDielectric );
vec3 cosineWeightedIrradiance = irradiance * RECIPROCAL_PI;
vec3 indirectSpecular = radiance * singleScattering;
indirectSpecular += multiScattering * cosineWeightedIrradiance;
vec3 indirectDiffuse = diffuse * cosineWeightedIrradiance;
#ifdef USE_SHEEN
float sheenAlbedo = IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
float sheenEnergyComp = 1.0 - max3( material.sheenColor ) * sheenAlbedo;
indirectSpecular *= sheenEnergyComp;
indirectDiffuse *= sheenEnergyComp;
#endif
reflectedLight.indirectSpecular += indirectSpecular;
reflectedLight.indirectDiffuse += indirectDiffuse;
}
#define RE_Direct RE_Direct_Physical
#define RE_Direct_RectArea RE_Direct_RectArea_Physical
#define RE_IndirectDiffuse RE_IndirectDiffuse_Physical
#define RE_IndirectSpecular RE_IndirectSpecular_Physical
float computeSpecularOcclusion( const in float dotNV, const in float ambientOcclusion, const in float roughness ) {
return saturate( pow( dotNV + ambientOcclusion, exp2( - 16.0 * roughness - 1.0 ) ) - 1.0 + ambientOcclusion );
}
`;var uf=`
vec3 geometryPosition = - vViewPosition;
vec3 geometryNormal = normal;
vec3 geometryViewDir = ( isOrthographic ) ? vec3( 0, 0, 1 ) : normalize( vViewPosition );
vec3 geometryClearcoatNormal = vec3( 0.0 );
#ifdef USE_CLEARCOAT
geometryClearcoatNormal = clearcoatNormal;
#endif
#ifdef USE_IRIDESCENCE
float dotNVi = saturate( dot( normal, geometryViewDir ) );
if ( material.iridescenceThickness == 0.0 ) {
material.iridescence = 0.0;
} else {
material.iridescence = saturate( material.iridescence );
}
if ( material.iridescence > 0.0 ) {
vec3 iridescenceFresnelDielectric = evalIridescence( 1.0, material.iridescenceIOR, dotNVi, material.iridescenceThickness, material.specularColor );
vec3 iridescenceFresnelMetallic = evalIridescence( 1.0, material.iridescenceIOR, dotNVi, material.iridescenceThickness, material.diffuseColor );
material.iridescenceFresnel = mix( iridescenceFresnelDielectric, iridescenceFresnelMetallic, material.metalness );
material.iridescenceF0Dielectric = Schlick_to_F0( iridescenceFresnelDielectric, 1.0, dotNVi );
material.iridescenceF0Metallic = Schlick_to_F0( iridescenceFresnelMetallic, 1.0, dotNVi );
}
#endif
#ifdef STANDARD
float dotNVms = saturate( dot( geometryNormal, geometryViewDir ) );
material.dfg = texture2D( dfgLUT, vec2( material.roughness, dotNVms ) ).rg;
#if ( NUM_SUN_LIGHTS > 0 || NUM_DIR_LIGHTS > 0 || NUM_POINT_LIGHTS > 0 || NUM_SPOT_LIGHTS > 0 )
float EssMs = material.dfg.x + material.dfg.y;
material.multiScatteringCompensation = 1.0 + material.specularColorBlended * ( 1.0 / EssMs - 1.0 );
#endif
#endif
IncidentLight directLight;
#if ( NUM_POINT_LIGHTS > 0 ) && defined( RE_Direct )
PointLight pointLight;
#if defined( USE_SHADOWMAP ) && NUM_POINT_LIGHT_SHADOWS > 0
PointLightShadow pointLightShadow;
#endif
#pragma unroll_loop_start
for ( int i = 0; i < NUM_POINT_LIGHTS; i ++ ) {
pointLight = pointLights[ i ];
getPointLightInfo( pointLight, geometryPosition, directLight );
#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_POINT_LIGHT_SHADOWS ) && ( defined( SHADOWMAP_TYPE_PCF ) || defined( SHADOWMAP_TYPE_BASIC ) )
pointLightShadow = pointLightShadows[ i ];
directLight.color *= ( directLight.visible && receiveShadow ) ? getPointShadow( pointShadowMap[ i ], pointLightShadow.shadowMapSize, pointLightShadow.shadowIntensity, pointLightShadow.shadowBias, pointLightShadow.shadowRadius, vPointShadowCoord[ i ], pointLightShadow.shadowCameraNear, pointLightShadow.shadowCameraFar ) : 1.0;
#endif
RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
}
#pragma unroll_loop_end
#endif
#if ( NUM_SPOT_LIGHTS > 0 ) && defined( RE_Direct )
SpotLight spotLight;
vec4 spotColor;
vec3 spotLightCoord;
bool inSpotLightMap;
#if defined( USE_SHADOWMAP ) && NUM_SPOT_LIGHT_SHADOWS > 0
SpotLightShadow spotLightShadow;
#endif
#pragma unroll_loop_start
for ( int i = 0; i < NUM_SPOT_LIGHTS; i ++ ) {
spotLight = spotLights[ i ];
getSpotLightInfo( spotLight, geometryPosition, directLight );
#if ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
#define SPOT_LIGHT_MAP_INDEX UNROLLED_LOOP_INDEX
#elif ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
#define SPOT_LIGHT_MAP_INDEX NUM_SPOT_LIGHT_MAPS
#else
#define SPOT_LIGHT_MAP_INDEX ( UNROLLED_LOOP_INDEX - NUM_SPOT_LIGHT_SHADOWS + NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
#endif
#if ( SPOT_LIGHT_MAP_INDEX < NUM_SPOT_LIGHT_MAPS )
spotLightCoord = vSpotLightCoord[ i ].xyz / vSpotLightCoord[ i ].w;
inSpotLightMap = all( lessThan( abs( spotLightCoord * 2. - 1. ), vec3( 1.0 ) ) );
spotColor = texture2D( spotLightMap[ SPOT_LIGHT_MAP_INDEX ], spotLightCoord.xy );
directLight.color = inSpotLightMap ? directLight.color * spotColor.rgb : directLight.color;
#endif
#undef SPOT_LIGHT_MAP_INDEX
#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
spotLightShadow = spotLightShadows[ i ];
directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( spotShadowMap[ i ], spotLightShadow.shadowMapSize, spotLightShadow.shadowIntensity, spotLightShadow.shadowBias, spotLightShadow.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
#endif
RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
}
#pragma unroll_loop_end
#endif
#if ( NUM_SUN_LIGHTS > 0 ) && defined( RE_Direct )
SunLight sunLight;
#if defined( USE_SHADOWMAP ) && NUM_SUN_LIGHT_SHADOWS > 0
SunLightShadow sunLightShadow;
#endif
#pragma unroll_loop_start
for ( int i = 0; i < NUM_SUN_LIGHTS; i ++ ) {
sunLight = sunLights[ i ];
getSunLightInfo( sunLight, directLight );
#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_SUN_LIGHT_SHADOWS )
sunLightShadow = sunLightShadows[ i ];
directLight.color *= ( directLight.visible && receiveShadow ) ? getSunShadow( sunShadowMap[ i ], sunLightShadow, UNROLLED_LOOP_INDEX ) : 1.0;
#endif
RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
}
#pragma unroll_loop_end
#endif
#if ( NUM_DIR_LIGHTS > 0 ) && defined( RE_Direct )
DirectionalLight directionalLight;
#if defined( USE_SHADOWMAP ) && NUM_DIR_LIGHT_SHADOWS > 0
DirectionalLightShadow directionalLightShadow;
#endif
#pragma unroll_loop_start
for ( int i = 0; i < NUM_DIR_LIGHTS; i ++ ) {
directionalLight = directionalLights[ i ];
getDirectionalLightInfo( directionalLight, directLight );
#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_DIR_LIGHT_SHADOWS )
directionalLightShadow = directionalLightShadows[ i ];
directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( directionalShadowMap[ i ], directionalLightShadow.shadowMapSize, directionalLightShadow.shadowIntensity, directionalLightShadow.shadowBias, directionalLightShadow.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
#endif
RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
}
#pragma unroll_loop_end
#endif
#if ( NUM_RECT_AREA_LIGHTS > 0 ) && defined( RE_Direct_RectArea )
RectAreaLight rectAreaLight;
#pragma unroll_loop_start
for ( int i = 0; i < NUM_RECT_AREA_LIGHTS; i ++ ) {
rectAreaLight = rectAreaLights[ i ];
RE_Direct_RectArea( rectAreaLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
}
#pragma unroll_loop_end
#endif
#if defined( RE_IndirectDiffuse )
vec3 iblIrradiance = vec3( 0.0 );
vec3 irradiance = getAmbientLightIrradiance( ambientLightColor );
#if defined( USE_LIGHT_PROBES )
irradiance += getLightProbeIrradiance( lightProbe, geometryNormal );
#endif
#if ( NUM_HEMI_LIGHTS > 0 )
#pragma unroll_loop_start
for ( int i = 0; i < NUM_HEMI_LIGHTS; i ++ ) {
irradiance += getHemisphereLightIrradiance( hemisphereLights[ i ], geometryNormal );
}
#pragma unroll_loop_end
#endif
#ifdef USE_LIGHT_PROBES_GRID
vec3 probeWorldPos = ( ( vec4( geometryPosition, 1.0 ) - viewMatrix[ 3 ] ) * viewMatrix ).xyz;
vec3 probeWorldNormal = transformNormalByInverseViewMatrix( geometryNormal, viewMatrix );
irradiance += getLightProbeGridIrradiance( probeWorldPos, probeWorldNormal );
#endif
#endif
#if defined( RE_IndirectSpecular )
vec3 radiance = vec3( 0.0 );
vec3 clearcoatRadiance = vec3( 0.0 );
#endif
`;var ff=`
#if defined( RE_IndirectDiffuse )
#ifdef USE_LIGHTMAP
vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
vec3 lightMapIrradiance = lightMapTexel.rgb * lightMapIntensity;
irradiance += lightMapIrradiance;
#endif
#if defined( USE_ENVMAP ) && defined( ENVMAP_TYPE_CUBE_UV )
#if defined( STANDARD ) || defined( LAMBERT ) || defined( PHONG )
iblIrradiance += getIBLIrradiance( geometryNormal );
#endif
#endif
#endif
#if defined( USE_ENVMAP ) && defined( RE_IndirectSpecular )
#ifdef USE_ANISOTROPY
vec3 iblRadiance = getIBLAnisotropyRadiance( geometryViewDir, geometryNormal, material.roughness, material.anisotropyB, material.anisotropy );
#else
vec3 iblRadiance = getIBLRadiance( geometryViewDir, geometryNormal, material.roughness );
#endif
#ifdef USE_RETROREFLECTION
#ifdef USE_ANISOTROPY
vec3 retroIBLRadiance = getIBLAnisotropyRetroRadiance( geometryViewDir, geometryNormal, material.roughness, material.anisotropyB, material.anisotropy );
#else
vec3 retroIBLRadiance = getIBLRetroRadiance( geometryViewDir, geometryNormal, material.roughness );
#endif
iblRadiance = mix( iblRadiance, retroIBLRadiance, saturate( material.retroreflectivity ) );
#endif
radiance += iblRadiance;
#ifdef USE_CLEARCOAT
clearcoatRadiance += getIBLRadiance( geometryViewDir, geometryClearcoatNormal, material.clearcoatRoughness );
#endif
#endif
`;var hf=`
#if defined( RE_IndirectDiffuse )
#if defined( LAMBERT ) || defined( PHONG )
irradiance += iblIrradiance;
#endif
RE_IndirectDiffuse( irradiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif
#if defined( RE_IndirectSpecular )
RE_IndirectSpecular( radiance, iblIrradiance, clearcoatRadiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif
`;var df=`
#ifdef USE_LIGHT_PROBES_GRID
uniform highp sampler3D probesSH;
uniform vec3 probesMin;
uniform vec3 probesMax;
uniform vec3 probesResolution;
vec3 getLightProbeGridIrradiance( vec3 worldPos, vec3 worldNormal ) {
vec3 res = probesResolution;
vec3 gridRange = probesMax - probesMin;
vec3 resMinusOne = res - 1.0;
vec3 probeSpacing = gridRange / resMinusOne;
vec3 samplePos = worldPos + worldNormal * probeSpacing * 0.5;
vec3 uvw = clamp( ( samplePos - probesMin ) / gridRange, 0.0, 1.0 );
uvw = uvw * resMinusOne / res + 0.5 / res;
float nz = res.z;
float paddedSlices = nz + 2.0;
float atlasDepth = 7.0 * paddedSlices;
float uvZBase = uvw.z * nz + 1.0;
vec4 s0 = texture( probesSH, vec3( uvw.xy, ( uvZBase ) / atlasDepth ) );
vec4 s1 = texture( probesSH, vec3( uvw.xy, ( uvZBase + paddedSlices ) / atlasDepth ) );
vec4 s2 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 2.0 * paddedSlices ) / atlasDepth ) );
vec4 s3 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 3.0 * paddedSlices ) / atlasDepth ) );
vec4 s4 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 4.0 * paddedSlices ) / atlasDepth ) );
vec4 s5 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 5.0 * paddedSlices ) / atlasDepth ) );
vec4 s6 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 6.0 * paddedSlices ) / atlasDepth ) );
vec3 c0 = s0.xyz;
vec3 c1 = vec3( s0.w, s1.xy );
vec3 c2 = vec3( s1.zw, s2.x );
vec3 c3 = s2.yzw;
vec3 c4 = s3.xyz;
vec3 c5 = vec3( s3.w, s4.xy );
vec3 c6 = vec3( s4.zw, s5.x );
vec3 c7 = s5.yzw;
vec3 c8 = s6.xyz;
float x = worldNormal.x, y = worldNormal.y, z = worldNormal.z;
vec3 result = c0 * 0.886227;
result += c1 * 2.0 * 0.511664 * y;
result += c2 * 2.0 * 0.511664 * z;
result += c3 * 2.0 * 0.511664 * x;
result += c4 * 2.0 * 0.429043 * x * y;
result += c5 * 2.0 * 0.429043 * y * z;
result += c6 * ( 0.743125 * z * z - 0.247708 );
result += c7 * 2.0 * 0.429043 * x * z;
result += c8 * 0.429043 * ( x * x - y * y );
return max( result, vec3( 0.0 ) );
}
#endif
`;var pf=`
#if defined( USE_LOGARITHMIC_DEPTH_BUFFER )
gl_FragDepth = vIsPerspective == 0.0 ? gl_FragCoord.z : log2( vFragDepth ) * logDepthBufFC * 0.5;
#endif
`;var mf=`
#if defined( USE_LOGARITHMIC_DEPTH_BUFFER )
uniform float logDepthBufFC;
varying float vFragDepth;
varying float vIsPerspective;
#endif
`;var gf=`
#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
varying float vFragDepth;
varying float vIsPerspective;
#endif
`;var _f=`
#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
vFragDepth = 1.0 + gl_Position.w;
vIsPerspective = float( isPerspectiveMatrix( projectionMatrix ) );
#endif
`;var xf=`
#ifdef USE_MAP
vec4 sampledDiffuseColor = texture2D( map, vMapUv );
#ifdef DECODE_VIDEO_TEXTURE
sampledDiffuseColor = sRGBTransferEOTF( sampledDiffuseColor );
#endif
diffuseColor *= sampledDiffuseColor;
#endif
`;var Mf=`
#ifdef USE_MAP
uniform sampler2D map;
#endif
`;var Sf=`
#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
#if defined( USE_POINTS_UV )
vec2 uv = vUv;
#else
vec2 uv = ( uvTransform * vec3( gl_PointCoord.x, 1.0 - gl_PointCoord.y, 1 ) ).xy;
#endif
#endif
#ifdef USE_MAP
diffuseColor *= texture2D( map, uv );
#endif
#ifdef USE_ALPHAMAP
diffuseColor.a *= texture2D( alphaMap, uv ).g;
#endif
`;var vf=`
#if defined( USE_POINTS_UV )
varying vec2 vUv;
#else
#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
uniform mat3 uvTransform;
#endif
#endif
#ifdef USE_MAP
uniform sampler2D map;
#endif
#ifdef USE_ALPHAMAP
uniform sampler2D alphaMap;
#endif
`;var yf=`
float metalnessFactor = metalness;
#ifdef USE_METALNESSMAP
vec4 texelMetalness = texture2D( metalnessMap, vMetalnessMapUv );
metalnessFactor *= texelMetalness.b;
#endif
`;var bf=`
#ifdef USE_METALNESSMAP
uniform sampler2D metalnessMap;
#endif
`;var Ef=`
#ifdef USE_INSTANCING_MORPH
float morphTargetInfluences[ MORPHTARGETS_COUNT ];
float morphTargetBaseInfluence = texelFetch( morphTexture, ivec2( 0, gl_InstanceID ), 0 ).r;
for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
morphTargetInfluences[i] = texelFetch( morphTexture, ivec2( i + 1, gl_InstanceID ), 0 ).r;
}
#endif
`;var Tf=`
#if defined( USE_MORPHCOLORS )
vColor *= morphTargetBaseInfluence;
for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
#if defined( USE_COLOR_ALPHA )
if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ) * morphTargetInfluences[ i ];
#elif defined( USE_COLOR )
if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ).rgb * morphTargetInfluences[ i ];
#endif
}
#endif
`;var Af=`
#ifdef USE_MORPHNORMALS
objectNormal *= morphTargetBaseInfluence;
for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
if ( morphTargetInfluences[ i ] != 0.0 ) objectNormal += getMorph( gl_VertexID, i, 1 ).xyz * morphTargetInfluences[ i ];
}
#endif
`;var wf=`
#ifdef USE_MORPHTARGETS
#ifndef USE_INSTANCING_MORPH
uniform float morphTargetBaseInfluence;
uniform float morphTargetInfluences[ MORPHTARGETS_COUNT ];
#endif
uniform sampler2DArray morphTargetsTexture;
uniform ivec2 morphTargetsTextureSize;
vec4 getMorph( const in int vertexIndex, const in int morphTargetIndex, const in int offset ) {
int texelIndex = vertexIndex * MORPHTARGETS_TEXTURE_STRIDE + offset;
int y = texelIndex / morphTargetsTextureSize.x;
int x = texelIndex - y * morphTargetsTextureSize.x;
ivec3 morphUV = ivec3( x, y, morphTargetIndex );
return texelFetch( morphTargetsTexture, morphUV, 0 );
}
#endif
`;var Rf=`
#ifdef USE_MORPHTARGETS
transformed *= morphTargetBaseInfluence;
for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
if ( morphTargetInfluences[ i ] != 0.0 ) transformed += getMorph( gl_VertexID, i, 0 ).xyz * morphTargetInfluences[ i ];
}
#endif
`;var Cf=`
float faceDirection = gl_FrontFacing ? 1.0 : - 1.0;
#ifdef FLAT_SHADED
vec3 fdx = dFdx( vViewPosition );
vec3 fdy = dFdy( vViewPosition );
vec3 normal = normalize( cross( fdx, fdy ) );
#else
vec3 normal = normalize( vNormal );
#ifdef DOUBLE_SIDED
normal *= faceDirection;
#endif
#endif
#if defined( USE_NORMALMAP_TANGENTSPACE ) || defined( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY )
#ifdef USE_TANGENT
mat3 tbn = mat3( normalize( vTangent ), normalize( vBitangent ), normal );
#else
mat3 tbn = getTangentFrame( - vViewPosition, normal,
#if defined( USE_NORMALMAP )
vNormalMapUv
#elif defined( USE_CLEARCOAT_NORMALMAP )
vClearcoatNormalMapUv
#else
vUv
#endif
);
#endif
#ifdef DOUBLE_SIDED
tbn[0] *= faceDirection;
tbn[1] *= faceDirection;
#endif
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
#ifdef USE_TANGENT
mat3 tbn2 = mat3( normalize( vTangent ), normalize( vBitangent ), normal );
#else
mat3 tbn2 = getTangentFrame( - vViewPosition, normal, vClearcoatNormalMapUv );
#endif
#ifdef DOUBLE_SIDED
tbn2[0] *= faceDirection;
tbn2[1] *= faceDirection;
#endif
#endif
vec3 nonPerturbedNormal = normal;
`;var Pf=`
#ifdef USE_NORMALMAP_OBJECTSPACE
normal = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
#ifdef FLIP_SIDED
normal = - normal;
#endif
#ifdef DOUBLE_SIDED
normal = normal * faceDirection;
#endif
normal = normalize( normalMatrix * normal );
#elif defined( USE_NORMALMAP_TANGENTSPACE )
vec3 mapN = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
#if defined( USE_PACKED_NORMALMAP )
mapN = vec3( mapN.xy, sqrt( saturate( 1.0 - dot( mapN.xy, mapN.xy ) ) ) );
#endif
mapN.xy *= normalScale;
normal = normalize( tbn * mapN );
#elif defined( USE_BUMPMAP )
normal = perturbNormalArb( - vViewPosition, normal, dHdxy_fwd(), faceDirection );
#endif
`;var Lf=`
#ifndef FLAT_SHADED
varying vec3 vNormal;
#ifdef USE_TANGENT
varying vec3 vTangent;
varying vec3 vBitangent;
#endif
#endif
`;var Df=`
#ifndef FLAT_SHADED
varying vec3 vNormal;
#ifdef USE_TANGENT
varying vec3 vTangent;
varying vec3 vBitangent;
#endif
#endif
`;var If=`
#ifndef FLAT_SHADED
vNormal = normalize( transformedNormal );
#ifdef USE_TANGENT
vTangent = normalize( transformedTangent );
vBitangent = normalize( cross( vNormal, vTangent ) * tangent.w );
#ifdef FLIP_SIDED
vBitangent = - vBitangent;
#endif
#endif
#endif
`;var Nf=`
#ifdef USE_NORMALMAP
uniform sampler2D normalMap;
uniform vec2 normalScale;
#endif
#ifdef USE_NORMALMAP_OBJECTSPACE
uniform mat3 normalMatrix;
#endif
#if ! defined ( USE_TANGENT ) && ( defined ( USE_NORMALMAP_TANGENTSPACE ) || defined ( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY ) )
mat3 getTangentFrame( vec3 eye_pos, vec3 surf_norm, vec2 uv ) {
vec3 q0 = dFdx( eye_pos.xyz );
vec3 q1 = dFdy( eye_pos.xyz );
vec2 st0 = dFdx( uv.st );
vec2 st1 = dFdy( uv.st );
vec3 N = surf_norm;
vec3 q1perp = cross( q1, N );
vec3 q0perp = cross( N, q0 );
vec3 T = q1perp * st0.x + q0perp * st1.x;
vec3 B = q1perp * st0.y + q0perp * st1.y;
float det = max( dot( T, T ), dot( B, B ) );
float scale = ( det == 0.0 ) ? 0.0 : inversesqrt( det );
return mat3( T * scale, B * scale, N );
}
#endif
`;var Uf=`
#ifdef USE_CLEARCOAT
vec3 clearcoatNormal = nonPerturbedNormal;
#endif
`;var Ff=`
#ifdef USE_CLEARCOAT_NORMALMAP
vec3 clearcoatMapN = texture2D( clearcoatNormalMap, vClearcoatNormalMapUv ).xyz * 2.0 - 1.0;
clearcoatMapN.xy *= clearcoatNormalScale;
clearcoatNormal = normalize( tbn2 * clearcoatMapN );
#endif
`;var Of=`
#ifdef USE_CLEARCOATMAP
uniform sampler2D clearcoatMap;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
uniform sampler2D clearcoatNormalMap;
uniform vec2 clearcoatNormalScale;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
uniform sampler2D clearcoatRoughnessMap;
#endif
`;var Bf=`
#ifdef USE_IRIDESCENCEMAP
uniform sampler2D iridescenceMap;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
uniform sampler2D iridescenceThicknessMap;
#endif
`;var Gf=`
#ifdef OPAQUE
diffuseColor.a = 1.0;
#endif
#ifdef USE_TRANSMISSION
diffuseColor.a *= material.transmissionAlpha;
#endif
gl_FragColor = vec4( outgoingLight, diffuseColor.a );
`;var zf=`
vec3 packNormalToRGB( const in vec3 normal ) {
return normalize( normal ) * 0.5 + 0.5;
}
vec3 unpackRGBToNormal( const in vec3 rgb ) {
return 2.0 * rgb.xyz - 1.0;
}
const float PackUpscale = 256. / 255.;
const float UnpackDownscale = 255. / 256.;
const float ShiftRight8 = 1. / 256.;
const float Inv255 = 1. / 255.;
const vec4 PackFactors = vec4( 1.0, 256.0, 256.0 * 256.0, 256.0 * 256.0 * 256.0 );
const vec2 UnpackFactors2 = vec2( UnpackDownscale, 1.0 / PackFactors.g );
const vec3 UnpackFactors3 = vec3( UnpackDownscale / PackFactors.rg, 1.0 / PackFactors.b );
const vec4 UnpackFactors4 = vec4( UnpackDownscale / PackFactors.rgb, 1.0 / PackFactors.a );
vec4 packDepthToRGBA( const in float v ) {
if( v <= 0.0 )
return vec4( 0., 0., 0., 0. );
if( v >= 1.0 )
return vec4( 1., 1., 1., 1. );
float vuf;
float af = modf( v * PackFactors.a, vuf );
float bf = modf( vuf * ShiftRight8, vuf );
float gf = modf( vuf * ShiftRight8, vuf );
return vec4( vuf * Inv255, gf * PackUpscale, bf * PackUpscale, af );
}
vec3 packDepthToRGB( const in float v ) {
if( v <= 0.0 )
return vec3( 0., 0., 0. );
if( v >= 1.0 )
return vec3( 1., 1., 1. );
float vuf;
float bf = modf( v * PackFactors.b, vuf );
float gf = modf( vuf * ShiftRight8, vuf );
return vec3( vuf * Inv255, gf * PackUpscale, bf );
}
vec2 packDepthToRG( const in float v ) {
if( v <= 0.0 )
return vec2( 0., 0. );
if( v >= 1.0 )
return vec2( 1., 1. );
float vuf;
float gf = modf( v * 256., vuf );
return vec2( vuf * Inv255, gf );
}
float unpackRGBAToDepth( const in vec4 v ) {
return dot( v, UnpackFactors4 );
}
float unpackRGBToDepth( const in vec3 v ) {
return dot( v, UnpackFactors3 );
}
float unpackRGToDepth( const in vec2 v ) {
return v.r * UnpackFactors2.r + v.g * UnpackFactors2.g;
}
vec4 pack2HalfToRGBA( const in vec2 v ) {
vec4 r = vec4( v.x, fract( v.x * 255.0 ), v.y, fract( v.y * 255.0 ) );
return vec4( r.x - r.y / 255.0, r.y, r.z - r.w / 255.0, r.w );
}
vec2 unpackRGBATo2Half( const in vec4 v ) {
return vec2( v.x + ( v.y / 255.0 ), v.z + ( v.w / 255.0 ) );
}
float viewZToOrthographicDepth( const in float viewZ, const in float near, const in float far ) {
return ( viewZ + near ) / ( near - far );
}
float orthographicDepthToViewZ( const in float depth, const in float near, const in float far ) {
#ifdef USE_REVERSED_DEPTH_BUFFER
return depth * ( far - near ) - far;
#else
return depth * ( near - far ) - near;
#endif
}
float viewZToPerspectiveDepth( const in float viewZ, const in float near, const in float far ) {
return ( ( near + viewZ ) * far ) / ( ( far - near ) * viewZ );
}
float perspectiveDepthToViewZ( const in float depth, const in float near, const in float far ) {
#ifdef USE_REVERSED_DEPTH_BUFFER
return ( near * far ) / ( ( near - far ) * depth - near );
#else
return ( near * far ) / ( ( far - near ) * depth - far );
#endif
}
`;var kf=`
#ifdef PREMULTIPLIED_ALPHA
gl_FragColor.rgb *= gl_FragColor.a;
#endif
`;var Hf=`
vec4 mvPosition = vec4( transformed, 1.0 );
#ifdef USE_BATCHING
mvPosition = batchingMatrix * mvPosition;
#endif
#ifdef USE_INSTANCING
mvPosition = instanceMatrix * mvPosition;
#endif
mvPosition = modelViewMatrix * mvPosition;
gl_Position = projectionMatrix * mvPosition;
`;var Vf=`
#ifdef DITHERING
gl_FragColor.rgb = dithering( gl_FragColor.rgb );
#endif
`;var Wf=`
#ifdef DITHERING
vec3 dithering( vec3 color ) {
float grid_position = rand( gl_FragCoord.xy );
vec3 dither_shift_RGB = vec3( 0.25 / 255.0, -0.25 / 255.0, 0.25 / 255.0 );
dither_shift_RGB = mix( 2.0 * dither_shift_RGB, -2.0 * dither_shift_RGB, grid_position );
return color + dither_shift_RGB;
}
#endif
`;var Xf=`
float roughnessFactor = roughness;
#ifdef USE_ROUGHNESSMAP
vec4 texelRoughness = texture2D( roughnessMap, vRoughnessMapUv );
roughnessFactor *= texelRoughness.g;
#endif
`;var qf=`
#ifdef USE_ROUGHNESSMAP
uniform sampler2D roughnessMap;
#endif
`;var Yf=`
#if NUM_SPOT_LIGHT_COORDS > 0
varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#if NUM_SPOT_LIGHT_MAPS > 0
uniform sampler2D spotLightMap[ NUM_SPOT_LIGHT_MAPS ];
#endif
#ifdef USE_SHADOWMAP
#if NUM_SUN_LIGHT_SHADOWS > 0
#define SUN_LIGHT_CASCADES 2
#if defined( SHADOWMAP_TYPE_PCF )
uniform sampler2DShadow sunShadowMap[ NUM_SUN_LIGHT_SHADOWS ];
#else
uniform sampler2D sunShadowMap[ NUM_SUN_LIGHT_SHADOWS ];
#endif
uniform mat4 sunShadowMatrix[ NUM_SUN_LIGHT_SHADOWS * SUN_LIGHT_CASCADES ];
uniform vec4 sunShadowCascade[ NUM_SUN_LIGHT_SHADOWS * SUN_LIGHT_CASCADES ];
varying vec4 vSunShadowWorldPosition;
varying vec3 vSunShadowWorldNormal;
struct SunLightShadow {
float shadowIntensity;
float shadowBias;
float shadowNormalBias;
float shadowRadius;
vec2 shadowMapSize;
};
uniform SunLightShadow sunLightShadows[ NUM_SUN_LIGHT_SHADOWS ];
#endif
#if NUM_DIR_LIGHT_SHADOWS > 0
#if defined( SHADOWMAP_TYPE_PCF )
uniform sampler2DShadow directionalShadowMap[ NUM_DIR_LIGHT_SHADOWS ];
#else
uniform sampler2D directionalShadowMap[ NUM_DIR_LIGHT_SHADOWS ];
#endif
varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
struct DirectionalLightShadow {
float shadowIntensity;
float shadowBias;
float shadowNormalBias;
float shadowRadius;
vec2 shadowMapSize;
};
uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
#endif
#if NUM_SPOT_LIGHT_SHADOWS > 0
#if defined( SHADOWMAP_TYPE_PCF )
uniform sampler2DShadow spotShadowMap[ NUM_SPOT_LIGHT_SHADOWS ];
#else
uniform sampler2D spotShadowMap[ NUM_SPOT_LIGHT_SHADOWS ];
#endif
struct SpotLightShadow {
float shadowIntensity;
float shadowBias;
float shadowNormalBias;
float shadowRadius;
vec2 shadowMapSize;
};
uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];
#endif
#if NUM_POINT_LIGHT_SHADOWS > 0
#if defined( SHADOWMAP_TYPE_PCF )
uniform samplerCubeShadow pointShadowMap[ NUM_POINT_LIGHT_SHADOWS ];
#elif defined( SHADOWMAP_TYPE_BASIC )
uniform samplerCube pointShadowMap[ NUM_POINT_LIGHT_SHADOWS ];
#endif
varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];
struct PointLightShadow {
float shadowIntensity;
float shadowBias;
float shadowNormalBias;
float shadowRadius;
vec2 shadowMapSize;
float shadowCameraNear;
float shadowCameraFar;
};
uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
#endif
#if defined( SHADOWMAP_TYPE_PCF )
float interleavedGradientNoise( vec2 position ) {
return fract( 52.9829189 * fract( dot( position, vec2( 0.06711056, 0.00583715 ) ) ) );
}
vec2 vogelDiskSample( int sampleIndex, int samplesCount, float phi ) {
const float goldenAngle = 2.399963229728653;
float r = sqrt( ( float( sampleIndex ) + 0.5 ) / float( samplesCount ) );
float theta = float( sampleIndex ) * goldenAngle + phi;
return vec2( cos( theta ), sin( theta ) ) * r;
}
#endif
#if defined( SHADOWMAP_TYPE_PCF )
float getShadow( sampler2DShadow shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
float shadow = 1.0;
shadowCoord.xyz /= shadowCoord.w;
shadowCoord.z += shadowBias;
bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
if ( frustumTest ) {
vec2 texelSize = vec2( 1.0 ) / shadowMapSize;
float radius = shadowRadius * texelSize.x;
float phi = interleavedGradientNoise( gl_FragCoord.xy ) * PI2;
shadow = (
texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 0, 5, phi ) * radius, shadowCoord.z ) ) +
texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 1, 5, phi ) * radius, shadowCoord.z ) ) +
texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 2, 5, phi ) * radius, shadowCoord.z ) ) +
texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 3, 5, phi ) * radius, shadowCoord.z ) ) +
texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 4, 5, phi ) * radius, shadowCoord.z ) )
) * 0.2;
}
return mix( 1.0, shadow, shadowIntensity );
}
#elif defined( SHADOWMAP_TYPE_VSM )
float getShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
float shadow = 1.0;
shadowCoord.xyz /= shadowCoord.w;
#ifdef USE_REVERSED_DEPTH_BUFFER
shadowCoord.z -= shadowBias;
#else
shadowCoord.z += shadowBias;
#endif
bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
if ( frustumTest ) {
vec2 distribution = texture2D( shadowMap, shadowCoord.xy ).rg;
float mean = distribution.x;
float variance = distribution.y * distribution.y;
#ifdef USE_REVERSED_DEPTH_BUFFER
float hard_shadow = step( mean, shadowCoord.z );
#else
float hard_shadow = step( shadowCoord.z, mean );
#endif
if ( hard_shadow == 1.0 ) {
shadow = 1.0;
} else {
variance = max( variance, 0.0000001 );
float d = shadowCoord.z - mean;
float p_max = variance / ( variance + d * d );
p_max = clamp( ( p_max - 0.3 ) / 0.65, 0.0, 1.0 );
shadow = max( hard_shadow, p_max );
}
}
return mix( 1.0, shadow, shadowIntensity );
}
#else
float getShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
float shadow = 1.0;
shadowCoord.xyz /= shadowCoord.w;
#ifdef USE_REVERSED_DEPTH_BUFFER
shadowCoord.z -= shadowBias;
#else
shadowCoord.z += shadowBias;
#endif
bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
if ( frustumTest ) {
float depth = texture2D( shadowMap, shadowCoord.xy ).r;
#ifdef USE_REVERSED_DEPTH_BUFFER
shadow = step( depth, shadowCoord.z );
#else
shadow = step( shadowCoord.z, depth );
#endif
}
return mix( 1.0, shadow, shadowIntensity );
}
#endif
#if NUM_SUN_LIGHT_SHADOWS > 0
float getSunShadow(
#if defined( SHADOWMAP_TYPE_PCF )
sampler2DShadow shadowMap,
#else
sampler2D shadowMap,
#endif
SunLightShadow sunLightShadow,
int shadowIndex
) {
vec4 shadowWorldPosition = vec4( vSunShadowWorldPosition.xyz + vSunShadowWorldNormal * sunLightShadow.shadowNormalBias, 1.0 );
float viewDepth = vSunShadowWorldPosition.w;
int cascadeOffset = shadowIndex * SUN_LIGHT_CASCADES;
float shadow = 1.0;
for ( int i = SUN_LIGHT_CASCADES - 1; i >= 0; i -- ) {
vec4 cascade = sunShadowCascade[ cascadeOffset + i ];
if ( viewDepth >= cascade.x && viewDepth < cascade.y ) {
float cascadeShadow = getShadow(
shadowMap,
sunLightShadow.shadowMapSize,
sunLightShadow.shadowIntensity,
sunLightShadow.shadowBias,
sunLightShadow.shadowRadius,
sunShadowMatrix[ cascadeOffset + i ] * shadowWorldPosition
);
shadow = mix( cascadeShadow, shadow, smoothstep( cascade.z, cascade.y, viewDepth ) );
}
}
return shadow;
}
#endif
#if NUM_POINT_LIGHT_SHADOWS > 0
#if defined( SHADOWMAP_TYPE_PCF )
float getPointShadow( samplerCubeShadow shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord, float shadowCameraNear, float shadowCameraFar ) {
float shadow = 1.0;
vec3 lightToPosition = shadowCoord.xyz;
vec3 bd3D = normalize( lightToPosition );
vec3 absVec = abs( lightToPosition );
float viewSpaceZ = max( max( absVec.x, absVec.y ), absVec.z );
if ( viewSpaceZ - shadowCameraFar <= 0.0 && viewSpaceZ - shadowCameraNear >= 0.0 ) {
#ifdef USE_REVERSED_DEPTH_BUFFER
float dp = ( shadowCameraNear * ( shadowCameraFar - viewSpaceZ ) ) / ( viewSpaceZ * ( shadowCameraFar - shadowCameraNear ) );
dp -= shadowBias;
#else
float dp = ( shadowCameraFar * ( viewSpaceZ - shadowCameraNear ) ) / ( viewSpaceZ * ( shadowCameraFar - shadowCameraNear ) );
dp += shadowBias;
#endif
float texelSize = shadowRadius / shadowMapSize.x;
vec3 absDir = abs( bd3D );
vec3 tangent = absDir.x > absDir.z ? vec3( 0.0, 1.0, 0.0 ) : vec3( 1.0, 0.0, 0.0 );
tangent = normalize( cross( bd3D, tangent ) );
vec3 bitangent = cross( bd3D, tangent );
float phi = interleavedGradientNoise( gl_FragCoord.xy ) * PI2;
vec2 sample0 = vogelDiskSample( 0, 5, phi );
vec2 sample1 = vogelDiskSample( 1, 5, phi );
vec2 sample2 = vogelDiskSample( 2, 5, phi );
vec2 sample3 = vogelDiskSample( 3, 5, phi );
vec2 sample4 = vogelDiskSample( 4, 5, phi );
shadow = (
texture( shadowMap, vec4( bd3D + ( tangent * sample0.x + bitangent * sample0.y ) * texelSize, dp ) ) +
texture( shadowMap, vec4( bd3D + ( tangent * sample1.x + bitangent * sample1.y ) * texelSize, dp ) ) +
texture( shadowMap, vec4( bd3D + ( tangent * sample2.x + bitangent * sample2.y ) * texelSize, dp ) ) +
texture( shadowMap, vec4( bd3D + ( tangent * sample3.x + bitangent * sample3.y ) * texelSize, dp ) ) +
texture( shadowMap, vec4( bd3D + ( tangent * sample4.x + bitangent * sample4.y ) * texelSize, dp ) )
) * 0.2;
}
return mix( 1.0, shadow, shadowIntensity );
}
#elif defined( SHADOWMAP_TYPE_BASIC )
float getPointShadow( samplerCube shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord, float shadowCameraNear, float shadowCameraFar ) {
float shadow = 1.0;
vec3 lightToPosition = shadowCoord.xyz;
vec3 absVec = abs( lightToPosition );
float viewSpaceZ = max( max( absVec.x, absVec.y ), absVec.z );
if ( viewSpaceZ - shadowCameraFar <= 0.0 && viewSpaceZ - shadowCameraNear >= 0.0 ) {
float dp = ( shadowCameraFar * ( viewSpaceZ - shadowCameraNear ) ) / ( viewSpaceZ * ( shadowCameraFar - shadowCameraNear ) );
dp += shadowBias;
vec3 bd3D = normalize( lightToPosition );
float depth = textureCube( shadowMap, bd3D ).r;
#ifdef USE_REVERSED_DEPTH_BUFFER
depth = 1.0 - depth;
#endif
shadow = step( dp, depth );
}
return mix( 1.0, shadow, shadowIntensity );
}
#endif
#endif
#endif
`;var Kf=`
#if NUM_SPOT_LIGHT_COORDS > 0
uniform mat4 spotLightMatrix[ NUM_SPOT_LIGHT_COORDS ];
varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#ifdef USE_SHADOWMAP
#if NUM_SUN_LIGHT_SHADOWS > 0
varying vec4 vSunShadowWorldPosition;
varying vec3 vSunShadowWorldNormal;
#endif
#if NUM_DIR_LIGHT_SHADOWS > 0
uniform mat4 directionalShadowMatrix[ NUM_DIR_LIGHT_SHADOWS ];
varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
struct DirectionalLightShadow {
float shadowIntensity;
float shadowBias;
float shadowNormalBias;
float shadowRadius;
vec2 shadowMapSize;
};
uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
#endif
#if NUM_SPOT_LIGHT_SHADOWS > 0
struct SpotLightShadow {
float shadowIntensity;
float shadowBias;
float shadowNormalBias;
float shadowRadius;
vec2 shadowMapSize;
};
uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];
#endif
#if NUM_POINT_LIGHT_SHADOWS > 0
uniform mat4 pointShadowMatrix[ NUM_POINT_LIGHT_SHADOWS ];
varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];
struct PointLightShadow {
float shadowIntensity;
float shadowBias;
float shadowNormalBias;
float shadowRadius;
vec2 shadowMapSize;
float shadowCameraNear;
float shadowCameraFar;
};
uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
#endif
#endif
`;var Zf=`
#if ( defined( USE_SHADOWMAP ) && ( NUM_DIR_LIGHT_SHADOWS > 0 || NUM_SUN_LIGHT_SHADOWS > 0 || NUM_POINT_LIGHT_SHADOWS > 0 ) ) || ( NUM_SPOT_LIGHT_COORDS > 0 )
#ifdef HAS_NORMAL
vec3 shadowWorldNormal = transformNormalByInverseViewMatrix( transformedNormal, viewMatrix );
#else
vec3 shadowWorldNormal = vec3( 0.0 );
#endif
vec4 shadowWorldPosition;
#endif
#if defined( USE_SHADOWMAP )
#if NUM_SUN_LIGHT_SHADOWS > 0
vSunShadowWorldPosition = vec4( worldPosition.xyz, - mvPosition.z );
vSunShadowWorldNormal = shadowWorldNormal;
#endif
#if NUM_DIR_LIGHT_SHADOWS > 0
#pragma unroll_loop_start
for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * directionalLightShadows[ i ].shadowNormalBias, 0 );
vDirectionalShadowCoord[ i ] = directionalShadowMatrix[ i ] * shadowWorldPosition;
}
#pragma unroll_loop_end
#endif
#if NUM_POINT_LIGHT_SHADOWS > 0
#pragma unroll_loop_start
for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * pointLightShadows[ i ].shadowNormalBias, 0 );
vPointShadowCoord[ i ] = pointShadowMatrix[ i ] * shadowWorldPosition;
}
#pragma unroll_loop_end
#endif
#endif
#if NUM_SPOT_LIGHT_COORDS > 0
#pragma unroll_loop_start
for ( int i = 0; i < NUM_SPOT_LIGHT_COORDS; i ++ ) {
shadowWorldPosition = worldPosition;
#if ( defined( USE_SHADOWMAP ) && UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
shadowWorldPosition.xyz += shadowWorldNormal * spotLightShadows[ i ].shadowNormalBias;
#endif
vSpotLightCoord[ i ] = spotLightMatrix[ i ] * shadowWorldPosition;
}
#pragma unroll_loop_end
#endif
`;var Jf=`
float getShadowMask() {
float shadow = 1.0;
#ifdef USE_SHADOWMAP
#if NUM_SUN_LIGHT_SHADOWS > 0
SunLightShadow sunLight;
#pragma unroll_loop_start
for ( int i = 0; i < NUM_SUN_LIGHT_SHADOWS; i ++ ) {
sunLight = sunLightShadows[ i ];
shadow *= receiveShadow ? getSunShadow( sunShadowMap[ i ], sunLight, UNROLLED_LOOP_INDEX ) : 1.0;
}
#pragma unroll_loop_end
#endif
#if NUM_DIR_LIGHT_SHADOWS > 0
DirectionalLightShadow directionalLight;
#pragma unroll_loop_start
for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
directionalLight = directionalLightShadows[ i ];
shadow *= receiveShadow ? getShadow( directionalShadowMap[ i ], directionalLight.shadowMapSize, directionalLight.shadowIntensity, directionalLight.shadowBias, directionalLight.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
}
#pragma unroll_loop_end
#endif
#if NUM_SPOT_LIGHT_SHADOWS > 0
SpotLightShadow spotLight;
#pragma unroll_loop_start
for ( int i = 0; i < NUM_SPOT_LIGHT_SHADOWS; i ++ ) {
spotLight = spotLightShadows[ i ];
shadow *= receiveShadow ? getShadow( spotShadowMap[ i ], spotLight.shadowMapSize, spotLight.shadowIntensity, spotLight.shadowBias, spotLight.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
}
#pragma unroll_loop_end
#endif
#if NUM_POINT_LIGHT_SHADOWS > 0 && ( defined( SHADOWMAP_TYPE_PCF ) || defined( SHADOWMAP_TYPE_BASIC ) )
PointLightShadow pointLight;
#pragma unroll_loop_start
for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
pointLight = pointLightShadows[ i ];
shadow *= receiveShadow ? getPointShadow( pointShadowMap[ i ], pointLight.shadowMapSize, pointLight.shadowIntensity, pointLight.shadowBias, pointLight.shadowRadius, vPointShadowCoord[ i ], pointLight.shadowCameraNear, pointLight.shadowCameraFar ) : 1.0;
}
#pragma unroll_loop_end
#endif
#endif
return shadow;
}
`;var $f=`
#ifdef USE_SKINNING
mat4 boneMatX = getBoneMatrix( skinIndex.x );
mat4 boneMatY = getBoneMatrix( skinIndex.y );
mat4 boneMatZ = getBoneMatrix( skinIndex.z );
mat4 boneMatW = getBoneMatrix( skinIndex.w );
#endif
`;var Qf=`
#ifdef USE_SKINNING
uniform mat4 bindMatrix;
uniform mat4 bindMatrixInverse;
uniform highp sampler2D boneTexture;
mat4 getBoneMatrix( const in float i ) {
int size = textureSize( boneTexture, 0 ).x;
int j = int( i ) * 4;
int x = j % size;
int y = j / size;
vec4 v1 = texelFetch( boneTexture, ivec2( x, y ), 0 );
vec4 v2 = texelFetch( boneTexture, ivec2( x + 1, y ), 0 );
vec4 v3 = texelFetch( boneTexture, ivec2( x + 2, y ), 0 );
vec4 v4 = texelFetch( boneTexture, ivec2( x + 3, y ), 0 );
return mat4( v1, v2, v3, v4 );
}
#endif
`;var jf=`
#ifdef USE_SKINNING
vec4 skinVertex = bindMatrix * vec4( transformed, 1.0 );
vec4 skinned = vec4( 0.0 );
skinned += boneMatX * skinVertex * skinWeight.x;
skinned += boneMatY * skinVertex * skinWeight.y;
skinned += boneMatZ * skinVertex * skinWeight.z;
skinned += boneMatW * skinVertex * skinWeight.w;
transformed = ( bindMatrixInverse * skinned ).xyz;
#endif
`;var eh=`
#ifdef USE_SKINNING
mat4 skinMatrix = mat4( 0.0 );
skinMatrix += skinWeight.x * boneMatX;
skinMatrix += skinWeight.y * boneMatY;
skinMatrix += skinWeight.z * boneMatZ;
skinMatrix += skinWeight.w * boneMatW;
skinMatrix = bindMatrixInverse * skinMatrix * bindMatrix;
objectNormal = vec4( skinMatrix * vec4( objectNormal, 0.0 ) ).xyz;
#ifdef USE_TANGENT
objectTangent = vec4( skinMatrix * vec4( objectTangent, 0.0 ) ).xyz;
#endif
#endif
`;var th=`
float specularStrength;
#ifdef USE_SPECULARMAP
vec4 texelSpecular = texture2D( specularMap, vSpecularMapUv );
specularStrength = texelSpecular.r;
#else
specularStrength = 1.0;
#endif
`;var ih=`
#ifdef USE_SPECULARMAP
uniform sampler2D specularMap;
#endif
`;var nh=`
#if defined( TONE_MAPPING )
gl_FragColor.rgb = toneMapping( gl_FragColor.rgb );
#endif
`;var rh=`
#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
uniform float toneMappingExposure;
vec3 LinearToneMapping( vec3 color ) {
return saturate( toneMappingExposure * color );
}
vec3 ReinhardToneMapping( vec3 color ) {
color *= toneMappingExposure;
return saturate( color / ( vec3( 1.0 ) + color ) );
}
vec3 CineonToneMapping( vec3 color ) {
color *= toneMappingExposure;
color = max( vec3( 0.0 ), color - 0.004 );
return pow( ( color * ( 6.2 * color + 0.5 ) ) / ( color * ( 6.2 * color + 1.7 ) + 0.06 ), vec3( 2.2 ) );
}
vec3 RRTAndODTFit( vec3 v ) {
vec3 a = v * ( v + 0.0245786 ) - 0.000090537;
vec3 b = v * ( 0.983729 * v + 0.4329510 ) + 0.238081;
return a / b;
}
vec3 ACESFilmicToneMapping( vec3 color ) {
const mat3 ACESInputMat = mat3(
vec3( 0.59719, 0.07600, 0.02840 ),
vec3( 0.35458, 0.90834, 0.13383 ),
vec3( 0.04823, 0.01566, 0.83777 )
);
const mat3 ACESOutputMat = mat3(
vec3( 1.60475, -0.10208, -0.00327 ),
vec3( -0.53108, 1.10813, -0.07276 ),
vec3( -0.07367, -0.00605, 1.07602 )
);
color *= toneMappingExposure / 0.6;
color = ACESInputMat * color;
color = RRTAndODTFit( color );
color = ACESOutputMat * color;
return saturate( color );
}
const mat3 LINEAR_REC2020_TO_LINEAR_SRGB = mat3(
vec3( 1.6605, - 0.1246, - 0.0182 ),
vec3( - 0.5876, 1.1329, - 0.1006 ),
vec3( - 0.0728, - 0.0083, 1.1187 )
);
const mat3 LINEAR_SRGB_TO_LINEAR_REC2020 = mat3(
vec3( 0.6274, 0.0691, 0.0164 ),
vec3( 0.3293, 0.9195, 0.0880 ),
vec3( 0.0433, 0.0113, 0.8956 )
);
vec3 agxDefaultContrastApprox( vec3 x ) {
vec3 x2 = x * x;
vec3 x4 = x2 * x2;
return + 15.5 * x4 * x2
- 40.14 * x4 * x
+ 31.96 * x4
- 6.868 * x2 * x
+ 0.4298 * x2
+ 0.1191 * x
- 0.00232;
}
vec3 AgXToneMapping( vec3 color ) {
const mat3 AgXInsetMatrix = mat3(
vec3( 0.856627153315983, 0.137318972929847, 0.11189821299995 ),
vec3( 0.0951212405381588, 0.761241990602591, 0.0767994186031903 ),
vec3( 0.0482516061458583, 0.101439036467562, 0.811302368396859 )
);
const mat3 AgXOutsetMatrix = mat3(
vec3( 1.1271005818144368, - 0.1413297634984383, - 0.14132976349843826 ),
vec3( - 0.11060664309660323, 1.157823702216272, - 0.11060664309660294 ),
vec3( - 0.016493938717834573, - 0.016493938717834257, 1.2519364065950405 )
);
const float AgxMinEv = - 12.47393;
const float AgxMaxEv = 4.026069;
color *= toneMappingExposure;
color = LINEAR_SRGB_TO_LINEAR_REC2020 * color;
color = AgXInsetMatrix * color;
color = max( color, 1e-10 );
color = log2( color );
color = ( color - AgxMinEv ) / ( AgxMaxEv - AgxMinEv );
color = clamp( color, 0.0, 1.0 );
color = agxDefaultContrastApprox( color );
color = AgXOutsetMatrix * color;
color = pow( max( vec3( 0.0 ), color ), vec3( 2.2 ) );
color = LINEAR_REC2020_TO_LINEAR_SRGB * color;
color = clamp( color, 0.0, 1.0 );
return color;
}
vec3 NeutralToneMapping( vec3 color ) {
const float StartCompression = 0.8 - 0.04;
const float Desaturation = 0.15;
color *= toneMappingExposure;
float x = min( color.r, min( color.g, color.b ) );
float offset = x < 0.08 ? x - 6.25 * x * x : 0.04;
color -= offset;
float peak = max( color.r, max( color.g, color.b ) );
if ( peak < StartCompression ) return color;
float d = 1. - StartCompression;
float newPeak = 1. - d * d / ( peak + d - StartCompression );
color *= newPeak / peak;
float g = 1. - 1. / ( Desaturation * ( peak - newPeak ) + 1. );
return mix( color, vec3( newPeak ), g );
}
vec3 CustomToneMapping( vec3 color ) { return color; }
`;var oh=`
#ifdef USE_TRANSMISSION
material.transmission = transmission;
material.transmissionAlpha = 1.0;
material.thickness = thickness;
material.attenuationDistance = attenuationDistance;
material.attenuationColor = attenuationColor;
#ifdef USE_TRANSMISSIONMAP
material.transmission *= texture2D( transmissionMap, vTransmissionMapUv ).r;
#endif
#ifdef USE_THICKNESSMAP
material.thickness *= texture2D( thicknessMap, vThicknessMapUv ).g;
#endif
vec3 pos = vWorldPosition;
vec3 v = normalize( cameraPosition - pos );
vec3 n = transformNormalByInverseViewMatrix( normal, viewMatrix );
vec4 transmitted = getIBLVolumeRefraction(
n, v, material.roughness, material.diffuseContribution, material.specularColorBlended, material.specularF90,
pos, modelMatrix, viewMatrix, projectionMatrix, material.dispersion, material.ior, material.thickness,
material.attenuationColor, material.attenuationDistance );
material.transmissionAlpha = mix( material.transmissionAlpha, transmitted.a, material.transmission );
totalDiffuse = mix( totalDiffuse, transmitted.rgb, material.transmission );
#endif
`;var sh=`
#ifdef USE_TRANSMISSION
uniform float transmission;
uniform float thickness;
uniform float attenuationDistance;
uniform vec3 attenuationColor;
#ifdef USE_TRANSMISSIONMAP
uniform sampler2D transmissionMap;
#endif
#ifdef USE_THICKNESSMAP
uniform sampler2D thicknessMap;
#endif
uniform vec2 transmissionSamplerSize;
uniform sampler2D transmissionSamplerMap;
uniform mat4 modelMatrix;
uniform mat4 projectionMatrix;
varying vec3 vWorldPosition;
float w0( float a ) {
return ( 1.0 / 6.0 ) * ( a * ( a * ( - a + 3.0 ) - 3.0 ) + 1.0 );
}
float w1( float a ) {
return ( 1.0 / 6.0 ) * ( a * a * ( 3.0 * a - 6.0 ) + 4.0 );
}
float w2( float a ){
return ( 1.0 / 6.0 ) * ( a * ( a * ( - 3.0 * a + 3.0 ) + 3.0 ) + 1.0 );
}
float w3( float a ) {
return ( 1.0 / 6.0 ) * ( a * a * a );
}
float g0( float a ) {
return w0( a ) + w1( a );
}
float g1( float a ) {
return w2( a ) + w3( a );
}
float h0( float a ) {
return - 1.0 + w1( a ) / ( w0( a ) + w1( a ) );
}
float h1( float a ) {
return 1.0 + w3( a ) / ( w2( a ) + w3( a ) );
}
vec4 bicubic( sampler2D tex, vec2 uv, vec4 texelSize, float lod ) {
uv = uv * texelSize.zw + 0.5;
vec2 iuv = floor( uv );
vec2 fuv = fract( uv );
float g0x = g0( fuv.x );
float g1x = g1( fuv.x );
float h0x = h0( fuv.x );
float h1x = h1( fuv.x );
float h0y = h0( fuv.y );
float h1y = h1( fuv.y );
vec2 p0 = ( vec2( iuv.x + h0x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
vec2 p1 = ( vec2( iuv.x + h1x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
vec2 p2 = ( vec2( iuv.x + h0x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;
vec2 p3 = ( vec2( iuv.x + h1x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;
return g0( fuv.y ) * ( g0x * textureLod( tex, p0, lod ) + g1x * textureLod( tex, p1, lod ) ) +
g1( fuv.y ) * ( g0x * textureLod( tex, p2, lod ) + g1x * textureLod( tex, p3, lod ) );
}
vec4 textureBicubic( sampler2D sampler, vec2 uv, float lod ) {
vec2 fLodSize = vec2( textureSize( sampler, int( lod ) ) );
vec2 cLodSize = vec2( textureSize( sampler, int( lod + 1.0 ) ) );
vec2 fLodSizeInv = 1.0 / fLodSize;
vec2 cLodSizeInv = 1.0 / cLodSize;
vec4 fSample = bicubic( sampler, uv, vec4( fLodSizeInv, fLodSize ), floor( lod ) );
vec4 cSample = bicubic( sampler, uv, vec4( cLodSizeInv, cLodSize ), ceil( lod ) );
return mix( fSample, cSample, fract( lod ) );
}
vec3 getVolumeTransmissionRay( const in vec3 n, const in vec3 v, const in float thickness, const in float ior, const in mat4 modelMatrix ) {
vec3 refractionVector = refract( - v, normalize( n ), 1.0 / ior );
vec3 modelScale;
modelScale.x = length( vec3( modelMatrix[ 0 ].xyz ) );
modelScale.y = length( vec3( modelMatrix[ 1 ].xyz ) );
modelScale.z = length( vec3( modelMatrix[ 2 ].xyz ) );
return normalize( refractionVector ) * thickness * modelScale;
}
float applyIorToRoughness( const in float roughness, const in float ior ) {
return roughness * clamp( ior * 2.0 - 2.0, 0.0, 1.0 );
}
vec4 getTransmissionSample( const in vec2 fragCoord, const in float roughness, const in float ior ) {
float lod = log2( transmissionSamplerSize.x ) * applyIorToRoughness( roughness, ior );
return textureBicubic( transmissionSamplerMap, fragCoord.xy, lod );
}
vec3 volumeAttenuation( const in float transmissionDistance, const in vec3 attenuationColor, const in float attenuationDistance ) {
if ( isinf( attenuationDistance ) ) {
return vec3( 1.0 );
} else {
vec3 attenuationCoefficient = -log( attenuationColor ) / attenuationDistance;
vec3 transmittance = exp( - attenuationCoefficient * transmissionDistance );
return transmittance;
}
}
vec4 getIBLVolumeRefraction( const in vec3 n, const in vec3 v, const in float roughness, const in vec3 diffuseColor,
const in vec3 specularColor, const in float specularF90, const in vec3 position, const in mat4 modelMatrix,
const in mat4 viewMatrix, const in mat4 projMatrix, const in float dispersion, const in float ior, const in float thickness,
const in vec3 attenuationColor, const in float attenuationDistance ) {
vec4 transmittedLight;
vec3 transmittance;
#ifdef USE_DISPERSION
float halfSpread = ( ior - 1.0 ) * 0.025 * dispersion;
vec3 iors = vec3( ior - halfSpread, ior, ior + halfSpread );
for ( int i = 0; i < 3; i ++ ) {
vec3 transmissionRay = getVolumeTransmissionRay( n, v, thickness, iors[ i ], modelMatrix );
vec3 refractedRayExit = position + transmissionRay;
vec4 ndcPos = projMatrix * viewMatrix * vec4( refractedRayExit, 1.0 );
vec2 refractionCoords = ndcPos.xy / ndcPos.w;
refractionCoords += 1.0;
refractionCoords /= 2.0;
vec4 transmissionSample = getTransmissionSample( refractionCoords, roughness, iors[ i ] );
transmittedLight[ i ] = transmissionSample[ i ];
transmittedLight.a += transmissionSample.a;
transmittance[ i ] = diffuseColor[ i ] * volumeAttenuation( length( transmissionRay ), attenuationColor, attenuationDistance )[ i ];
}
transmittedLight.a /= 3.0;
#else
vec3 transmissionRay = getVolumeTransmissionRay( n, v, thickness, ior, modelMatrix );
vec3 refractedRayExit = position + transmissionRay;
vec4 ndcPos = projMatrix * viewMatrix * vec4( refractedRayExit, 1.0 );
vec2 refractionCoords = ndcPos.xy / ndcPos.w;
refractionCoords += 1.0;
refractionCoords /= 2.0;
transmittedLight = getTransmissionSample( refractionCoords, roughness, ior );
transmittance = diffuseColor * volumeAttenuation( length( transmissionRay ), attenuationColor, attenuationDistance );
#endif
vec3 attenuatedColor = transmittance * transmittedLight.rgb;
vec3 F = EnvironmentBRDF( n, v, specularColor, specularF90, roughness );
float transmittanceFactor = ( transmittance.r + transmittance.g + transmittance.b ) / 3.0;
return vec4( ( 1.0 - F ) * attenuatedColor, 1.0 - ( 1.0 - transmittedLight.a ) * transmittanceFactor );
}
#endif
`;var ah=`
#if defined( USE_UV ) || defined( USE_ANISOTROPY )
varying vec2 vUv;
#endif
#ifdef USE_MAP
varying vec2 vMapUv;
#endif
#ifdef USE_ALPHAMAP
varying vec2 vAlphaMapUv;
#endif
#ifdef USE_LIGHTMAP
varying vec2 vLightMapUv;
#endif
#ifdef USE_AOMAP
varying vec2 vAoMapUv;
#endif
#ifdef USE_BUMPMAP
varying vec2 vBumpMapUv;
#endif
#ifdef USE_NORMALMAP
varying vec2 vNormalMapUv;
#endif
#ifdef USE_EMISSIVEMAP
varying vec2 vEmissiveMapUv;
#endif
#ifdef USE_METALNESSMAP
varying vec2 vMetalnessMapUv;
#endif
#ifdef USE_ROUGHNESSMAP
varying vec2 vRoughnessMapUv;
#endif
#ifdef USE_ANISOTROPYMAP
varying vec2 vAnisotropyMapUv;
#endif
#ifdef USE_CLEARCOATMAP
varying vec2 vClearcoatMapUv;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
varying vec2 vClearcoatNormalMapUv;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
varying vec2 vClearcoatRoughnessMapUv;
#endif
#ifdef USE_IRIDESCENCEMAP
varying vec2 vIridescenceMapUv;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
varying vec2 vIridescenceThicknessMapUv;
#endif
#ifdef USE_SHEEN_COLORMAP
varying vec2 vSheenColorMapUv;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
varying vec2 vSheenRoughnessMapUv;
#endif
#ifdef USE_SPECULARMAP
varying vec2 vSpecularMapUv;
#endif
#ifdef USE_SPECULAR_COLORMAP
varying vec2 vSpecularColorMapUv;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
varying vec2 vSpecularIntensityMapUv;
#endif
#ifdef USE_TRANSMISSIONMAP
uniform mat3 transmissionMapTransform;
varying vec2 vTransmissionMapUv;
#endif
#ifdef USE_THICKNESSMAP
uniform mat3 thicknessMapTransform;
varying vec2 vThicknessMapUv;
#endif
`;var lh=`
#if defined( USE_UV ) || defined( USE_ANISOTROPY )
varying vec2 vUv;
#endif
#ifdef USE_MAP
uniform mat3 mapTransform;
varying vec2 vMapUv;
#endif
#ifdef USE_ALPHAMAP
uniform mat3 alphaMapTransform;
varying vec2 vAlphaMapUv;
#endif
#ifdef USE_LIGHTMAP
uniform mat3 lightMapTransform;
varying vec2 vLightMapUv;
#endif
#ifdef USE_AOMAP
uniform mat3 aoMapTransform;
varying vec2 vAoMapUv;
#endif
#ifdef USE_BUMPMAP
uniform mat3 bumpMapTransform;
varying vec2 vBumpMapUv;
#endif
#ifdef USE_NORMALMAP
uniform mat3 normalMapTransform;
varying vec2 vNormalMapUv;
#endif
#ifdef USE_DISPLACEMENTMAP
uniform mat3 displacementMapTransform;
varying vec2 vDisplacementMapUv;
#endif
#ifdef USE_EMISSIVEMAP
uniform mat3 emissiveMapTransform;
varying vec2 vEmissiveMapUv;
#endif
#ifdef USE_METALNESSMAP
uniform mat3 metalnessMapTransform;
varying vec2 vMetalnessMapUv;
#endif
#ifdef USE_ROUGHNESSMAP
uniform mat3 roughnessMapTransform;
varying vec2 vRoughnessMapUv;
#endif
#ifdef USE_ANISOTROPYMAP
uniform mat3 anisotropyMapTransform;
varying vec2 vAnisotropyMapUv;
#endif
#ifdef USE_CLEARCOATMAP
uniform mat3 clearcoatMapTransform;
varying vec2 vClearcoatMapUv;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
uniform mat3 clearcoatNormalMapTransform;
varying vec2 vClearcoatNormalMapUv;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
uniform mat3 clearcoatRoughnessMapTransform;
varying vec2 vClearcoatRoughnessMapUv;
#endif
#ifdef USE_SHEEN_COLORMAP
uniform mat3 sheenColorMapTransform;
varying vec2 vSheenColorMapUv;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
uniform mat3 sheenRoughnessMapTransform;
varying vec2 vSheenRoughnessMapUv;
#endif
#ifdef USE_IRIDESCENCEMAP
uniform mat3 iridescenceMapTransform;
varying vec2 vIridescenceMapUv;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
uniform mat3 iridescenceThicknessMapTransform;
varying vec2 vIridescenceThicknessMapUv;
#endif
#ifdef USE_SPECULARMAP
uniform mat3 specularMapTransform;
varying vec2 vSpecularMapUv;
#endif
#ifdef USE_SPECULAR_COLORMAP
uniform mat3 specularColorMapTransform;
varying vec2 vSpecularColorMapUv;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
uniform mat3 specularIntensityMapTransform;
varying vec2 vSpecularIntensityMapUv;
#endif
#ifdef USE_TRANSMISSIONMAP
uniform mat3 transmissionMapTransform;
varying vec2 vTransmissionMapUv;
#endif
#ifdef USE_THICKNESSMAP
uniform mat3 thicknessMapTransform;
varying vec2 vThicknessMapUv;
#endif
`;var ch=`
#if defined( USE_UV ) || defined( USE_ANISOTROPY )
vUv = vec3( uv, 1 ).xy;
#endif
#ifdef USE_MAP
vMapUv = ( mapTransform * vec3( MAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ALPHAMAP
vAlphaMapUv = ( alphaMapTransform * vec3( ALPHAMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_LIGHTMAP
vLightMapUv = ( lightMapTransform * vec3( LIGHTMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_AOMAP
vAoMapUv = ( aoMapTransform * vec3( AOMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_BUMPMAP
vBumpMapUv = ( bumpMapTransform * vec3( BUMPMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_NORMALMAP
vNormalMapUv = ( normalMapTransform * vec3( NORMALMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_DISPLACEMENTMAP
vDisplacementMapUv = ( displacementMapTransform * vec3( DISPLACEMENTMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_EMISSIVEMAP
vEmissiveMapUv = ( emissiveMapTransform * vec3( EMISSIVEMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_METALNESSMAP
vMetalnessMapUv = ( metalnessMapTransform * vec3( METALNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ROUGHNESSMAP
vRoughnessMapUv = ( roughnessMapTransform * vec3( ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ANISOTROPYMAP
vAnisotropyMapUv = ( anisotropyMapTransform * vec3( ANISOTROPYMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOATMAP
vClearcoatMapUv = ( clearcoatMapTransform * vec3( CLEARCOATMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
vClearcoatNormalMapUv = ( clearcoatNormalMapTransform * vec3( CLEARCOAT_NORMALMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
vClearcoatRoughnessMapUv = ( clearcoatRoughnessMapTransform * vec3( CLEARCOAT_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_IRIDESCENCEMAP
vIridescenceMapUv = ( iridescenceMapTransform * vec3( IRIDESCENCEMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
vIridescenceThicknessMapUv = ( iridescenceThicknessMapTransform * vec3( IRIDESCENCE_THICKNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SHEEN_COLORMAP
vSheenColorMapUv = ( sheenColorMapTransform * vec3( SHEEN_COLORMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
vSheenRoughnessMapUv = ( sheenRoughnessMapTransform * vec3( SHEEN_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULARMAP
vSpecularMapUv = ( specularMapTransform * vec3( SPECULARMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULAR_COLORMAP
vSpecularColorMapUv = ( specularColorMapTransform * vec3( SPECULAR_COLORMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
vSpecularIntensityMapUv = ( specularIntensityMapTransform * vec3( SPECULAR_INTENSITYMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_TRANSMISSIONMAP
vTransmissionMapUv = ( transmissionMapTransform * vec3( TRANSMISSIONMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_THICKNESSMAP
vThicknessMapUv = ( thicknessMapTransform * vec3( THICKNESSMAP_UV, 1 ) ).xy;
#endif
`;var uh=`
#if defined( USE_ENVMAP ) || defined( DISTANCE ) || defined ( USE_SHADOWMAP ) || defined ( USE_TRANSMISSION ) || NUM_SPOT_LIGHT_COORDS > 0
vec4 worldPosition = vec4( transformed, 1.0 );
#ifdef USE_BATCHING
worldPosition = batchingMatrix * worldPosition;
#endif
#ifdef USE_INSTANCING
worldPosition = instanceMatrix * worldPosition;
#endif
worldPosition = modelMatrix * worldPosition;
#endif
`;var fh=`
varying vec2 vUv;
uniform mat3 uvTransform;
void main() {
vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
gl_Position = vec4( position.xy, 1.0, 1.0 );
}
`,hh=`
uniform sampler2D t2D;
uniform float backgroundIntensity;
varying vec2 vUv;
void main() {
vec4 texColor = texture2D( t2D, vUv );
#ifdef DECODE_VIDEO_TEXTURE
texColor = vec4( mix( pow( texColor.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), texColor.rgb * 0.0773993808, vec3( lessThanEqual( texColor.rgb, vec3( 0.04045 ) ) ) ), texColor.w );
#endif
texColor.rgb *= backgroundIntensity;
gl_FragColor = texColor;
#include <tonemapping_fragment>
#include <colorspace_fragment>
}
`;var dh=`
varying vec3 vWorldDirection;
#include <common>
void main() {
vWorldDirection = transformDirection( position, modelMatrix );
#include <begin_vertex>
#include <project_vertex>
gl_Position.z = gl_Position.w;
}
`,ph=`
#ifdef ENVMAP_TYPE_CUBE
uniform samplerCube envMap;
#elif defined( ENVMAP_TYPE_CUBE_UV )
uniform sampler2D envMap;
#endif
uniform float backgroundBlurriness;
uniform float backgroundIntensity;
uniform mat3 backgroundRotation;
varying vec3 vWorldDirection;
#include <cube_uv_reflection_fragment>
void main() {
#ifdef ENVMAP_TYPE_CUBE
vec4 texColor = textureCube( envMap, backgroundRotation * vWorldDirection );
#elif defined( ENVMAP_TYPE_CUBE_UV )
vec4 texColor = textureCubeUV( envMap, backgroundRotation * vWorldDirection, backgroundBlurriness );
#else
vec4 texColor = vec4( 0.0, 0.0, 0.0, 1.0 );
#endif
texColor.rgb *= backgroundIntensity;
gl_FragColor = texColor;
#include <tonemapping_fragment>
#include <colorspace_fragment>
}
`;var mh=`
varying vec3 vWorldDirection;
#include <common>
void main() {
vWorldDirection = transformDirection( position, modelMatrix );
#include <begin_vertex>
#include <project_vertex>
gl_Position.z = gl_Position.w;
}
`,gh=`
uniform samplerCube tCube;
uniform float tFlip;
uniform float opacity;
varying vec3 vWorldDirection;
void main() {
vec4 texColor = textureCube( tCube, vec3( tFlip * vWorldDirection.x, vWorldDirection.yz ) );
gl_FragColor = texColor;
gl_FragColor.a *= opacity;
#include <tonemapping_fragment>
#include <colorspace_fragment>
}
`;var _h=`
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
varying vec2 vHighPrecisionZW;
void main() {
#include <uv_vertex>
#include <batching_vertex>
#include <skinbase_vertex>
#include <morphinstance_vertex>
#ifdef USE_DISPLACEMENTMAP
#include <beginnormal_vertex>
#include <morphnormal_vertex>
#include <skinnormal_vertex>
#endif
#include <begin_vertex>
#include <morphtarget_vertex>
#include <skinning_vertex>
#include <displacementmap_vertex>
#include <project_vertex>
#include <logdepthbuf_vertex>
#include <clipping_planes_vertex>
vHighPrecisionZW = gl_Position.zw;
}
`,xh=`
#if DEPTH_PACKING == 3200
uniform float opacity;
#endif
#include <common>
#include <packing>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
varying vec2 vHighPrecisionZW;
void main() {
vec4 diffuseColor = vec4( 1.0 );
#include <clipping_planes_fragment>
#if DEPTH_PACKING == 3200
diffuseColor.a = opacity;
#endif
#include <map_fragment>
#include <alphamap_fragment>
#include <alphatest_fragment>
#include <alphahash_fragment>
#include <logdepthbuf_fragment>
#ifdef USE_REVERSED_DEPTH_BUFFER
float fragCoordZ = vHighPrecisionZW[ 0 ] / vHighPrecisionZW[ 1 ];
#else
float fragCoordZ = 0.5 * vHighPrecisionZW[ 0 ] / vHighPrecisionZW[ 1 ] + 0.5;
#endif
#if DEPTH_PACKING == 3200
gl_FragColor = vec4( vec3( 1.0 - fragCoordZ ), opacity );
#elif DEPTH_PACKING == 3201
gl_FragColor = packDepthToRGBA( fragCoordZ );
#elif DEPTH_PACKING == 3202
gl_FragColor = vec4( packDepthToRGB( fragCoordZ ), 1.0 );
#elif DEPTH_PACKING == 3203
gl_FragColor = vec4( packDepthToRG( fragCoordZ ), 0.0, 1.0 );
#endif
}
`;var Mh=`
#define DISTANCE
varying vec3 vWorldPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
#include <uv_vertex>
#include <batching_vertex>
#include <skinbase_vertex>
#include <morphinstance_vertex>
#ifdef USE_DISPLACEMENTMAP
#include <beginnormal_vertex>
#include <morphnormal_vertex>
#include <skinnormal_vertex>
#endif
#include <begin_vertex>
#include <morphtarget_vertex>
#include <skinning_vertex>
#include <displacementmap_vertex>
#include <project_vertex>
#include <worldpos_vertex>
#include <clipping_planes_vertex>
vWorldPosition = worldPosition.xyz;
}
`,Sh=`
#define DISTANCE
uniform vec3 referencePosition;
uniform float nearDistance;
uniform float farDistance;
varying vec3 vWorldPosition;
#include <common>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
vec4 diffuseColor = vec4( 1.0 );
#include <clipping_planes_fragment>
#include <map_fragment>
#include <alphamap_fragment>
#include <alphatest_fragment>
#include <alphahash_fragment>
float dist = length( vWorldPosition - referencePosition );
dist = ( dist - nearDistance ) / ( farDistance - nearDistance );
dist = saturate( dist );
gl_FragColor = vec4( dist, 0.0, 0.0, 1.0 );
}
`;var vh=`
varying vec3 vWorldDirection;
#include <common>
void main() {
vWorldDirection = transformDirection( position, modelMatrix );
#include <begin_vertex>
#include <project_vertex>
}
`,yh=`
uniform sampler2D tEquirect;
varying vec3 vWorldDirection;
#include <common>
void main() {
vec3 direction = normalize( vWorldDirection );
vec2 sampleUV = equirectUv( direction );
gl_FragColor = texture2D( tEquirect, sampleUV );
#include <tonemapping_fragment>
#include <colorspace_fragment>
}
`;var bh=`
uniform float scale;
attribute float lineDistance;
varying float vLineDistance;
#include <common>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
vLineDistance = scale * lineDistance;
#include <uv_vertex>
#include <color_vertex>
#include <morphinstance_vertex>
#include <morphcolor_vertex>
#include <begin_vertex>
#include <morphtarget_vertex>
#include <project_vertex>
#include <logdepthbuf_vertex>
#include <clipping_planes_vertex>
#include <fog_vertex>
}
`,Eh=`
uniform vec3 diffuse;
uniform float opacity;
uniform float dashSize;
uniform float totalSize;
varying float vLineDistance;
#include <common>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
vec4 diffuseColor = vec4( diffuse, opacity );
#include <clipping_planes_fragment>
if ( mod( vLineDistance, totalSize ) > dashSize ) {
discard;
}
vec3 outgoingLight = vec3( 0.0 );
#include <logdepthbuf_fragment>
#include <map_fragment>
#include <color_fragment>
outgoingLight = diffuseColor.rgb;
#include <opaque_fragment>
#include <tonemapping_fragment>
#include <colorspace_fragment>
#include <fog_fragment>
#include <premultiplied_alpha_fragment>
}
`;var Th=`
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
#include <uv_vertex>
#include <color_vertex>
#include <morphinstance_vertex>
#include <morphcolor_vertex>
#include <batching_vertex>
#if defined ( USE_ENVMAP ) || defined ( USE_SKINNING )
#include <beginnormal_vertex>
#include <morphnormal_vertex>
#include <skinbase_vertex>
#include <skinnormal_vertex>
#include <defaultnormal_vertex>
#endif
#include <begin_vertex>
#include <morphtarget_vertex>
#include <skinning_vertex>
#include <project_vertex>
#include <logdepthbuf_vertex>
#include <clipping_planes_vertex>
#include <worldpos_vertex>
#include <envmap_vertex>
#include <fog_vertex>
}
`,Ah=`
uniform vec3 diffuse;
uniform float opacity;
#ifndef FLAT_SHADED
varying vec3 vNormal;
#endif
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
vec4 diffuseColor = vec4( diffuse, opacity );
#include <clipping_planes_fragment>
#include <logdepthbuf_fragment>
#include <map_fragment>
#include <color_fragment>
#include <alphamap_fragment>
#include <alphatest_fragment>
#include <alphahash_fragment>
#include <specularmap_fragment>
ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
#ifdef USE_LIGHTMAP
vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
reflectedLight.indirectDiffuse += lightMapTexel.rgb * lightMapIntensity * RECIPROCAL_PI;
#else
reflectedLight.indirectDiffuse += vec3( 1.0 );
#endif
#include <aomap_fragment>
reflectedLight.indirectDiffuse *= diffuseColor.rgb;
vec3 outgoingLight = reflectedLight.indirectDiffuse;
#include <envmap_fragment>
#include <opaque_fragment>
#include <tonemapping_fragment>
#include <colorspace_fragment>
#include <fog_fragment>
#include <premultiplied_alpha_fragment>
#include <dithering_fragment>
}
`;var wh=`
#define LAMBERT
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
#include <uv_vertex>
#include <color_vertex>
#include <morphinstance_vertex>
#include <morphcolor_vertex>
#include <batching_vertex>
#include <beginnormal_vertex>
#include <morphnormal_vertex>
#include <skinbase_vertex>
#include <skinnormal_vertex>
#include <defaultnormal_vertex>
#include <normal_vertex>
#include <begin_vertex>
#include <morphtarget_vertex>
#include <skinning_vertex>
#include <displacementmap_vertex>
#include <project_vertex>
#include <logdepthbuf_vertex>
#include <clipping_planes_vertex>
vViewPosition = - mvPosition.xyz;
#include <worldpos_vertex>
#include <envmap_vertex>
#include <shadowmap_vertex>
#include <fog_vertex>
}
`,Rh=`
#define LAMBERT
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <cube_uv_reflection_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_lambert_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
vec4 diffuseColor = vec4( diffuse, opacity );
#include <clipping_planes_fragment>
ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
vec3 totalEmissiveRadiance = emissive;
#include <logdepthbuf_fragment>
#include <map_fragment>
#include <color_fragment>
#include <alphamap_fragment>
#include <alphatest_fragment>
#include <alphahash_fragment>
#include <specularmap_fragment>
#include <normal_fragment_begin>
#include <normal_fragment_maps>
#include <emissivemap_fragment>
#include <lights_lambert_fragment>
#include <lights_fragment_begin>
#include <lights_fragment_maps>
#include <lights_fragment_end>
#include <aomap_fragment>
vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
#include <envmap_fragment>
#include <opaque_fragment>
#include <tonemapping_fragment>
#include <colorspace_fragment>
#include <fog_fragment>
#include <premultiplied_alpha_fragment>
#include <dithering_fragment>
}
`;var Ch=`
#define MATCAP
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <displacementmap_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
#include <uv_vertex>
#include <color_vertex>
#include <morphinstance_vertex>
#include <morphcolor_vertex>
#include <batching_vertex>
#include <beginnormal_vertex>
#include <morphnormal_vertex>
#include <skinbase_vertex>
#include <skinnormal_vertex>
#include <defaultnormal_vertex>
#include <normal_vertex>
#include <begin_vertex>
#include <morphtarget_vertex>
#include <skinning_vertex>
#include <displacementmap_vertex>
#include <project_vertex>
#include <logdepthbuf_vertex>
#include <clipping_planes_vertex>
#include <fog_vertex>
vViewPosition = - mvPosition.xyz;
}
`,Ph=`
#define MATCAP
uniform vec3 diffuse;
uniform float opacity;
uniform sampler2D matcap;
varying vec3 vViewPosition;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
vec4 diffuseColor = vec4( diffuse, opacity );
#include <clipping_planes_fragment>
#include <logdepthbuf_fragment>
#include <map_fragment>
#include <color_fragment>
#include <alphamap_fragment>
#include <alphatest_fragment>
#include <alphahash_fragment>
#include <normal_fragment_begin>
#include <normal_fragment_maps>
vec3 viewDir = normalize( vViewPosition );
vec3 x = normalize( vec3( viewDir.z, 0.0, - viewDir.x ) );
vec3 y = cross( viewDir, x );
vec2 uv = vec2( dot( x, normal ), dot( y, normal ) ) * 0.495 + 0.5;
#ifdef USE_MATCAP
vec4 matcapColor = texture2D( matcap, uv );
#else
vec4 matcapColor = vec4( vec3( mix( 0.2, 0.8, uv.y ) ), 1.0 );
#endif
vec3 outgoingLight = diffuseColor.rgb * matcapColor.rgb;
#include <opaque_fragment>
#include <tonemapping_fragment>
#include <colorspace_fragment>
#include <fog_fragment>
#include <premultiplied_alpha_fragment>
#include <dithering_fragment>
}
`;var Lh=`
#define NORMAL
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
varying vec3 vViewPosition;
#endif
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
#include <uv_vertex>
#include <batching_vertex>
#include <beginnormal_vertex>
#include <morphinstance_vertex>
#include <morphnormal_vertex>
#include <skinbase_vertex>
#include <skinnormal_vertex>
#include <defaultnormal_vertex>
#include <normal_vertex>
#include <begin_vertex>
#include <morphtarget_vertex>
#include <skinning_vertex>
#include <displacementmap_vertex>
#include <project_vertex>
#include <logdepthbuf_vertex>
#include <clipping_planes_vertex>
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
vViewPosition = - mvPosition.xyz;
#endif
}
`,Dh=`
#define NORMAL
uniform float opacity;
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
varying vec3 vViewPosition;
#endif
#include <uv_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
vec4 diffuseColor = vec4( 0.0, 0.0, 0.0, opacity );
#include <clipping_planes_fragment>
#include <logdepthbuf_fragment>
#include <normal_fragment_begin>
#include <normal_fragment_maps>
gl_FragColor = vec4( normalize( normal ) * 0.5 + 0.5, diffuseColor.a );
#ifdef OPAQUE
gl_FragColor.a = 1.0;
#endif
}
`;var Ih=`
#define PHONG
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
#include <uv_vertex>
#include <color_vertex>
#include <morphcolor_vertex>
#include <batching_vertex>
#include <beginnormal_vertex>
#include <morphinstance_vertex>
#include <morphnormal_vertex>
#include <skinbase_vertex>
#include <skinnormal_vertex>
#include <defaultnormal_vertex>
#include <normal_vertex>
#include <begin_vertex>
#include <morphtarget_vertex>
#include <skinning_vertex>
#include <displacementmap_vertex>
#include <project_vertex>
#include <logdepthbuf_vertex>
#include <clipping_planes_vertex>
vViewPosition = - mvPosition.xyz;
#include <worldpos_vertex>
#include <envmap_vertex>
#include <shadowmap_vertex>
#include <fog_vertex>
}
`,Nh=`
#define PHONG
uniform vec3 diffuse;
uniform vec3 emissive;
uniform vec3 specular;
uniform float shininess;
uniform float opacity;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <cube_uv_reflection_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_phong_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
vec4 diffuseColor = vec4( diffuse, opacity );
#include <clipping_planes_fragment>
ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
vec3 totalEmissiveRadiance = emissive;
#include <logdepthbuf_fragment>
#include <map_fragment>
#include <color_fragment>
#include <alphamap_fragment>
#include <alphatest_fragment>
#include <alphahash_fragment>
#include <specularmap_fragment>
#include <normal_fragment_begin>
#include <normal_fragment_maps>
#include <emissivemap_fragment>
#include <lights_phong_fragment>
#include <lights_fragment_begin>
#include <lights_fragment_maps>
#include <lights_fragment_end>
#include <aomap_fragment>
vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + reflectedLight.directSpecular + reflectedLight.indirectSpecular + totalEmissiveRadiance;
#include <envmap_fragment>
#include <opaque_fragment>
#include <tonemapping_fragment>
#include <colorspace_fragment>
#include <fog_fragment>
#include <premultiplied_alpha_fragment>
#include <dithering_fragment>
}
`;var Uh=`
#define STANDARD
varying vec3 vViewPosition;
#ifdef USE_TRANSMISSION
varying vec3 vWorldPosition;
#endif
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
#include <uv_vertex>
#include <color_vertex>
#include <morphinstance_vertex>
#include <morphcolor_vertex>
#include <batching_vertex>
#include <beginnormal_vertex>
#include <morphnormal_vertex>
#include <skinbase_vertex>
#include <skinnormal_vertex>
#include <defaultnormal_vertex>
#include <normal_vertex>
#include <begin_vertex>
#include <morphtarget_vertex>
#include <skinning_vertex>
#include <displacementmap_vertex>
#include <project_vertex>
#include <logdepthbuf_vertex>
#include <clipping_planes_vertex>
vViewPosition = - mvPosition.xyz;
#include <worldpos_vertex>
#include <shadowmap_vertex>
#include <fog_vertex>
#ifdef USE_TRANSMISSION
vWorldPosition = worldPosition.xyz;
#endif
}
`,Fh=`
#define STANDARD
#ifdef PHYSICAL
#define IOR
#define USE_SPECULAR
#endif
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float roughness;
uniform float metalness;
uniform float opacity;
#ifdef IOR
uniform float ior;
#endif
#ifdef USE_SPECULAR
uniform float specularIntensity;
uniform vec3 specularColor;
#ifdef USE_SPECULAR_COLORMAP
uniform sampler2D specularColorMap;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
uniform sampler2D specularIntensityMap;
#endif
#endif
#ifdef USE_CLEARCOAT
uniform float clearcoat;
uniform float clearcoatRoughness;
#endif
#ifdef USE_DISPERSION
uniform float dispersion;
#endif
#ifdef USE_RETROREFLECTION
uniform float retroreflectivity;
#endif
#ifdef USE_IRIDESCENCE
uniform float iridescence;
uniform float iridescenceIOR;
uniform float iridescenceThicknessMinimum;
uniform float iridescenceThicknessMaximum;
#endif
#ifdef USE_SHEEN
uniform vec3 sheenColor;
uniform float sheenRoughness;
#ifdef USE_SHEEN_COLORMAP
uniform sampler2D sheenColorMap;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
uniform sampler2D sheenRoughnessMap;
#endif
#endif
#ifdef USE_ANISOTROPY
uniform vec2 anisotropyVector;
#ifdef USE_ANISOTROPYMAP
uniform sampler2D anisotropyMap;
#endif
#endif
varying vec3 vViewPosition;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <iridescence_fragment>
#include <cube_uv_reflection_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_physical_pars_fragment>
#include <transmission_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <clearcoat_pars_fragment>
#include <iridescence_pars_fragment>
#include <roughnessmap_pars_fragment>
#include <metalnessmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
vec4 diffuseColor = vec4( diffuse, opacity );
#include <clipping_planes_fragment>
ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
vec3 totalEmissiveRadiance = emissive;
#include <logdepthbuf_fragment>
#include <map_fragment>
#include <color_fragment>
#include <alphamap_fragment>
#include <alphatest_fragment>
#include <alphahash_fragment>
#include <roughnessmap_fragment>
#include <metalnessmap_fragment>
#include <normal_fragment_begin>
#include <normal_fragment_maps>
#include <clearcoat_normal_fragment_begin>
#include <clearcoat_normal_fragment_maps>
#include <emissivemap_fragment>
#include <lights_physical_fragment>
#include <lights_fragment_begin>
#include <lights_fragment_maps>
#include <lights_fragment_end>
#include <aomap_fragment>
vec3 totalDiffuse = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse;
vec3 totalSpecular = reflectedLight.directSpecular + reflectedLight.indirectSpecular;
#include <transmission_fragment>
vec3 outgoingLight = totalDiffuse + totalSpecular + totalEmissiveRadiance;
#ifdef USE_SHEEN
outgoingLight = outgoingLight + sheenSpecularDirect + sheenSpecularIndirect;
#endif
#ifdef USE_CLEARCOAT
float dotNVcc = saturate( dot( geometryClearcoatNormal, geometryViewDir ) );
vec3 Fcc = F_Schlick( material.clearcoatF0, material.clearcoatF90, dotNVcc );
outgoingLight = outgoingLight * ( 1.0 - material.clearcoat * Fcc ) + ( clearcoatSpecularDirect + clearcoatSpecularIndirect ) * material.clearcoat;
#endif
#include <opaque_fragment>
#include <tonemapping_fragment>
#include <colorspace_fragment>
#include <fog_fragment>
#include <premultiplied_alpha_fragment>
#include <dithering_fragment>
}
`;var Oh=`
#define TOON
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
#include <uv_vertex>
#include <color_vertex>
#include <morphinstance_vertex>
#include <morphcolor_vertex>
#include <batching_vertex>
#include <beginnormal_vertex>
#include <morphnormal_vertex>
#include <skinbase_vertex>
#include <skinnormal_vertex>
#include <defaultnormal_vertex>
#include <normal_vertex>
#include <begin_vertex>
#include <morphtarget_vertex>
#include <skinning_vertex>
#include <displacementmap_vertex>
#include <project_vertex>
#include <logdepthbuf_vertex>
#include <clipping_planes_vertex>
vViewPosition = - mvPosition.xyz;
#include <worldpos_vertex>
#include <shadowmap_vertex>
#include <fog_vertex>
}
`,Bh=`
#define TOON
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <gradientmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_toon_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
vec4 diffuseColor = vec4( diffuse, opacity );
#include <clipping_planes_fragment>
ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
vec3 totalEmissiveRadiance = emissive;
#include <logdepthbuf_fragment>
#include <map_fragment>
#include <color_fragment>
#include <alphamap_fragment>
#include <alphatest_fragment>
#include <alphahash_fragment>
#include <normal_fragment_begin>
#include <normal_fragment_maps>
#include <emissivemap_fragment>
#include <lights_toon_fragment>
#include <lights_fragment_begin>
#include <lights_fragment_maps>
#include <lights_fragment_end>
#include <aomap_fragment>
vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
#include <opaque_fragment>
#include <tonemapping_fragment>
#include <colorspace_fragment>
#include <fog_fragment>
#include <premultiplied_alpha_fragment>
#include <dithering_fragment>
}
`;var Gh=`
uniform float size;
uniform float scale;
#include <common>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
#ifdef USE_POINTS_UV
varying vec2 vUv;
uniform mat3 uvTransform;
#endif
void main() {
#ifdef USE_POINTS_UV
vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
#endif
#include <color_vertex>
#include <morphinstance_vertex>
#include <morphcolor_vertex>
#include <begin_vertex>
#include <morphtarget_vertex>
#include <project_vertex>
gl_PointSize = size;
#ifdef USE_SIZEATTENUATION
bool isPerspective = isPerspectiveMatrix( projectionMatrix );
if ( isPerspective ) gl_PointSize *= ( scale / - mvPosition.z );
#endif
#include <logdepthbuf_vertex>
#include <clipping_planes_vertex>
#include <worldpos_vertex>
#include <fog_vertex>
}
`,zh=`
uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <color_pars_fragment>
#include <map_particle_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
vec4 diffuseColor = vec4( diffuse, opacity );
#include <clipping_planes_fragment>
vec3 outgoingLight = vec3( 0.0 );
#include <logdepthbuf_fragment>
#include <map_particle_fragment>
#include <color_fragment>
#include <alphatest_fragment>
#include <alphahash_fragment>
outgoingLight = diffuseColor.rgb;
#include <opaque_fragment>
#include <tonemapping_fragment>
#include <colorspace_fragment>
#include <fog_fragment>
#include <premultiplied_alpha_fragment>
}
`;var kh=`
#include <common>
#include <batching_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <shadowmap_pars_vertex>
void main() {
#include <batching_vertex>
#include <beginnormal_vertex>
#include <morphinstance_vertex>
#include <morphnormal_vertex>
#include <skinbase_vertex>
#include <skinnormal_vertex>
#include <defaultnormal_vertex>
#include <begin_vertex>
#include <morphtarget_vertex>
#include <skinning_vertex>
#include <project_vertex>
#include <logdepthbuf_vertex>
#include <worldpos_vertex>
#include <shadowmap_vertex>
#include <fog_vertex>
}
`,Hh=`
uniform vec3 color;
uniform float opacity;
#include <common>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <logdepthbuf_pars_fragment>
#include <shadowmap_pars_fragment>
#include <shadowmask_pars_fragment>
void main() {
#include <logdepthbuf_fragment>
gl_FragColor = vec4( color, opacity * ( 1.0 - getShadowMask() ) );
#include <tonemapping_fragment>
#include <colorspace_fragment>
#include <fog_fragment>
#include <premultiplied_alpha_fragment>
}
`;var Vh=`
uniform float rotation;
uniform vec2 center;
#include <common>
#include <uv_pars_vertex>
#include <fog_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
#include <uv_vertex>
vec4 mvPosition = modelViewMatrix[ 3 ];
vec2 scale = vec2( length( modelMatrix[ 0 ].xyz ), length( modelMatrix[ 1 ].xyz ) );
#ifndef USE_SIZEATTENUATION
bool isPerspective = isPerspectiveMatrix( projectionMatrix );
if ( isPerspective ) scale *= - mvPosition.z;
#endif
vec2 alignedPosition = ( position.xy - ( center - vec2( 0.5 ) ) ) * scale;
vec2 rotatedPosition;
rotatedPosition.x = cos( rotation ) * alignedPosition.x - sin( rotation ) * alignedPosition.y;
rotatedPosition.y = sin( rotation ) * alignedPosition.x + cos( rotation ) * alignedPosition.y;
mvPosition.xy += rotatedPosition;
gl_Position = projectionMatrix * mvPosition;
#include <logdepthbuf_vertex>
#include <clipping_planes_vertex>
#include <fog_vertex>
}
`,Wh=`
uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
vec4 diffuseColor = vec4( diffuse, opacity );
#include <clipping_planes_fragment>
vec3 outgoingLight = vec3( 0.0 );
#include <logdepthbuf_fragment>
#include <map_fragment>
#include <alphamap_fragment>
#include <alphatest_fragment>
#include <alphahash_fragment>
outgoingLight = diffuseColor.rgb;
#include <opaque_fragment>
#include <tonemapping_fragment>
#include <colorspace_fragment>
#include <fog_fragment>
}
`;var rt={alphahash_fragment:uu,alphahash_pars_fragment:fu,alphamap_fragment:hu,alphamap_pars_fragment:du,alphatest_fragment:pu,alphatest_pars_fragment:mu,aomap_fragment:gu,aomap_pars_fragment:_u,batching_pars_vertex:xu,batching_vertex:Mu,begin_vertex:Su,beginnormal_vertex:vu,bsdfs:yu,iridescence_fragment:bu,bumpmap_pars_fragment:Eu,clipping_planes_fragment:Tu,clipping_planes_pars_fragment:Au,clipping_planes_pars_vertex:wu,clipping_planes_vertex:Ru,color_fragment:Cu,color_pars_fragment:Pu,color_pars_vertex:Lu,color_vertex:Du,common:Iu,cube_uv_reflection_fragment:Nu,defaultnormal_vertex:Uu,displacementmap_pars_vertex:Fu,displacementmap_vertex:Ou,emissivemap_fragment:Bu,emissivemap_pars_fragment:Gu,colorspace_fragment:zu,colorspace_pars_fragment:ku,envmap_fragment:Hu,envmap_common_pars_fragment:Vu,envmap_pars_fragment:Wu,envmap_pars_vertex:Xu,envmap_physical_pars_fragment:nf,envmap_vertex:qu,fog_vertex:Yu,fog_pars_vertex:Ku,fog_fragment:Zu,fog_pars_fragment:Ju,gradientmap_pars_fragment:$u,lightmap_pars_fragment:Qu,lights_lambert_fragment:ju,lights_lambert_pars_fragment:ef,lights_pars_begin:tf,lights_toon_fragment:rf,lights_toon_pars_fragment:of,lights_phong_fragment:sf,lights_phong_pars_fragment:af,lights_physical_fragment:lf,lights_physical_pars_fragment:cf,lights_fragment_begin:uf,lights_fragment_maps:ff,lights_fragment_end:hf,lightprobes_pars_fragment:df,logdepthbuf_fragment:pf,logdepthbuf_pars_fragment:mf,logdepthbuf_pars_vertex:gf,logdepthbuf_vertex:_f,map_fragment:xf,map_pars_fragment:Mf,map_particle_fragment:Sf,map_particle_pars_fragment:vf,metalnessmap_fragment:yf,metalnessmap_pars_fragment:bf,morphinstance_vertex:Ef,morphcolor_vertex:Tf,morphnormal_vertex:Af,morphtarget_pars_vertex:wf,morphtarget_vertex:Rf,normal_fragment_begin:Cf,normal_fragment_maps:Pf,normal_pars_fragment:Lf,normal_pars_vertex:Df,normal_vertex:If,normalmap_pars_fragment:Nf,clearcoat_normal_fragment_begin:Uf,clearcoat_normal_fragment_maps:Ff,clearcoat_pars_fragment:Of,iridescence_pars_fragment:Bf,opaque_fragment:Gf,packing:zf,premultiplied_alpha_fragment:kf,project_vertex:Hf,dithering_fragment:Vf,dithering_pars_fragment:Wf,roughnessmap_fragment:Xf,roughnessmap_pars_fragment:qf,shadowmap_pars_fragment:Yf,shadowmap_pars_vertex:Kf,shadowmap_vertex:Zf,shadowmask_pars_fragment:Jf,skinbase_vertex:$f,skinning_pars_vertex:Qf,skinning_vertex:jf,skinnormal_vertex:eh,specularmap_fragment:th,specularmap_pars_fragment:ih,tonemapping_fragment:nh,tonemapping_pars_fragment:rh,transmission_fragment:oh,transmission_pars_fragment:sh,uv_pars_fragment:ah,uv_pars_vertex:lh,uv_vertex:ch,worldpos_vertex:uh,background_vert:fh,background_frag:hh,backgroundCube_vert:dh,backgroundCube_frag:ph,cube_vert:mh,cube_frag:gh,depth_vert:_h,depth_frag:xh,distance_vert:Mh,distance_frag:Sh,equirect_vert:vh,equirect_frag:yh,linedashed_vert:bh,linedashed_frag:Eh,meshbasic_vert:Th,meshbasic_frag:Ah,meshlambert_vert:wh,meshlambert_frag:Rh,meshmatcap_vert:Ch,meshmatcap_frag:Ph,meshnormal_vert:Lh,meshnormal_frag:Dh,meshphong_vert:Ih,meshphong_frag:Nh,meshphysical_vert:Uh,meshphysical_frag:Fh,meshtoon_vert:Oh,meshtoon_frag:Bh,points_vert:Gh,points_frag:zh,shadow_vert:kh,shadow_frag:Hh,sprite_vert:Vh,sprite_frag:Wh};var Re={common:{diffuse:{value:new Le(16777215)},opacity:{value:1},map:{value:null},mapTransform:{value:new qe},alphaMap:{value:null},alphaMapTransform:{value:new qe},alphaTest:{value:0}},specularmap:{specularMap:{value:null},specularMapTransform:{value:new qe}},envmap:{envMap:{value:null},envMapRotation:{value:new qe},reflectivity:{value:1},ior:{value:1.5},refractionRatio:{value:.98},dfgLUT:{value:null}},aomap:{aoMap:{value:null},aoMapIntensity:{value:1},aoMapTransform:{value:new qe}},lightmap:{lightMap:{value:null},lightMapIntensity:{value:1},lightMapTransform:{value:new qe}},bumpmap:{bumpMap:{value:null},bumpMapTransform:{value:new qe},bumpScale:{value:1}},normalmap:{normalMap:{value:null},normalMapTransform:{value:new qe},normalScale:{value:new Ce(1,1)}},displacementmap:{displacementMap:{value:null},displacementMapTransform:{value:new qe},displacementScale:{value:1},displacementBias:{value:0}},emissivemap:{emissiveMap:{value:null},emissiveMapTransform:{value:new qe}},metalnessmap:{metalnessMap:{value:null},metalnessMapTransform:{value:new qe}},roughnessmap:{roughnessMap:{value:null},roughnessMapTransform:{value:new qe}},gradientmap:{gradientMap:{value:null}},fog:{fogDensity:{value:25e-5},fogNear:{value:1},fogFar:{value:2e3},fogColor:{value:new Le(16777215)}},lights:{ambientLightColor:{value:[]},lightProbe:{value:[]},sunLights:{value:[],properties:{direction:{},color:{}}},sunLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},sunShadowMatrix:{value:[]},sunShadowCascade:{value:[]},directionalLights:{value:[],properties:{direction:{},color:{}}},directionalLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},directionalShadowMatrix:{value:[]},spotLights:{value:[],properties:{color:{},position:{},direction:{},distance:{},coneCos:{},penumbraCos:{},decay:{}}},spotLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},spotLightMap:{value:[]},spotLightMatrix:{value:[]},pointLights:{value:[],properties:{color:{},position:{},decay:{},distance:{}}},pointLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{},shadowCameraNear:{},shadowCameraFar:{}}},pointShadowMatrix:{value:[]},hemisphereLights:{value:[],properties:{direction:{},skyColor:{},groundColor:{}}},rectAreaLights:{value:[],properties:{color:{},position:{},width:{},height:{}}},ltc_1:{value:null},ltc_2:{value:null},probesSH:{value:null},probesMin:{value:new D},probesMax:{value:new D},probesResolution:{value:new D}},points:{diffuse:{value:new Le(16777215)},opacity:{value:1},size:{value:1},scale:{value:1},map:{value:null},alphaMap:{value:null},alphaMapTransform:{value:new qe},alphaTest:{value:0},uvTransform:{value:new qe}},sprite:{diffuse:{value:new Le(16777215)},opacity:{value:1},center:{value:new Ce(.5,.5)},rotation:{value:0},map:{value:null},mapTransform:{value:new qe},alphaMap:{value:null},alphaMapTransform:{value:new qe},alphaTest:{value:0}}};var Ii={basic:{uniforms:hi([Re.common,Re.specularmap,Re.envmap,Re.aomap,Re.lightmap,Re.fog]),vertexShader:rt.meshbasic_vert,fragmentShader:rt.meshbasic_frag},lambert:{uniforms:hi([Re.common,Re.specularmap,Re.envmap,Re.aomap,Re.lightmap,Re.emissivemap,Re.bumpmap,Re.normalmap,Re.displacementmap,Re.fog,Re.lights,{emissive:{value:new Le(0)},envMapIntensity:{value:1}}]),vertexShader:rt.meshlambert_vert,fragmentShader:rt.meshlambert_frag},phong:{uniforms:hi([Re.common,Re.specularmap,Re.envmap,Re.aomap,Re.lightmap,Re.emissivemap,Re.bumpmap,Re.normalmap,Re.displacementmap,Re.fog,Re.lights,{emissive:{value:new Le(0)},specular:{value:new Le(1118481)},shininess:{value:30},envMapIntensity:{value:1}}]),vertexShader:rt.meshphong_vert,fragmentShader:rt.meshphong_frag},standard:{uniforms:hi([Re.common,Re.envmap,Re.aomap,Re.lightmap,Re.emissivemap,Re.bumpmap,Re.normalmap,Re.displacementmap,Re.roughnessmap,Re.metalnessmap,Re.fog,Re.lights,{emissive:{value:new Le(0)},roughness:{value:1},metalness:{value:0},envMapIntensity:{value:1}}]),vertexShader:rt.meshphysical_vert,fragmentShader:rt.meshphysical_frag},toon:{uniforms:hi([Re.common,Re.aomap,Re.lightmap,Re.emissivemap,Re.bumpmap,Re.normalmap,Re.displacementmap,Re.gradientmap,Re.fog,Re.lights,{emissive:{value:new Le(0)}}]),vertexShader:rt.meshtoon_vert,fragmentShader:rt.meshtoon_frag},matcap:{uniforms:hi([Re.common,Re.bumpmap,Re.normalmap,Re.displacementmap,Re.fog,{matcap:{value:null}}]),vertexShader:rt.meshmatcap_vert,fragmentShader:rt.meshmatcap_frag},points:{uniforms:hi([Re.points,Re.fog]),vertexShader:rt.points_vert,fragmentShader:rt.points_frag},dashed:{uniforms:hi([Re.common,Re.fog,{scale:{value:1},dashSize:{value:1},totalSize:{value:2}}]),vertexShader:rt.linedashed_vert,fragmentShader:rt.linedashed_frag},depth:{uniforms:hi([Re.common,Re.displacementmap]),vertexShader:rt.depth_vert,fragmentShader:rt.depth_frag},normal:{uniforms:hi([Re.common,Re.bumpmap,Re.normalmap,Re.displacementmap,{opacity:{value:1}}]),vertexShader:rt.meshnormal_vert,fragmentShader:rt.meshnormal_frag},sprite:{uniforms:hi([Re.sprite,Re.fog]),vertexShader:rt.sprite_vert,fragmentShader:rt.sprite_frag},background:{uniforms:{uvTransform:{value:new qe},t2D:{value:null},backgroundIntensity:{value:1}},vertexShader:rt.background_vert,fragmentShader:rt.background_frag},backgroundCube:{uniforms:{envMap:{value:null},backgroundBlurriness:{value:0},backgroundIntensity:{value:1},backgroundRotation:{value:new qe}},vertexShader:rt.backgroundCube_vert,fragmentShader:rt.backgroundCube_frag},cube:{uniforms:{tCube:{value:null},tFlip:{value:-1},opacity:{value:1}},vertexShader:rt.cube_vert,fragmentShader:rt.cube_frag},equirect:{uniforms:{tEquirect:{value:null}},vertexShader:rt.equirect_vert,fragmentShader:rt.equirect_frag},distance:{uniforms:hi([Re.common,Re.displacementmap,{referencePosition:{value:new D},nearDistance:{value:1},farDistance:{value:1e3}}]),vertexShader:rt.distance_vert,fragmentShader:rt.distance_frag},shadow:{uniforms:hi([Re.lights,Re.fog,{color:{value:new Le(0)},opacity:{value:1}}]),vertexShader:rt.shadow_vert,fragmentShader:rt.shadow_frag}};Ii.physical={uniforms:hi([Ii.standard.uniforms,{clearcoat:{value:0},clearcoatMap:{value:null},clearcoatMapTransform:{value:new qe},clearcoatNormalMap:{value:null},clearcoatNormalMapTransform:{value:new qe},clearcoatNormalScale:{value:new Ce(1,1)},clearcoatRoughness:{value:0},clearcoatRoughnessMap:{value:null},clearcoatRoughnessMapTransform:{value:new qe},dispersion:{value:0},retroreflectivity:{value:0},iridescence:{value:0},iridescenceMap:{value:null},iridescenceMapTransform:{value:new qe},iridescenceIOR:{value:1.3},iridescenceThicknessMinimum:{value:100},iridescenceThicknessMaximum:{value:400},iridescenceThicknessMap:{value:null},iridescenceThicknessMapTransform:{value:new qe},sheen:{value:0},sheenColor:{value:new Le(0)},sheenColorMap:{value:null},sheenColorMapTransform:{value:new qe},sheenRoughness:{value:1},sheenRoughnessMap:{value:null},sheenRoughnessMapTransform:{value:new qe},transmission:{value:0},transmissionMap:{value:null},transmissionMapTransform:{value:new qe},transmissionSamplerSize:{value:new Ce},transmissionSamplerMap:{value:null},thickness:{value:0},thicknessMap:{value:null},thicknessMapTransform:{value:new qe},attenuationDistance:{value:0},attenuationColor:{value:new Le(0)},specularColor:{value:new Le(1,1,1)},specularColorMap:{value:null},specularColorMapTransform:{value:new qe},specularIntensity:{value:1},specularIntensityMap:{value:null},specularIntensityMapTransform:{value:new qe},anisotropyVector:{value:new Ce},anisotropyMap:{value:null},anisotropyMapTransform:{value:new qe}}]),vertexShader:rt.meshphysical_vert,fragmentShader:rt.meshphysical_frag};var Ea={r:0,b:0,g:0},Cm=new it,Xh=new qe;Xh.set(-1,0,0,0,1,0,0,0,1);function qh(n,e,t,i,r,o){let s=new Le(0),a=r===!0?0:1,c,l,h=null,m=0,f=null;function g(A){let P=A.isScene===!0?A.background:null;if(P&&P.isTexture){let y=A.backgroundBlurriness>0;P=e.get(P,y)}return P}function x(A){let P=!1,y=g(A);y===null?_(s,a):y&&y.isColor&&(_(y,1),P=!0);let E=n.xr.getEnvironmentBlendMode();E==="additive"?t.buffers.color.setClear(0,0,0,1,o):E==="alpha-blend"&&t.buffers.color.setClear(0,0,0,0,o),(n.autoClear||P)&&(t.buffers.depth.setTest(!0),t.buffers.depth.setMask(!0),t.buffers.color.setMask(!0),n.clear(n.autoClearColor,n.autoClearDepth,n.autoClearStencil))}function S(A,P){let y=g(P);y&&(y.isCubeTexture||y.mapping===_n)?(l===void 0&&(l=new Se(new wt(1,1,1),new ti({name:"BackgroundCubeMaterial",uniforms:un(Ii.backgroundCube.uniforms),vertexShader:Ii.backgroundCube.vertexShader,fragmentShader:Ii.backgroundCube.fragmentShader,side:Ct,depthTest:!1,depthWrite:!1,fog:!1,allowOverride:!1})),l.geometry.deleteAttribute("normal"),l.geometry.deleteAttribute("uv"),l.onBeforeRender=function(E,b,R){this.matrixWorld.copyPosition(R.matrixWorld)},Object.defineProperty(l.material,"envMap",{get:function(){return this.uniforms.envMap.value}}),i.update(l)),l.material.uniforms.envMap.value=y,l.material.uniforms.backgroundBlurriness.value=P.backgroundBlurriness,l.material.uniforms.backgroundIntensity.value=P.backgroundIntensity,l.material.uniforms.backgroundRotation.value.setFromMatrix4(Cm.makeRotationFromEuler(P.backgroundRotation)).transpose(),y.isCubeTexture&&y.isRenderTargetTexture===!1&&l.material.uniforms.backgroundRotation.value.premultiply(Xh),l.material.toneMapped=tt.getTransfer(y.colorSpace)!==dt,(h!==y||m!==y.version||f!==n.toneMapping)&&(l.material.needsUpdate=!0,h=y,m=y.version,f=n.toneMapping),l.layers.enableAll(),A.unshift(l,l.geometry,l.material,0,0,null)):y&&y.isTexture&&(c===void 0&&(c=new Se(new cn(2,2),new ti({name:"BackgroundMaterial",uniforms:un(Ii.background.uniforms),vertexShader:Ii.background.vertexShader,fragmentShader:Ii.background.fragmentShader,side:Ti,depthTest:!1,depthWrite:!1,fog:!1,allowOverride:!1})),c.geometry.deleteAttribute("normal"),Object.defineProperty(c.material,"map",{get:function(){return this.uniforms.t2D.value}}),i.update(c)),c.material.uniforms.t2D.value=y,c.material.uniforms.backgroundIntensity.value=P.backgroundIntensity,c.material.toneMapped=tt.getTransfer(y.colorSpace)!==dt,y.matrixAutoUpdate===!0&&y.updateMatrix(),c.material.uniforms.uvTransform.value.copy(y.matrix),(h!==y||m!==y.version||f!==n.toneMapping)&&(c.material.needsUpdate=!0,h=y,m=y.version,f=n.toneMapping),c.layers.enableAll(),A.unshift(c,c.geometry,c.material,0,0,null))}function _(A,P){A.getRGB(Ea,da(n)),t.buffers.color.setClear(Ea.r,Ea.g,Ea.b,P,o)}function p(){l!==void 0&&(l.geometry.dispose(),l.material.dispose(),l=void 0),c!==void 0&&(c.geometry.dispose(),c.material.dispose(),c=void 0)}return{getClearColor:function(){return s},setClearColor:function(A,P=1){s.set(A),a=P,_(s,a)},getClearAlpha:function(){return a},setClearAlpha:function(A){a=A,_(s,a)},render:x,addToRenderList:S,dispose:p}}function Yh(n,e){let t=n.getParameter(n.MAX_VERTEX_ATTRIBS),i={},r=f(null),o=r,s=!1;function a(F,B,X,U,K){let ee=!1,j=m(F,U,X,B);o!==j&&(o=j,l(o.object)),ee=g(F,U,X,K),ee&&x(F,U,X,K),K!==null&&e.update(K,n.ELEMENT_ARRAY_BUFFER),(ee||s)&&(s=!1,y(F,B,X,U),K!==null&&n.bindBuffer(n.ELEMENT_ARRAY_BUFFER,e.get(K).buffer))}function c(){return n.createVertexArray()}function l(F){return n.bindVertexArray(F)}function h(F){return n.deleteVertexArray(F)}function m(F,B,X,U){let K=U.wireframe===!0,ee=i[B.id];ee===void 0&&(ee={},i[B.id]=ee);let j=F.isInstancedMesh===!0?F.id:0,le=ee[j];le===void 0&&(le={},ee[j]=le);let te=le[X.id];te===void 0&&(te={},le[X.id]=te);let he=te[K];return he===void 0&&(he=f(c()),te[K]=he),he}function f(F){let B=[],X=[],U=[];for(let K=0;K<t;K++)B[K]=0,X[K]=0,U[K]=0;return{geometry:null,program:null,wireframe:!1,newAttributes:B,enabledAttributes:X,attributeDivisors:U,object:F,attributes:{},index:null}}function g(F,B,X,U){let K=o.attributes,ee=B.attributes,j=0,le=X.getAttributes();for(let te in le)if(le[te].location>=0){let pe=K[te],We=ee[te];if(We===void 0&&(te==="instanceMatrix"&&F.instanceMatrix&&(We=F.instanceMatrix),te==="instanceColor"&&F.instanceColor&&(We=F.instanceColor)),pe===void 0||pe.attribute!==We||We&&pe.data!==We.data)return!0;j++}return o.attributesNum!==j||o.index!==U}function x(F,B,X,U){let K={},ee=B.attributes,j=0,le=X.getAttributes();for(let te in le)if(le[te].location>=0){let pe=ee[te];pe===void 0&&(te==="instanceMatrix"&&F.instanceMatrix&&(pe=F.instanceMatrix),te==="instanceColor"&&F.instanceColor&&(pe=F.instanceColor));let We={};We.attribute=pe,pe&&pe.data&&(We.data=pe.data),K[te]=We,j++}o.attributes=K,o.attributesNum=j,o.index=U}function S(){let F=o.newAttributes;for(let B=0,X=F.length;B<X;B++)F[B]=0}function _(F){p(F,0)}function p(F,B){let X=o.newAttributes,U=o.enabledAttributes,K=o.attributeDivisors;X[F]=1,U[F]===0&&(n.enableVertexAttribArray(F),U[F]=1),K[F]!==B&&(n.vertexAttribDivisor(F,B),K[F]=B)}function A(){let F=o.newAttributes,B=o.enabledAttributes;for(let X=0,U=B.length;X<U;X++)B[X]!==F[X]&&(n.disableVertexAttribArray(X),B[X]=0)}function P(F,B,X,U,K,ee,j){j===!0?n.vertexAttribIPointer(F,B,X,K,ee):n.vertexAttribPointer(F,B,X,U,K,ee)}function y(F,B,X,U){S();let K=U.attributes,ee=X.getAttributes(),j=B.defaultAttributeValues;for(let le in ee){let te=ee[le];if(te.location>=0){let he=K[le];if(he===void 0&&(le==="instanceMatrix"&&F.instanceMatrix&&(he=F.instanceMatrix),le==="instanceColor"&&F.instanceColor&&(he=F.instanceColor)),he!==void 0){let pe=he.normalized,We=he.itemSize,ze=e.get(he);if(ze===void 0)continue;let pt=ze.buffer,at=ze.type,ht=ze.bytesPerElement,$=at===n.INT||at===n.UNSIGNED_INT||he.gpuType===or;if(he.isInterleavedBufferAttribute){let de=he.data,Ne=de.stride,Je=he.offset;if(de.isInstancedInterleavedBuffer){for(let Fe=0;Fe<te.locationSize;Fe++)p(te.location+Fe,de.meshPerAttribute);F.isInstancedMesh!==!0&&U._maxInstanceCount===void 0&&(U._maxInstanceCount=de.meshPerAttribute*de.count)}else for(let Fe=0;Fe<te.locationSize;Fe++)_(te.location+Fe);n.bindBuffer(n.ARRAY_BUFFER,pt);for(let Fe=0;Fe<te.locationSize;Fe++)P(te.location+Fe,We/te.locationSize,at,pe,Ne*ht,(Je+We/te.locationSize*Fe)*ht,$)}else{if(he.isInstancedBufferAttribute){for(let de=0;de<te.locationSize;de++)p(te.location+de,he.meshPerAttribute);F.isInstancedMesh!==!0&&U._maxInstanceCount===void 0&&(U._maxInstanceCount=he.meshPerAttribute*he.count)}else for(let de=0;de<te.locationSize;de++)_(te.location+de);n.bindBuffer(n.ARRAY_BUFFER,pt);for(let de=0;de<te.locationSize;de++)P(te.location+de,We/te.locationSize,at,pe,We*ht,We/te.locationSize*de*ht,$)}}else if(j!==void 0){let pe=j[le];if(pe!==void 0)switch(pe.length){case 2:n.vertexAttrib2fv(te.location,pe);break;case 3:n.vertexAttrib3fv(te.location,pe);break;case 4:n.vertexAttrib4fv(te.location,pe);break;default:n.vertexAttrib1fv(te.location,pe)}}}}A()}function E(){T();for(let F in i){let B=i[F];for(let X in B){let U=B[X];for(let K in U){let ee=U[K];for(let j in ee)h(ee[j].object),delete ee[j];delete U[K]}}delete i[F]}}function b(F){if(i[F.id]===void 0)return;let B=i[F.id];for(let X in B){let U=B[X];for(let K in U){let ee=U[K];for(let j in ee)h(ee[j].object),delete ee[j];delete U[K]}}delete i[F.id]}function R(F){for(let B in i){let X=i[B];for(let U in X){let K=X[U];if(K[F.id]===void 0)continue;let ee=K[F.id];for(let j in ee)h(ee[j].object),delete ee[j];delete K[F.id]}}}function d(F){for(let B in i){let X=i[B],U=F.isInstancedMesh===!0?F.id:0,K=X[U];if(K!==void 0){for(let ee in K){let j=K[ee];for(let le in j)h(j[le].object),delete j[le];delete K[ee]}delete X[U],Object.keys(X).length===0&&delete i[B]}}}function T(){L(),s=!0,o!==r&&(o=r,l(o.object))}function L(){r.geometry=null,r.program=null,r.wireframe=!1}return{setup:a,reset:T,resetDefaultState:L,dispose:E,releaseStatesOfGeometry:b,releaseStatesOfObject:d,releaseStatesOfProgram:R,initAttributes:S,enableAttribute:_,disableUnusedAttributes:A}}function Kh(n,e,t){let i;function r(c){i=c}function o(c,l){n.drawArrays(i,c,l),t.update(l,i,1)}function s(c,l,h){h!==0&&(n.drawArraysInstanced(i,c,l,h),t.update(l,i,h))}function a(c,l,h){if(h===0)return;e.get("WEBGL_multi_draw").multiDrawArraysWEBGL(i,c,0,l,0,h);let f=0;for(let g=0;g<h;g++)f+=l[g];t.update(f,i,1)}this.setMode=r,this.render=o,this.renderInstances=s,this.renderMultiDraw=a}function Zh(n,e,t,i){let r;function o(){if(r!==void 0)return r;if(e.has("EXT_texture_filter_anisotropic")===!0){let R=e.get("EXT_texture_filter_anisotropic");r=n.getParameter(R.MAX_TEXTURE_MAX_ANISOTROPY_EXT)}else r=0;return r}function s(R){return!(R!==$t&&i.convert(R)!==n.getParameter(n.IMPLEMENTATION_COLOR_READ_FORMAT))}function a(R){let d=R===Jt&&(e.has("EXT_color_buffer_half_float")||e.has("EXT_color_buffer_float"));return!(R!==Bt&&R!==ni&&!d&&i.convert(R)!==n.getParameter(n.IMPLEMENTATION_COLOR_READ_TYPE))}function c(R){if(R==="highp"){if(n.getShaderPrecisionFormat(n.VERTEX_SHADER,n.HIGH_FLOAT).precision>0&&n.getShaderPrecisionFormat(n.FRAGMENT_SHADER,n.HIGH_FLOAT).precision>0)return"highp";R="mediump"}return R==="mediump"&&n.getShaderPrecisionFormat(n.VERTEX_SHADER,n.MEDIUM_FLOAT).precision>0&&n.getShaderPrecisionFormat(n.FRAGMENT_SHADER,n.MEDIUM_FLOAT).precision>0?"mediump":"lowp"}let l=t.precision!==void 0?t.precision:"highp",h=c(l);h!==l&&(Ue("WebGLRenderer:",l,"not supported, using",h,"instead."),l=h);let m=t.logarithmicDepthBuffer===!0,f=t.reversedDepthBuffer===!0&&e.has("EXT_clip_control");t.reversedDepthBuffer===!0&&f===!1&&Ue("WebGLRenderer: Unable to use reversed depth buffer due to missing EXT_clip_control extension. Fallback to default depth buffer.");let g=n.getParameter(n.MAX_TEXTURE_IMAGE_UNITS),x=n.getParameter(n.MAX_VERTEX_TEXTURE_IMAGE_UNITS),S=n.getParameter(n.MAX_TEXTURE_SIZE),_=n.getParameter(n.MAX_CUBE_MAP_TEXTURE_SIZE),p=n.getParameter(n.MAX_VERTEX_ATTRIBS),A=n.getParameter(n.MAX_VERTEX_UNIFORM_VECTORS),P=n.getParameter(n.MAX_VARYING_VECTORS),y=n.getParameter(n.MAX_FRAGMENT_UNIFORM_VECTORS),E=n.getParameter(n.MAX_SAMPLES),b=n.getParameter(n.SAMPLES);return{isWebGL2:!0,getMaxAnisotropy:o,getMaxPrecision:c,textureFormatReadable:s,textureTypeReadable:a,precision:l,logarithmicDepthBuffer:m,reversedDepthBuffer:f,maxTextures:g,maxVertexTextures:x,maxTextureSize:S,maxCubemapSize:_,maxAttributes:p,maxVertexUniforms:A,maxVaryings:P,maxFragmentUniforms:y,maxSamples:E,samples:b}}function Jh(n){let e=this,t=null,i=0,r=!1,o=!1,s=new ui,a=new qe,c={value:null,needsUpdate:!1};this.uniform=c,this.numPlanes=0,this.numIntersection=0,this.init=function(m,f){let g=m.length!==0||f||i!==0||r;return r=f,i=m.length,g},this.beginShadows=function(){o=!0,h(null)},this.endShadows=function(){o=!1},this.setGlobalState=function(m,f){t=h(m,f,0)},this.setState=function(m,f,g){let x=m.clippingPlanes,S=m.clipIntersection,_=m.clipShadows,p=n.get(m);if(!r||x===null||x.length===0||o&&!_)o?h(null):l();else{let A=o?0:i,P=A*4,y=p.clippingState||null;c.value=y,y=h(x,f,P,g);for(let E=0;E!==P;++E)y[E]=t[E];p.clippingState=y,this.numIntersection=S?this.numPlanes:0,this.numPlanes+=A}};function l(){c.value!==t&&(c.value=t,c.needsUpdate=i>0),e.numPlanes=i,e.numIntersection=0}function h(m,f,g,x){let S=m!==null?m.length:0,_=null;if(S!==0){if(_=c.value,x!==!0||_===null){let p=g+S*4,A=f.matrixWorldInverse;a.getNormalMatrix(A),(_===null||_.length<p)&&(_=new Float32Array(p));for(let P=0,y=g;P!==S;++P,y+=4)s.copy(m[P]).applyMatrix4(A,a),s.normal.toArray(_,y),_[y+3]=s.constant}c.value=_,c.needsUpdate=!0}return e.numPlanes=S,e.numIntersection=0,_}}var qr=4,Pm=6,Lm=20,Dm=256,os=new Pn,$h=new Le,vl=null,yl=0,bl=0,El=!1,Im=new D,er=new D,ss=class{constructor(e){this._renderer=e,this._pingPongRenderTarget=null,this._lodMax=0,this._cubeSize=0,this._sizeLods=[],this._lodMeshes=[],this._backgroundBox=null,this._cubemapMaterial=null,this._equirectMaterial=null,this._blurMaterial=null,this._ggxMaterial=null}fromScene(e,t=0,i=.1,r=100,o={}){let{size:s=256,position:a=Im}=o;vl=this._renderer.getRenderTarget(),yl=this._renderer.getActiveCubeFace(),bl=this._renderer.getActiveMipmapLevel(),El=this._renderer.xr.enabled,this._renderer.xr.enabled=!1,this._setSize(s);let c=this._allocateTargets();return c.depthBuffer=!0,this._sceneToCubeUV(e,i,r,c,a),t>0&&this._blur(c,0,0,t),this._applyPMREM(c),this._cleanup(c),c}fromEquirectangular(e,t=null){return this._fromTexture(e,t)}fromCubemap(e,t=null){return this._fromTexture(e,t)}compileCubemapShader(){this._cubemapMaterial===null&&(this._cubemapMaterial=ed(),this._compileMaterial(this._cubemapMaterial))}compileEquirectangularShader(){this._equirectMaterial===null&&(this._equirectMaterial=jh(),this._compileMaterial(this._equirectMaterial))}dispose(){this._dispose(),this._cubemapMaterial!==null&&this._cubemapMaterial.dispose(),this._equirectMaterial!==null&&this._equirectMaterial.dispose(),this._backgroundBox!==null&&(this._backgroundBox.geometry.dispose(),this._backgroundBox.material.dispose())}_setSize(e){this._lodMax=Math.floor(Math.log2(e)),this._cubeSize=Math.pow(2,this._lodMax)}_dispose(){this._blurMaterial!==null&&this._blurMaterial.dispose(),this._ggxMaterial!==null&&this._ggxMaterial.dispose(),this._pingPongRenderTarget!==null&&this._pingPongRenderTarget.dispose();for(let e=0;e<this._lodMeshes.length;e++)this._lodMeshes[e].geometry.dispose()}_cleanup(e){this._renderer.setRenderTarget(vl,yl,bl),this._renderer.xr.enabled=El,e.scissorTest=!1,Xr(e,0,0,e.width,e.height)}_fromTexture(e,t){e.mapping===wi||e.mapping===$i?this._setSize(e.image.length===0?16:e.image[0].width||e.image[0].image.width):this._setSize(e.image.width/4),vl=this._renderer.getRenderTarget(),yl=this._renderer.getActiveCubeFace(),bl=this._renderer.getActiveMipmapLevel(),El=this._renderer.xr.enabled,this._renderer.xr.enabled=!1;let i=t||this._allocateTargets();return this._textureToCubeUV(e,i),this._applyPMREM(i),this._cleanup(i),i}_allocateTargets(){let e=3*Math.max(this._cubeSize,112),t=4*this._cubeSize,i={magFilter:Ut,minFilter:Ut,generateMipmaps:!1,type:Jt,format:$t,colorSpace:Hn,depthBuffer:!1},r=Qh(e,t,i);if(this._pingPongRenderTarget===null||this._pingPongRenderTarget.width!==e||this._pingPongRenderTarget.height!==t){this._pingPongRenderTarget!==null&&this._dispose(),this._pingPongRenderTarget=Qh(e,t,i);let{_lodMax:o}=this;({lodMeshes:this._lodMeshes,sizeLods:this._sizeLods}=Nm(o)),this._blurMaterial=Fm(o,e,t),this._ggxMaterial=Um(o,e,t)}return r}_compileMaterial(e){let t=new Se(new gt,e);this._renderer.compile(t,os)}_sceneToCubeUV(e,t,i,r,o){let c=new Ot(90,1,t,i),l=[1,-1,1,1,1,1],h=[1,1,1,-1,-1,-1],m=this._renderer,f=m.autoClear,g=m.toneMapping;m.getClearColor($h),m.toneMapping=di,m.autoClear=!1,m.state.buffers.depth.getReversed()&&(m.setRenderTarget(r),m.clearDepth(),m.setRenderTarget(null)),this._backgroundBox===null&&(this._backgroundBox=new Se(new wt,new ei({name:"PMREM.Background",side:Ct,depthWrite:!1,depthTest:!1})));let S=this._backgroundBox,_=S.material,p=!1,A=e.background;A?A.isColor&&(_.color.copy(A),e.background=null,p=!0):(_.color.copy($h),p=!0);for(let P=0;P<6;P++){let y=P%3;y===0?(c.up.set(0,l[P],0),c.position.set(o.x,o.y,o.z),c.lookAt(o.x+h[P],o.y,o.z)):y===1?(c.up.set(0,0,l[P]),c.position.set(o.x,o.y,o.z),c.lookAt(o.x,o.y+h[P],o.z)):(c.up.set(0,l[P],0),c.position.set(o.x,o.y,o.z),c.lookAt(o.x,o.y,o.z+h[P]));let E=this._cubeSize;Xr(r,y*E,P>2?E:0,E,E),m.setRenderTarget(r),p&&m.render(S,c),m.render(e,c)}m.toneMapping=g,m.autoClear=f,e.background=A}_textureToCubeUV(e,t){let i=this._renderer,r=e.mapping===wi||e.mapping===$i;r?(this._cubemapMaterial===null&&(this._cubemapMaterial=ed()),this._cubemapMaterial.uniforms.flipEnvMap.value=e.isRenderTargetTexture===!1?-1:1):this._equirectMaterial===null&&(this._equirectMaterial=jh());let o=r?this._cubemapMaterial:this._equirectMaterial,s=this._lodMeshes[0];s.material=o;let a=o.uniforms;a.envMap.value=e;let c=this._cubeSize;Xr(t,0,0,3*c,2*c),i.setRenderTarget(t),i.render(s,os)}_applyPMREM(e){let t=this._renderer,i=t.autoClear;t.autoClear=!1;let r=this._lodMeshes.length;for(let o=1;o<r;o++)this._applyGGXFilter(e,o-1,o);t.autoClear=i}_applyGGXFilter(e,t,i){let r=this._renderer,o=this._pingPongRenderTarget,s=this._ggxMaterial,a=this._lodMeshes[i];a.material=s;let c=s.uniforms,l=i/(this._lodMeshes.length-1),h=t/(this._lodMeshes.length-1),m=Math.sqrt(l*l-h*h),f=l*1.25,g=m*f,{_lodMax:x}=this,S=this._sizeLods[i],_=3*S*(i>x-qr?i-x+qr:0),p=4*(this._cubeSize-S);c.envMap.value=e.texture,c.roughness.value=g,c.mipInt.value=x-t,Xr(o,_,p,3*S,2*S),r.setRenderTarget(o),r.render(a,os),c.envMap.value=o.texture,c.roughness.value=0,c.mipInt.value=x-i,Xr(e,_,p,3*S,2*S),r.setRenderTarget(e),r.render(a,os)}_blur(e,t,i,r){let o=this._pingPongRenderTarget,s=Math.min(r,Math.PI)/Math.SQRT2;this._blurPass(e,o,t,i,s),this._blurPass(o,e,i,i,s)}_blurPass(e,t,i,r,o){let s=this._renderer,a=this._blurMaterial,c=this._lodMeshes[r];c.material=a;let l=a.uniforms;l.envMap.value=e.texture,l.sigma.value=o,l.mipInt.value=this._lodMax-i;let h=this._sizeLods[r],m=3*h*(r>this._lodMax-qr?r-this._lodMax+qr:0),f=4*(this._cubeSize-h);Xr(t,m,f,3*h,2*h),s.setRenderTarget(t),s.render(c,os)}};function Nm(n){let e=[],t=[],i=n,r=n-qr+1+Pm;for(let o=0;o<r;o++){let s=Math.pow(2,i);e.push(s);let a=1/(s-2),c=-a,l=1+a,h=[c,c,l,c,l,l,c,c,l,l,c,l],m=6,f=6,g=3,x=new Float32Array(g*f*m),S=new Float32Array(g*f*m);for(let p=0;p<m;p++){let A=p%3*2/3-1,P=p>2?0:-1,y=[A,P,0,A+2/3,P,0,A+2/3,P+1,0,A,P,0,A+2/3,P+1,0,A,P+1,0];x.set(y,g*f*p);for(let E=0;E<f;E++){let b=h[E*2]*2-1,R=h[E*2+1]*2-1;p===0?er.set(1,R,b):p===1?er.set(-b,1,-R):p===2?er.set(-b,R,1):p===3?er.set(-1,R,-b):p===4?er.set(-b,-1,R):er.set(b,R,-1),er.toArray(S,(p*f+E)*g)}}let _=new gt;_.setAttribute("position",new ri(x,g)),_.setAttribute("outputDirection",new ri(S,g)),t.push(new Se(_,null)),i>qr&&i--}return{lodMeshes:t,sizeLods:e}}function Qh(n,e,t){let i=new Wt(n,e,t);return i.texture.mapping=_n,i.texture.name="PMREM.cubeUv",i.scissorTest=!0,i}function Xr(n,e,t,i,r){n.viewport.set(e,t,i,r),n.scissor.set(e,t,i,r)}function Um(n,e,t){return new ti({name:"PMREMGGXConvolution",defines:{GGX_SAMPLES:Dm,CUBEUV_TEXEL_WIDTH:1/e,CUBEUV_TEXEL_HEIGHT:1/t,CUBEUV_MAX_MIP:`${n}.0`},uniforms:{envMap:{value:null},roughness:{value:0},mipInt:{value:0}},vertexShader:Ta(),fragmentShader:`

			precision highp float;
			precision highp int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;
			uniform float roughness;
			uniform float mipInt;

			#define ENVMAP_TYPE_CUBE_UV
			#include <cube_uv_reflection_fragment>

			#define PI 3.14159265359

			// Van der Corput radical inverse
			float radicalInverse_VdC(uint bits) {
				bits = (bits << 16u) | (bits >> 16u);
				bits = ((bits & 0x55555555u) << 1u) | ((bits & 0xAAAAAAAAu) >> 1u);
				bits = ((bits & 0x33333333u) << 2u) | ((bits & 0xCCCCCCCCu) >> 2u);
				bits = ((bits & 0x0F0F0F0Fu) << 4u) | ((bits & 0xF0F0F0F0u) >> 4u);
				bits = ((bits & 0x00FF00FFu) << 8u) | ((bits & 0xFF00FF00u) >> 8u);
				return float(bits) * 2.3283064365386963e-10; // / 0x100000000
			}

			// Hammersley sequence
			vec2 hammersley(uint i, uint N) {
				return vec2(float(i) / float(N), radicalInverse_VdC(i));
			}

			// GGX VNDF importance sampling (Eric Heitz 2018)
			// "Sampling the GGX Distribution of Visible Normals"
			// https://jcgt.org/published/0007/04/01/
			vec3 importanceSampleGGX_VNDF(vec2 Xi, vec3 V, float roughness) {
				float alpha = roughness * roughness;

				// Section 4.1: Orthonormal basis
				vec3 T1 = vec3(1.0, 0.0, 0.0);
				vec3 T2 = cross(V, T1);

				// Section 4.2: Parameterization of projected area
				float r = sqrt(Xi.x);
				float phi = 2.0 * PI * Xi.y;
				float t1 = r * cos(phi);
				float t2 = r * sin(phi);
				float s = 0.5 * (1.0 + V.z);
				t2 = (1.0 - s) * sqrt(1.0 - t1 * t1) + s * t2;

				// Section 4.3: Reprojection onto hemisphere
				vec3 Nh = t1 * T1 + t2 * T2 + sqrt(max(0.0, 1.0 - t1 * t1 - t2 * t2)) * V;

				// Section 3.4: Transform back to ellipsoid configuration
				return normalize(vec3(alpha * Nh.x, alpha * Nh.y, max(0.0, Nh.z)));
			}

			void main() {
				vec3 N = normalize(vOutputDirection);
				vec3 V = N; // Assume view direction equals normal for pre-filtering

				vec3 prefilteredColor = vec3(0.0);
				float totalWeight = 0.0;

				// For very low roughness, just sample the environment directly
				if (roughness < 0.001) {
					gl_FragColor = vec4(bilinearCubeUV(envMap, N, mipInt), 1.0);
					return;
				}

				// Tangent space basis for VNDF sampling
				vec3 up = abs(N.z) < 0.999 ? vec3(0.0, 0.0, 1.0) : vec3(1.0, 0.0, 0.0);
				vec3 tangent = normalize(cross(up, N));
				vec3 bitangent = cross(N, tangent);

				for(uint i = 0u; i < uint(GGX_SAMPLES); i++) {
					vec2 Xi = hammersley(i, uint(GGX_SAMPLES));

					// For PMREM, V = N, so in tangent space V is always (0, 0, 1)
					vec3 H_tangent = importanceSampleGGX_VNDF(Xi, vec3(0.0, 0.0, 1.0), roughness);

					// Transform H back to world space
					vec3 H = normalize(tangent * H_tangent.x + bitangent * H_tangent.y + N * H_tangent.z);
					vec3 L = normalize(2.0 * dot(V, H) * H - V);

					float NdotL = max(dot(N, L), 0.0);

					if(NdotL > 0.0) {
						// Sample environment at fixed mip level
						// VNDF importance sampling handles the distribution filtering
						vec3 sampleColor = bilinearCubeUV(envMap, L, mipInt);

						// Weight by NdotL for the split-sum approximation
						// VNDF PDF naturally accounts for the visible microfacet distribution
						prefilteredColor += sampleColor * NdotL;
						totalWeight += NdotL;
					}
				}

				if (totalWeight > 0.0) {
					prefilteredColor = prefilteredColor / totalWeight;
				}

				gl_FragColor = vec4(prefilteredColor, 1.0);
			}
		`,blending:Si,depthTest:!1,depthWrite:!1})}function Fm(n,e,t){return new ti({name:"SphericalGaussianBlur",defines:{SAMPLES:Lm,CUBEUV_TEXEL_WIDTH:1/e,CUBEUV_TEXEL_HEIGHT:1/t,CUBEUV_MAX_MIP:`${n}.0`},uniforms:{envMap:{value:null},sigma:{value:0},mipInt:{value:0}},vertexShader:Ta(),fragmentShader:`

			precision highp float;
			precision highp int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;
			uniform float sigma;
			uniform float mipInt;

			#define ENVMAP_TYPE_CUBE_UV
			#include <cube_uv_reflection_fragment>

			#define PI 3.14159265359
			#define GOLDEN_ANGLE 2.39996322973

			void main() {

				if ( sigma == 0.0 ) {

					gl_FragColor = vec4( bilinearCubeUV( envMap, vOutputDirection, mipInt ), 1.0 );
					return;

				}

				vec3 outputDirection = normalize( vOutputDirection );

				vec3 up = abs( outputDirection.z ) < 0.999 ? vec3( 0.0, 0.0, 1.0 ) : vec3( 1.0, 0.0, 0.0 );
				vec3 tangent = normalize( cross( up, outputDirection ) );
				vec3 bitangent = cross( outputDirection, tangent );

				// Truncate the kernel at three standard deviations or at the antipode.
				float thetaMax = min( 3.0 * sigma, PI );
				float truncation = 1.0 - exp( - 0.5 * thetaMax * thetaMax / ( sigma * sigma ) );

				vec3 accumColor = vec3( 0.0 );
				float accumWeight = 0.0;

				for ( int i = 0; i < SAMPLES; i ++ ) {

					// Stratified inverse-CDF sampling of the Gaussian, placed on a golden-angle spiral.
					float stratum = ( float( i ) + 0.5 ) / float( SAMPLES );
					float theta = sigma * sqrt( - 2.0 * log( 1.0 - stratum * truncation ) );
					float phi = float( i ) * GOLDEN_ANGLE;

					vec3 offset = cos( phi ) * tangent + sin( phi ) * bitangent;
					vec3 sampleDirection = cos( theta ) * outputDirection + sin( theta ) * offset;

					// Correct the planar sample density to solid angle.
					float weight = sin( theta ) / theta;

					accumColor += weight * bilinearCubeUV( envMap, sampleDirection, mipInt );
					accumWeight += weight;

				}

				gl_FragColor = vec4( accumColor / accumWeight, 1.0 );

			}
		`,blending:Si,depthTest:!1,depthWrite:!1})}function jh(){return new ti({name:"EquirectangularToCubeUV",uniforms:{envMap:{value:null}},vertexShader:Ta(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;

			#include <common>

			void main() {

				vec3 outputDirection = normalize( vOutputDirection );
				vec2 uv = equirectUv( outputDirection );

				gl_FragColor = vec4( texture2D ( envMap, uv ).rgb, 1.0 );

			}
		`,blending:Si,depthTest:!1,depthWrite:!1})}function ed(){return new ti({name:"CubemapToCubeUV",uniforms:{envMap:{value:null},flipEnvMap:{value:-1}},vertexShader:Ta(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			uniform float flipEnvMap;

			varying vec3 vOutputDirection;

			uniform samplerCube envMap;

			void main() {

				gl_FragColor = textureCube( envMap, vec3( flipEnvMap * vOutputDirection.x, vOutputDirection.yz ) );

			}
		`,blending:Si,depthTest:!1,depthWrite:!1})}function Ta(){return`

		precision mediump float;
		precision mediump int;

		attribute vec3 outputDirection;

		varying vec3 vOutputDirection;

		void main() {

			vOutputDirection = outputDirection;
			gl_Position = vec4( position, 1.0 );

		}
	`}var Yr=class extends Wt{constructor(e=1,t={}){super(e,e,t),this.isWebGLCubeRenderTarget=!0;let i={width:e,height:e,depth:1},r=[i,i,i,i,i,i];this.texture=new Nr(r),this._setTextureOptions(t),this.texture.isRenderTargetTexture=!0}fromEquirectangularTexture(e,t){this.texture.type=t.type,this.texture.colorSpace=t.colorSpace,this.texture.generateMipmaps=t.generateMipmaps,this.texture.minFilter=t.minFilter,this.texture.magFilter=t.magFilter;let i={uniforms:{tEquirect:{value:null}},vertexShader:`

				varying vec3 vWorldDirection;

				vec3 transformDirection( in vec3 dir, in mat4 matrix ) {

					return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );

				}

				void main() {

					vWorldDirection = transformDirection( position, modelMatrix );

					#include <begin_vertex>
					#include <project_vertex>

				}
			`,fragmentShader:`

				uniform sampler2D tEquirect;

				varying vec3 vWorldDirection;

				#include <common>

				void main() {

					vec3 direction = normalize( vWorldDirection );

					vec2 sampleUV = equirectUv( direction );

					gl_FragColor = texture2D( tEquirect, sampleUV );

				}
			`},r=new wt(5,5,5),o=new ti({name:"CubemapFromEquirect",uniforms:un(i.uniforms),vertexShader:i.vertexShader,fragmentShader:i.fragmentShader,side:Ct,blending:Si});o.uniforms.tEquirect.value=t;let s=new Se(r,o),a=t.minFilter;return t.minFilter===Ni&&(t.minFilter=Ut),new va(1,10,this).update(e,s),t.minFilter=a,s.geometry.dispose(),s.material.dispose(),this}clear(e,t=!0,i=!0,r=!0){let o=e.getRenderTarget();for(let s=0;s<6;s++)e.setRenderTarget(this,s),e.clear(t,i,r);e.setRenderTarget(o)}};function td(n){let e=new WeakMap,t=new WeakMap,i=null;function r(f,g=!1){return f==null?null:g?s(f):o(f)}function o(f){if(f&&f.isTexture){let g=f.mapping;if(g===ys||g===bs)if(e.has(f)){let x=e.get(f).texture;return a(x,f.mapping)}else{let x=f.image;if(x&&x.height>0){let S=new Yr(x.height);return S.fromEquirectangularTexture(n,f),e.set(f,S),f.addEventListener("dispose",l),a(S.texture,f.mapping)}else return null}}return f}function s(f){if(f&&f.isTexture){let g=f.mapping,x=g===ys||g===bs,S=g===wi||g===$i;if(x||S){let _=t.get(f),p=_!==void 0?_.texture.pmremVersion:0;if(f.isRenderTargetTexture&&f.pmremVersion!==p)return i===null&&(i=new ss(n)),_=x?i.fromEquirectangular(f,_):i.fromCubemap(f,_),_.texture.pmremVersion=f.pmremVersion,t.set(f,_),_.texture;if(_!==void 0)return _.texture;{let A=f.image;return x&&A&&A.height>0||S&&A&&c(A)?(i===null&&(i=new ss(n)),_=x?i.fromEquirectangular(f):i.fromCubemap(f),_.texture.pmremVersion=f.pmremVersion,t.set(f,_),f.addEventListener("dispose",h),_.texture):null}}}return f}function a(f,g){return g===ys?f.mapping=wi:g===bs&&(f.mapping=$i),f}function c(f){let g=0,x=6;for(let S=0;S<x;S++)f[S]!==void 0&&g++;return g===x}function l(f){let g=f.target;g.removeEventListener("dispose",l);let x=e.get(g);x!==void 0&&(e.delete(g),x.dispose())}function h(f){let g=f.target;g.removeEventListener("dispose",h);let x=t.get(g);x!==void 0&&(t.delete(g),x.dispose())}function m(){e=new WeakMap,t=new WeakMap,i!==null&&(i.dispose(),i=null)}return{get:r,dispose:m}}function id(n){let e={};function t(i){if(e[i]!==void 0)return e[i];let r=n.getExtension(i);return e[i]=r,r}return{has:function(i){return t(i)!==null},init:function(){t("EXT_color_buffer_float"),t("WEBGL_clip_cull_distance"),t("OES_texture_float_linear"),t("EXT_color_buffer_half_float"),t("WEBGL_multisampled_render_to_texture"),t("WEBGL_render_shared_exponent")},get:function(i){let r=t(i);return r===null&&Wi("WebGLRenderer: "+i+" extension not supported."),r}}}function nd(n,e,t,i){let r={},o=new WeakMap;function s(m){let f=m.target;f.index!==null&&e.remove(f.index);for(let x in f.attributes)e.remove(f.attributes[x]);f.removeEventListener("dispose",s),delete r[f.id];let g=o.get(f);g&&(e.remove(g),o.delete(f)),i.releaseStatesOfGeometry(f),f.isInstancedBufferGeometry===!0&&delete f._maxInstanceCount,t.memory.geometries--}function a(m,f){return r[f.id]===!0||(f.addEventListener("dispose",s),r[f.id]=!0,t.memory.geometries++),f}function c(m){let f=m.attributes;for(let g in f)e.update(f[g],n.ARRAY_BUFFER)}function l(m){let f=[],g=m.index,x=m.attributes.position,S=0;if(x===void 0)return;if(g!==null){let A=g.array;S=g.version;for(let P=0,y=A.length;P<y;P+=3){let E=A[P+0],b=A[P+1],R=A[P+2];f.push(E,b,b,R,R,E)}}else{let A=x.array;S=x.version;for(let P=0,y=A.length/3-1;P<y;P+=3){let E=P+0,b=P+1,R=P+2;f.push(E,b,b,R,R,E)}}let _=new(x.count>=65535?Dr:Lr)(f,1);_.version=S;let p=o.get(m);p&&e.remove(p),o.set(m,_)}function h(m){let f=o.get(m);if(f){let g=m.index;g!==null&&f.version<g.version&&l(m)}else l(m);return o.get(m)}return{get:a,update:c,getWireframeAttribute:h}}function rd(n,e,t){let i;function r(m){i=m}let o,s;function a(m){o=m.type,s=m.bytesPerElement}function c(m,f){n.drawElements(i,f,o,m*s),t.update(f,i,1)}function l(m,f,g){g!==0&&(n.drawElementsInstanced(i,f,o,m*s,g),t.update(f,i,g))}function h(m,f,g){if(g===0)return;e.get("WEBGL_multi_draw").multiDrawElementsWEBGL(i,f,0,o,m,0,g);let S=0;for(let _=0;_<g;_++)S+=f[_];t.update(S,i,1)}this.setMode=r,this.setIndex=a,this.render=c,this.renderInstances=l,this.renderMultiDraw=h}function od(n){let e={geometries:0,textures:0},t={frame:0,calls:0,triangles:0,points:0,lines:0};function i(o,s,a){switch(t.calls++,s){case n.TRIANGLES:t.triangles+=a*(o/3);break;case n.LINES:t.lines+=a*(o/2);break;case n.LINE_STRIP:t.lines+=a*(o-1);break;case n.LINE_LOOP:t.lines+=a*o;break;case n.POINTS:t.points+=a*o;break;default:nt("WebGLInfo: Unknown draw mode:",s);break}}function r(){t.calls=0,t.triangles=0,t.points=0,t.lines=0}return{memory:e,render:t,programs:null,autoReset:!0,reset:r,update:i}}function sd(n,e,t){let i=new WeakMap,r=new xt;function o(s,a,c){let l=s.morphTargetInfluences,h=a.morphAttributes.position||a.morphAttributes.normal||a.morphAttributes.color,m=h!==void 0?h.length:0,f=i.get(a);if(f===void 0||f.count!==m){let T=function(){R.dispose(),i.delete(a),a.removeEventListener("dispose",T)};f!==void 0&&f.texture.dispose();let g=a.morphAttributes.position!==void 0,x=a.morphAttributes.normal!==void 0,S=a.morphAttributes.color!==void 0,_=a.morphAttributes.position||[],p=a.morphAttributes.normal||[],A=a.morphAttributes.color||[],P=0;g===!0&&(P=1),x===!0&&(P=2),S===!0&&(P=3);let y=a.attributes.position.count*P,E=1;y>e.maxTextureSize&&(E=Math.ceil(y/e.maxTextureSize),y=e.maxTextureSize);let b=new Float32Array(y*E*4*m),R=new vr(b,y,E,m);R.type=ni,R.needsUpdate=!0;let d=P*4;for(let L=0;L<m;L++){let F=_[L],B=p[L],X=A[L],U=y*E*4*L;for(let K=0;K<F.count;K++){let ee=K*d;g===!0&&(r.fromBufferAttribute(F,K),b[U+ee+0]=r.x,b[U+ee+1]=r.y,b[U+ee+2]=r.z,b[U+ee+3]=0),x===!0&&(r.fromBufferAttribute(B,K),b[U+ee+4]=r.x,b[U+ee+5]=r.y,b[U+ee+6]=r.z,b[U+ee+7]=0),S===!0&&(r.fromBufferAttribute(X,K),b[U+ee+8]=r.x,b[U+ee+9]=r.y,b[U+ee+10]=r.z,b[U+ee+11]=X.itemSize===4?r.w:1)}}f={count:m,texture:R,size:new Ce(y,E)},i.set(a,f),a.addEventListener("dispose",T)}if(s.isInstancedMesh===!0&&s.morphTexture!==null)c.getUniforms().setValue(n,"morphTexture",s.morphTexture,t);else{let g=0;for(let S=0;S<l.length;S++)g+=l[S];let x=a.morphTargetsRelative?1:1-g;c.getUniforms().setValue(n,"morphTargetBaseInfluence",x),c.getUniforms().setValue(n,"morphTargetInfluences",l)}c.getUniforms().setValue(n,"morphTargetsTexture",f.texture,t),c.getUniforms().setValue(n,"morphTargetsTextureSize",f.size)}return{update:o}}function ad(n,e,t,i,r){let o=new WeakMap;function s(l){let h=r.render.frame,m=l.geometry,f=e.get(l,m);if(o.get(f)!==h&&(e.update(f),o.set(f,h)),l.isInstancedMesh&&(l.hasEventListener("dispose",c)===!1&&l.addEventListener("dispose",c),o.get(l)!==h&&(t.update(l.instanceMatrix,n.ARRAY_BUFFER),l.instanceColor!==null&&t.update(l.instanceColor,n.ARRAY_BUFFER),o.set(l,h))),l.isSkinnedMesh){let g=l.skeleton;o.get(g)!==h&&(g.update(),o.set(g,h))}return f}function a(){o=new WeakMap}function c(l){let h=l.target;h.removeEventListener("dispose",c),i.releaseStatesOfObject(h),t.remove(h.instanceMatrix),h.instanceColor!==null&&t.remove(h.instanceColor)}return{update:s,dispose:a}}var Om={[gs]:"LINEAR_TONE_MAPPING",[_s]:"REINHARD_TONE_MAPPING",[xs]:"CINEON_TONE_MAPPING",[rr]:"ACES_FILMIC_TONE_MAPPING",[Ss]:"AGX_TONE_MAPPING",[vs]:"NEUTRAL_TONE_MAPPING",[Ms]:"CUSTOM_TONE_MAPPING"};function ld(n,e,t,i,r,o){let s=new Wt(e,t,{type:n,depthBuffer:r,stencilBuffer:o,samples:i?4:0,storeMultisampledDepthBuffer:!1,storeMultisampledStencilBuffer:!1,resolveDepthBuffer:!1,resolveStencilBuffer:!1}),a=null,c=null,l=new gt;l.setAttribute("position",new ft([-1,3,0,-1,-1,0,3,-1,0],3)),l.setAttribute("uv",new ft([0,2,0,0,2,0],2));let h=new pa({uniforms:{tDiffuse:{value:null}},vertexShader:`
			precision highp float;

			uniform mat4 modelViewMatrix;
			uniform mat4 projectionMatrix;

			attribute vec3 position;
			attribute vec2 uv;

			varying vec2 vUv;

			void main() {
				vUv = uv;
				gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
			}`,fragmentShader:`
			precision highp float;

			uniform sampler2D tDiffuse;

			varying vec2 vUv;

			#include <tonemapping_pars_fragment>
			#include <colorspace_pars_fragment>

			void main() {
				gl_FragColor = texture2D( tDiffuse, vUv );

				#ifdef LINEAR_TONE_MAPPING
					gl_FragColor.rgb = LinearToneMapping( gl_FragColor.rgb );
				#elif defined( REINHARD_TONE_MAPPING )
					gl_FragColor.rgb = ReinhardToneMapping( gl_FragColor.rgb );
				#elif defined( CINEON_TONE_MAPPING )
					gl_FragColor.rgb = CineonToneMapping( gl_FragColor.rgb );
				#elif defined( ACES_FILMIC_TONE_MAPPING )
					gl_FragColor.rgb = ACESFilmicToneMapping( gl_FragColor.rgb );
				#elif defined( AGX_TONE_MAPPING )
					gl_FragColor.rgb = AgXToneMapping( gl_FragColor.rgb );
				#elif defined( NEUTRAL_TONE_MAPPING )
					gl_FragColor.rgb = NeutralToneMapping( gl_FragColor.rgb );
				#elif defined( CUSTOM_TONE_MAPPING )
					gl_FragColor.rgb = CustomToneMapping( gl_FragColor.rgb );
				#endif

				#ifdef SRGB_TRANSFER
					gl_FragColor = sRGBTransferOETF( gl_FragColor );
				#endif
			}`,depthTest:!1,depthWrite:!1}),m=new Se(l,h),f=new Pn(-1,1,1,-1,0,1),g=null,x=null,S=!1,_,p=null,A=[],P=!1;this.setSize=function(y,E){s.setSize(y,E),a!==null&&a.setSize(y,E),c!==null&&c.setSize(y,E);for(let b=0;b<A.length;b++){let R=A[b];R.setSize&&R.setSize(y,E)}},this.setEffects=function(y){A=y,P=A.length>0&&A[0].isRenderPass===!0;let E=s.width,b=s.height;A.length>0&&a===null&&(a=new Wt(E,b,{type:Jt,depthBuffer:!1,stencilBuffer:!1}),c=new Wt(E,b,{type:Jt,depthBuffer:!1,stencilBuffer:!1}));for(let R=0;R<A.length;R++){let d=A[R];d.setSize&&d.setSize(E,b)}},this.begin=function(y,E){if(S||y.toneMapping===di&&A.length===0)return!1;if(p=E,E!==null){let b=E.width,R=E.height;(s.width!==b||s.height!==R)&&this.setSize(b,R)}return P===!1&&y.setRenderTarget(s),_=y.toneMapping,y.toneMapping=di,!0},this.hasRenderPass=function(){return P},this.end=function(y,E){y.toneMapping=_,S=!0;let b=s,R=a;for(let d=0;d<A.length;d++){let T=A[d];T.enabled!==!1&&(T.render(y,R,b,E),T.needsSwap!==!1&&(b=R,R=R===a?c:a))}if(g!==y.outputColorSpace||x!==y.toneMapping){g=y.outputColorSpace,x=y.toneMapping,h.defines={},tt.getTransfer(g)===dt&&(h.defines.SRGB_TRANSFER="");let d=Om[x];d&&(h.defines[d]=""),h.needsUpdate=!0}h.uniforms.tDiffuse.value=b.texture,y.setRenderTarget(p),y.render(m,f),p=null,S=!1},this.isCompositing=function(){return S},this.dispose=function(){s.dispose(),a!==null&&a.dispose(),c!==null&&c.dispose(),l.dispose(),h.dispose()}}var md=new Ft,Al=new Hi(1,1),gd=new vr,_d=new Fs,xd=new Nr,cd=[],ud=[],fd=new Float32Array(16),hd=new Float32Array(9),dd=new Float32Array(4);function Kr(n,e,t){let i=n[0];if(i<=0||i>0)return n;let r=e*t,o=cd[r];if(o===void 0&&(o=new Float32Array(r),cd[r]=o),e!==0){i.toArray(o,0);for(let s=1,a=0;s!==e;++s)a+=t,n[s].toArray(o,a)}return o}function Xt(n,e){if(n.length!==e.length)return!1;for(let t=0,i=n.length;t<i;t++)if(n[t]!==e[t])return!1;return!0}function qt(n,e){for(let t=0,i=e.length;t<i;t++)n[t]=e[t]}function Aa(n,e){let t=ud[e];t===void 0&&(t=new Int32Array(e),ud[e]=t);for(let i=0;i!==e;++i)t[i]=n.allocateTextureUnit();return t}function Bm(n,e){let t=this.cache;t[0]!==e&&(n.uniform1f(this.addr,e),t[0]=e)}function Gm(n,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y)&&(n.uniform2f(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if(Xt(t,e))return;n.uniform2fv(this.addr,e),qt(t,e)}}function zm(n,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z)&&(n.uniform3f(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else if(e.r!==void 0)(t[0]!==e.r||t[1]!==e.g||t[2]!==e.b)&&(n.uniform3f(this.addr,e.r,e.g,e.b),t[0]=e.r,t[1]=e.g,t[2]=e.b);else{if(Xt(t,e))return;n.uniform3fv(this.addr,e),qt(t,e)}}function km(n,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z||t[3]!==e.w)&&(n.uniform4f(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if(Xt(t,e))return;n.uniform4fv(this.addr,e),qt(t,e)}}function Hm(n,e){let t=this.cache,i=e.elements;if(i===void 0){if(Xt(t,e))return;n.uniformMatrix2fv(this.addr,!1,e),qt(t,e)}else{if(Xt(t,i))return;dd.set(i),n.uniformMatrix2fv(this.addr,!1,dd),qt(t,i)}}function Vm(n,e){let t=this.cache,i=e.elements;if(i===void 0){if(Xt(t,e))return;n.uniformMatrix3fv(this.addr,!1,e),qt(t,e)}else{if(Xt(t,i))return;hd.set(i),n.uniformMatrix3fv(this.addr,!1,hd),qt(t,i)}}function Wm(n,e){let t=this.cache,i=e.elements;if(i===void 0){if(Xt(t,e))return;n.uniformMatrix4fv(this.addr,!1,e),qt(t,e)}else{if(Xt(t,i))return;fd.set(i),n.uniformMatrix4fv(this.addr,!1,fd),qt(t,i)}}function Xm(n,e){let t=this.cache;t[0]!==e&&(n.uniform1i(this.addr,e),t[0]=e)}function qm(n,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y)&&(n.uniform2i(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if(Xt(t,e))return;n.uniform2iv(this.addr,e),qt(t,e)}}function Ym(n,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z)&&(n.uniform3i(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else{if(Xt(t,e))return;n.uniform3iv(this.addr,e),qt(t,e)}}function Km(n,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z||t[3]!==e.w)&&(n.uniform4i(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if(Xt(t,e))return;n.uniform4iv(this.addr,e),qt(t,e)}}function Zm(n,e){let t=this.cache;t[0]!==e&&(n.uniform1ui(this.addr,e),t[0]=e)}function Jm(n,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y)&&(n.uniform2ui(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if(Xt(t,e))return;n.uniform2uiv(this.addr,e),qt(t,e)}}function $m(n,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z)&&(n.uniform3ui(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else{if(Xt(t,e))return;n.uniform3uiv(this.addr,e),qt(t,e)}}function Qm(n,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z||t[3]!==e.w)&&(n.uniform4ui(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if(Xt(t,e))return;n.uniform4uiv(this.addr,e),qt(t,e)}}function jm(n,e,t){let i=this.cache,r=t.allocateTextureUnit();i[0]!==r&&(n.uniform1i(this.addr,r),i[0]=r);let o;this.type===n.SAMPLER_2D_SHADOW?(Al.compareFunction=t.isReversedDepthBuffer()?gr:mr,o=Al):o=md,t.setTexture2D(e||o,r)}function eg(n,e,t){let i=this.cache,r=t.allocateTextureUnit();i[0]!==r&&(n.uniform1i(this.addr,r),i[0]=r),t.setTexture3D(e||_d,r)}function tg(n,e,t){let i=this.cache,r=t.allocateTextureUnit();i[0]!==r&&(n.uniform1i(this.addr,r),i[0]=r),t.setTextureCube(e||xd,r)}function ig(n,e,t){let i=this.cache,r=t.allocateTextureUnit();i[0]!==r&&(n.uniform1i(this.addr,r),i[0]=r),t.setTexture2DArray(e||gd,r)}function ng(n){switch(n){case 5126:return Bm;case 35664:return Gm;case 35665:return zm;case 35666:return km;case 35674:return Hm;case 35675:return Vm;case 35676:return Wm;case 5124:case 35670:return Xm;case 35667:case 35671:return qm;case 35668:case 35672:return Ym;case 35669:case 35673:return Km;case 5125:return Zm;case 36294:return Jm;case 36295:return $m;case 36296:return Qm;case 35678:case 36198:case 36298:case 36306:case 35682:return jm;case 35679:case 36299:case 36307:return eg;case 35680:case 36300:case 36308:case 36293:return tg;case 36289:case 36303:case 36311:case 36292:return ig}}function rg(n,e){n.uniform1fv(this.addr,e)}function og(n,e){let t=Kr(e,this.size,2);n.uniform2fv(this.addr,t)}function sg(n,e){let t=Kr(e,this.size,3);n.uniform3fv(this.addr,t)}function ag(n,e){let t=Kr(e,this.size,4);n.uniform4fv(this.addr,t)}function lg(n,e){let t=Kr(e,this.size,4);n.uniformMatrix2fv(this.addr,!1,t)}function cg(n,e){let t=Kr(e,this.size,9);n.uniformMatrix3fv(this.addr,!1,t)}function ug(n,e){let t=Kr(e,this.size,16);n.uniformMatrix4fv(this.addr,!1,t)}function fg(n,e){n.uniform1iv(this.addr,e)}function hg(n,e){n.uniform2iv(this.addr,e)}function dg(n,e){n.uniform3iv(this.addr,e)}function pg(n,e){n.uniform4iv(this.addr,e)}function mg(n,e){n.uniform1uiv(this.addr,e)}function gg(n,e){n.uniform2uiv(this.addr,e)}function _g(n,e){n.uniform3uiv(this.addr,e)}function xg(n,e){n.uniform4uiv(this.addr,e)}function Mg(n,e,t){let i=this.cache,r=e.length,o=Aa(t,r);Xt(i,o)||(n.uniform1iv(this.addr,o),qt(i,o));let s;this.type===n.SAMPLER_2D_SHADOW?s=Al:s=md;for(let a=0;a!==r;++a)t.setTexture2D(e[a]||s,o[a])}function Sg(n,e,t){let i=this.cache,r=e.length,o=Aa(t,r);Xt(i,o)||(n.uniform1iv(this.addr,o),qt(i,o));for(let s=0;s!==r;++s)t.setTexture3D(e[s]||_d,o[s])}function vg(n,e,t){let i=this.cache,r=e.length,o=Aa(t,r);Xt(i,o)||(n.uniform1iv(this.addr,o),qt(i,o));for(let s=0;s!==r;++s)t.setTextureCube(e[s]||xd,o[s])}function yg(n,e,t){let i=this.cache,r=e.length,o=Aa(t,r);Xt(i,o)||(n.uniform1iv(this.addr,o),qt(i,o));for(let s=0;s!==r;++s)t.setTexture2DArray(e[s]||gd,o[s])}function bg(n){switch(n){case 5126:return rg;case 35664:return og;case 35665:return sg;case 35666:return ag;case 35674:return lg;case 35675:return cg;case 35676:return ug;case 5124:case 35670:return fg;case 35667:case 35671:return hg;case 35668:case 35672:return dg;case 35669:case 35673:return pg;case 5125:return mg;case 36294:return gg;case 36295:return _g;case 36296:return xg;case 35678:case 36198:case 36298:case 36306:case 35682:return Mg;case 35679:case 36299:case 36307:return Sg;case 35680:case 36300:case 36308:case 36293:return vg;case 36289:case 36303:case 36311:case 36292:return yg}}var wl=class{constructor(e,t,i){this.id=e,this.addr=i,this.cache=[],this.type=t.type,this.setValue=ng(t.type)}},Rl=class{constructor(e,t,i){this.id=e,this.addr=i,this.cache=[],this.type=t.type,this.size=t.size,this.setValue=bg(t.type)}},Cl=class{constructor(e){this.id=e,this.seq=[],this.map={}}setValue(e,t,i){let r=this.seq;for(let o=0,s=r.length;o!==s;++o){let a=r[o];a.setValue(e,t[a.id],i)}}},Tl=/(\w+)(\])?(\[|\.)?/g;function pd(n,e){n.seq.push(e),n.map[e.id]=e}function Eg(n,e,t){let i=n.name,r=i.length;for(Tl.lastIndex=0;;){let o=Tl.exec(i),s=Tl.lastIndex,a=o[1],c=o[2]==="]",l=o[3];if(c&&(a=a|0),l===void 0||l==="["&&s+2===r){pd(t,l===void 0?new wl(a,n,e):new Rl(a,n,e));break}else{let m=t.map[a];m===void 0&&(m=new Cl(a),pd(t,m)),t=m}}}var Ln=class{constructor(e,t){this.seq=[],this.map={};let i=e.getProgramParameter(t,e.ACTIVE_UNIFORMS);for(let s=0;s<i;++s){let a=e.getActiveUniform(t,s),c=e.getUniformLocation(t,a.name);Eg(a,c,this)}let r=[],o=[];for(let s of this.seq)s.type===e.SAMPLER_2D_SHADOW||s.type===e.SAMPLER_CUBE_SHADOW||s.type===e.SAMPLER_2D_ARRAY_SHADOW?r.push(s):o.push(s);r.length>0&&(this.seq=r.concat(o))}setValue(e,t,i,r){let o=this.map[t];o!==void 0&&o.setValue(e,i,r)}setOptional(e,t,i){let r=t[i];r!==void 0&&this.setValue(e,i,r)}static upload(e,t,i,r){for(let o=0,s=t.length;o!==s;++o){let a=t[o],c=i[a.id];c.needsUpdate!==!1&&a.setValue(e,c.value,r)}}static seqWithValue(e,t){let i=[];for(let r=0,o=e.length;r!==o;++r){let s=e[r];s.id in t&&i.push(s)}return i}};function Pl(n,e,t){let i=n.createShader(e);return n.shaderSource(i,t),n.compileShader(i),i}var Tg=37297,Ag=0;function wg(n,e){let t=n.split(`
`),i=[],r=Math.max(e-6,0),o=Math.min(e+6,t.length);for(let s=r;s<o;s++){let a=s+1;i.push(`${a===e?">":" "} ${a}: ${t[s]}`)}return i.join(`
`)}var Md=new qe;function Rg(n){tt._getMatrix(Md,tt.workingColorSpace,n);let e=`mat3( ${Md.elements.map(t=>t.toFixed(4))} )`;switch(tt.getTransfer(n)){case Vn:return[e,"LinearTransferOETF"];case dt:return[e,"sRGBTransferOETF"];default:return Ue("WebGLProgram: Unsupported color space: ",n),[e,"LinearTransferOETF"]}}function Sd(n,e,t){let i=n.getShaderParameter(e,n.COMPILE_STATUS),o=(n.getShaderInfoLog(e)||"").trim();if(i&&o==="")return"";let s=/ERROR: 0:(\d+)/.exec(o);if(s){let a=parseInt(s[1]);return t.toUpperCase()+`

`+o+`

`+wg(n.getShaderSource(e),a)}else return o}function Cg(n,e){let t=Rg(e);return[`vec4 ${n}( vec4 value ) {`,`	return ${t[1]}( vec4( value.rgb * ${t[0]}, value.a ) );`,"}"].join(`
`)}var Pg={[gs]:"Linear",[_s]:"Reinhard",[xs]:"Cineon",[rr]:"ACESFilmic",[Ss]:"AgX",[vs]:"Neutral",[Ms]:"Custom"};function Lg(n,e){let t=Pg[e];return t===void 0?(Ue("WebGLProgram: Unsupported toneMapping:",e),"vec3 "+n+"( vec3 color ) { return LinearToneMapping( color ); }"):"vec3 "+n+"( vec3 color ) { return "+t+"ToneMapping( color ); }"}var wa=new D;function Dg(){tt.getLuminanceCoefficients(wa);let n=wa.x.toFixed(4),e=wa.y.toFixed(4),t=wa.z.toFixed(4);return["float luminance( const in vec3 rgb ) {",`	const vec3 weights = vec3( ${n}, ${e}, ${t} );`,"	return dot( weights, rgb );","}"].join(`
`)}function Ig(n){return[n.extensionClipCullDistance?"#extension GL_ANGLE_clip_cull_distance : require":"",n.extensionMultiDraw?"#extension GL_ANGLE_multi_draw : require":""].filter(as).join(`
`)}function Ng(n){let e=[];for(let t in n){let i=n[t];i!==!1&&e.push("#define "+t+" "+i)}return e.join(`
`)}function Ug(n,e){let t={},i=n.getProgramParameter(e,n.ACTIVE_ATTRIBUTES);for(let r=0;r<i;r++){let o=n.getActiveAttrib(e,r),s=o.name,a=1;o.type===n.FLOAT_MAT2&&(a=2),o.type===n.FLOAT_MAT3&&(a=3),o.type===n.FLOAT_MAT4&&(a=4),t[s]={type:o.type,location:n.getAttribLocation(e,s),locationSize:a}}return t}function as(n){return n!==""}function vd(n,e){let t=e.numSpotLightShadows+e.numSpotLightMaps-e.numSpotLightShadowsWithMaps;return n.replace(/NUM_SUN_LIGHTS/g,e.numSunLights).replace(/NUM_DIR_LIGHTS/g,e.numDirLights).replace(/NUM_SPOT_LIGHTS/g,e.numSpotLights).replace(/NUM_SPOT_LIGHT_MAPS/g,e.numSpotLightMaps).replace(/NUM_SPOT_LIGHT_COORDS/g,t).replace(/NUM_RECT_AREA_LIGHTS/g,e.numRectAreaLights).replace(/NUM_POINT_LIGHTS/g,e.numPointLights).replace(/NUM_HEMI_LIGHTS/g,e.numHemiLights).replace(/NUM_SUN_LIGHT_SHADOWS/g,e.numSunLightShadows).replace(/NUM_DIR_LIGHT_SHADOWS/g,e.numDirLightShadows).replace(/NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS/g,e.numSpotLightShadowsWithMaps).replace(/NUM_SPOT_LIGHT_SHADOWS/g,e.numSpotLightShadows).replace(/NUM_POINT_LIGHT_SHADOWS/g,e.numPointLightShadows)}function yd(n,e){return n.replace(/NUM_CLIPPING_PLANES/g,e.numClippingPlanes).replace(/UNION_CLIPPING_PLANES/g,e.numClippingPlanes-e.numClipIntersection)}var Fg=/^[ \t]*#include +<([\w\d./]+)>/gm;function Ll(n){return n.replace(Fg,Bg)}var Og=new Map;function Bg(n,e){let t=rt[e];if(t===void 0){let i=Og.get(e);if(i!==void 0)t=rt[i],Ue('WebGLRenderer: Shader chunk "%s" has been deprecated. Use "%s" instead.',e,i);else throw new Error("THREE.WebGLProgram: Can not resolve #include <"+e+">")}return Ll(t)}var Gg=/#pragma unroll_loop_start\s+for\s*\(\s*int\s+i\s*=\s*(\d+)\s*;\s*i\s*<\s*(\d+)\s*;\s*i\s*\+\+\s*\)\s*{([\s\S]+?)}\s+#pragma unroll_loop_end/g;function bd(n){return n.replace(Gg,zg)}function zg(n,e,t,i){let r="";for(let o=parseInt(e);o<parseInt(t);o++)r+=i.replace(/\[\s*i\s*\]/g,"[ "+o+" ]").replace(/UNROLLED_LOOP_INDEX/g,o);return r}function Ed(n){let e=`precision ${n.precision} float;
	precision ${n.precision} int;
	precision ${n.precision} sampler2D;
	precision ${n.precision} samplerCube;
	precision ${n.precision} sampler3D;
	precision ${n.precision} sampler2DArray;
	precision ${n.precision} sampler2DShadow;
	precision ${n.precision} samplerCubeShadow;
	precision ${n.precision} sampler2DArrayShadow;
	precision ${n.precision} isampler2D;
	precision ${n.precision} isampler3D;
	precision ${n.precision} isamplerCube;
	precision ${n.precision} isampler2DArray;
	precision ${n.precision} usampler2D;
	precision ${n.precision} usampler3D;
	precision ${n.precision} usamplerCube;
	precision ${n.precision} usampler2DArray;
	`;return n.precision==="highp"?e+=`
#define HIGH_PRECISION`:n.precision==="mediump"?e+=`
#define MEDIUM_PRECISION`:n.precision==="lowp"&&(e+=`
#define LOW_PRECISION`),e}var kg={[dn]:"SHADOWMAP_TYPE_PCF",[Gn]:"SHADOWMAP_TYPE_VSM"};function Hg(n){return kg[n.shadowMapType]||"SHADOWMAP_TYPE_BASIC"}var Vg={[wi]:"ENVMAP_TYPE_CUBE",[$i]:"ENVMAP_TYPE_CUBE",[_n]:"ENVMAP_TYPE_CUBE_UV"};function Wg(n){return n.envMap===!1?"ENVMAP_TYPE_CUBE":Vg[n.envMapMode]||"ENVMAP_TYPE_CUBE"}var Xg={[$i]:"ENVMAP_MODE_REFRACTION"};function qg(n){return n.envMap===!1?"ENVMAP_MODE_REFLECTION":Xg[n.envMapMode]||"ENVMAP_MODE_REFLECTION"}var Yg={[ms]:"ENVMAP_BLENDING_MULTIPLY",[fc]:"ENVMAP_BLENDING_MIX",[hc]:"ENVMAP_BLENDING_ADD"};function Kg(n){return n.envMap===!1?"ENVMAP_BLENDING_NONE":Yg[n.combine]||"ENVMAP_BLENDING_NONE"}function Zg(n){let e=n.envMapCubeUVHeight;if(e===null)return null;let t=Math.log2(e)-2,i=1/e;return{texelWidth:1/(3*Math.max(Math.pow(2,t),112)),texelHeight:i,maxMip:t}}function Td(n,e,t,i){let r=n.getContext(),o=t.defines,s=t.vertexShader,a=t.fragmentShader,c=Hg(t),l=Wg(t),h=qg(t),m=Kg(t),f=Zg(t),g=Ig(t),x=Ng(o),S=r.createProgram(),_,p,A=t.glslVersion?"#version "+t.glslVersion+`
`:"";t.isRawShaderMaterial?(_=["#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,x].filter(as).join(`
`),_.length>0&&(_+=`
`),p=["#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,x].filter(as).join(`
`),p.length>0&&(p+=`
`)):(_=[Ed(t),"#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,x,t.extensionClipCullDistance?"#define USE_CLIP_DISTANCE":"",t.batching?"#define USE_BATCHING":"",t.batchingColor?"#define USE_BATCHING_COLOR":"",t.instancing?"#define USE_INSTANCING":"",t.instancingColor?"#define USE_INSTANCING_COLOR":"",t.instancingMorph?"#define USE_INSTANCING_MORPH":"",t.useFog&&t.fog?"#define USE_FOG":"",t.useFog&&t.fogExp2?"#define FOG_EXP2":"",t.map?"#define USE_MAP":"",t.envMap?"#define USE_ENVMAP":"",t.envMap?"#define "+h:"",t.lightMap?"#define USE_LIGHTMAP":"",t.aoMap?"#define USE_AOMAP":"",t.bumpMap?"#define USE_BUMPMAP":"",t.normalMap?"#define USE_NORMALMAP":"",t.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",t.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",t.displacementMap?"#define USE_DISPLACEMENTMAP":"",t.emissiveMap?"#define USE_EMISSIVEMAP":"",t.anisotropy?"#define USE_ANISOTROPY":"",t.anisotropyMap?"#define USE_ANISOTROPYMAP":"",t.clearcoatMap?"#define USE_CLEARCOATMAP":"",t.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",t.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",t.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",t.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",t.specularMap?"#define USE_SPECULARMAP":"",t.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",t.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",t.roughnessMap?"#define USE_ROUGHNESSMAP":"",t.metalnessMap?"#define USE_METALNESSMAP":"",t.alphaMap?"#define USE_ALPHAMAP":"",t.alphaHash?"#define USE_ALPHAHASH":"",t.transmission?"#define USE_TRANSMISSION":"",t.transmissionMap?"#define USE_TRANSMISSIONMAP":"",t.thicknessMap?"#define USE_THICKNESSMAP":"",t.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",t.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",t.mapUv?"#define MAP_UV "+t.mapUv:"",t.alphaMapUv?"#define ALPHAMAP_UV "+t.alphaMapUv:"",t.lightMapUv?"#define LIGHTMAP_UV "+t.lightMapUv:"",t.aoMapUv?"#define AOMAP_UV "+t.aoMapUv:"",t.emissiveMapUv?"#define EMISSIVEMAP_UV "+t.emissiveMapUv:"",t.bumpMapUv?"#define BUMPMAP_UV "+t.bumpMapUv:"",t.normalMapUv?"#define NORMALMAP_UV "+t.normalMapUv:"",t.displacementMapUv?"#define DISPLACEMENTMAP_UV "+t.displacementMapUv:"",t.metalnessMapUv?"#define METALNESSMAP_UV "+t.metalnessMapUv:"",t.roughnessMapUv?"#define ROUGHNESSMAP_UV "+t.roughnessMapUv:"",t.anisotropyMapUv?"#define ANISOTROPYMAP_UV "+t.anisotropyMapUv:"",t.clearcoatMapUv?"#define CLEARCOATMAP_UV "+t.clearcoatMapUv:"",t.clearcoatNormalMapUv?"#define CLEARCOAT_NORMALMAP_UV "+t.clearcoatNormalMapUv:"",t.clearcoatRoughnessMapUv?"#define CLEARCOAT_ROUGHNESSMAP_UV "+t.clearcoatRoughnessMapUv:"",t.iridescenceMapUv?"#define IRIDESCENCEMAP_UV "+t.iridescenceMapUv:"",t.iridescenceThicknessMapUv?"#define IRIDESCENCE_THICKNESSMAP_UV "+t.iridescenceThicknessMapUv:"",t.sheenColorMapUv?"#define SHEEN_COLORMAP_UV "+t.sheenColorMapUv:"",t.sheenRoughnessMapUv?"#define SHEEN_ROUGHNESSMAP_UV "+t.sheenRoughnessMapUv:"",t.specularMapUv?"#define SPECULARMAP_UV "+t.specularMapUv:"",t.specularColorMapUv?"#define SPECULAR_COLORMAP_UV "+t.specularColorMapUv:"",t.specularIntensityMapUv?"#define SPECULAR_INTENSITYMAP_UV "+t.specularIntensityMapUv:"",t.transmissionMapUv?"#define TRANSMISSIONMAP_UV "+t.transmissionMapUv:"",t.thicknessMapUv?"#define THICKNESSMAP_UV "+t.thicknessMapUv:"",t.vertexTangents&&t.flatShading===!1?"#define USE_TANGENT":"",t.vertexNormals?"#define HAS_NORMAL":"",t.vertexColors?"#define USE_COLOR":"",t.vertexAlphas?"#define USE_COLOR_ALPHA":"",t.vertexUv1s?"#define USE_UV1":"",t.vertexUv2s?"#define USE_UV2":"",t.vertexUv3s?"#define USE_UV3":"",t.pointsUvs?"#define USE_POINTS_UV":"",t.flatShading?"#define FLAT_SHADED":"",t.skinning?"#define USE_SKINNING":"",t.morphTargets?"#define USE_MORPHTARGETS":"",t.morphNormals&&t.flatShading===!1?"#define USE_MORPHNORMALS":"",t.morphColors?"#define USE_MORPHCOLORS":"",t.morphTargetsCount>0?"#define MORPHTARGETS_TEXTURE_STRIDE "+t.morphTextureStride:"",t.morphTargetsCount>0?"#define MORPHTARGETS_COUNT "+t.morphTargetsCount:"",t.doubleSided?"#define DOUBLE_SIDED":"",t.flipSided?"#define FLIP_SIDED":"",t.shadowMapEnabled?"#define USE_SHADOWMAP":"",t.shadowMapEnabled?"#define "+c:"",t.sizeAttenuation?"#define USE_SIZEATTENUATION":"",t.numLightProbes>0?"#define USE_LIGHT_PROBES":"",t.logarithmicDepthBuffer?"#define USE_LOGARITHMIC_DEPTH_BUFFER":"",t.reversedDepthBuffer?"#define USE_REVERSED_DEPTH_BUFFER":"","uniform mat4 modelMatrix;","uniform mat4 modelViewMatrix;","uniform mat4 projectionMatrix;","uniform mat4 viewMatrix;","uniform mat3 normalMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;","#ifdef USE_INSTANCING","	attribute mat4 instanceMatrix;","#endif","#ifdef USE_INSTANCING_COLOR","	attribute vec3 instanceColor;","#endif","#ifdef USE_INSTANCING_MORPH","	uniform sampler2D morphTexture;","#endif","attribute vec3 position;","attribute vec3 normal;","attribute vec2 uv;","#ifdef USE_UV1","	attribute vec2 uv1;","#endif","#ifdef USE_UV2","	attribute vec2 uv2;","#endif","#ifdef USE_UV3","	attribute vec2 uv3;","#endif","#ifdef USE_TANGENT","	attribute vec4 tangent;","#endif","#if defined( USE_COLOR_ALPHA )","	attribute vec4 color;","#elif defined( USE_COLOR )","	attribute vec3 color;","#endif","#ifdef USE_SKINNING","	attribute vec4 skinIndex;","	attribute vec4 skinWeight;","#endif",`
`].filter(as).join(`
`),p=[Ed(t),"#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,x,t.useFog&&t.fog?"#define USE_FOG":"",t.useFog&&t.fogExp2?"#define FOG_EXP2":"",t.alphaToCoverage?"#define ALPHA_TO_COVERAGE":"",t.map?"#define USE_MAP":"",t.matcap?"#define USE_MATCAP":"",t.envMap?"#define USE_ENVMAP":"",t.envMap?"#define "+l:"",t.envMap?"#define "+h:"",t.envMap?"#define "+m:"",f?"#define CUBEUV_TEXEL_WIDTH "+f.texelWidth:"",f?"#define CUBEUV_TEXEL_HEIGHT "+f.texelHeight:"",f?"#define CUBEUV_MAX_MIP "+f.maxMip+".0":"",t.lightMap?"#define USE_LIGHTMAP":"",t.aoMap?"#define USE_AOMAP":"",t.bumpMap?"#define USE_BUMPMAP":"",t.normalMap?"#define USE_NORMALMAP":"",t.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",t.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",t.packedNormalMap?"#define USE_PACKED_NORMALMAP":"",t.emissiveMap?"#define USE_EMISSIVEMAP":"",t.anisotropy?"#define USE_ANISOTROPY":"",t.anisotropyMap?"#define USE_ANISOTROPYMAP":"",t.clearcoat?"#define USE_CLEARCOAT":"",t.clearcoatMap?"#define USE_CLEARCOATMAP":"",t.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",t.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",t.dispersion?"#define USE_DISPERSION":"",t.retroreflection?"#define USE_RETROREFLECTION":"",t.iridescence?"#define USE_IRIDESCENCE":"",t.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",t.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",t.specularMap?"#define USE_SPECULARMAP":"",t.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",t.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",t.roughnessMap?"#define USE_ROUGHNESSMAP":"",t.metalnessMap?"#define USE_METALNESSMAP":"",t.alphaMap?"#define USE_ALPHAMAP":"",t.alphaTest?"#define USE_ALPHATEST":"",t.alphaHash?"#define USE_ALPHAHASH":"",t.sheen?"#define USE_SHEEN":"",t.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",t.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",t.transmission?"#define USE_TRANSMISSION":"",t.transmissionMap?"#define USE_TRANSMISSIONMAP":"",t.thicknessMap?"#define USE_THICKNESSMAP":"",t.vertexTangents&&t.flatShading===!1?"#define USE_TANGENT":"",t.vertexColors||t.instancingColor?"#define USE_COLOR":"",t.vertexAlphas||t.batchingColor?"#define USE_COLOR_ALPHA":"",t.vertexUv1s?"#define USE_UV1":"",t.vertexUv2s?"#define USE_UV2":"",t.vertexUv3s?"#define USE_UV3":"",t.pointsUvs?"#define USE_POINTS_UV":"",t.gradientMap?"#define USE_GRADIENTMAP":"",t.flatShading?"#define FLAT_SHADED":"",t.doubleSided?"#define DOUBLE_SIDED":"",t.flipSided?"#define FLIP_SIDED":"",t.shadowMapEnabled?"#define USE_SHADOWMAP":"",t.shadowMapEnabled?"#define "+c:"",t.premultipliedAlpha?"#define PREMULTIPLIED_ALPHA":"",t.numLightProbes>0?"#define USE_LIGHT_PROBES":"",t.numLightProbeGrids>0?"#define USE_LIGHT_PROBES_GRID":"",t.decodeVideoTexture?"#define DECODE_VIDEO_TEXTURE":"",t.decodeVideoTextureEmissive?"#define DECODE_VIDEO_TEXTURE_EMISSIVE":"",t.logarithmicDepthBuffer?"#define USE_LOGARITHMIC_DEPTH_BUFFER":"",t.reversedDepthBuffer?"#define USE_REVERSED_DEPTH_BUFFER":"","uniform mat4 viewMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;",t.toneMapping!==di?"#define TONE_MAPPING":"",t.toneMapping!==di?rt.tonemapping_pars_fragment:"",t.toneMapping!==di?Lg("toneMapping",t.toneMapping):"",t.dithering?"#define DITHERING":"",t.opaque?"#define OPAQUE":"",rt.colorspace_pars_fragment,Cg("linearToOutputTexel",t.outputColorSpace),Dg(),t.useDepthPacking?"#define DEPTH_PACKING "+t.depthPacking:"",`
`].filter(as).join(`
`)),s=Ll(s),s=vd(s,t),s=yd(s,t),a=Ll(a),a=vd(a,t),a=yd(a,t),s=bd(s),a=bd(a),t.isRawShaderMaterial!==!0&&(A=`#version 300 es
`,_=[g,"#define attribute in","#define varying out","#define texture2D texture"].join(`
`)+`
`+_,p=["#define varying in",t.glslVersion===qa?"":"layout(location = 0) out highp vec4 pc_fragColor;",t.glslVersion===qa?"":"#define gl_FragColor pc_fragColor","#define gl_FragDepthEXT gl_FragDepth","#define texture2D texture","#define textureCube texture","#define texture2DProj textureProj","#define texture2DLodEXT textureLod","#define texture2DProjLodEXT textureProjLod","#define textureCubeLodEXT textureLod","#define texture2DGradEXT textureGrad","#define texture2DProjGradEXT textureProjGrad","#define textureCubeGradEXT textureGrad"].join(`
`)+`
`+p);let P=A+_+s,y=A+p+a,E=Pl(r,r.VERTEX_SHADER,P),b=Pl(r,r.FRAGMENT_SHADER,y);r.attachShader(S,E),r.attachShader(S,b),t.index0AttributeName!==void 0?r.bindAttribLocation(S,0,t.index0AttributeName):t.hasPositionAttribute===!0&&r.bindAttribLocation(S,0,"position"),r.linkProgram(S);function R(F){if(n.debug.checkShaderErrors){let B=r.getProgramInfoLog(S)||"",X=r.getShaderInfoLog(E)||"",U=r.getShaderInfoLog(b)||"",K=B.trim(),ee=X.trim(),j=U.trim(),le=!0,te=!0;if(r.getProgramParameter(S,r.LINK_STATUS)===!1)if(le=!1,typeof n.debug.onShaderError=="function")n.debug.onShaderError(r,S,E,b);else{let he=Sd(r,E,"vertex"),pe=Sd(r,b,"fragment");nt("WebGLProgram: Shader Error "+r.getError()+" - VALIDATE_STATUS "+r.getProgramParameter(S,r.VALIDATE_STATUS)+`

Material Name: `+F.name+`
Material Type: `+F.type+`

Program Info Log: `+K+`
`+he+`
`+pe)}else K!==""?Ue("WebGLProgram: Program Info Log:",K):(ee===""||j==="")&&(te=!1);te&&(F.diagnostics={runnable:le,programLog:K,vertexShader:{log:ee,prefix:_},fragmentShader:{log:j,prefix:p}})}r.deleteShader(E),r.deleteShader(b),d=new Ln(r,S),T=Ug(r,S)}let d;this.getUniforms=function(){return d===void 0&&R(this),d};let T;this.getAttributes=function(){return T===void 0&&R(this),T};let L=t.rendererExtensionParallelShaderCompile===!1;return this.isReady=function(){return L===!1&&(L=r.getProgramParameter(S,Tg)),L},this.destroy=function(){i.releaseStatesOfProgram(this),r.deleteProgram(S),this.program=void 0},this.type=t.shaderType,this.name=t.shaderName,this.id=Ag++,this.cacheKey=e,this.usedTimes=1,this.program=S,this.vertexShader=E,this.fragmentShader=b,this}var Jg=0,Ra=class{constructor(){this.shaderCache=new Map,this.materialCache=new Map}update(e,t,i){let r=this._getShaderCacheForMaterial(e);return r.has(t)===!1&&(r.add(t),t.usedTimes++),r.has(i)===!1&&(r.add(i),i.usedTimes++),this}remove(e){let t=this.materialCache.get(e);for(let i of t)i.usedTimes--,i.usedTimes===0&&this.shaderCache.delete(i.code);return this.materialCache.delete(e),this}getVertexShaderStage(e){return this._getShaderStage(e.vertexShader)}getFragmentShaderStage(e){return this._getShaderStage(e.fragmentShader)}dispose(){this.shaderCache.clear(),this.materialCache.clear()}_getShaderCacheForMaterial(e){let t=this.materialCache,i=t.get(e);return i===void 0&&(i=new Set,t.set(e,i)),i}_getShaderStage(e){let t=this.shaderCache,i=t.get(e);return i===void 0&&(i=new Dl(e),t.set(e,i)),i}},Dl=class{constructor(e){this.id=Jg++,this.code=e,this.usedTimes=0}};function $g(n){return n===vi||n===zn||n===kn}function Ad(n,e,t,i,r,o){let s=new yn,a=new Ra,c=new Set,l=[],h=new Map,m=i.logarithmicDepthBuffer,f=i.precision,g={MeshDepthMaterial:"depth",MeshDistanceMaterial:"distance",MeshNormalMaterial:"normal",MeshBasicMaterial:"basic",MeshLambertMaterial:"lambert",MeshPhongMaterial:"phong",MeshToonMaterial:"toon",MeshStandardMaterial:"physical",MeshPhysicalMaterial:"physical",MeshMatcapMaterial:"matcap",LineBasicMaterial:"basic",LineDashedMaterial:"dashed",PointsMaterial:"points",ShadowMaterial:"shadow",SpriteMaterial:"sprite"};function x(d){return c.add(d),d===0?"uv":`uv${d}`}function S(d,T,L,F,B,X){let U=F.fog,K=B.geometry,ee=d.isMeshStandardMaterial||d.isMeshLambertMaterial||d.isMeshPhongMaterial?F.environment:null,j=d.isMeshStandardMaterial||d.isMeshLambertMaterial&&!d.envMap||d.isMeshPhongMaterial&&!d.envMap,le=e.get(d.envMap||ee,j),te=le&&le.mapping===_n?le.image.height:null,he=g[d.type];d.precision!==null&&(f=i.getMaxPrecision(d.precision),f!==d.precision&&Ue("WebGLProgram.getParameters:",d.precision,"not supported, using",f,"instead."));let pe=K.morphAttributes.position||K.morphAttributes.normal||K.morphAttributes.color,We=pe!==void 0?pe.length:0,ze=0;K.morphAttributes.position!==void 0&&(ze=1),K.morphAttributes.normal!==void 0&&(ze=2),K.morphAttributes.color!==void 0&&(ze=3);let pt,at,ht,$;if(he){let yt=Ii[he];pt=yt.vertexShader,at=yt.fragmentShader}else{pt=d.vertexShader,at=d.fragmentShader;let yt=a.getVertexShaderStage(d),_t=a.getFragmentShaderStage(d);a.update(d,yt,_t),ht=yt.id,$=_t.id}let de=n.getRenderTarget(),Ne=n.state.buffers.depth.getReversed(),Je=B.isInstancedMesh===!0,Fe=B.isBatchedMesh===!0,Ye=!!d.map,vt=!!d.matcap,ot=!!le,Oe=!!d.aoMap,At=!!d.lightMap,ct=!!d.bumpMap&&d.wireframe===!1,Rt=!!d.normalMap,Nt=!!d.displacementMap,Ht=!!d.emissiveMap,lt=!!d.metalnessMap,Pt=!!d.roughnessMap,V=d.anisotropy>0,Kt=d.clearcoat>0,Mt=d.dispersion>0,C=d.retroreflectivity>0,M=d.iridescence>0,Y=d.sheen>0,J=d.transmission>0,re=V&&!!d.anisotropyMap,xe=Kt&&!!d.clearcoatMap,ve=Kt&&!!d.clearcoatNormalMap,se=Kt&&!!d.clearcoatRoughnessMap,ue=M&&!!d.iridescenceMap,ye=M&&!!d.iridescenceThicknessMap,Ge=Y&&!!d.sheenColorMap,be=Y&&!!d.sheenRoughnessMap,Te=!!d.specularMap,ke=!!d.specularColorMap,Ke=!!d.specularIntensityMap,$e=J&&!!d.transmissionMap,H=J&&!!d.thicknessMap,Ee=!!d.gradientMap,ae=!!d.alphaMap,Ae=d.alphaTest>0,De=!!d.alphaHash,me=!!d.extensions,Xe=di;d.toneMapped&&(de===null||de.isXRRenderTarget===!0)&&(Xe=n.toneMapping);let Pe={shaderID:he,shaderType:d.type,shaderName:d.name,vertexShader:pt,fragmentShader:at,defines:d.defines,customVertexShaderID:ht,customFragmentShaderID:$,isRawShaderMaterial:d.isRawShaderMaterial===!0,glslVersion:d.glslVersion,precision:f,batching:Fe,batchingColor:Fe&&B._colorsTexture!==null,instancing:Je,instancingColor:Je&&B.instanceColor!==null,instancingMorph:Je&&B.morphTexture!==null,outputColorSpace:de===null?n.outputColorSpace:de.isXRRenderTarget===!0?de.texture.colorSpace:tt.workingColorSpace,alphaToCoverage:!!d.alphaToCoverage,map:Ye,matcap:vt,envMap:ot,envMapMode:ot&&le.mapping,envMapCubeUVHeight:te,aoMap:Oe,lightMap:At,bumpMap:ct,normalMap:Rt,displacementMap:Nt,emissiveMap:Ht,normalMapObjectSpace:Rt&&d.normalMapType===mc,normalMapTangentSpace:Rt&&d.normalMapType===Xo,packedNormalMap:Rt&&d.normalMapType===Xo&&$g(d.normalMap.format),metalnessMap:lt,roughnessMap:Pt,anisotropy:V,anisotropyMap:re,clearcoat:Kt,clearcoatMap:xe,clearcoatNormalMap:ve,clearcoatRoughnessMap:se,dispersion:Mt,retroreflection:C,iridescence:M,iridescenceMap:ue,iridescenceThicknessMap:ye,sheen:Y,sheenColorMap:Ge,sheenRoughnessMap:be,specularMap:Te,specularColorMap:ke,specularIntensityMap:Ke,transmission:J,transmissionMap:$e,thicknessMap:H,gradientMap:Ee,opaque:d.transparent===!1&&d.blending===pn&&d.alphaToCoverage===!1,alphaMap:ae,alphaTest:Ae,alphaHash:De,combine:d.combine,mapUv:Ye&&x(d.map.channel),aoMapUv:Oe&&x(d.aoMap.channel),lightMapUv:At&&x(d.lightMap.channel),bumpMapUv:ct&&x(d.bumpMap.channel),normalMapUv:Rt&&x(d.normalMap.channel),displacementMapUv:Nt&&x(d.displacementMap.channel),emissiveMapUv:Ht&&x(d.emissiveMap.channel),metalnessMapUv:lt&&x(d.metalnessMap.channel),roughnessMapUv:Pt&&x(d.roughnessMap.channel),anisotropyMapUv:re&&x(d.anisotropyMap.channel),clearcoatMapUv:xe&&x(d.clearcoatMap.channel),clearcoatNormalMapUv:ve&&x(d.clearcoatNormalMap.channel),clearcoatRoughnessMapUv:se&&x(d.clearcoatRoughnessMap.channel),iridescenceMapUv:ue&&x(d.iridescenceMap.channel),iridescenceThicknessMapUv:ye&&x(d.iridescenceThicknessMap.channel),sheenColorMapUv:Ge&&x(d.sheenColorMap.channel),sheenRoughnessMapUv:be&&x(d.sheenRoughnessMap.channel),specularMapUv:Te&&x(d.specularMap.channel),specularColorMapUv:ke&&x(d.specularColorMap.channel),specularIntensityMapUv:Ke&&x(d.specularIntensityMap.channel),transmissionMapUv:$e&&x(d.transmissionMap.channel),thicknessMapUv:H&&x(d.thicknessMap.channel),alphaMapUv:ae&&x(d.alphaMap.channel),vertexTangents:!!K.attributes.tangent&&(Rt||V),vertexNormals:!!K.attributes.normal,vertexColors:d.vertexColors,vertexAlphas:d.vertexColors===!0&&!!K.attributes.color&&K.attributes.color.itemSize===4,pointsUvs:B.isPoints===!0&&!!K.attributes.uv&&(Ye||ae),fog:!!U,useFog:d.fog===!0,fogExp2:!!U&&U.isFogExp2,flatShading:d.wireframe===!1&&(d.flatShading===!0||K.attributes.normal===void 0&&Rt===!1&&(d.isMeshLambertMaterial||d.isMeshPhongMaterial||d.isMeshStandardMaterial||d.isMeshPhysicalMaterial)),sizeAttenuation:d.sizeAttenuation===!0,logarithmicDepthBuffer:m,reversedDepthBuffer:Ne,skinning:B.isSkinnedMesh===!0,hasPositionAttribute:K.attributes.position!==void 0,morphTargets:K.morphAttributes.position!==void 0,morphNormals:K.morphAttributes.normal!==void 0,morphColors:K.morphAttributes.color!==void 0,morphTargetsCount:We,morphTextureStride:ze,numSunLights:T.sun.length,numDirLights:T.directional.length,numPointLights:T.point.length,numSpotLights:T.spot.length,numSpotLightMaps:T.spotLightMap.length,numRectAreaLights:T.rectArea.length,numHemiLights:T.hemi.length,numSunLightShadows:T.sunShadowMap.length,numDirLightShadows:T.directionalShadowMap.length,numPointLightShadows:T.pointShadowMap.length,numSpotLightShadows:T.spotShadowMap.length,numSpotLightShadowsWithMaps:T.numSpotLightShadowsWithMaps,numLightProbes:T.numLightProbes,numLightProbeGrids:X.length,numClippingPlanes:o.numPlanes,numClipIntersection:o.numIntersection,dithering:d.dithering,shadowMapEnabled:n.shadowMap.enabled&&L.length>0,shadowMapType:n.shadowMap.type,toneMapping:Xe,decodeVideoTexture:Ye&&d.map.isVideoTexture===!0&&tt.getTransfer(d.map.colorSpace)===dt,decodeVideoTextureEmissive:Ht&&d.emissiveMap.isVideoTexture===!0&&tt.getTransfer(d.emissiveMap.colorSpace)===dt,premultipliedAlpha:d.premultipliedAlpha,doubleSided:d.side===ii,flipSided:d.side===Ct,useDepthPacking:d.depthPacking>=0,depthPacking:d.depthPacking||0,index0AttributeName:d.index0AttributeName,extensionClipCullDistance:me&&d.extensions.clipCullDistance===!0&&t.has("WEBGL_clip_cull_distance"),extensionMultiDraw:(me&&d.extensions.multiDraw===!0||Fe)&&t.has("WEBGL_multi_draw"),rendererExtensionParallelShaderCompile:t.has("KHR_parallel_shader_compile"),customProgramCacheKey:d.customProgramCacheKey()};return Pe.vertexUv1s=c.has(1),Pe.vertexUv2s=c.has(2),Pe.vertexUv3s=c.has(3),c.clear(),Pe}function _(d){let T=[];if(d.shaderID?T.push(d.shaderID):(T.push(d.customVertexShaderID),T.push(d.customFragmentShaderID)),d.defines!==void 0)for(let L in d.defines)T.push(L),T.push(d.defines[L]);return d.isRawShaderMaterial===!1&&(p(T,d),A(T,d),T.push(n.outputColorSpace)),T.push(d.customProgramCacheKey),T.join()}function p(d,T){d.push(T.precision),d.push(T.outputColorSpace),d.push(T.envMapMode),d.push(T.envMapCubeUVHeight),d.push(T.mapUv),d.push(T.alphaMapUv),d.push(T.lightMapUv),d.push(T.aoMapUv),d.push(T.bumpMapUv),d.push(T.normalMapUv),d.push(T.displacementMapUv),d.push(T.emissiveMapUv),d.push(T.metalnessMapUv),d.push(T.roughnessMapUv),d.push(T.anisotropyMapUv),d.push(T.clearcoatMapUv),d.push(T.clearcoatNormalMapUv),d.push(T.clearcoatRoughnessMapUv),d.push(T.iridescenceMapUv),d.push(T.iridescenceThicknessMapUv),d.push(T.sheenColorMapUv),d.push(T.sheenRoughnessMapUv),d.push(T.specularMapUv),d.push(T.specularColorMapUv),d.push(T.specularIntensityMapUv),d.push(T.transmissionMapUv),d.push(T.thicknessMapUv),d.push(T.combine),d.push(T.fogExp2),d.push(T.sizeAttenuation),d.push(T.morphTargetsCount),d.push(T.morphAttributeCount),d.push(T.numSunLights),d.push(T.numDirLights),d.push(T.numPointLights),d.push(T.numSpotLights),d.push(T.numSpotLightMaps),d.push(T.numHemiLights),d.push(T.numRectAreaLights),d.push(T.numSunLightShadows),d.push(T.numDirLightShadows),d.push(T.numPointLightShadows),d.push(T.numSpotLightShadows),d.push(T.numSpotLightShadowsWithMaps),d.push(T.numLightProbes),d.push(T.shadowMapType),d.push(T.toneMapping),d.push(T.numClippingPlanes),d.push(T.numClipIntersection),d.push(T.depthPacking)}function A(d,T){s.disableAll(),T.instancing&&s.enable(0),T.instancingColor&&s.enable(1),T.instancingMorph&&s.enable(2),T.matcap&&s.enable(3),T.envMap&&s.enable(4),T.normalMapObjectSpace&&s.enable(5),T.normalMapTangentSpace&&s.enable(6),T.clearcoat&&s.enable(7),T.iridescence&&s.enable(8),T.alphaTest&&s.enable(9),T.vertexColors&&s.enable(10),T.vertexAlphas&&s.enable(11),T.vertexUv1s&&s.enable(12),T.vertexUv2s&&s.enable(13),T.vertexUv3s&&s.enable(14),T.vertexTangents&&s.enable(15),T.anisotropy&&s.enable(16),T.alphaHash&&s.enable(17),T.batching&&s.enable(18),T.dispersion&&s.enable(19),T.retroreflection&&s.enable(24),T.batchingColor&&s.enable(20),T.gradientMap&&s.enable(21),T.packedNormalMap&&s.enable(22),T.vertexNormals&&s.enable(23),d.push(s.mask),s.disableAll(),T.fog&&s.enable(0),T.useFog&&s.enable(1),T.flatShading&&s.enable(2),T.logarithmicDepthBuffer&&s.enable(3),T.reversedDepthBuffer&&s.enable(4),T.skinning&&s.enable(5),T.morphTargets&&s.enable(6),T.morphNormals&&s.enable(7),T.morphColors&&s.enable(8),T.premultipliedAlpha&&s.enable(9),T.shadowMapEnabled&&s.enable(10),T.doubleSided&&s.enable(11),T.flipSided&&s.enable(12),T.useDepthPacking&&s.enable(13),T.dithering&&s.enable(14),T.transmission&&s.enable(15),T.sheen&&s.enable(16),T.opaque&&s.enable(17),T.pointsUvs&&s.enable(18),T.decodeVideoTexture&&s.enable(19),T.decodeVideoTextureEmissive&&s.enable(20),T.alphaToCoverage&&s.enable(21),T.numLightProbeGrids>0&&s.enable(22),T.hasPositionAttribute&&s.enable(23),d.push(s.mask)}function P(d){let T=g[d.type],L;if(T){let F=Ii[T];L=eu.clone(F.uniforms)}else L=d.uniforms;return L}function y(d,T){let L=h.get(T);return L!==void 0?++L.usedTimes:(L=new Td(n,T,d,r),l.push(L),h.set(T,L)),L}function E(d){if(--d.usedTimes===0){let T=l.indexOf(d);l[T]=l[l.length-1],l.pop(),h.delete(d.cacheKey),d.destroy()}}function b(d){a.remove(d)}function R(){a.dispose()}return{getParameters:S,getProgramCacheKey:_,getUniforms:P,acquireProgram:y,releaseProgram:E,releaseShaderCache:b,programs:l,dispose:R}}function wd(){let n=new WeakMap;function e(s){return n.has(s)}function t(s){let a=n.get(s);return a===void 0&&(a={},n.set(s,a)),a}function i(s){n.delete(s)}function r(s,a,c){n.get(s)[a]=c}function o(){n=new WeakMap}return{has:e,get:t,remove:i,update:r,dispose:o}}function Qg(n,e){return n.groupOrder!==e.groupOrder?n.groupOrder-e.groupOrder:n.renderOrder!==e.renderOrder?n.renderOrder-e.renderOrder:n.material.id!==e.material.id?n.material.id-e.material.id:n.materialVariant!==e.materialVariant?n.materialVariant-e.materialVariant:n.z!==e.z?n.z-e.z:n.id-e.id}function Rd(n,e){return n.groupOrder!==e.groupOrder?n.groupOrder-e.groupOrder:n.renderOrder!==e.renderOrder?n.renderOrder-e.renderOrder:n.z!==e.z?e.z-n.z:n.id-e.id}function Cd(){let n=[],e=0,t=[],i=[],r=[];function o(){e=0,t.length=0,i.length=0,r.length=0}function s(f){let g=0;return f.isInstancedMesh&&(g+=2),f.isSkinnedMesh&&(g+=1),g}function a(f,g,x,S,_,p){let A=n[e];return A===void 0?(A={id:f.id,object:f,geometry:g,material:x,materialVariant:s(f),groupOrder:S,renderOrder:f.renderOrder,z:_,group:p},n[e]=A):(A.id=f.id,A.object=f,A.geometry=g,A.material=x,A.materialVariant=s(f),A.groupOrder=S,A.renderOrder=f.renderOrder,A.z=_,A.group=p),e++,A}function c(f,g,x,S,_,p,A){A.reversedDepth===!0&&(_=-_);let P=a(f,g,x,S,_,p);x.transmission>0?i.push(P):x.transparent===!0?r.push(P):t.push(P)}function l(f,g,x,S,_,p){let A=a(f,g,x,S,_,p);x.transmission>0?i.unshift(A):x.transparent===!0?r.unshift(A):t.unshift(A)}function h(f,g){t.length>1&&t.sort(f||Qg),i.length>1&&i.sort(g||Rd),r.length>1&&r.sort(g||Rd)}function m(){for(let f=e,g=n.length;f<g;f++){let x=n[f];if(x.id===null)break;x.id=null,x.object=null,x.geometry=null,x.material=null,x.group=null}}return{opaque:t,transmissive:i,transparent:r,init:o,push:c,unshift:l,finish:m,sort:h}}function Pd(){let n=new WeakMap;function e(i,r){let o=n.get(i),s;return o===void 0?(s=new Cd,n.set(i,[s])):r>=o.length?(s=new Cd,o.push(s)):s=o[r],s}function t(){n=new WeakMap}return{get:e,dispose:t}}function jg(){let n={};return{get:function(e){if(n[e.id]!==void 0)return n[e.id];let t;switch(e.type){case"SunLight":case"DirectionalLight":t={direction:new D,color:new Le};break;case"SpotLight":t={position:new D,direction:new D,color:new Le,distance:0,coneCos:0,penumbraCos:0,decay:0};break;case"PointLight":t={position:new D,color:new Le,distance:0,decay:0};break;case"HemisphereLight":t={direction:new D,skyColor:new Le,groundColor:new Le};break;case"RectAreaLight":t={color:new Le,position:new D,halfWidth:new D,halfHeight:new D};break}return n[e.id]=t,t}}}function e0(){let n={};return{get:function(e){if(n[e.id]!==void 0)return n[e.id];let t;switch(e.type){case"SunLight":case"DirectionalLight":t={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new Ce};break;case"SpotLight":t={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new Ce};break;case"PointLight":t={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new Ce,shadowCameraNear:1,shadowCameraFar:1e3};break}return n[e.id]=t,t}}}var t0=0;function i0(n,e){return(e.castShadow?2:0)-(n.castShadow?2:0)+(e.map?1:0)-(n.map?1:0)}function Ld(n){let e=new jg,t=e0(),i={version:0,hash:{sunLength:-1,directionalLength:-1,pointLength:-1,spotLength:-1,rectAreaLength:-1,hemiLength:-1,numSunShadows:-1,numDirectionalShadows:-1,numPointShadows:-1,numSpotShadows:-1,numSpotMaps:-1,numLightProbes:-1},ambient:[0,0,0],probe:[],sun:[],sunShadow:[],sunShadowMap:[],sunShadowMatrix:[],sunShadowCascade:[],directional:[],directionalShadow:[],directionalShadowMap:[],directionalShadowMatrix:[],spot:[],spotLightMap:[],spotShadow:[],spotShadowMap:[],spotLightMatrix:[],rectArea:[],rectAreaLTC1:null,rectAreaLTC2:null,point:[],pointShadow:[],pointShadowMap:[],pointShadowMatrix:[],hemi:[],numSpotLightShadowsWithMaps:0,numLightProbes:0};for(let l=0;l<9;l++)i.probe.push(new D);let r=new D,o=new it,s=new it;function a(l){let h=0,m=0,f=0;for(let B=0;B<9;B++)i.probe[B].set(0,0,0);let g=0,x=0,S=0,_=0,p=0,A=0,P=0,y=0,E=0,b=0,R=0,d=0,T=0,L=0;l.sort(i0);for(let B=0,X=l.length;B<X;B++){let U=l[B],K=U.color,ee=U.intensity,j=U.distance,le=null;if(U.shadow&&U.shadow.map&&(U.shadow.map.texture.format===vi?le=U.shadow.map.texture:le=U.shadow.map.depthTexture||U.shadow.map.texture),U.isAmbientLight)h+=K.r*ee,m+=K.g*ee,f+=K.b*ee;else if(U.isLightProbe){for(let te=0;te<9;te++)i.probe[te].addScaledVector(U.sh.coefficients[te],ee);L++}else if(U.isSunLight){let te=e.get(U);if(te.color.copy(U.color).multiplyScalar(U.intensity),U.castShadow){let he=U.shadow,pe=t.get(U);pe.shadowIntensity=he.intensity,pe.shadowBias=he.bias,pe.shadowNormalBias=he.normalBias,pe.shadowRadius=he.radius,pe.shadowMapSize.copy(he.mapSize).multiply(he.getFrameExtents()),i.sunShadow[x]=pe,i.sunShadowMap[x]=le;let We=he.getViewportCount();for(let ze=0;ze<We;ze++)i.sunShadowMatrix[S+ze]=he.getMatrix(ze),i.sunShadowCascade[S+ze]=he._cascadeData[ze];S+=We,x++}i.sun[g]=te,g++}else if(U.isDirectionalLight){let te=e.get(U);if(te.color.copy(U.color).multiplyScalar(U.intensity),U.castShadow){let he=U.shadow,pe=t.get(U);pe.shadowIntensity=he.intensity,pe.shadowBias=he.bias,pe.shadowNormalBias=he.normalBias,pe.shadowRadius=he.radius,pe.shadowMapSize=he.mapSize,i.directionalShadow[_]=pe,i.directionalShadowMap[_]=le,i.directionalShadowMatrix[_]=U.shadow.matrix,E++}i.directional[_]=te,_++}else if(U.isSpotLight){let te=e.get(U);te.position.setFromMatrixPosition(U.matrixWorld),te.color.copy(K).multiplyScalar(ee),te.distance=j,te.coneCos=Math.cos(U.angle),te.penumbraCos=Math.cos(U.angle*(1-U.penumbra)),te.decay=U.decay,i.spot[A]=te;let he=U.shadow;if(U.map&&(i.spotLightMap[d]=U.map,d++,he.updateMatrices(U),U.castShadow&&T++),i.spotLightMatrix[A]=he.matrix,U.castShadow){let pe=t.get(U);pe.shadowIntensity=he.intensity,pe.shadowBias=he.bias,pe.shadowNormalBias=he.normalBias,pe.shadowRadius=he.radius,pe.shadowMapSize=he.mapSize,i.spotShadow[A]=pe,i.spotShadowMap[A]=le,R++}A++}else if(U.isRectAreaLight){let te=e.get(U);te.color.copy(K).multiplyScalar(ee),te.halfWidth.set(U.width*.5,0,0),te.halfHeight.set(0,U.height*.5,0),i.rectArea[P]=te,P++}else if(U.isPointLight){let te=e.get(U);if(te.color.copy(U.color).multiplyScalar(U.intensity),te.distance=U.distance,te.decay=U.decay,U.castShadow){let he=U.shadow,pe=t.get(U);pe.shadowIntensity=he.intensity,pe.shadowBias=he.bias,pe.shadowNormalBias=he.normalBias,pe.shadowRadius=he.radius,pe.shadowMapSize=he.mapSize,pe.shadowCameraNear=he.camera.near,pe.shadowCameraFar=he.camera.far,i.pointShadow[p]=pe,i.pointShadowMap[p]=le,i.pointShadowMatrix[p]=U.shadow.matrix,b++}i.point[p]=te,p++}else if(U.isHemisphereLight){let te=e.get(U);te.skyColor.copy(U.color).multiplyScalar(ee),te.groundColor.copy(U.groundColor).multiplyScalar(ee),i.hemi[y]=te,y++}}P>0&&(n.has("OES_texture_float_linear")===!0?(i.rectAreaLTC1=Re.LTC_FLOAT_1,i.rectAreaLTC2=Re.LTC_FLOAT_2):(i.rectAreaLTC1=Re.LTC_HALF_1,i.rectAreaLTC2=Re.LTC_HALF_2)),i.ambient[0]=h,i.ambient[1]=m,i.ambient[2]=f;let F=i.hash;(F.sunLength!==g||F.directionalLength!==_||F.pointLength!==p||F.spotLength!==A||F.rectAreaLength!==P||F.hemiLength!==y||F.numSunShadows!==x||F.numDirectionalShadows!==E||F.numPointShadows!==b||F.numSpotShadows!==R||F.numSpotMaps!==d||F.numLightProbes!==L)&&(i.sun.length=g,i.directional.length=_,i.spot.length=A,i.rectArea.length=P,i.point.length=p,i.hemi.length=y,i.sunShadow.length=x,i.sunShadowMap.length=x,i.sunShadowMatrix.length=S,i.sunShadowCascade.length=S,i.directionalShadow.length=E,i.directionalShadowMap.length=E,i.directionalShadowMatrix.length=E,i.pointShadow.length=b,i.pointShadowMap.length=b,i.pointShadowMatrix.length=b,i.spotShadow.length=R,i.spotShadowMap.length=R,i.spotLightMatrix.length=R+d-T,i.spotLightMap.length=d,i.numSpotLightShadowsWithMaps=T,i.numLightProbes=L,F.sunLength=g,F.directionalLength=_,F.pointLength=p,F.spotLength=A,F.rectAreaLength=P,F.hemiLength=y,F.numSunShadows=x,F.numDirectionalShadows=E,F.numPointShadows=b,F.numSpotShadows=R,F.numSpotMaps=d,F.numLightProbes=L,i.version=t0++)}function c(l,h){let m=0,f=0,g=0,x=0,S=0,_=0,p=h.matrixWorldInverse;for(let A=0,P=l.length;A<P;A++){let y=l[A];if(y.isSunLight){let E=i.sun[m];E.direction.setFromMatrixPosition(y.matrixWorld),E.direction.transformDirection(p),m++}else if(y.isDirectionalLight){let E=i.directional[f];E.direction.setFromMatrixPosition(y.matrixWorld),r.setFromMatrixPosition(y.target.matrixWorld),E.direction.sub(r),E.direction.transformDirection(p),f++}else if(y.isSpotLight){let E=i.spot[x];E.position.setFromMatrixPosition(y.matrixWorld),E.position.applyMatrix4(p),E.direction.setFromMatrixPosition(y.matrixWorld),r.setFromMatrixPosition(y.target.matrixWorld),E.direction.sub(r),E.direction.transformDirection(p),x++}else if(y.isRectAreaLight){let E=i.rectArea[S];E.position.setFromMatrixPosition(y.matrixWorld),E.position.applyMatrix4(p),s.identity(),o.copy(y.matrixWorld),o.premultiply(p),s.extractRotation(o),E.halfWidth.set(y.width*.5,0,0),E.halfHeight.set(0,y.height*.5,0),E.halfWidth.applyMatrix4(s),E.halfHeight.applyMatrix4(s),S++}else if(y.isPointLight){let E=i.point[g];E.position.setFromMatrixPosition(y.matrixWorld),E.position.applyMatrix4(p),g++}else if(y.isHemisphereLight){let E=i.hemi[_];E.direction.setFromMatrixPosition(y.matrixWorld),E.direction.transformDirection(p),_++}}}return{setup:a,setupView:c,state:i}}function Dd(n){let e=new Ld(n),t=[],i=[],r=[];function o(f){m.camera=f,t.length=0,i.length=0,r.length=0}function s(f){t.push(f)}function a(f){i.push(f)}function c(f){r.push(f)}function l(){e.setup(t)}function h(f){e.setupView(t,f)}let m={lightsArray:t,shadowsArray:i,lightProbeGridArray:r,camera:null,lights:e,transmissionRenderTarget:{},textureUnits:0};return{init:o,state:m,setupLights:l,setupLightsView:h,pushLight:s,pushShadow:a,pushLightProbeGrid:c}}function Id(n){let e=new WeakMap;function t(r,o=0){let s=e.get(r),a;return s===void 0?(a=new Dd(n),e.set(r,[a])):o>=s.length?(a=new Dd(n),s.push(a)):a=s[o],a}function i(){e=new WeakMap}return{get:t,dispose:i}}var Nd=`
void main() {
gl_Position = vec4( position, 1.0 );
}
`,Ud=`
uniform sampler2D shadow_pass;
uniform vec2 resolution;
uniform float radius;
void main() {
const float samples = float( VSM_SAMPLES );
float mean = 0.0;
float squared_mean = 0.0;
float uvStride = samples <= 1.0 ? 0.0 : 2.0 / ( samples - 1.0 );
float uvStart = samples <= 1.0 ? 0.0 : - 1.0;
for ( float i = 0.0; i < samples; i ++ ) {
float uvOffset = uvStart + i * uvStride;
#ifdef HORIZONTAL_PASS
vec2 distribution = texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( uvOffset, 0.0 ) * radius ) / resolution ).rg;
mean += distribution.x;
squared_mean += distribution.y * distribution.y + distribution.x * distribution.x;
#else
float depth = texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( 0.0, uvOffset ) * radius ) / resolution ).r;
mean += depth;
squared_mean += depth * depth;
#endif
}
mean = mean / samples;
squared_mean = squared_mean / samples;
float std_dev = sqrt( max( 0.0, squared_mean - mean * mean ) );
gl_FragColor = vec4( mean, std_dev, 0.0, 1.0 );
}
`;var r0=[new D(1,0,0),new D(-1,0,0),new D(0,1,0),new D(0,-1,0),new D(0,0,1),new D(0,0,-1)],o0=[new D(0,-1,0),new D(0,-1,0),new D(0,0,1),new D(0,0,-1),new D(0,-1,0),new D(0,-1,0)],Fd=new it,ls=new D,Il=new D;function Od(n,e,t){let i=new An,r=new Ce,o=new Ce,s=new xt,a=new ma,c=new ga,l={},h=t.maxTextureSize,m={[Ti]:Ct,[Ct]:Ti,[ii]:ii},f=new ti({defines:{VSM_SAMPLES:8},uniforms:{shadow_pass:{value:null},resolution:{value:new Ce},radius:{value:4}},vertexShader:Nd,fragmentShader:Ud}),g=f.clone();g.defines.HORIZONTAL_PASS=1;let x=new gt;x.setAttribute("position",new ri(new Float32Array([-1,-1,.5,3,-1,.5,-1,3,.5]),3));let S=new Se(x,f),_=this;this.enabled=!1,this.autoUpdate=!0,this.needsUpdate=!1,this.type=dn;let p=this.type;this.render=function(b,R,d){if(_.enabled===!1||_.autoUpdate===!1&&_.needsUpdate===!1||b.length===0)return;this.type===ql&&(Ue("WebGLShadowMap: PCFSoftShadowMap has been removed. Using PCFShadowMap instead."),this.type=dn);let T=n.getRenderTarget(),L=n.getActiveCubeFace(),F=n.getActiveMipmapLevel(),B=n.state;B.setBlending(Si),B.buffers.depth.getReversed()===!0?B.buffers.color.setClear(0,0,0,0):B.buffers.color.setClear(1,1,1,1),B.buffers.depth.setTest(!0),B.setScissorTest(!1);let X=p!==this.type;X&&R.traverse(function(U){U.material&&(Array.isArray(U.material)?U.material.forEach(K=>K.needsUpdate=!0):U.material.needsUpdate=!0)});for(let U=0,K=b.length;U<K;U++){let ee=b[U],j=ee.shadow;if(j===void 0){Ue("WebGLShadowMap:",ee,"has no shadow.");continue}if(j.autoUpdate===!1&&j.needsUpdate===!1)continue;r.copy(j.mapSize);let le=j.getFrameExtents();r.multiply(le),o.copy(j.mapSize),(r.x>h||r.y>h)&&(r.x>h&&(o.x=Math.floor(h/le.x),r.x=o.x*le.x,j.mapSize.x=o.x),r.y>h&&(o.y=Math.floor(h/le.y),r.y=o.y*le.y,j.mapSize.y=o.y));let te=n.state.buffers.depth.getReversed();if(j.camera._reversedDepth=te,j.map===null||X===!0){if(j.map!==null&&(j.map.depthTexture!==null&&(j.map.depthTexture.dispose(),j.map.depthTexture=null),j.map.dispose()),this.type===Gn){if(ee.isPointLight){Ue("WebGLShadowMap: VSM shadow maps are not supported for PointLights. Use PCF or BasicShadowMap instead.");continue}j.map=new Wt(r.x,r.y,{format:vi,type:Jt,minFilter:Ut,magFilter:Ut,generateMipmaps:!1}),j.map.texture.name=ee.name+".shadowMap",j.map.depthTexture=new Hi(r.x,r.y,ni),j.map.depthTexture.name=ee.name+".shadowMapDepth",j.map.depthTexture.format=pi,j.map.depthTexture.compareFunction=null,j.map.depthTexture.minFilter=Dt,j.map.depthTexture.magFilter=Dt}else ee.isPointLight?(j.map=new Yr(r.x),j.map.depthTexture=new la(r.x,Zt)):(j.map=new Wt(r.x,r.y),j.map.depthTexture=new Hi(r.x,r.y,Zt)),j.map.depthTexture.name=ee.name+".shadowMap",j.map.depthTexture.format=pi,this.type===dn?(j.map.depthTexture.compareFunction=te?gr:mr,j.map.depthTexture.minFilter=Ut,j.map.depthTexture.magFilter=Ut):(j.map.depthTexture.compareFunction=null,j.map.depthTexture.minFilter=Dt,j.map.depthTexture.magFilter=Dt);j.camera.updateProjectionMatrix()}j.map.isWebGLCubeRenderTarget!==!0&&(j.map.width!==r.x||j.map.height!==r.y)&&j.map.setSize(r.x,r.y);let he=j.map.isWebGLCubeRenderTarget?6:j.getViewportCount();ee.isPointLight!==!0&&j.updateMatrices(ee,d);for(let pe=0;pe<he;pe++){let We=j.getCamera(pe);if(ee.isPointLight){let ze=j.camera,pt=j.matrix,at=ee.distance||ze.far;at!==ze.far&&(ze.far=at,ze.updateProjectionMatrix()),ls.setFromMatrixPosition(ee.matrixWorld),ze.position.copy(ls),Il.copy(ze.position),Il.add(r0[pe]),ze.up.copy(o0[pe]),ze.lookAt(Il),ze.updateMatrixWorld(),pt.makeTranslation(-ls.x,-ls.y,-ls.z),Fd.multiplyMatrices(ze.projectionMatrix,ze.matrixWorldInverse),j._frustum.setFromProjectionMatrix(Fd,ze.coordinateSystem,ze.reversedDepth)}if(j.map.isWebGLCubeRenderTarget)n.setRenderTarget(j.map,pe),n.clear();else{pe===0&&(n.setRenderTarget(j.map),n.clear());let ze=j.getViewport(pe);s.set(o.x*ze.x,o.y*ze.y,o.x*ze.z,o.y*ze.w),B.viewport(s)}i=j.getFrustum(pe),y(R,d,We,ee,this.type)}j.isPointLightShadow!==!0&&this.type===Gn&&A(j,d),j.needsUpdate=!1}p=this.type,_.needsUpdate=!1,n.setRenderTarget(T,L,F)};function A(b,R){let d=e.update(S);f.defines.VSM_SAMPLES!==b.blurSamples&&(f.defines.VSM_SAMPLES=b.blurSamples,g.defines.VSM_SAMPLES=b.blurSamples,f.needsUpdate=!0,g.needsUpdate=!0),b.mapPass===null?b.mapPass=new Wt(r.x,r.y,{format:vi,type:Jt}):(b.mapPass.width!==b.map.width||b.mapPass.height!==b.map.height)&&b.mapPass.setSize(b.map.width,b.map.height),f.uniforms.shadow_pass.value=b.map.depthTexture,f.uniforms.resolution.value.set(b.map.width,b.map.height),f.uniforms.radius.value=b.radius,n.setRenderTarget(b.mapPass),n.clear(),n.renderBufferDirect(R,null,d,f,S,null),g.uniforms.shadow_pass.value=b.mapPass.texture,g.uniforms.resolution.value.set(b.map.width,b.map.height),g.uniforms.radius.value=b.radius,n.setRenderTarget(b.map),n.clear(),n.renderBufferDirect(R,null,d,g,S,null)}function P(b,R,d,T){let L=null,F=d.isPointLight===!0?b.customDistanceMaterial:b.customDepthMaterial;if(F!==void 0)L=F;else if(L=d.isPointLight===!0?c:a,n.localClippingEnabled&&R.clipShadows===!0&&Array.isArray(R.clippingPlanes)&&R.clippingPlanes.length!==0||R.displacementMap&&R.displacementScale!==0||R.alphaMap&&R.alphaTest>0||R.map&&R.alphaTest>0||R.alphaToCoverage===!0){let B=L.uuid,X=R.uuid,U=l[B];U===void 0&&(U={},l[B]=U);let K=U[X];K===void 0&&(K=L.clone(),U[X]=K,R.addEventListener("dispose",E)),L=K}if(L.visible=R.visible,L.wireframe=R.wireframe,T===Gn?L.side=R.shadowSide!==null?R.shadowSide:R.side:L.side=R.shadowSide!==null?R.shadowSide:m[R.side],L.alphaMap=R.alphaMap,L.alphaTest=R.alphaToCoverage===!0?.5:R.alphaTest,L.map=R.map,L.clipShadows=R.clipShadows,L.clippingPlanes=R.clippingPlanes,L.clipIntersection=R.clipIntersection,L.displacementMap=R.displacementMap,L.displacementScale=R.displacementScale,L.displacementBias=R.displacementBias,L.wireframeLinewidth=R.wireframeLinewidth,L.linewidth=R.linewidth,d.isPointLight===!0&&L.isMeshDistanceMaterial===!0){let B=n.properties.get(L);B.light=d}return L}function y(b,R,d,T,L){if(b.visible===!1)return;if(b.layers.test(R.layers)&&(b.isMesh||b.isLine||b.isPoints)&&(b.castShadow||b.receiveShadow&&L===Gn)&&(!b.frustumCulled||b.intersectsFrustum(i))){b.modelViewMatrix.multiplyMatrices(d.matrixWorldInverse,b.matrixWorld);let X=e.update(b),U=b.material;if(Array.isArray(U)){let K=X.groups;for(let ee=0,j=K.length;ee<j;ee++){let le=K[ee],te=U[le.materialIndex];if(te&&te.visible){let he=P(b,te,T,L);b.onBeforeShadow(n,b,R,d,X,he,le),n.renderBufferDirect(d,null,X,he,b,le),b.onAfterShadow(n,b,R,d,X,he,le)}}}else if(U.visible){let K=P(b,U,T,L);b.onBeforeShadow(n,b,R,d,X,K,null),n.renderBufferDirect(d,null,X,K,b,null),b.onAfterShadow(n,b,R,d,X,K,null)}}let B=b.children;for(let X=0,U=B.length;X<U;X++)y(B[X],R,d,T,L)}function E(b){b.target.removeEventListener("dispose",E);for(let d in l){let T=l[d],L=b.target.uuid;L in T&&(T[L].dispose(),delete T[L])}}}function Bd(n,e){function t(){let H=!1,Ee=new xt,ae=null,Ae=new xt(0,0,0,0);return{setMask:function(De){ae!==De&&!H&&(n.colorMask(De,De,De,De),ae=De)},setLocked:function(De){H=De},setClear:function(De,me,Xe,Pe,yt){yt===!0&&(De*=Pe,me*=Pe,Xe*=Pe),Ee.set(De,me,Xe,Pe),Ae.equals(Ee)===!1&&(n.clearColor(De,me,Xe,Pe),Ae.copy(Ee))},reset:function(){H=!1,ae=null,Ae.set(-1,0,0,0)}}}function i(){let H=!1,Ee=!1,ae=null,Ae=null,De=null;return{setReversed:function(me){if(Ee!==me){let Xe=e.get("EXT_clip_control");me?Xe.clipControlEXT(Xe.LOWER_LEFT_EXT,Xe.ZERO_TO_ONE_EXT):Xe.clipControlEXT(Xe.LOWER_LEFT_EXT,Xe.NEGATIVE_ONE_TO_ONE_EXT),Ee=me;let Pe=De;De=null,this.setClear(Pe)}},getReversed:function(){return Ee},setTest:function(me){me?de(n.DEPTH_TEST):Ne(n.DEPTH_TEST)},setMask:function(me){ae!==me&&!H&&(n.depthMask(me),ae=me)},setFunc:function(me){if(Ee&&(me=Cc[me]),Ae!==me){switch(me){case oo:n.depthFunc(n.NEVER);break;case so:n.depthFunc(n.ALWAYS);break;case ao:n.depthFunc(n.LESS);break;case gn:n.depthFunc(n.LEQUAL);break;case lo:n.depthFunc(n.EQUAL);break;case co:n.depthFunc(n.GEQUAL);break;case uo:n.depthFunc(n.GREATER);break;case fo:n.depthFunc(n.NOTEQUAL);break;default:n.depthFunc(n.LEQUAL)}Ae=me}},setLocked:function(me){H=me},setClear:function(me){De!==me&&(De=me,Ee&&(me=1-me),n.clearDepth(me))},reset:function(){H=!1,ae=null,Ae=null,De=null,Ee=!1}}}function r(){let H=!1,Ee=null,ae=null,Ae=null,De=null,me=null,Xe=null,Pe=null,yt=null;return{setTest:function(_t){H||(_t?de(n.STENCIL_TEST):Ne(n.STENCIL_TEST))},setMask:function(_t){Ee!==_t&&!H&&(n.stencilMask(_t),Ee=_t)},setFunc:function(_t,oi,Mi){(ae!==_t||Ae!==oi||De!==Mi)&&(n.stencilFunc(_t,oi,Mi),ae=_t,Ae=oi,De=Mi)},setOp:function(_t,oi,Mi){(me!==_t||Xe!==oi||Pe!==Mi)&&(n.stencilOp(_t,oi,Mi),me=_t,Xe=oi,Pe=Mi)},setLocked:function(_t){H=_t},setClear:function(_t){yt!==_t&&(n.clearStencil(_t),yt=_t)},reset:function(){H=!1,Ee=null,ae=null,Ae=null,De=null,me=null,Xe=null,Pe=null,yt=null}}}let o=new t,s=new i,a=new r,c=new WeakMap,l=new WeakMap,h={},m={},f={},g=new WeakMap,x=[],S=null,_=!1,p=null,A=null,P=null,y=null,E=null,b=null,R=null,d=new Le(0,0,0),T=0,L=!1,F=null,B=null,X=null,U=null,K=null,ee=n.getParameter(n.MAX_COMBINED_TEXTURE_IMAGE_UNITS),j=!1,le=0,te=n.getParameter(n.VERSION);te.indexOf("WebGL")!==-1?(le=parseFloat(/^WebGL (\d)/.exec(te)[1]),j=le>=1):te.indexOf("OpenGL ES")!==-1&&(le=parseFloat(/^OpenGL ES (\d)/.exec(te)[1]),j=le>=2);let he=null,pe={},We=n.getParameter(n.SCISSOR_BOX),ze=n.getParameter(n.VIEWPORT),pt=new xt().fromArray(We),at=new xt().fromArray(ze);function ht(H,Ee,ae,Ae){let De=new Uint8Array(4),me=n.createTexture();n.bindTexture(H,me),n.texParameteri(H,n.TEXTURE_MIN_FILTER,n.NEAREST),n.texParameteri(H,n.TEXTURE_MAG_FILTER,n.NEAREST);for(let Xe=0;Xe<ae;Xe++)H===n.TEXTURE_3D||H===n.TEXTURE_2D_ARRAY?n.texImage3D(Ee,0,n.RGBA,1,1,Ae,0,n.RGBA,n.UNSIGNED_BYTE,De):n.texImage2D(Ee+Xe,0,n.RGBA,1,1,0,n.RGBA,n.UNSIGNED_BYTE,De);return me}let $={};$[n.TEXTURE_2D]=ht(n.TEXTURE_2D,n.TEXTURE_2D,1),$[n.TEXTURE_CUBE_MAP]=ht(n.TEXTURE_CUBE_MAP,n.TEXTURE_CUBE_MAP_POSITIVE_X,6),$[n.TEXTURE_2D_ARRAY]=ht(n.TEXTURE_2D_ARRAY,n.TEXTURE_2D_ARRAY,1,1),$[n.TEXTURE_3D]=ht(n.TEXTURE_3D,n.TEXTURE_3D,1,1),o.setClear(0,0,0,1),s.setClear(1),a.setClear(0),de(n.DEPTH_TEST),s.setFunc(gn),ct(!1),Rt(Ha),de(n.CULL_FACE),Oe(Si);function de(H){h[H]!==!0&&(n.enable(H),h[H]=!0)}function Ne(H){h[H]!==!1&&(n.disable(H),h[H]=!1)}function Je(H,Ee){return f[H]!==Ee?(n.bindFramebuffer(H,Ee),f[H]=Ee,H===n.DRAW_FRAMEBUFFER&&(f[n.FRAMEBUFFER]=Ee),H===n.FRAMEBUFFER&&(f[n.DRAW_FRAMEBUFFER]=Ee),!0):!1}function Fe(H,Ee){let ae=x,Ae=!1;if(H){ae=g.get(Ee),ae===void 0&&(ae=[],g.set(Ee,ae));let De=H.textures;if(ae.length!==De.length||ae[0]!==n.COLOR_ATTACHMENT0){for(let me=0,Xe=De.length;me<Xe;me++)ae[me]=n.COLOR_ATTACHMENT0+me;ae.length=De.length,Ae=!0}}else ae[0]!==n.BACK&&(ae[0]=n.BACK,Ae=!0);Ae&&n.drawBuffers(ae)}function Ye(H){return S!==H?(n.useProgram(H),S=H,!0):!1}let vt={[mn]:n.FUNC_ADD,[Kl]:n.FUNC_SUBTRACT,[Zl]:n.FUNC_REVERSE_SUBTRACT};vt[Jl]=n.MIN,vt[$l]=n.MAX;let ot={[Ql]:n.ZERO,[jl]:n.ONE,[ec]:n.SRC_COLOR,[ds]:n.SRC_ALPHA,[sc]:n.SRC_ALPHA_SATURATE,[rc]:n.DST_COLOR,[ic]:n.DST_ALPHA,[tc]:n.ONE_MINUS_SRC_COLOR,[ps]:n.ONE_MINUS_SRC_ALPHA,[oc]:n.ONE_MINUS_DST_COLOR,[nc]:n.ONE_MINUS_DST_ALPHA,[ac]:n.CONSTANT_COLOR,[lc]:n.ONE_MINUS_CONSTANT_COLOR,[cc]:n.CONSTANT_ALPHA,[uc]:n.ONE_MINUS_CONSTANT_ALPHA};function Oe(H,Ee,ae,Ae,De,me,Xe,Pe,yt,_t){if(H===Si){_===!0&&(Ne(n.BLEND),_=!1);return}if(_===!1&&(de(n.BLEND),_=!0),H!==Yl){if(H!==p||_t!==L){if((A!==mn||E!==mn)&&(n.blendEquation(n.FUNC_ADD),A=mn,E=mn),_t)switch(H){case pn:n.blendFuncSeparate(n.ONE,n.ONE_MINUS_SRC_ALPHA,n.ONE,n.ONE_MINUS_SRC_ALPHA);break;case Ai:n.blendFunc(n.ONE,n.ONE);break;case Va:n.blendFuncSeparate(n.ZERO,n.ONE_MINUS_SRC_COLOR,n.ZERO,n.ONE);break;case Wa:n.blendFuncSeparate(n.DST_COLOR,n.ONE_MINUS_SRC_ALPHA,n.ZERO,n.ONE);break;default:nt("WebGLState: Invalid blending: ",H);break}else switch(H){case pn:n.blendFuncSeparate(n.SRC_ALPHA,n.ONE_MINUS_SRC_ALPHA,n.ONE,n.ONE_MINUS_SRC_ALPHA);break;case Ai:n.blendFuncSeparate(n.SRC_ALPHA,n.ONE,n.ONE,n.ONE);break;case Va:nt("WebGLState: SubtractiveBlending requires material.premultipliedAlpha = true");break;case Wa:nt("WebGLState: MultiplyBlending requires material.premultipliedAlpha = true");break;default:nt("WebGLState: Invalid blending: ",H);break}P=null,y=null,b=null,R=null,d.set(0,0,0),T=0,p=H,L=_t}return}De=De||Ee,me=me||ae,Xe=Xe||Ae,(Ee!==A||De!==E)&&(n.blendEquationSeparate(vt[Ee],vt[De]),A=Ee,E=De),(ae!==P||Ae!==y||me!==b||Xe!==R)&&(n.blendFuncSeparate(ot[ae],ot[Ae],ot[me],ot[Xe]),P=ae,y=Ae,b=me,R=Xe),(Pe.equals(d)===!1||yt!==T)&&(n.blendColor(Pe.r,Pe.g,Pe.b,yt),d.copy(Pe),T=yt),p=H,L=!1}function At(H,Ee){H.side===ii?Ne(n.CULL_FACE):de(n.CULL_FACE);let ae=H.side===Ct;Ee&&(ae=!ae),ct(ae),H.blending===pn&&H.transparent===!1?Oe(Si):Oe(H.blending,H.blendEquation,H.blendSrc,H.blendDst,H.blendEquationAlpha,H.blendSrcAlpha,H.blendDstAlpha,H.blendColor,H.blendAlpha,H.premultipliedAlpha),s.setFunc(H.depthFunc),s.setTest(H.depthTest),s.setMask(H.depthWrite),o.setMask(H.colorWrite);let Ae=H.stencilWrite;a.setTest(Ae),Ae&&(a.setMask(H.stencilWriteMask),a.setFunc(H.stencilFunc,H.stencilRef,H.stencilFuncMask),a.setOp(H.stencilFail,H.stencilZFail,H.stencilZPass)),Ht(H.polygonOffset,H.polygonOffsetFactor,H.polygonOffsetUnits),H.alphaToCoverage===!0?de(n.SAMPLE_ALPHA_TO_COVERAGE):Ne(n.SAMPLE_ALPHA_TO_COVERAGE)}function ct(H){F!==H&&(H?n.frontFace(n.CW):n.frontFace(n.CCW),F=H)}function Rt(H){H!==Wl?(de(n.CULL_FACE),H!==B&&(H===Ha?n.cullFace(n.BACK):H===Xl?n.cullFace(n.FRONT):n.cullFace(n.FRONT_AND_BACK))):Ne(n.CULL_FACE),B=H}function Nt(H){H!==X&&(j&&n.lineWidth(H),X=H)}function Ht(H,Ee,ae){H?(de(n.POLYGON_OFFSET_FILL),(U!==Ee||K!==ae)&&(U=Ee,K=ae,s.getReversed()&&(Ee=-Ee),n.polygonOffset(Ee,ae))):Ne(n.POLYGON_OFFSET_FILL)}function lt(H){H?de(n.SCISSOR_TEST):Ne(n.SCISSOR_TEST)}function Pt(H){H===void 0&&(H=n.TEXTURE0+ee-1),he!==H&&(n.activeTexture(H),he=H)}function V(H,Ee,ae){ae===void 0&&(he===null?ae=n.TEXTURE0+ee-1:ae=he);let Ae=pe[ae];Ae===void 0&&(Ae={type:void 0,texture:void 0},pe[ae]=Ae),(Ae.type!==H||Ae.texture!==Ee)&&(he!==ae&&(n.activeTexture(ae),he=ae),n.bindTexture(H,Ee||$[H]),Ae.type=H,Ae.texture=Ee)}function Kt(){let H=pe[he];H!==void 0&&H.type!==void 0&&(n.bindTexture(H.type,null),H.type=void 0,H.texture=void 0)}function Mt(){try{n.compressedTexImage2D(...arguments)}catch(H){nt("WebGLState:",H)}}function C(){try{n.compressedTexImage3D(...arguments)}catch(H){nt("WebGLState:",H)}}function M(){try{n.texSubImage2D(...arguments)}catch(H){nt("WebGLState:",H)}}function Y(){try{n.texSubImage3D(...arguments)}catch(H){nt("WebGLState:",H)}}function J(){try{n.compressedTexSubImage2D(...arguments)}catch(H){nt("WebGLState:",H)}}function re(){try{n.compressedTexSubImage3D(...arguments)}catch(H){nt("WebGLState:",H)}}function xe(){try{n.texStorage2D(...arguments)}catch(H){nt("WebGLState:",H)}}function ve(){try{n.texStorage3D(...arguments)}catch(H){nt("WebGLState:",H)}}function se(){try{n.texImage2D(...arguments)}catch(H){nt("WebGLState:",H)}}function ue(){try{n.texImage3D(...arguments)}catch(H){nt("WebGLState:",H)}}function ye(H){return m[H]!==void 0?m[H]:n.getParameter(H)}function Ge(H,Ee){m[H]!==Ee&&(n.pixelStorei(H,Ee),m[H]=Ee)}function be(H){pt.equals(H)===!1&&(n.scissor(H.x,H.y,H.z,H.w),pt.copy(H))}function Te(H){at.equals(H)===!1&&(n.viewport(H.x,H.y,H.z,H.w),at.copy(H))}function ke(H,Ee){let ae=l.get(Ee);ae===void 0&&(ae=new WeakMap,l.set(Ee,ae));let Ae=ae.get(H);Ae===void 0&&(Ae=n.getUniformBlockIndex(Ee,H.name),ae.set(H,Ae))}function Ke(H,Ee){let Ae=l.get(Ee).get(H);c.get(Ee)!==Ae&&(n.uniformBlockBinding(Ee,Ae,H.__bindingPointIndex),c.set(Ee,Ae))}function $e(){n.disable(n.BLEND),n.disable(n.CULL_FACE),n.disable(n.DEPTH_TEST),n.disable(n.POLYGON_OFFSET_FILL),n.disable(n.SCISSOR_TEST),n.disable(n.STENCIL_TEST),n.disable(n.SAMPLE_ALPHA_TO_COVERAGE),n.blendEquation(n.FUNC_ADD),n.blendFunc(n.ONE,n.ZERO),n.blendFuncSeparate(n.ONE,n.ZERO,n.ONE,n.ZERO),n.blendColor(0,0,0,0),n.colorMask(!0,!0,!0,!0),n.clearColor(0,0,0,0),n.depthMask(!0),n.depthFunc(n.LESS),s.setReversed(!1),n.clearDepth(1),n.stencilMask(4294967295),n.stencilFunc(n.ALWAYS,0,4294967295),n.stencilOp(n.KEEP,n.KEEP,n.KEEP),n.clearStencil(0),n.cullFace(n.BACK),n.frontFace(n.CCW),n.polygonOffset(0,0),n.activeTexture(n.TEXTURE0),n.bindFramebuffer(n.FRAMEBUFFER,null),n.bindFramebuffer(n.DRAW_FRAMEBUFFER,null),n.bindFramebuffer(n.READ_FRAMEBUFFER,null),n.useProgram(null),n.lineWidth(1),n.scissor(0,0,n.canvas.width,n.canvas.height),n.viewport(0,0,n.canvas.width,n.canvas.height),n.pixelStorei(n.PACK_ALIGNMENT,4),n.pixelStorei(n.UNPACK_ALIGNMENT,4),n.pixelStorei(n.UNPACK_FLIP_Y_WEBGL,!1),n.pixelStorei(n.UNPACK_PREMULTIPLY_ALPHA_WEBGL,!1),n.pixelStorei(n.UNPACK_COLORSPACE_CONVERSION_WEBGL,n.BROWSER_DEFAULT_WEBGL),n.pixelStorei(n.PACK_ROW_LENGTH,0),n.pixelStorei(n.PACK_SKIP_PIXELS,0),n.pixelStorei(n.PACK_SKIP_ROWS,0),n.pixelStorei(n.UNPACK_ROW_LENGTH,0),n.pixelStorei(n.UNPACK_IMAGE_HEIGHT,0),n.pixelStorei(n.UNPACK_SKIP_PIXELS,0),n.pixelStorei(n.UNPACK_SKIP_ROWS,0),n.pixelStorei(n.UNPACK_SKIP_IMAGES,0),h={},m={},he=null,pe={},f={},g=new WeakMap,x=[],S=null,_=!1,p=null,A=null,P=null,y=null,E=null,b=null,R=null,d=new Le(0,0,0),T=0,L=!1,F=null,B=null,X=null,U=null,K=null,pt.set(0,0,n.canvas.width,n.canvas.height),at.set(0,0,n.canvas.width,n.canvas.height),o.reset(),s.reset(),a.reset()}return{buffers:{color:o,depth:s,stencil:a},enable:de,disable:Ne,bindFramebuffer:Je,drawBuffers:Fe,useProgram:Ye,setBlending:Oe,setMaterial:At,setFlipSided:ct,setCullFace:Rt,setLineWidth:Nt,setPolygonOffset:Ht,setScissorTest:lt,activeTexture:Pt,bindTexture:V,unbindTexture:Kt,compressedTexImage2D:Mt,compressedTexImage3D:C,texImage2D:se,texImage3D:ue,pixelStorei:Ge,getParameter:ye,updateUBOMapping:ke,uniformBlockBinding:Ke,texStorage2D:xe,texStorage3D:ve,texSubImage2D:M,texSubImage3D:Y,compressedTexSubImage2D:J,compressedTexSubImage3D:re,scissor:be,viewport:Te,reset:$e}}function Gd(n,e,t,i,r,o,s){let a=e.has("WEBGL_multisampled_render_to_texture")?e.get("WEBGL_multisampled_render_to_texture"):null,c=typeof navigator>"u"?!1:/OculusBrowser/g.test(navigator.userAgent),l=new Ce,h=new WeakMap,m=new Set,f,g=new WeakMap,x=!1;try{x=typeof OffscreenCanvas<"u"&&new OffscreenCanvas(1,1).getContext("2d")!==null}catch{}function S(C,M){return x?new OffscreenCanvas(C,M):xr("canvas")}function _(C,M,Y){let J=1,re=Mt(C);if((re.width>Y||re.height>Y)&&(J=Y/Math.max(re.width,re.height)),J<1)if(typeof HTMLImageElement<"u"&&C instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&C instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&C instanceof ImageBitmap||typeof VideoFrame<"u"&&C instanceof VideoFrame){let xe=Math.floor(J*re.width),ve=Math.floor(J*re.height);f===void 0&&(f=S(xe,ve));let se=M?S(xe,ve):f;return se.width=xe,se.height=ve,se.getContext("2d").drawImage(C,0,0,xe,ve),Ue("WebGLRenderer: Texture has been resized from ("+re.width+"x"+re.height+") to ("+xe+"x"+ve+")."),se}else return"data"in C&&Ue("WebGLRenderer: Image in DataTexture is too big ("+re.width+"x"+re.height+")."),C;return C}function p(C){return C.generateMipmaps}function A(C){n.generateMipmap(C)}function P(C){return C.isWebGLCubeRenderTarget?n.TEXTURE_CUBE_MAP:C.isWebGL3DRenderTarget?n.TEXTURE_3D:C.isWebGLArrayRenderTarget||C.isCompressedArrayTexture?n.TEXTURE_2D_ARRAY:n.TEXTURE_2D}function y(C,M,Y,J,re,xe=!1){if(C!==null){if(n[C]!==void 0)return n[C];Ue("WebGLRenderer: Attempt to use non-existing WebGL internal format '"+C+"'")}let ve;J&&(ve=e.get("EXT_texture_norm16"),ve||Ue("WebGLRenderer: Unable to use normalized textures without EXT_texture_norm16 extension"));let se=M;if(M===n.RED&&(Y===n.FLOAT&&(se=n.R32F),Y===n.HALF_FLOAT&&(se=n.R16F),Y===n.UNSIGNED_BYTE&&(se=n.R8),Y===n.UNSIGNED_SHORT&&ve&&(se=ve.R16_EXT),Y===n.SHORT&&ve&&(se=ve.R16_SNORM_EXT)),M===n.RED_INTEGER&&(Y===n.UNSIGNED_BYTE&&(se=n.R8UI),Y===n.UNSIGNED_SHORT&&(se=n.R16UI),Y===n.UNSIGNED_INT&&(se=n.R32UI),Y===n.BYTE&&(se=n.R8I),Y===n.SHORT&&(se=n.R16I),Y===n.INT&&(se=n.R32I)),M===n.RG&&(Y===n.FLOAT&&(se=n.RG32F),Y===n.HALF_FLOAT&&(se=n.RG16F),Y===n.UNSIGNED_BYTE&&(se=n.RG8),Y===n.UNSIGNED_SHORT&&ve&&(se=ve.RG16_EXT),Y===n.SHORT&&ve&&(se=ve.RG16_SNORM_EXT)),M===n.RG_INTEGER&&(Y===n.UNSIGNED_BYTE&&(se=n.RG8UI),Y===n.UNSIGNED_SHORT&&(se=n.RG16UI),Y===n.UNSIGNED_INT&&(se=n.RG32UI),Y===n.BYTE&&(se=n.RG8I),Y===n.SHORT&&(se=n.RG16I),Y===n.INT&&(se=n.RG32I)),M===n.RGB_INTEGER&&(Y===n.UNSIGNED_BYTE&&(se=n.RGB8UI),Y===n.UNSIGNED_SHORT&&(se=n.RGB16UI),Y===n.UNSIGNED_INT&&(se=n.RGB32UI),Y===n.BYTE&&(se=n.RGB8I),Y===n.SHORT&&(se=n.RGB16I),Y===n.INT&&(se=n.RGB32I)),M===n.RGBA_INTEGER&&(Y===n.UNSIGNED_BYTE&&(se=n.RGBA8UI),Y===n.UNSIGNED_SHORT&&(se=n.RGBA16UI),Y===n.UNSIGNED_INT&&(se=n.RGBA32UI),Y===n.BYTE&&(se=n.RGBA8I),Y===n.SHORT&&(se=n.RGBA16I),Y===n.INT&&(se=n.RGBA32I)),M===n.RGB&&(Y===n.UNSIGNED_SHORT&&ve&&(se=ve.RGB16_EXT),Y===n.SHORT&&ve&&(se=ve.RGB16_SNORM_EXT),Y===n.UNSIGNED_INT_5_9_9_9_REV&&(se=n.RGB9_E5),Y===n.UNSIGNED_INT_10F_11F_11F_REV&&(se=n.R11F_G11F_B10F)),M===n.RGBA){let ue=xe?Vn:tt.getTransfer(re);Y===n.FLOAT&&(se=n.RGBA32F),Y===n.HALF_FLOAT&&(se=n.RGBA16F),Y===n.UNSIGNED_BYTE&&(se=ue===dt?n.SRGB8_ALPHA8:n.RGBA8),Y===n.UNSIGNED_SHORT&&ve&&(se=ve.RGBA16_EXT),Y===n.SHORT&&ve&&(se=ve.RGBA16_SNORM_EXT),Y===n.UNSIGNED_SHORT_4_4_4_4&&(se=n.RGBA4),Y===n.UNSIGNED_SHORT_5_5_5_1&&(se=n.RGB5_A1)}return(se===n.R16F||se===n.R32F||se===n.RG16F||se===n.RG32F||se===n.RGBA16F||se===n.RGBA32F)&&e.get("EXT_color_buffer_float"),se}function E(C,M){let Y;return C?M===null||M===Zt||M===ji?Y=n.DEPTH24_STENCIL8:M===ni?Y=n.DEPTH32F_STENCIL8:M===Qi&&(Y=n.DEPTH24_STENCIL8,Ue("DepthTexture: 16 bit depth attachment is not supported with stencil. Using 24-bit attachment.")):M===null||M===Zt||M===ji?Y=n.DEPTH_COMPONENT24:M===ni?Y=n.DEPTH_COMPONENT32F:M===Qi&&(Y=n.DEPTH_COMPONENT16),Y}function b(C,M){return p(C)===!0||C.isFramebufferTexture&&C.minFilter!==Dt&&C.minFilter!==Ut?Math.log2(Math.max(M.width,M.height))+1:C.mipmaps!==void 0&&C.mipmaps.length>0?C.mipmaps.length:C.isCompressedTexture&&Array.isArray(C.image)?M.mipmaps.length:1}function R(C){let M=C.target;M.removeEventListener("dispose",R),T(M),M.isVideoTexture&&h.delete(M),M.isHTMLTexture&&m.delete(M)}function d(C){let M=C.target;M.removeEventListener("dispose",d),F(M)}function T(C){let M=i.get(C);if(M.__webglInit===void 0)return;let Y=C.source,J=g.get(Y);if(J){let re=J[M.__cacheKey];re.usedTimes--,re.usedTimes===0&&L(C),Object.keys(J).length===0&&g.delete(Y)}i.remove(C)}function L(C){let M=i.get(C);n.deleteTexture(M.__webglTexture);let Y=C.source,J=g.get(Y);delete J[M.__cacheKey],s.memory.textures--}function F(C){let M=i.get(C);if(C.depthTexture&&(C.depthTexture.dispose(),i.remove(C.depthTexture)),C.isWebGLCubeRenderTarget)for(let J=0;J<6;J++){if(Array.isArray(M.__webglFramebuffer[J]))for(let re=0;re<M.__webglFramebuffer[J].length;re++)n.deleteFramebuffer(M.__webglFramebuffer[J][re]);else n.deleteFramebuffer(M.__webglFramebuffer[J]);M.__webglDepthbuffer&&n.deleteRenderbuffer(M.__webglDepthbuffer[J])}else{if(Array.isArray(M.__webglFramebuffer))for(let J=0;J<M.__webglFramebuffer.length;J++)n.deleteFramebuffer(M.__webglFramebuffer[J]);else n.deleteFramebuffer(M.__webglFramebuffer);if(M.__webglDepthbuffer&&n.deleteRenderbuffer(M.__webglDepthbuffer),M.__webglMultisampledFramebuffer&&n.deleteFramebuffer(M.__webglMultisampledFramebuffer),M.__webglColorRenderbuffer)for(let J=0;J<M.__webglColorRenderbuffer.length;J++)M.__webglColorRenderbuffer[J]&&n.deleteRenderbuffer(M.__webglColorRenderbuffer[J]);M.__webglDepthRenderbuffer&&n.deleteRenderbuffer(M.__webglDepthRenderbuffer)}let Y=C.textures;for(let J=0,re=Y.length;J<re;J++){let xe=i.get(Y[J]);xe.__webglTexture&&(n.deleteTexture(xe.__webglTexture),s.memory.textures--),i.remove(Y[J])}i.remove(C)}let B=0;function X(){B=0}function U(){return B}function K(C){B=C}function ee(){let C=B;return C>=r.maxTextures&&Ue("WebGLTextures: Trying to use "+(C+1)+" texture units while this GPU supports only "+r.maxTextures),B+=1,C}function j(C){let M=[];return M.push(C.wrapS),M.push(C.wrapT),M.push(C.wrapR||0),M.push(C.magFilter),M.push(C.minFilter),M.push(C.anisotropy),M.push(C.internalFormat),M.push(C.format),M.push(C.type),M.push(C.generateMipmaps),M.push(C.premultiplyAlpha),M.push(C.flipY),M.push(C.unpackAlignment),M.push(C.colorSpace),M.join()}function le(C,M){let Y=i.get(C);if(C.isVideoTexture&&V(C),C.isRenderTargetTexture===!1&&C.isExternalTexture!==!0&&C.version>0&&Y.__version!==C.version){let J=C.image;if(J===null)Ue("WebGLRenderer: Texture marked for update but no image data found.");else if(J.complete===!1)Ue("WebGLRenderer: Texture marked for update but image is incomplete");else{Ne(Y,C,M);return}}else C.isExternalTexture&&(Y.__webglTexture=C.sourceTexture?C.sourceTexture:null);t.bindTexture(n.TEXTURE_2D,Y.__webglTexture,n.TEXTURE0+M)}function te(C,M){let Y=i.get(C);if(C.isRenderTargetTexture===!1&&C.version>0&&Y.__version!==C.version){Ne(Y,C,M);return}else C.isExternalTexture&&(Y.__webglTexture=C.sourceTexture?C.sourceTexture:null);t.bindTexture(n.TEXTURE_2D_ARRAY,Y.__webglTexture,n.TEXTURE0+M)}function he(C,M){let Y=i.get(C);if(C.isRenderTargetTexture===!1&&C.version>0&&Y.__version!==C.version){Ne(Y,C,M);return}t.bindTexture(n.TEXTURE_3D,Y.__webglTexture,n.TEXTURE0+M)}function pe(C,M){let Y=i.get(C);if(C.isCubeDepthTexture!==!0&&C.version>0&&Y.__version!==C.version){Je(Y,C,M);return}t.bindTexture(n.TEXTURE_CUBE_MAP,Y.__webglTexture,n.TEXTURE0+M)}let We={[xn]:n.REPEAT,[_i]:n.CLAMP_TO_EDGE,[ho]:n.MIRRORED_REPEAT},ze={[Dt]:n.NEAREST,[dc]:n.NEAREST_MIPMAP_NEAREST,[po]:n.NEAREST_MIPMAP_LINEAR,[Ut]:n.LINEAR,[Es]:n.LINEAR_MIPMAP_NEAREST,[Ni]:n.LINEAR_MIPMAP_LINEAR},pt={[_c]:n.NEVER,[yc]:n.ALWAYS,[xc]:n.LESS,[mr]:n.LEQUAL,[Mc]:n.EQUAL,[gr]:n.GEQUAL,[Sc]:n.GREATER,[vc]:n.NOTEQUAL};function at(C,M){if(M.type===ni&&e.has("OES_texture_float_linear")===!1&&(M.magFilter===Ut||M.magFilter===Es||M.magFilter===po||M.magFilter===Ni||M.minFilter===Ut||M.minFilter===Es||M.minFilter===po||M.minFilter===Ni)&&Ue("WebGLRenderer: Unable to use linear filtering with floating point textures. OES_texture_float_linear not supported on this device."),n.texParameteri(C,n.TEXTURE_WRAP_S,We[M.wrapS]),n.texParameteri(C,n.TEXTURE_WRAP_T,We[M.wrapT]),(C===n.TEXTURE_3D||C===n.TEXTURE_2D_ARRAY)&&n.texParameteri(C,n.TEXTURE_WRAP_R,We[M.wrapR]),n.texParameteri(C,n.TEXTURE_MAG_FILTER,ze[M.magFilter]),n.texParameteri(C,n.TEXTURE_MIN_FILTER,ze[M.minFilter]),M.compareFunction&&(n.texParameteri(C,n.TEXTURE_COMPARE_MODE,n.COMPARE_REF_TO_TEXTURE),n.texParameteri(C,n.TEXTURE_COMPARE_FUNC,pt[M.compareFunction])),e.has("EXT_texture_filter_anisotropic")===!0){if(M.magFilter===Dt||M.minFilter!==po&&M.minFilter!==Ni||M.type===ni&&e.has("OES_texture_float_linear")===!1)return;if(M.anisotropy>1||i.get(M).__currentAnisotropy){let Y=e.get("EXT_texture_filter_anisotropic");n.texParameterf(C,Y.TEXTURE_MAX_ANISOTROPY_EXT,Math.min(M.anisotropy,r.getMaxAnisotropy())),i.get(M).__currentAnisotropy=M.anisotropy}}}function ht(C,M){let Y=!1;C.__webglInit===void 0&&(C.__webglInit=!0,M.addEventListener("dispose",R));let J=M.source,re=g.get(J);re===void 0&&(re={},g.set(J,re));let xe=j(M);if(xe!==C.__cacheKey){re[xe]===void 0&&(re[xe]={texture:n.createTexture(),usedTimes:0},s.memory.textures++,Y=!0),re[xe].usedTimes++;let ve=re[C.__cacheKey];ve!==void 0&&(re[C.__cacheKey].usedTimes--,ve.usedTimes===0&&L(M)),C.__cacheKey=xe,C.__webglTexture=re[xe].texture}return Y}function $(C,M,Y){return Math.floor(Math.floor(C/Y)/M)}function de(C,M,Y,J){let xe=C.updateRanges;if(xe.length===0)t.texSubImage2D(n.TEXTURE_2D,0,0,0,M.width,M.height,Y,J,M.data);else{xe.sort((Ge,be)=>Ge.start-be.start);let ve=0;for(let Ge=1;Ge<xe.length;Ge++){let be=xe[ve],Te=xe[Ge],ke=be.start+be.count,Ke=$(Te.start,M.width,4),$e=$(be.start,M.width,4);Te.start<=ke+1&&Ke===$e&&$(Te.start+Te.count-1,M.width,4)===Ke?be.count=Math.max(be.count,Te.start+Te.count-be.start):(++ve,xe[ve]=Te)}xe.length=ve+1;let se=t.getParameter(n.UNPACK_ROW_LENGTH),ue=t.getParameter(n.UNPACK_SKIP_PIXELS),ye=t.getParameter(n.UNPACK_SKIP_ROWS);t.pixelStorei(n.UNPACK_ROW_LENGTH,M.width);for(let Ge=0,be=xe.length;Ge<be;Ge++){let Te=xe[Ge],ke=Math.floor(Te.start/4),Ke=Math.ceil(Te.count/4),$e=ke%M.width,H=Math.floor(ke/M.width),Ee=Ke,ae=1;t.pixelStorei(n.UNPACK_SKIP_PIXELS,$e),t.pixelStorei(n.UNPACK_SKIP_ROWS,H),t.texSubImage2D(n.TEXTURE_2D,0,$e,H,Ee,ae,Y,J,M.data)}C.clearUpdateRanges(),t.pixelStorei(n.UNPACK_ROW_LENGTH,se),t.pixelStorei(n.UNPACK_SKIP_PIXELS,ue),t.pixelStorei(n.UNPACK_SKIP_ROWS,ye)}}function Ne(C,M,Y){let J=n.TEXTURE_2D;(M.isDataArrayTexture||M.isCompressedArrayTexture)&&(J=n.TEXTURE_2D_ARRAY),M.isData3DTexture&&(J=n.TEXTURE_3D);let re=ht(C,M),xe=M.source;t.bindTexture(J,C.__webglTexture,n.TEXTURE0+Y);let ve=i.get(xe);if(xe.version!==ve.__version||re===!0){if(t.activeTexture(n.TEXTURE0+Y),(typeof ImageBitmap<"u"&&M.image instanceof ImageBitmap)===!1){let ae=tt.getPrimaries(tt.workingColorSpace),Ae=M.colorSpace===Ri?null:tt.getPrimaries(M.colorSpace),De=M.colorSpace===Ri||ae===Ae?n.NONE:n.BROWSER_DEFAULT_WEBGL;t.pixelStorei(n.UNPACK_FLIP_Y_WEBGL,M.flipY),t.pixelStorei(n.UNPACK_PREMULTIPLY_ALPHA_WEBGL,M.premultiplyAlpha),t.pixelStorei(n.UNPACK_COLORSPACE_CONVERSION_WEBGL,De)}t.pixelStorei(n.UNPACK_ALIGNMENT,M.unpackAlignment);let ue=_(M.image,!1,r.maxTextureSize);ue=Kt(M,ue);let ye=o.convert(M.format,M.colorSpace),Ge=o.convert(M.type),be=y(M.internalFormat,ye,Ge,M.normalized,M.colorSpace,M.isVideoTexture);at(J,M);let Te,ke=M.mipmaps,Ke=M.isVideoTexture!==!0,$e=ve.__version===void 0||re===!0,H=xe.dataReady,Ee=b(M,ue);if(M.isDepthTexture)be=E(M.format===Ui,M.type),$e&&(Ke?t.texStorage2D(n.TEXTURE_2D,1,be,ue.width,ue.height):t.texImage2D(n.TEXTURE_2D,0,be,ue.width,ue.height,0,ye,Ge,null));else if(M.isDataTexture)if(ke.length>0){Ke&&$e&&t.texStorage2D(n.TEXTURE_2D,Ee,be,ke[0].width,ke[0].height);for(let ae=0,Ae=ke.length;ae<Ae;ae++)Te=ke[ae],Ke?H&&t.texSubImage2D(n.TEXTURE_2D,ae,0,0,Te.width,Te.height,ye,Ge,Te.data):t.texImage2D(n.TEXTURE_2D,ae,be,Te.width,Te.height,0,ye,Ge,Te.data);M.generateMipmaps=!1}else Ke?($e&&t.texStorage2D(n.TEXTURE_2D,Ee,be,ue.width,ue.height),H&&de(M,ue,ye,Ge)):t.texImage2D(n.TEXTURE_2D,0,be,ue.width,ue.height,0,ye,Ge,ue.data);else if(M.isCompressedTexture)if(M.isCompressedArrayTexture){Ke&&$e&&t.texStorage3D(n.TEXTURE_2D_ARRAY,Ee,be,ke[0].width,ke[0].height,ue.depth);for(let ae=0,Ae=ke.length;ae<Ae;ae++)if(Te=ke[ae],M.format!==$t)if(ye!==null)if(Ke){if(H)if(M.layerUpdates.size>0){let De=Ml(Te.width,Te.height,M.format,M.type);for(let me of M.layerUpdates){let Xe=Te.data.subarray(me*De/Te.data.BYTES_PER_ELEMENT,(me+1)*De/Te.data.BYTES_PER_ELEMENT);t.compressedTexSubImage3D(n.TEXTURE_2D_ARRAY,ae,0,0,me,Te.width,Te.height,1,ye,Xe)}}else t.compressedTexSubImage3D(n.TEXTURE_2D_ARRAY,ae,0,0,0,Te.width,Te.height,ue.depth,ye,Te.data)}else t.compressedTexImage3D(n.TEXTURE_2D_ARRAY,ae,be,Te.width,Te.height,ue.depth,0,Te.data,0,0);else Ue("WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()");else Ke?H&&t.texSubImage3D(n.TEXTURE_2D_ARRAY,ae,0,0,0,Te.width,Te.height,ue.depth,ye,Ge,Te.data):t.texImage3D(n.TEXTURE_2D_ARRAY,ae,be,Te.width,Te.height,ue.depth,0,ye,Ge,Te.data);M.layerUpdates.size>0&&M.clearLayerUpdates()}else{Ke&&$e&&t.texStorage2D(n.TEXTURE_2D,Ee,be,ke[0].width,ke[0].height);for(let ae=0,Ae=ke.length;ae<Ae;ae++)Te=ke[ae],M.format!==$t?ye!==null?Ke?H&&t.compressedTexSubImage2D(n.TEXTURE_2D,ae,0,0,Te.width,Te.height,ye,Te.data):t.compressedTexImage2D(n.TEXTURE_2D,ae,be,Te.width,Te.height,0,Te.data):Ue("WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()"):Ke?H&&t.texSubImage2D(n.TEXTURE_2D,ae,0,0,Te.width,Te.height,ye,Ge,Te.data):t.texImage2D(n.TEXTURE_2D,ae,be,Te.width,Te.height,0,ye,Ge,Te.data)}else if(M.isDataArrayTexture)if(Ke){if($e&&t.texStorage3D(n.TEXTURE_2D_ARRAY,Ee,be,ue.width,ue.height,ue.depth),H)if(M.layerUpdates.size>0){let ae=Ml(ue.width,ue.height,M.format,M.type);for(let Ae of M.layerUpdates){let De=ue.data.subarray(Ae*ae/ue.data.BYTES_PER_ELEMENT,(Ae+1)*ae/ue.data.BYTES_PER_ELEMENT);t.texSubImage3D(n.TEXTURE_2D_ARRAY,0,0,0,Ae,ue.width,ue.height,1,ye,Ge,De)}M.clearLayerUpdates()}else t.texSubImage3D(n.TEXTURE_2D_ARRAY,0,0,0,0,ue.width,ue.height,ue.depth,ye,Ge,ue.data)}else t.texImage3D(n.TEXTURE_2D_ARRAY,0,be,ue.width,ue.height,ue.depth,0,ye,Ge,ue.data);else if(M.isData3DTexture)Ke?($e&&t.texStorage3D(n.TEXTURE_3D,Ee,be,ue.width,ue.height,ue.depth),H&&t.texSubImage3D(n.TEXTURE_3D,0,0,0,0,ue.width,ue.height,ue.depth,ye,Ge,ue.data)):t.texImage3D(n.TEXTURE_3D,0,be,ue.width,ue.height,ue.depth,0,ye,Ge,ue.data);else if(M.isFramebufferTexture){if($e)if(Ke)t.texStorage2D(n.TEXTURE_2D,Ee,be,ue.width,ue.height);else{let ae=ue.width,Ae=ue.height;for(let De=0;De<Ee;De++)t.texImage2D(n.TEXTURE_2D,De,be,ae,Ae,0,ye,Ge,null),ae>>=1,Ae>>=1}}else if(M.isHTMLTexture){if("texElementImage2D"in n){let ae=n.canvas;if(ae.hasAttribute("layoutsubtree")||ae.setAttribute("layoutsubtree","true"),ue.parentNode!==ae){ae.appendChild(ue),m.add(M),ae.onpaint=Ae=>{let De=Ae.changedElements;for(let me of m)De.includes(me.image)&&(me.needsUpdate=!0)},ae.requestPaint();return}if(n.texElementImage2D.length===3)n.texElementImage2D(n.TEXTURE_2D,n.RGBA8,ue);else{let De=n.RGBA,me=n.RGBA,Xe=n.UNSIGNED_BYTE;n.texElementImage2D(n.TEXTURE_2D,0,De,me,Xe,ue)}n.texParameteri(n.TEXTURE_2D,n.TEXTURE_MIN_FILTER,n.LINEAR),n.texParameteri(n.TEXTURE_2D,n.TEXTURE_WRAP_S,n.CLAMP_TO_EDGE),n.texParameteri(n.TEXTURE_2D,n.TEXTURE_WRAP_T,n.CLAMP_TO_EDGE)}}else if(ke.length>0){if(Ke&&$e){let ae=Mt(ke[0]);t.texStorage2D(n.TEXTURE_2D,Ee,be,ae.width,ae.height)}for(let ae=0,Ae=ke.length;ae<Ae;ae++)Te=ke[ae],Ke?H&&t.texSubImage2D(n.TEXTURE_2D,ae,0,0,ye,Ge,Te):t.texImage2D(n.TEXTURE_2D,ae,be,ye,Ge,Te);M.generateMipmaps=!1}else if(Ke){if($e){let ae=Mt(ue);t.texStorage2D(n.TEXTURE_2D,Ee,be,ae.width,ae.height)}H&&t.texSubImage2D(n.TEXTURE_2D,0,0,0,ye,Ge,ue)}else t.texImage2D(n.TEXTURE_2D,0,be,ye,Ge,ue);p(M)&&A(J),ve.__version=xe.version,M.onUpdate&&M.onUpdate(M)}C.__version=M.version}function Je(C,M,Y){if(M.image.length!==6)return;let J=ht(C,M),re=M.source;t.bindTexture(n.TEXTURE_CUBE_MAP,C.__webglTexture,n.TEXTURE0+Y);let xe=i.get(re);if(re.version!==xe.__version||J===!0){t.activeTexture(n.TEXTURE0+Y);let ve=tt.getPrimaries(tt.workingColorSpace),se=M.colorSpace===Ri?null:tt.getPrimaries(M.colorSpace),ue=M.colorSpace===Ri||ve===se?n.NONE:n.BROWSER_DEFAULT_WEBGL;t.pixelStorei(n.UNPACK_FLIP_Y_WEBGL,M.flipY),t.pixelStorei(n.UNPACK_PREMULTIPLY_ALPHA_WEBGL,M.premultiplyAlpha),t.pixelStorei(n.UNPACK_ALIGNMENT,M.unpackAlignment),t.pixelStorei(n.UNPACK_COLORSPACE_CONVERSION_WEBGL,ue);let ye=M.isCompressedTexture||M.image[0].isCompressedTexture,Ge=M.image[0]&&M.image[0].isDataTexture,be=[];for(let me=0;me<6;me++)!ye&&!Ge?be[me]=_(M.image[me],!0,r.maxCubemapSize):be[me]=Ge?M.image[me].image:M.image[me],be[me]=Kt(M,be[me]);let Te=be[0],ke=o.convert(M.format,M.colorSpace),Ke=o.convert(M.type),$e=y(M.internalFormat,ke,Ke,M.normalized,M.colorSpace),H=M.isVideoTexture!==!0,Ee=xe.__version===void 0||J===!0,ae=re.dataReady,Ae=b(M,Te);at(n.TEXTURE_CUBE_MAP,M);let De;if(ye){H&&Ee&&t.texStorage2D(n.TEXTURE_CUBE_MAP,Ae,$e,Te.width,Te.height);for(let me=0;me<6;me++){De=be[me].mipmaps;for(let Xe=0;Xe<De.length;Xe++){let Pe=De[Xe];M.format!==$t?ke!==null?H?ae&&t.compressedTexSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+me,Xe,0,0,Pe.width,Pe.height,ke,Pe.data):t.compressedTexImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+me,Xe,$e,Pe.width,Pe.height,0,Pe.data):Ue("WebGLRenderer: Attempt to load unsupported compressed texture format in .setTextureCube()"):H?ae&&t.texSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+me,Xe,0,0,Pe.width,Pe.height,ke,Ke,Pe.data):t.texImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+me,Xe,$e,Pe.width,Pe.height,0,ke,Ke,Pe.data)}}}else{if(De=M.mipmaps,H&&Ee){De.length>0&&Ae++;let me=Mt(be[0]);t.texStorage2D(n.TEXTURE_CUBE_MAP,Ae,$e,me.width,me.height)}for(let me=0;me<6;me++)if(Ge){H?ae&&t.texSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+me,0,0,0,be[me].width,be[me].height,ke,Ke,be[me].data):t.texImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+me,0,$e,be[me].width,be[me].height,0,ke,Ke,be[me].data);for(let Xe=0;Xe<De.length;Xe++){let yt=De[Xe].image[me].image;H?ae&&t.texSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+me,Xe+1,0,0,yt.width,yt.height,ke,Ke,yt.data):t.texImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+me,Xe+1,$e,yt.width,yt.height,0,ke,Ke,yt.data)}}else{H?ae&&t.texSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+me,0,0,0,ke,Ke,be[me]):t.texImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+me,0,$e,ke,Ke,be[me]);for(let Xe=0;Xe<De.length;Xe++){let Pe=De[Xe];H?ae&&t.texSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+me,Xe+1,0,0,ke,Ke,Pe.image[me]):t.texImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+me,Xe+1,$e,ke,Ke,Pe.image[me])}}}p(M)&&A(n.TEXTURE_CUBE_MAP),xe.__version=re.version,M.onUpdate&&M.onUpdate(M)}C.__version=M.version}function Fe(C,M,Y,J,re,xe){let ve=o.convert(Y.format,Y.colorSpace),se=o.convert(Y.type),ue=y(Y.internalFormat,ve,se,Y.normalized,Y.colorSpace),ye=i.get(M),Ge=i.get(Y);if(Ge.__renderTarget=M,!ye.__hasExternalTextures){let be=Math.max(1,M.width>>xe),Te=Math.max(1,M.height>>xe);re===n.TEXTURE_3D||re===n.TEXTURE_2D_ARRAY?t.texImage3D(re,xe,ue,be,Te,M.depth,0,ve,se,null):t.texImage2D(re,xe,ue,be,Te,0,ve,se,null)}t.bindFramebuffer(n.FRAMEBUFFER,C),Pt(M)?a.framebufferTexture2DMultisampleEXT(n.FRAMEBUFFER,J,re,Ge.__webglTexture,0,lt(M)):(re===n.TEXTURE_2D||re>=n.TEXTURE_CUBE_MAP_POSITIVE_X&&re<=n.TEXTURE_CUBE_MAP_NEGATIVE_Z)&&n.framebufferTexture2D(n.FRAMEBUFFER,J,re,Ge.__webglTexture,xe),t.bindFramebuffer(n.FRAMEBUFFER,null)}function Ye(C,M,Y){if(n.bindRenderbuffer(n.RENDERBUFFER,C),M.depthBuffer){let J=M.depthTexture,re=J&&J.isDepthTexture?J.type:null,xe=E(M.stencilBuffer,re),ve=M.stencilBuffer?n.DEPTH_STENCIL_ATTACHMENT:n.DEPTH_ATTACHMENT;Pt(M)?a.renderbufferStorageMultisampleEXT(n.RENDERBUFFER,lt(M),xe,M.width,M.height):Y?n.renderbufferStorageMultisample(n.RENDERBUFFER,lt(M),xe,M.width,M.height):n.renderbufferStorage(n.RENDERBUFFER,xe,M.width,M.height),n.framebufferRenderbuffer(n.FRAMEBUFFER,ve,n.RENDERBUFFER,C)}else{let J=M.textures;for(let re=0;re<J.length;re++){let xe=J[re],ve=o.convert(xe.format,xe.colorSpace),se=o.convert(xe.type),ue=y(xe.internalFormat,ve,se,xe.normalized,xe.colorSpace);Pt(M)?a.renderbufferStorageMultisampleEXT(n.RENDERBUFFER,lt(M),ue,M.width,M.height):Y?n.renderbufferStorageMultisample(n.RENDERBUFFER,lt(M),ue,M.width,M.height):n.renderbufferStorage(n.RENDERBUFFER,ue,M.width,M.height)}}n.bindRenderbuffer(n.RENDERBUFFER,null)}function vt(C,M,Y){let J=M.isWebGLCubeRenderTarget===!0;if(t.bindFramebuffer(n.FRAMEBUFFER,C),!(M.depthTexture&&M.depthTexture.isDepthTexture))throw new Error("THREE.WebGLTextures: renderTarget.depthTexture must be an instance of THREE.DepthTexture.");let re=i.get(M.depthTexture);if(re.__renderTarget=M,(!re.__webglTexture||M.depthTexture.image.width!==M.width||M.depthTexture.image.height!==M.height)&&(M.depthTexture.image.width=M.width,M.depthTexture.image.height=M.height,M.depthTexture.needsUpdate=!0),J){if(re.__webglInit===void 0&&(re.__webglInit=!0,M.depthTexture.addEventListener("dispose",R)),re.__webglTexture===void 0){re.__webglTexture=n.createTexture(),t.bindTexture(n.TEXTURE_CUBE_MAP,re.__webglTexture),at(n.TEXTURE_CUBE_MAP,M.depthTexture);let ye=o.convert(M.depthTexture.format),Ge=o.convert(M.depthTexture.type),be;M.depthTexture.format===pi?be=n.DEPTH_COMPONENT24:M.depthTexture.format===Ui&&(be=n.DEPTH24_STENCIL8);for(let Te=0;Te<6;Te++)n.texImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+Te,0,be,M.width,M.height,0,ye,Ge,null)}}else le(M.depthTexture,0);let xe=re.__webglTexture,ve=lt(M),se=J?n.TEXTURE_CUBE_MAP_POSITIVE_X+Y:n.TEXTURE_2D,ue=M.depthTexture.format===Ui?n.DEPTH_STENCIL_ATTACHMENT:n.DEPTH_ATTACHMENT;if(M.depthTexture.format===pi)Pt(M)?a.framebufferTexture2DMultisampleEXT(n.FRAMEBUFFER,ue,se,xe,0,ve):n.framebufferTexture2D(n.FRAMEBUFFER,ue,se,xe,0);else if(M.depthTexture.format===Ui)Pt(M)?a.framebufferTexture2DMultisampleEXT(n.FRAMEBUFFER,ue,se,xe,0,ve):n.framebufferTexture2D(n.FRAMEBUFFER,ue,se,xe,0);else throw new Error("THREE.WebGLTextures: Unknown depthTexture format.")}function ot(C){let M=i.get(C),Y=C.isWebGLCubeRenderTarget===!0;if(M.__boundDepthTexture!==C.depthTexture){let J=C.depthTexture;if(M.__depthDisposeCallback&&M.__depthDisposeCallback(),J){let re=()=>{delete M.__boundDepthTexture,delete M.__depthDisposeCallback,J.removeEventListener("dispose",re)};J.addEventListener("dispose",re),M.__depthDisposeCallback=re}M.__boundDepthTexture=J}if(C.depthTexture&&!M.__autoAllocateDepthBuffer)if(Y)for(let J=0;J<6;J++)vt(M.__webglFramebuffer[J],C,J);else{let J=C.texture.mipmaps;J&&J.length>0?vt(M.__webglFramebuffer[0],C,0):vt(M.__webglFramebuffer,C,0)}else if(Y){M.__webglDepthbuffer=[];for(let J=0;J<6;J++)if(t.bindFramebuffer(n.FRAMEBUFFER,M.__webglFramebuffer[J]),M.__webglDepthbuffer[J]===void 0)M.__webglDepthbuffer[J]=n.createRenderbuffer(),Ye(M.__webglDepthbuffer[J],C,!1);else{let re=C.stencilBuffer?n.DEPTH_STENCIL_ATTACHMENT:n.DEPTH_ATTACHMENT,xe=M.__webglDepthbuffer[J];n.bindRenderbuffer(n.RENDERBUFFER,xe),n.framebufferRenderbuffer(n.FRAMEBUFFER,re,n.RENDERBUFFER,xe)}}else{let J=C.texture.mipmaps;if(J&&J.length>0?t.bindFramebuffer(n.FRAMEBUFFER,M.__webglFramebuffer[0]):t.bindFramebuffer(n.FRAMEBUFFER,M.__webglFramebuffer),M.__webglDepthbuffer===void 0)M.__webglDepthbuffer=n.createRenderbuffer(),Ye(M.__webglDepthbuffer,C,!1);else{let re=C.stencilBuffer?n.DEPTH_STENCIL_ATTACHMENT:n.DEPTH_ATTACHMENT,xe=M.__webglDepthbuffer;n.bindRenderbuffer(n.RENDERBUFFER,xe),n.framebufferRenderbuffer(n.FRAMEBUFFER,re,n.RENDERBUFFER,xe)}}t.bindFramebuffer(n.FRAMEBUFFER,null)}function Oe(C,M,Y){let J=i.get(C);M!==void 0&&Fe(J.__webglFramebuffer,C,C.texture,n.COLOR_ATTACHMENT0,n.TEXTURE_2D,0),Y!==void 0&&ot(C)}function At(C){let M=C.texture,Y=i.get(C),J=i.get(M);C.addEventListener("dispose",d);let re=C.textures,xe=C.isWebGLCubeRenderTarget===!0,ve=re.length>1;if(ve||(J.__webglTexture===void 0&&(J.__webglTexture=n.createTexture()),J.__version=M.version,s.memory.textures++),xe){Y.__webglFramebuffer=[];for(let se=0;se<6;se++)if(M.mipmaps&&M.mipmaps.length>0){Y.__webglFramebuffer[se]=[];for(let ue=0;ue<M.mipmaps.length;ue++)Y.__webglFramebuffer[se][ue]=n.createFramebuffer()}else Y.__webglFramebuffer[se]=n.createFramebuffer()}else{if(M.mipmaps&&M.mipmaps.length>0){Y.__webglFramebuffer=[];for(let se=0;se<M.mipmaps.length;se++)Y.__webglFramebuffer[se]=n.createFramebuffer()}else Y.__webglFramebuffer=n.createFramebuffer();if(ve)for(let se=0,ue=re.length;se<ue;se++){let ye=i.get(re[se]);ye.__webglTexture===void 0&&(ye.__webglTexture=n.createTexture(),s.memory.textures++)}if(C.samples>0&&Pt(C)===!1){Y.__webglMultisampledFramebuffer=n.createFramebuffer(),Y.__webglColorRenderbuffer=[],t.bindFramebuffer(n.FRAMEBUFFER,Y.__webglMultisampledFramebuffer);for(let se=0;se<re.length;se++){let ue=re[se];Y.__webglColorRenderbuffer[se]=n.createRenderbuffer(),n.bindRenderbuffer(n.RENDERBUFFER,Y.__webglColorRenderbuffer[se]);let ye=o.convert(ue.format,ue.colorSpace),Ge=o.convert(ue.type),be=y(ue.internalFormat,ye,Ge,ue.normalized,ue.colorSpace,C.isXRRenderTarget===!0),Te=lt(C);n.renderbufferStorageMultisample(n.RENDERBUFFER,Te,be,C.width,C.height),n.framebufferRenderbuffer(n.FRAMEBUFFER,n.COLOR_ATTACHMENT0+se,n.RENDERBUFFER,Y.__webglColorRenderbuffer[se])}n.bindRenderbuffer(n.RENDERBUFFER,null),C.depthBuffer&&(Y.__webglDepthRenderbuffer=n.createRenderbuffer(),Ye(Y.__webglDepthRenderbuffer,C,!0)),t.bindFramebuffer(n.FRAMEBUFFER,null)}}if(xe){t.bindTexture(n.TEXTURE_CUBE_MAP,J.__webglTexture),at(n.TEXTURE_CUBE_MAP,M);for(let se=0;se<6;se++)if(M.mipmaps&&M.mipmaps.length>0)for(let ue=0;ue<M.mipmaps.length;ue++)Fe(Y.__webglFramebuffer[se][ue],C,M,n.COLOR_ATTACHMENT0,n.TEXTURE_CUBE_MAP_POSITIVE_X+se,ue);else Fe(Y.__webglFramebuffer[se],C,M,n.COLOR_ATTACHMENT0,n.TEXTURE_CUBE_MAP_POSITIVE_X+se,0);p(M)&&A(n.TEXTURE_CUBE_MAP),t.unbindTexture()}else if(ve){for(let se=0,ue=re.length;se<ue;se++){let ye=re[se],Ge=i.get(ye),be=n.TEXTURE_2D;(C.isWebGL3DRenderTarget||C.isWebGLArrayRenderTarget)&&(be=C.isWebGL3DRenderTarget?n.TEXTURE_3D:n.TEXTURE_2D_ARRAY),t.bindTexture(be,Ge.__webglTexture),at(be,ye),Fe(Y.__webglFramebuffer,C,ye,n.COLOR_ATTACHMENT0+se,be,0),p(ye)&&A(be)}t.unbindTexture()}else{let se=n.TEXTURE_2D;if((C.isWebGL3DRenderTarget||C.isWebGLArrayRenderTarget)&&(se=C.isWebGL3DRenderTarget?n.TEXTURE_3D:n.TEXTURE_2D_ARRAY),t.bindTexture(se,J.__webglTexture),at(se,M),M.mipmaps&&M.mipmaps.length>0)for(let ue=0;ue<M.mipmaps.length;ue++)Fe(Y.__webglFramebuffer[ue],C,M,n.COLOR_ATTACHMENT0,se,ue);else Fe(Y.__webglFramebuffer,C,M,n.COLOR_ATTACHMENT0,se,0);p(M)&&A(se),t.unbindTexture()}C.depthBuffer&&ot(C)}function ct(C){let M=C.textures;for(let Y=0,J=M.length;Y<J;Y++){let re=M[Y];if(p(re)){let xe=P(C),ve=i.get(re).__webglTexture;t.bindTexture(xe,ve),A(xe),t.unbindTexture()}}}let Rt=[],Nt=[];function Ht(C){if(C.samples>0){if(Pt(C)===!1){let M=C.textures,Y=C.width,J=C.height,re=n.COLOR_BUFFER_BIT,xe=C.stencilBuffer?n.DEPTH_STENCIL_ATTACHMENT:n.DEPTH_ATTACHMENT,ve=i.get(C),se=M.length>1;if(se)for(let ye=0;ye<M.length;ye++)t.bindFramebuffer(n.FRAMEBUFFER,ve.__webglMultisampledFramebuffer),n.framebufferRenderbuffer(n.FRAMEBUFFER,n.COLOR_ATTACHMENT0+ye,n.RENDERBUFFER,null),t.bindFramebuffer(n.FRAMEBUFFER,ve.__webglFramebuffer),n.framebufferTexture2D(n.DRAW_FRAMEBUFFER,n.COLOR_ATTACHMENT0+ye,n.TEXTURE_2D,null,0);t.bindFramebuffer(n.READ_FRAMEBUFFER,ve.__webglMultisampledFramebuffer);let ue=C.texture.mipmaps;ue&&ue.length>0?t.bindFramebuffer(n.DRAW_FRAMEBUFFER,ve.__webglFramebuffer[0]):t.bindFramebuffer(n.DRAW_FRAMEBUFFER,ve.__webglFramebuffer);for(let ye=0;ye<M.length;ye++){if(C.resolveDepthBuffer&&(C.depthBuffer&&(re|=n.DEPTH_BUFFER_BIT),C.stencilBuffer&&C.resolveStencilBuffer&&(re|=n.STENCIL_BUFFER_BIT)),se){n.framebufferRenderbuffer(n.READ_FRAMEBUFFER,n.COLOR_ATTACHMENT0,n.RENDERBUFFER,ve.__webglColorRenderbuffer[ye]);let Ge=i.get(M[ye]).__webglTexture;n.framebufferTexture2D(n.DRAW_FRAMEBUFFER,n.COLOR_ATTACHMENT0,n.TEXTURE_2D,Ge,0)}n.blitFramebuffer(0,0,Y,J,0,0,Y,J,re,n.NEAREST),c===!0&&(Rt.length=0,Nt.length=0,Rt.push(n.COLOR_ATTACHMENT0+ye),C.depthBuffer&&C.storeMultisampledDepthBuffer===!1&&(Rt.push(xe),Nt.push(xe),n.invalidateFramebuffer(n.DRAW_FRAMEBUFFER,Nt)),n.invalidateFramebuffer(n.READ_FRAMEBUFFER,Rt))}if(t.bindFramebuffer(n.READ_FRAMEBUFFER,null),t.bindFramebuffer(n.DRAW_FRAMEBUFFER,null),se)for(let ye=0;ye<M.length;ye++){t.bindFramebuffer(n.FRAMEBUFFER,ve.__webglMultisampledFramebuffer),n.framebufferRenderbuffer(n.FRAMEBUFFER,n.COLOR_ATTACHMENT0+ye,n.RENDERBUFFER,ve.__webglColorRenderbuffer[ye]);let Ge=i.get(M[ye]).__webglTexture;t.bindFramebuffer(n.FRAMEBUFFER,ve.__webglFramebuffer),n.framebufferTexture2D(n.DRAW_FRAMEBUFFER,n.COLOR_ATTACHMENT0+ye,n.TEXTURE_2D,Ge,0)}t.bindFramebuffer(n.DRAW_FRAMEBUFFER,ve.__webglMultisampledFramebuffer)}else if(C.depthBuffer&&C.storeMultisampledDepthBuffer===!1&&c){let M=C.stencilBuffer?n.DEPTH_STENCIL_ATTACHMENT:n.DEPTH_ATTACHMENT;n.invalidateFramebuffer(n.DRAW_FRAMEBUFFER,[M])}}}function lt(C){return Math.min(r.maxSamples,C.samples)}function Pt(C){let M=i.get(C);return C.samples>0&&e.has("WEBGL_multisampled_render_to_texture")===!0&&M.__useRenderToTexture!==!1}function V(C){let M=s.render.frame;h.get(C)!==M&&(h.set(C,M),C.update())}function Kt(C,M){let Y=C.colorSpace,J=C.format,re=C.type;return C.isCompressedTexture===!0||C.isVideoTexture===!0||Y!==Hn&&Y!==Ri&&(tt.getTransfer(Y)===dt?(J!==$t||re!==Bt)&&Ue("WebGLTextures: sRGB encoded textures have to use RGBAFormat and UnsignedByteType."):nt("WebGLTextures: Unsupported texture color space:",Y)),M}function Mt(C){return typeof HTMLImageElement<"u"&&C instanceof HTMLImageElement?(l.width=C.naturalWidth||C.width,l.height=C.naturalHeight||C.height):typeof VideoFrame<"u"&&C instanceof VideoFrame?(l.width=C.displayWidth,l.height=C.displayHeight):(l.width=C.width,l.height=C.height),l}this.allocateTextureUnit=ee,this.resetTextureUnits=X,this.getTextureUnits=U,this.setTextureUnits=K,this.setTexture2D=le,this.setTexture2DArray=te,this.setTexture3D=he,this.setTextureCube=pe,this.rebindTextures=Oe,this.setupRenderTarget=At,this.updateRenderTargetMipmap=ct,this.updateMultisampleRenderTarget=Ht,this.setupDepthRenderbuffer=ot,this.setupFrameBufferTexture=Fe,this.useMultisampledRTT=Pt,this.isReversedDepthBuffer=function(){return t.buffers.depth.getReversed()}}function zd(n,e){function t(i,r=Ri){let o,s=tt.getTransfer(r);if(i===Bt)return n.UNSIGNED_BYTE;if(i===sr)return n.UNSIGNED_SHORT_4_4_4_4;if(i===ar)return n.UNSIGNED_SHORT_5_5_5_1;if(i===ws)return n.UNSIGNED_INT_5_9_9_9_REV;if(i===Rs)return n.UNSIGNED_INT_10F_11F_11F_REV;if(i===Ts)return n.BYTE;if(i===As)return n.SHORT;if(i===Qi)return n.UNSIGNED_SHORT;if(i===or)return n.INT;if(i===Zt)return n.UNSIGNED_INT;if(i===ni)return n.FLOAT;if(i===Jt)return n.HALF_FLOAT;if(i===Cs)return n.ALPHA;if(i===Ps)return n.RGB;if(i===$t)return n.RGBA;if(i===pi)return n.DEPTH_COMPONENT;if(i===Ui)return n.DEPTH_STENCIL;if(i===Ls)return n.RED;if(i===lr)return n.RED_INTEGER;if(i===vi)return n.RG;if(i===cr)return n.RG_INTEGER;if(i===ur)return n.RGBA_INTEGER;if(i===fr||i===hr||i===dr||i===pr)if(s===dt)if(o=e.get("WEBGL_compressed_texture_s3tc_srgb"),o!==null){if(i===fr)return o.COMPRESSED_SRGB_S3TC_DXT1_EXT;if(i===hr)return o.COMPRESSED_SRGB_ALPHA_S3TC_DXT1_EXT;if(i===dr)return o.COMPRESSED_SRGB_ALPHA_S3TC_DXT3_EXT;if(i===pr)return o.COMPRESSED_SRGB_ALPHA_S3TC_DXT5_EXT}else return null;else if(o=e.get("WEBGL_compressed_texture_s3tc"),o!==null){if(i===fr)return o.COMPRESSED_RGB_S3TC_DXT1_EXT;if(i===hr)return o.COMPRESSED_RGBA_S3TC_DXT1_EXT;if(i===dr)return o.COMPRESSED_RGBA_S3TC_DXT3_EXT;if(i===pr)return o.COMPRESSED_RGBA_S3TC_DXT5_EXT}else return null;if(i===mo||i===go||i===_o||i===xo)if(o=e.get("WEBGL_compressed_texture_pvrtc"),o!==null){if(i===mo)return o.COMPRESSED_RGB_PVRTC_4BPPV1_IMG;if(i===go)return o.COMPRESSED_RGB_PVRTC_2BPPV1_IMG;if(i===_o)return o.COMPRESSED_RGBA_PVRTC_4BPPV1_IMG;if(i===xo)return o.COMPRESSED_RGBA_PVRTC_2BPPV1_IMG}else return null;if(i===Mo||i===So||i===vo||i===yo||i===bo||i===zn||i===Eo)if(o=e.get("WEBGL_compressed_texture_etc"),o!==null){if(i===Mo||i===So)return s===dt?o.COMPRESSED_SRGB8_ETC2:o.COMPRESSED_RGB8_ETC2;if(i===vo)return s===dt?o.COMPRESSED_SRGB8_ALPHA8_ETC2_EAC:o.COMPRESSED_RGBA8_ETC2_EAC;if(i===yo)return o.COMPRESSED_R11_EAC;if(i===bo)return o.COMPRESSED_SIGNED_R11_EAC;if(i===zn)return o.COMPRESSED_RG11_EAC;if(i===Eo)return o.COMPRESSED_SIGNED_RG11_EAC}else return null;if(i===To||i===Ao||i===wo||i===Ro||i===Co||i===Po||i===Lo||i===Do||i===Io||i===No||i===Uo||i===Fo||i===Oo||i===Bo)if(o=e.get("WEBGL_compressed_texture_astc"),o!==null){if(i===To)return s===dt?o.COMPRESSED_SRGB8_ALPHA8_ASTC_4x4_KHR:o.COMPRESSED_RGBA_ASTC_4x4_KHR;if(i===Ao)return s===dt?o.COMPRESSED_SRGB8_ALPHA8_ASTC_5x4_KHR:o.COMPRESSED_RGBA_ASTC_5x4_KHR;if(i===wo)return s===dt?o.COMPRESSED_SRGB8_ALPHA8_ASTC_5x5_KHR:o.COMPRESSED_RGBA_ASTC_5x5_KHR;if(i===Ro)return s===dt?o.COMPRESSED_SRGB8_ALPHA8_ASTC_6x5_KHR:o.COMPRESSED_RGBA_ASTC_6x5_KHR;if(i===Co)return s===dt?o.COMPRESSED_SRGB8_ALPHA8_ASTC_6x6_KHR:o.COMPRESSED_RGBA_ASTC_6x6_KHR;if(i===Po)return s===dt?o.COMPRESSED_SRGB8_ALPHA8_ASTC_8x5_KHR:o.COMPRESSED_RGBA_ASTC_8x5_KHR;if(i===Lo)return s===dt?o.COMPRESSED_SRGB8_ALPHA8_ASTC_8x6_KHR:o.COMPRESSED_RGBA_ASTC_8x6_KHR;if(i===Do)return s===dt?o.COMPRESSED_SRGB8_ALPHA8_ASTC_8x8_KHR:o.COMPRESSED_RGBA_ASTC_8x8_KHR;if(i===Io)return s===dt?o.COMPRESSED_SRGB8_ALPHA8_ASTC_10x5_KHR:o.COMPRESSED_RGBA_ASTC_10x5_KHR;if(i===No)return s===dt?o.COMPRESSED_SRGB8_ALPHA8_ASTC_10x6_KHR:o.COMPRESSED_RGBA_ASTC_10x6_KHR;if(i===Uo)return s===dt?o.COMPRESSED_SRGB8_ALPHA8_ASTC_10x8_KHR:o.COMPRESSED_RGBA_ASTC_10x8_KHR;if(i===Fo)return s===dt?o.COMPRESSED_SRGB8_ALPHA8_ASTC_10x10_KHR:o.COMPRESSED_RGBA_ASTC_10x10_KHR;if(i===Oo)return s===dt?o.COMPRESSED_SRGB8_ALPHA8_ASTC_12x10_KHR:o.COMPRESSED_RGBA_ASTC_12x10_KHR;if(i===Bo)return s===dt?o.COMPRESSED_SRGB8_ALPHA8_ASTC_12x12_KHR:o.COMPRESSED_RGBA_ASTC_12x12_KHR}else return null;if(i===Go||i===zo||i===ko)if(o=e.get("EXT_texture_compression_bptc"),o!==null){if(i===Go)return s===dt?o.COMPRESSED_SRGB_ALPHA_BPTC_UNORM_EXT:o.COMPRESSED_RGBA_BPTC_UNORM_EXT;if(i===zo)return o.COMPRESSED_RGB_BPTC_SIGNED_FLOAT_EXT;if(i===ko)return o.COMPRESSED_RGB_BPTC_UNSIGNED_FLOAT_EXT}else return null;if(i===Ho||i===Vo||i===kn||i===Wo)if(o=e.get("EXT_texture_compression_rgtc"),o!==null){if(i===Ho)return o.COMPRESSED_RED_RGTC1_EXT;if(i===Vo)return o.COMPRESSED_SIGNED_RED_RGTC1_EXT;if(i===kn)return o.COMPRESSED_RED_GREEN_RGTC2_EXT;if(i===Wo)return o.COMPRESSED_SIGNED_RED_GREEN_RGTC2_EXT}else return null;return i===ji?n.UNSIGNED_INT_24_8:n[i]!==void 0?n[i]:null}return{convert:t}}var s0=`
void main() {

	gl_Position = vec4( position, 1.0 );

}`,a0=`
uniform sampler2DArray depthColor;
uniform float depthWidth;
uniform float depthHeight;

void main() {

	vec2 coord = vec2( gl_FragCoord.x / depthWidth, gl_FragCoord.y / depthHeight );

	if ( coord.x >= 1.0 ) {

		gl_FragDepth = texture( depthColor, vec3( coord.x - 1.0, coord.y, 1 ) ).r;

	} else {

		gl_FragDepth = texture( depthColor, vec3( coord.x, coord.y, 0 ) ).r;

	}

}`,Ca=class{constructor(){this.texture=null,this.mesh=null,this.depthNear=0,this.depthFar=0}init(e,t){if(this.texture===null){let i=new Ur(e.texture);(e.depthNear!==t.depthNear||e.depthFar!==t.depthFar)&&(this.depthNear=e.depthNear,this.depthFar=e.depthFar),this.texture=i}}getMesh(e){if(this.texture!==null&&this.mesh===null){let t=e.cameras[0].viewport,i=new ti({vertexShader:s0,fragmentShader:a0,uniforms:{depthColor:{value:this.texture},depthWidth:{value:t.z},depthHeight:{value:t.w}}});this.mesh=new Se(new cn(20,20),i)}return this.mesh}reset(){this.texture=null,this.mesh=null}getDepthTexture(){return this.texture}};var Pa=class extends Qt{constructor(e,t){super();let i=this,r=null,o=1,s=null,a="local-floor",c=1,l=null,h=null,m=null,f=null,g=null,x=null,S=typeof XRWebGLBinding<"u",_=new Ca,p={},A=t.getContextAttributes(),P=null,y=null,E=[],b=[],R=new Ce,d=null,T=null,L=new Ot;L.viewport=new xt;let F=new Ot;F.viewport=new xt;let B=[L,F],X=new ya,U=null,K=null;this.cameraAutoUpdate=!0,this.enabled=!1,this.isPresenting=!1,this.getController=function($){let de=E[$];return de===void 0&&(de=new Tr,E[$]=de),de.getTargetRaySpace()},this.getControllerGrip=function($){let de=E[$];return de===void 0&&(de=new Tr,E[$]=de),de.getGripSpace()},this.getHand=function($){let de=E[$];return de===void 0&&(de=new Tr,E[$]=de),de.getHandSpace()};function ee($){let de=b.indexOf($.inputSource);if(de===-1)return;let Ne=E[de];Ne!==void 0&&(Ne.update($.inputSource,$.frame,l||s),Ne.dispatchEvent({type:$.type,data:$.inputSource}))}function j(){r.removeEventListener("select",ee),r.removeEventListener("selectstart",ee),r.removeEventListener("selectend",ee),r.removeEventListener("squeeze",ee),r.removeEventListener("squeezestart",ee),r.removeEventListener("squeezeend",ee),r.removeEventListener("end",j),r.removeEventListener("inputsourceschange",le);for(let $=0;$<E.length;$++){let de=b[$];de!==null&&(b[$]=null,E[$].disconnect(de))}U=null,K=null,_.reset();for(let $ in p)delete p[$];if(e.setRenderTarget(P),g=null,f=null,m=null,r=null,y=null,ht.stop(),i.isPresenting=!1,e.setPixelRatio(d),e.setSize(R.width,R.height,!1),T!==null){let $=T.camera;$.fov=T.fov,$.zoom=T.zoom,$.updateProjectionMatrix(),T=null}i.dispatchEvent({type:"sessionend"})}this.setFramebufferScaleFactor=function($){o=$,i.isPresenting===!0&&Ue("WebXRManager: Cannot change framebuffer scale while presenting.")},this.setReferenceSpaceType=function($){a=$,i.isPresenting===!0&&Ue("WebXRManager: Cannot change reference space type while presenting.")},this.getReferenceSpace=function(){return l||s},this.setReferenceSpace=function($){l=$},this.getBaseLayer=function(){return f!==null?f:g},this.getBinding=function(){return m===null&&S&&(m=new XRWebGLBinding(r,t)),m},this.getFrame=function(){return x},this.getSession=function(){return r},this.setSession=async function($){if(r=$,r!==null){if(P=e.getRenderTarget(),r.addEventListener("select",ee),r.addEventListener("selectstart",ee),r.addEventListener("selectend",ee),r.addEventListener("squeeze",ee),r.addEventListener("squeezestart",ee),r.addEventListener("squeezeend",ee),r.addEventListener("end",j),r.addEventListener("inputsourceschange",le),A.xrCompatible!==!0&&await t.makeXRCompatible(),d=e.getPixelRatio(),e.getSize(R),S&&"createProjectionLayer"in XRWebGLBinding.prototype){let Ne=null,Je=null,Fe=null;A.depth&&(Fe=A.stencil?t.DEPTH24_STENCIL8:t.DEPTH_COMPONENT24,Ne=A.stencil?Ui:pi,Je=A.stencil?ji:Zt);let Ye={colorFormat:t.RGBA8,depthFormat:Fe,scaleFactor:o};m=this.getBinding(),f=m.createProjectionLayer(Ye),r.updateRenderState({layers:[f]}),e.setPixelRatio(1),e.setSize(f.textureWidth,f.textureHeight,!1),y=new Wt(f.textureWidth,f.textureHeight,{format:$t,type:Bt,depthTexture:new Hi(f.textureWidth,f.textureHeight,Je,void 0,void 0,void 0,void 0,void 0,void 0,Ne),stencilBuffer:A.stencil,colorSpace:e.outputColorSpace,samples:A.antialias?4:0,resolveDepthBuffer:f.ignoreDepthValues===!1,resolveStencilBuffer:f.ignoreDepthValues===!1,storeMultisampledDepthBuffer:f.ignoreDepthValues===!1,storeMultisampledStencilBuffer:f.ignoreDepthValues===!1})}else{let Ne={antialias:A.antialias,alpha:!0,depth:A.depth,stencil:A.stencil,framebufferScaleFactor:o};g=new XRWebGLLayer(r,t,Ne),r.updateRenderState({baseLayer:g}),e.setPixelRatio(1),e.setSize(g.framebufferWidth,g.framebufferHeight,!1),y=new Wt(g.framebufferWidth,g.framebufferHeight,{format:$t,type:Bt,colorSpace:e.outputColorSpace,stencilBuffer:A.stencil,resolveDepthBuffer:g.ignoreDepthValues===!1,resolveStencilBuffer:g.ignoreDepthValues===!1,storeMultisampledDepthBuffer:g.ignoreDepthValues===!1,storeMultisampledStencilBuffer:g.ignoreDepthValues===!1})}y.isXRRenderTarget=!0,this.setFoveation(c),l=null,s=await r.requestReferenceSpace(a),ht.setContext(r),ht.start(),i.isPresenting=!0,i.dispatchEvent({type:"sessionstart"})}},this.getEnvironmentBlendMode=function(){if(r!==null)return r.environmentBlendMode},this.getDepthTexture=function(){return _.getDepthTexture()};function le($){for(let de=0;de<$.removed.length;de++){let Ne=$.removed[de],Je=b.indexOf(Ne);Je>=0&&(b[Je]=null,E[Je].disconnect(Ne))}for(let de=0;de<$.added.length;de++){let Ne=$.added[de],Je=b.indexOf(Ne);if(Je===-1){for(let Ye=0;Ye<E.length;Ye++)if(Ye>=b.length){b.push(Ne),Je=Ye;break}else if(b[Ye]===null){b[Ye]=Ne,Je=Ye;break}if(Je===-1)break}let Fe=E[Je];Fe&&Fe.connect(Ne)}}let te=new D,he=new D;function pe($,de,Ne){te.setFromMatrixPosition(de.matrixWorld),he.setFromMatrixPosition(Ne.matrixWorld);let Je=te.distanceTo(he),Fe=de.projectionMatrix.elements,Ye=Ne.projectionMatrix.elements,vt=Fe[14]/(Fe[10]-1),ot=Fe[14]/(Fe[10]+1),Oe=(Fe[9]+1)/Fe[5],At=(Fe[9]-1)/Fe[5],ct=(Fe[8]-1)/Fe[0],Rt=(Ye[8]+1)/Ye[0],Nt=vt*ct,Ht=vt*Rt,lt=Je/(-ct+Rt),Pt=lt*-ct;if(de.matrixWorld.decompose($.position,$.quaternion,$.scale),$.translateX(Pt),$.translateZ(lt),$.matrixWorld.compose($.position,$.quaternion,$.scale),$.matrixWorldInverse.copy($.matrixWorld).invert(),Fe[10]===-1)$.projectionMatrix.copy(de.projectionMatrix),$.projectionMatrixInverse.copy(de.projectionMatrixInverse);else{let V=vt+lt,Kt=ot+lt,Mt=Nt-Pt,C=Ht+(Je-Pt),M=Oe*ot/Kt*V,Y=At*ot/Kt*V;$.projectionMatrix.makePerspective(Mt,C,M,Y,V,Kt),$.projectionMatrixInverse.copy($.projectionMatrix).invert()}}function We($,de){de===null?$.matrixWorld.copy($.matrix):$.matrixWorld.multiplyMatrices(de.matrixWorld,$.matrix),$.matrixWorldInverse.copy($.matrixWorld).invert()}this.updateCamera=function($){if(r===null)return;let de=$.near,Ne=$.far;_.texture!==null&&(_.depthNear>0&&(de=_.depthNear),_.depthFar>0&&(Ne=_.depthFar)),X.near=F.near=L.near=de,X.far=F.far=L.far=Ne,(U!==X.near||K!==X.far)&&(r.updateRenderState({depthNear:X.near,depthFar:X.far}),U=X.near,K=X.far),X.layers.mask=$.layers.mask|6,L.layers.mask=X.layers.mask&-5,F.layers.mask=X.layers.mask&-3;let Je=$.parent,Fe=X.cameras;We(X,Je);for(let Ye=0;Ye<Fe.length;Ye++)We(Fe[Ye],Je);Fe.length===2?pe(X,L,F):X.projectionMatrix.copy(L.projectionMatrix),T===null&&$.isPerspectiveCamera&&(T={camera:$,fov:$.fov,zoom:$.zoom}),ze($,X,Je)};function ze($,de,Ne){Ne===null?$.matrix.copy(de.matrixWorld):($.matrix.copy(Ne.matrixWorld),$.matrix.invert(),$.matrix.multiply(de.matrixWorld)),$.matrix.decompose($.position,$.quaternion,$.scale),$.updateMatrixWorld(!0),$.projectionMatrix.copy(de.projectionMatrix),$.projectionMatrixInverse.copy(de.projectionMatrixInverse),$.isPerspectiveCamera&&($.fov=Wn*2*Math.atan(1/$.projectionMatrix.elements[5]),$.zoom=1)}this.getCamera=function(){return X},this.getFoveation=function(){if(!(f===null&&g===null))return c},this.setFoveation=function($){c=$,f!==null&&(f.fixedFoveation=$),g!==null&&g.fixedFoveation!==void 0&&(g.fixedFoveation=$)},this.hasDepthSensing=function(){return _.texture!==null},this.getDepthSensingMesh=function(){return _.getMesh(X)},this.getCameraTexture=function($){return p[$]};let pt=null;function at($,de){if(h=de.getViewerPose(l||s),x=de,h!==null){let Ne=h.views;g!==null&&(e.setRenderTargetFramebuffer(y,g.framebuffer),e.setRenderTarget(y));let Je=!1;Ne.length!==X.cameras.length&&(X.cameras.length=0,Je=!0);for(let ot=0;ot<Ne.length;ot++){let Oe=Ne[ot],At=null;if(g!==null)At=g.getViewport(Oe);else{let Rt=m.getViewSubImage(f,Oe);At=Rt.viewport,ot===0&&(e.setRenderTargetTextures(y,Rt.colorTexture,Rt.depthStencilTexture),e.setRenderTarget(y))}let ct=B[ot];ct===void 0&&(ct=new Ot,ct.layers.enable(ot),ct.viewport=new xt,B[ot]=ct),ct.matrix.fromArray(Oe.transform.matrix),ct.matrix.decompose(ct.position,ct.quaternion,ct.scale),ct.projectionMatrix.fromArray(Oe.projectionMatrix),ct.projectionMatrixInverse.copy(ct.projectionMatrix).invert(),ct.viewport.set(At.x,At.y,At.width,At.height),ot===0&&(X.matrix.copy(ct.matrix),X.matrix.decompose(X.position,X.quaternion,X.scale)),Je===!0&&X.cameras.push(ct)}let Fe=r.enabledFeatures;if(Fe&&Fe.includes("depth-sensing")&&r.depthUsage=="gpu-optimized"&&S){m=i.getBinding();let ot=m.getDepthInformation(Ne[0]);ot&&ot.isValid&&ot.texture&&_.init(ot,r.renderState)}if(Fe&&Fe.includes("camera-access")&&S){e.state.unbindTexture(),m=i.getBinding();for(let ot=0;ot<Ne.length;ot++){let Oe=Ne[ot].camera;if(Oe){let At=p[Oe];At||(At=new Ur,p[Oe]=At);let ct=m.getCameraImage(Oe);At.sourceTexture=ct}}}}for(let Ne=0;Ne<E.length;Ne++){let Je=b[Ne],Fe=E[Ne];Je!==null&&Fe!==void 0&&Fe.update(Je,de,l||s)}pt&&pt($,de),de.detectedPlanes&&i.dispatchEvent({type:"planesdetected",data:de}),x=null}let ht=new ba;ht.setAnimationLoop(at),this.setAnimationLoop=function($){pt=$},this.dispose=function(){}}};var l0=new it,kd=new qe;kd.set(-1,0,0,0,1,0,0,0,1);function Hd(n,e){function t(_,p){_.matrixAutoUpdate===!0&&_.updateMatrix(),p.value.copy(_.matrix)}function i(_,p){p.color.getRGB(_.fogColor.value,da(n)),p.isFog?(_.fogNear.value=p.near,_.fogFar.value=p.far):p.isFogExp2&&(_.fogDensity.value=p.density)}function r(_,p,A,P,y){p.isNodeMaterial?p.uniformsNeedUpdate=!1:p.isMeshBasicMaterial?o(_,p):p.isMeshLambertMaterial?(o(_,p),p.envMap&&(_.envMapIntensity.value=p.envMapIntensity)):p.isMeshToonMaterial?(o(_,p),m(_,p)):p.isMeshPhongMaterial?(o(_,p),h(_,p),p.envMap&&(_.envMapIntensity.value=p.envMapIntensity)):p.isMeshStandardMaterial?(o(_,p),f(_,p),p.isMeshPhysicalMaterial&&g(_,p,y)):p.isMeshMatcapMaterial?(o(_,p),x(_,p)):p.isMeshDepthMaterial?o(_,p):p.isMeshDistanceMaterial?(o(_,p),S(_,p)):p.isMeshNormalMaterial?o(_,p):p.isLineBasicMaterial?(s(_,p),p.isLineDashedMaterial&&a(_,p)):p.isPointsMaterial?c(_,p,A,P):p.isSpriteMaterial?l(_,p):p.isShadowMaterial?(_.color.value.copy(p.color),_.opacity.value=p.opacity):p.isShaderMaterial&&(p.uniformsNeedUpdate=!1)}function o(_,p){_.opacity.value=p.opacity,p.color&&_.diffuse.value.copy(p.color),p.emissive&&_.emissive.value.copy(p.emissive).multiplyScalar(p.emissiveIntensity),p.map&&(_.map.value=p.map,t(p.map,_.mapTransform)),p.alphaMap&&(_.alphaMap.value=p.alphaMap,t(p.alphaMap,_.alphaMapTransform)),p.bumpMap&&(_.bumpMap.value=p.bumpMap,t(p.bumpMap,_.bumpMapTransform),_.bumpScale.value=p.bumpScale,p.side===Ct&&(_.bumpScale.value*=-1)),p.normalMap&&(_.normalMap.value=p.normalMap,t(p.normalMap,_.normalMapTransform),_.normalScale.value.copy(p.normalScale),p.side===Ct&&_.normalScale.value.negate()),p.displacementMap&&(_.displacementMap.value=p.displacementMap,t(p.displacementMap,_.displacementMapTransform),_.displacementScale.value=p.displacementScale,_.displacementBias.value=p.displacementBias),p.emissiveMap&&(_.emissiveMap.value=p.emissiveMap,t(p.emissiveMap,_.emissiveMapTransform)),p.specularMap&&(_.specularMap.value=p.specularMap,t(p.specularMap,_.specularMapTransform)),p.alphaTest>0&&(_.alphaTest.value=p.alphaTest);let A=e.get(p),P=A.envMap,y=A.envMapRotation;P&&(_.envMap.value=P,_.envMapRotation.value.setFromMatrix4(l0.makeRotationFromEuler(y)).transpose(),P.isCubeTexture&&P.isRenderTargetTexture===!1&&_.envMapRotation.value.premultiply(kd),_.reflectivity.value=p.reflectivity,_.ior.value=p.ior,_.refractionRatio.value=p.refractionRatio),p.lightMap&&(_.lightMap.value=p.lightMap,_.lightMapIntensity.value=p.lightMapIntensity,t(p.lightMap,_.lightMapTransform)),p.aoMap&&(_.aoMap.value=p.aoMap,_.aoMapIntensity.value=p.aoMapIntensity,t(p.aoMap,_.aoMapTransform))}function s(_,p){_.diffuse.value.copy(p.color),_.opacity.value=p.opacity,p.map&&(_.map.value=p.map,t(p.map,_.mapTransform))}function a(_,p){_.dashSize.value=p.dashSize,_.totalSize.value=p.dashSize+p.gapSize,_.scale.value=p.scale}function c(_,p,A,P){_.diffuse.value.copy(p.color),_.opacity.value=p.opacity,_.size.value=p.size*A,_.scale.value=P*.5,p.map&&(_.map.value=p.map,t(p.map,_.uvTransform)),p.alphaMap&&(_.alphaMap.value=p.alphaMap,t(p.alphaMap,_.alphaMapTransform)),p.alphaTest>0&&(_.alphaTest.value=p.alphaTest)}function l(_,p){_.diffuse.value.copy(p.color),_.opacity.value=p.opacity,_.rotation.value=p.rotation,p.map&&(_.map.value=p.map,t(p.map,_.mapTransform)),p.alphaMap&&(_.alphaMap.value=p.alphaMap,t(p.alphaMap,_.alphaMapTransform)),p.alphaTest>0&&(_.alphaTest.value=p.alphaTest)}function h(_,p){_.specular.value.copy(p.specular),_.shininess.value=Math.max(p.shininess,1e-4)}function m(_,p){p.gradientMap&&(_.gradientMap.value=p.gradientMap)}function f(_,p){_.metalness.value=p.metalness,p.metalnessMap&&(_.metalnessMap.value=p.metalnessMap,t(p.metalnessMap,_.metalnessMapTransform)),_.roughness.value=p.roughness,p.roughnessMap&&(_.roughnessMap.value=p.roughnessMap,t(p.roughnessMap,_.roughnessMapTransform)),p.envMap&&(_.envMapIntensity.value=p.envMapIntensity)}function g(_,p,A){_.ior.value=p.ior,p.sheen>0&&(_.sheenColor.value.copy(p.sheenColor).multiplyScalar(p.sheen),_.sheenRoughness.value=p.sheenRoughness,p.sheenColorMap&&(_.sheenColorMap.value=p.sheenColorMap,t(p.sheenColorMap,_.sheenColorMapTransform)),p.sheenRoughnessMap&&(_.sheenRoughnessMap.value=p.sheenRoughnessMap,t(p.sheenRoughnessMap,_.sheenRoughnessMapTransform))),p.clearcoat>0&&(_.clearcoat.value=p.clearcoat,_.clearcoatRoughness.value=p.clearcoatRoughness,p.clearcoatMap&&(_.clearcoatMap.value=p.clearcoatMap,t(p.clearcoatMap,_.clearcoatMapTransform)),p.clearcoatRoughnessMap&&(_.clearcoatRoughnessMap.value=p.clearcoatRoughnessMap,t(p.clearcoatRoughnessMap,_.clearcoatRoughnessMapTransform)),p.clearcoatNormalMap&&(_.clearcoatNormalMap.value=p.clearcoatNormalMap,t(p.clearcoatNormalMap,_.clearcoatNormalMapTransform),_.clearcoatNormalScale.value.copy(p.clearcoatNormalScale),p.side===Ct&&_.clearcoatNormalScale.value.negate())),p.dispersion>0&&(_.dispersion.value=p.dispersion),p.retroreflectivity>0&&(_.retroreflectivity.value=p.retroreflectivity),p.iridescence>0&&(_.iridescence.value=p.iridescence,_.iridescenceIOR.value=p.iridescenceIOR,_.iridescenceThicknessMinimum.value=p.iridescenceThicknessRange[0],_.iridescenceThicknessMaximum.value=p.iridescenceThicknessRange[1],p.iridescenceMap&&(_.iridescenceMap.value=p.iridescenceMap,t(p.iridescenceMap,_.iridescenceMapTransform)),p.iridescenceThicknessMap&&(_.iridescenceThicknessMap.value=p.iridescenceThicknessMap,t(p.iridescenceThicknessMap,_.iridescenceThicknessMapTransform))),p.transmission>0&&(_.transmission.value=p.transmission,_.transmissionSamplerMap.value=A.texture,_.transmissionSamplerSize.value.set(A.width,A.height),p.transmissionMap&&(_.transmissionMap.value=p.transmissionMap,t(p.transmissionMap,_.transmissionMapTransform)),_.thickness.value=p.thickness,p.thicknessMap&&(_.thicknessMap.value=p.thicknessMap,t(p.thicknessMap,_.thicknessMapTransform)),_.attenuationDistance.value=p.attenuationDistance,_.attenuationColor.value.copy(p.attenuationColor)),p.anisotropy>0&&(_.anisotropyVector.value.set(p.anisotropy*Math.cos(p.anisotropyRotation),p.anisotropy*Math.sin(p.anisotropyRotation)),p.anisotropyMap&&(_.anisotropyMap.value=p.anisotropyMap,t(p.anisotropyMap,_.anisotropyMapTransform))),_.specularIntensity.value=p.specularIntensity,_.specularColor.value.copy(p.specularColor),p.specularColorMap&&(_.specularColorMap.value=p.specularColorMap,t(p.specularColorMap,_.specularColorMapTransform)),p.specularIntensityMap&&(_.specularIntensityMap.value=p.specularIntensityMap,t(p.specularIntensityMap,_.specularIntensityMapTransform))}function x(_,p){p.matcap&&(_.matcap.value=p.matcap)}function S(_,p){let A=e.get(p).light;_.referencePosition.value.setFromMatrixPosition(A.matrixWorld),_.nearDistance.value=A.shadow.camera.near,_.farDistance.value=A.shadow.camera.far}return{refreshFogUniforms:i,refreshMaterialUniforms:r}}function Vd(n,e,t,i){let r={},o={},s=[],a=n.getParameter(n.MAX_UNIFORM_BUFFER_BINDINGS);function c(y,E){let b=E.program;i.uniformBlockBinding(y,b)}function l(y,E){let b=r[y.id];b===void 0&&(_(y),b=h(y),r[y.id]=b,y.addEventListener("dispose",A));let R=E.program;i.updateUBOMapping(y,R);let d=e.render.frame;o[y.id]!==d&&(f(y),o[y.id]=d)}function h(y){let E=m();y.__bindingPointIndex=E;let b=n.createBuffer(),R=y.__size,d=y.usage;return n.bindBuffer(n.UNIFORM_BUFFER,b),n.bufferData(n.UNIFORM_BUFFER,R,d),n.bindBuffer(n.UNIFORM_BUFFER,null),n.bindBufferBase(n.UNIFORM_BUFFER,E,b),b}function m(){for(let y=0;y<a;y++)if(s.indexOf(y)===-1)return s.push(y),y;return nt("WebGLRenderer: Maximum number of simultaneously usable uniforms groups reached."),0}function f(y){let E=r[y.id],b=y.uniforms,R=y.__cache;n.bindBuffer(n.UNIFORM_BUFFER,E);for(let d=0,T=b.length;d<T;d++){let L=b[d];if(Array.isArray(L))for(let F=0,B=L.length;F<B;F++)g(L[F],d,F,R);else g(L,d,0,R)}n.bindBuffer(n.UNIFORM_BUFFER,null)}function g(y,E,b,R){if(S(y,E,b,R)===!0){let d=y.__offset,T=y.value;if(Array.isArray(T)){let L=0;for(let F=0;F<T.length;F++){let B=T[F],X=p(B);x(B,y.__data,L),typeof B!="number"&&typeof B!="boolean"&&!B.isMatrix3&&!ArrayBuffer.isView(B)&&(L+=X.storage/Float32Array.BYTES_PER_ELEMENT)}}else x(T,y.__data,0);n.bufferSubData(n.UNIFORM_BUFFER,d,y.__data)}}function x(y,E,b){typeof y=="number"||typeof y=="boolean"?E[0]=y:y.isMatrix3?(E[0]=y.elements[0],E[1]=y.elements[1],E[2]=y.elements[2],E[3]=0,E[4]=y.elements[3],E[5]=y.elements[4],E[6]=y.elements[5],E[7]=0,E[8]=y.elements[6],E[9]=y.elements[7],E[10]=y.elements[8],E[11]=0):ArrayBuffer.isView(y)?E.set(new y.constructor(y.buffer,y.byteOffset,E.length)):y.toArray(E,b)}function S(y,E,b,R){let d=y.value,T=E+"_"+b;if(R[T]===void 0)return typeof d=="number"||typeof d=="boolean"?R[T]=d:ArrayBuffer.isView(d)?R[T]=d.slice():R[T]=d.clone(),!0;{let L=R[T];if(typeof d=="number"||typeof d=="boolean"){if(L!==d)return R[T]=d,!0}else{if(ArrayBuffer.isView(d))return!0;if(L.equals(d)===!1)return L.copy(d),!0}}return!1}function _(y){let E=y.uniforms,b=0,R=16;for(let T=0,L=E.length;T<L;T++){let F=Array.isArray(E[T])?E[T]:[E[T]];for(let B=0,X=F.length;B<X;B++){let U=F[B],K=Array.isArray(U.value)?U.value:[U.value];for(let ee=0,j=K.length;ee<j;ee++){let le=K[ee],te=p(le),he=b%R,pe=he%te.boundary,We=he+pe;b+=pe,We!==0&&R-We<te.storage&&(b+=R-We),U.__data=new Float32Array(te.storage/Float32Array.BYTES_PER_ELEMENT),U.__offset=b,b+=te.storage}}}let d=b%R;return d>0&&(b+=R-d),y.__size=b,y.__cache={},this}function p(y){let E={boundary:0,storage:0};return typeof y=="number"||typeof y=="boolean"?(E.boundary=4,E.storage=4):y.isVector2?(E.boundary=8,E.storage=8):y.isVector3||y.isColor?(E.boundary=16,E.storage=12):y.isVector4?(E.boundary=16,E.storage=16):y.isMatrix3?(E.boundary=48,E.storage=48):y.isMatrix4?(E.boundary=64,E.storage=64):y.isTexture?Ue("WebGLRenderer: Texture samplers can not be part of an uniforms group."):ArrayBuffer.isView(y)?(E.boundary=16,E.storage=y.byteLength):Ue("WebGLRenderer: Unsupported uniform value type.",y),E}function A(y){let E=y.target;E.removeEventListener("dispose",A);let b=s.indexOf(E.__bindingPointIndex);s.splice(b,1),n.deleteBuffer(r[E.id]),delete r[E.id],delete o[E.id]}function P(){for(let y in r)n.deleteBuffer(r[y]);s=[],r={},o={}}return{bind:c,update:l,dispose:P}}var c0=new Uint16Array([12469,15057,12620,14925,13266,14620,13807,14376,14323,13990,14545,13625,14713,13328,14840,12882,14931,12528,14996,12233,15039,11829,15066,11525,15080,11295,15085,10976,15082,10705,15073,10495,13880,14564,13898,14542,13977,14430,14158,14124,14393,13732,14556,13410,14702,12996,14814,12596,14891,12291,14937,11834,14957,11489,14958,11194,14943,10803,14921,10506,14893,10278,14858,9960,14484,14039,14487,14025,14499,13941,14524,13740,14574,13468,14654,13106,14743,12678,14818,12344,14867,11893,14889,11509,14893,11180,14881,10751,14852,10428,14812,10128,14765,9754,14712,9466,14764,13480,14764,13475,14766,13440,14766,13347,14769,13070,14786,12713,14816,12387,14844,11957,14860,11549,14868,11215,14855,10751,14825,10403,14782,10044,14729,9651,14666,9352,14599,9029,14967,12835,14966,12831,14963,12804,14954,12723,14936,12564,14917,12347,14900,11958,14886,11569,14878,11247,14859,10765,14828,10401,14784,10011,14727,9600,14660,9289,14586,8893,14508,8533,15111,12234,15110,12234,15104,12216,15092,12156,15067,12010,15028,11776,14981,11500,14942,11205,14902,10752,14861,10393,14812,9991,14752,9570,14682,9252,14603,8808,14519,8445,14431,8145,15209,11449,15208,11451,15202,11451,15190,11438,15163,11384,15117,11274,15055,10979,14994,10648,14932,10343,14871,9936,14803,9532,14729,9218,14645,8742,14556,8381,14461,8020,14365,7603,15273,10603,15272,10607,15267,10619,15256,10631,15231,10614,15182,10535,15118,10389,15042,10167,14963,9787,14883,9447,14800,9115,14710,8665,14615,8318,14514,7911,14411,7507,14279,7198,15314,9675,15313,9683,15309,9712,15298,9759,15277,9797,15229,9773,15166,9668,15084,9487,14995,9274,14898,8910,14800,8539,14697,8234,14590,7790,14479,7409,14367,7067,14178,6621,15337,8619,15337,8631,15333,8677,15325,8769,15305,8871,15264,8940,15202,8909,15119,8775,15022,8565,14916,8328,14804,8009,14688,7614,14569,7287,14448,6888,14321,6483,14088,6171,15350,7402,15350,7419,15347,7480,15340,7613,15322,7804,15287,7973,15229,8057,15148,8012,15046,7846,14933,7611,14810,7357,14682,7069,14552,6656,14421,6316,14251,5948,14007,5528,15356,5942,15356,5977,15353,6119,15348,6294,15332,6551,15302,6824,15249,7044,15171,7122,15070,7050,14949,6861,14818,6611,14679,6349,14538,6067,14398,5651,14189,5311,13935,4958,15359,4123,15359,4153,15356,4296,15353,4646,15338,5160,15311,5508,15263,5829,15188,6042,15088,6094,14966,6001,14826,5796,14678,5543,14527,5287,14377,4985,14133,4586,13869,4257,15360,1563,15360,1642,15358,2076,15354,2636,15341,3350,15317,4019,15273,4429,15203,4732,15105,4911,14981,4932,14836,4818,14679,4621,14517,4386,14359,4156,14083,3795,13808,3437,15360,122,15360,137,15358,285,15355,636,15344,1274,15322,2177,15281,2765,15215,3223,15120,3451,14995,3569,14846,3567,14681,3466,14511,3305,14344,3121,14037,2800,13753,2467,15360,0,15360,1,15359,21,15355,89,15346,253,15325,479,15287,796,15225,1148,15133,1492,15008,1749,14856,1882,14685,1886,14506,1783,14324,1608,13996,1398,13702,1183]),Yi=null;function Wd(){return Yi===null&&(Yi=new js(c0,16,16,vi,Jt),Yi.name="DFG_LUT",Yi.minFilter=Ut,Yi.magFilter=Ut,Yi.wrapS=_i,Yi.wrapT=_i,Yi.generateMipmaps=!1,Yi.needsUpdate=!0),Yi}var cs=class{constructor(e={}){let{canvas:t=Ac(),context:i=null,depth:r=!0,stencil:o=!1,alpha:s=!1,antialias:a=!1,premultipliedAlpha:c=!0,preserveDrawingBuffer:l=!1,powerPreference:h="default",failIfMajorPerformanceCaveat:m=!1,reversedDepthBuffer:f=!1,outputBufferType:g=Bt}=e;this.isWebGLRenderer=!0;let x;if(i!==null){if(typeof WebGLRenderingContext<"u"&&i instanceof WebGLRenderingContext)throw new Error("THREE.WebGLRenderer: WebGL 1 is not supported since r163.");x=i.getContextAttributes().alpha}else x=s;let S=g,_=new Set([ur,cr,lr]),p=new Set([Bt,Zt,Qi,ji,sr,ar]),A=new Uint32Array(4),P=new Int32Array(4),y=new D,E=null,b=null,R=[],d=[],T=null;this.domElement=t,this.debug={checkShaderErrors:!0,diagnostics:{keywords:!1},onShaderError:null},this.autoClear=!0,this.autoClearColor=!0,this.autoClearDepth=!0,this.autoClearStencil=!0,this.sortObjects=!0,this.clippingPlanes=[],this.localClippingEnabled=!1,this.toneMapping=di,this.toneMappingExposure=1,this.transmissionResolutionScale=1;let L=this,F=!1,B=null,X=null,U=null,K=null;this._outputColorSpace=Vt;let ee=0,j=0,le=null,te=-1,he=null,pe=new xt,We=new xt,ze=null,pt=new Le(0),at=0,ht=t.width,$=t.height,de=1,Ne=null,Je=null,Fe=new xt(0,0,ht,$),Ye=new xt(0,0,ht,$),vt=!1,ot=new An,Oe=!1,At=!1,ct=new it,Rt=new D,Nt=new xt,Ht={background:null,fog:null,environment:null,overrideMaterial:null,isScene:!0},lt=!1;function Pt(){return le===null?de:1}let V=i;function Kt(u,v){return t.getContext(u,v)}let Mt,C,M,Y,J,re,xe,ve,se,ue,ye,Ge,be,Te,ke,Ke,$e,H,Ee,ae,Ae,De,me;try{let u={alpha:!0,depth:r,stencil:o,antialias:a,premultipliedAlpha:c,preserveDrawingBuffer:l,powerPreference:h,failIfMajorPerformanceCaveat:m};if("setAttribute"in t&&t.setAttribute("data-engine",`three.js r${"186"}`),t.addEventListener("webglcontextlost",yt,!1),t.addEventListener("webglcontextrestored",_t,!1),t.addEventListener("webglcontextcreationerror",oi,!1),V===null){let v="webgl2";if(V=Kt(v,u),V===null)throw Kt(v)?new Error("THREE.WebGLRenderer: Error creating WebGL context with your selected attributes."):new Error("THREE.WebGLRenderer: Error creating WebGL context.")}Xe()}catch(u){throw t.removeEventListener("webglcontextlost",yt,!1),t.removeEventListener("webglcontextrestored",_t,!1),t.removeEventListener("webglcontextcreationerror",oi,!1),nt("WebGLRenderer: "+u.message),u}function Xe(){Mt=new id(V),Mt.init(),Ae=new zd(V,Mt),C=new Zh(V,Mt,e,Ae),M=new Bd(V,Mt),C.reversedDepthBuffer&&f&&M.buffers.depth.setReversed(!0),X=V.createFramebuffer(),U=V.createFramebuffer(),K=V.createFramebuffer(),Y=new od(V),J=new wd,re=new Gd(V,Mt,M,J,C,Ae,Y),xe=new td(L),ve=new cu(V),De=new Yh(V,ve),se=new nd(V,ve,Y,De),ue=new ad(V,se,ve,De,Y),H=new sd(V,C,re),ke=new Jh(J),ye=new Ad(L,xe,Mt,C,De,ke),Ge=new Hd(L,J),be=new Pd,Te=new Id(Mt),$e=new qh(L,xe,M,ue,x,c),Ke=new Od(L,ue,C),me=new Vd(V,Y,C,M),Ee=new Kh(V,Mt,Y),ae=new rd(V,Mt,Y),Y.programs=ye.programs,L.capabilities=C,L.extensions=Mt,L.properties=J,L.renderLists=be,L.shadowMap=Ke,L.state=M,L.info=Y}S!==Bt&&(T=new ld(S,t.width,t.height,a,r,o));let Pe=new Pa(L,V);this.xr=Pe,this.getContext=function(){return V},this.getContextAttributes=function(){return V.getContextAttributes()},this.forceContextLoss=function(){let u=Mt.get("WEBGL_lose_context");u&&u.loseContext()},this.forceContextRestore=function(){let u=Mt.get("WEBGL_lose_context");u&&u.restoreContext()},this.getPixelRatio=function(){return de},this.setPixelRatio=function(u){u!==void 0&&(de=u,this.setSize(ht,$,!1))},this.getSize=function(u){return u.set(ht,$)},this.setSize=function(u,v,I=!0){if(Pe.isPresenting){Ue("WebGLRenderer: Can't change size while VR device is presenting.");return}ht=u,$=v,t.width=Math.floor(u*de),t.height=Math.floor(v*de),I===!0&&(t.style.width=u+"px",t.style.height=v+"px"),T!==null&&T.setSize(t.width,t.height),this.setViewport(0,0,u,v)},this.getDrawingBufferSize=function(u){return u.set(ht*de,$*de).floor()},this.setDrawingBufferSize=function(u,v,I){ht=u,$=v,de=I,t.width=Math.floor(u*I),t.height=Math.floor(v*I),this.setViewport(0,0,u,v)},this.setEffects=function(u){if(S===Bt){nt("WebGLRenderer: setEffects() requires outputBufferType set to HalfFloatType or FloatType.");return}if(u){for(let v=0;v<u.length;v++)if(u[v].isOutputPass===!0){Ue("WebGLRenderer: OutputPass is not needed in setEffects(). Tone mapping and color space conversion are applied automatically.");break}}T.setEffects(u||[])},this.getCurrentViewport=function(u){return u.copy(pe)},this.getViewport=function(u){return u.copy(Fe)},this.setViewport=function(u,v,I,N){u.isVector4?Fe.set(u.x,u.y,u.z,u.w):Fe.set(u,v,I,N),M.viewport(pe.copy(Fe).multiplyScalar(de).round())},this.getScissor=function(u){return u.copy(Ye)},this.setScissor=function(u,v,I,N){u.isVector4?Ye.set(u.x,u.y,u.z,u.w):Ye.set(u,v,I,N),M.scissor(We.copy(Ye).multiplyScalar(de).round())},this.getScissorTest=function(){return vt},this.setScissorTest=function(u){M.setScissorTest(vt=u)},this.setOpaqueSort=function(u){Ne=u},this.setTransparentSort=function(u){Je=u},this.getClearColor=function(u){return u.copy($e.getClearColor())},this.setClearColor=function(){$e.setClearColor(...arguments)},this.getClearAlpha=function(){return $e.getClearAlpha()},this.setClearAlpha=function(){$e.setClearAlpha(...arguments)},this.clear=function(u=!0,v=!0,I=!0){let N=0;if(u){let O=!1;if(le!==null){let ce=le.texture.format;O=_.has(ce)}if(O){let ce=le.texture.type,ie=p.has(ce),q=$e.getClearColor(),W=$e.getClearAlpha(),Z=q.r,ne=q.g,fe=q.b;ie?(A[0]=Z,A[1]=ne,A[2]=fe,A[3]=W,V.clearBufferuiv(V.COLOR,0,A)):(P[0]=Z,P[1]=ne,P[2]=fe,P[3]=W,V.clearBufferiv(V.COLOR,0,P))}else N|=V.COLOR_BUFFER_BIT}v&&(N|=V.DEPTH_BUFFER_BIT,this.state.buffers.depth.setMask(!0)),I&&(N|=V.STENCIL_BUFFER_BIT,this.state.buffers.stencil.setMask(4294967295)),N!==0&&V.clear(N)},this.clearColor=function(){this.clear(!0,!1,!1)},this.clearDepth=function(){this.clear(!1,!0,!1)},this.clearStencil=function(){this.clear(!1,!1,!0)},this.setNodesHandler=function(u){u.setRenderer(this),B=u},this.dispose=function(){t.removeEventListener("webglcontextlost",yt,!1),t.removeEventListener("webglcontextrestored",_t,!1),t.removeEventListener("webglcontextcreationerror",oi,!1),$e.dispose(),be.dispose(),Te.dispose(),J.dispose(),xe.dispose(),ue.dispose(),De.dispose(),me.dispose(),ye.dispose(),Pe.dispose(),Pe.removeEventListener("sessionstart",Qr),Pe.removeEventListener("sessionend",jr),gi.stop()};function yt(u){u.preventDefault(),Ya("WebGLRenderer: Context Lost."),F=!0}function _t(){Ya("WebGLRenderer: Context Restored."),F=!1;let u=Y.autoReset,v=Ke.enabled,I=Ke.autoUpdate,N=Ke.needsUpdate,O=Ke.type;Xe(),Y.autoReset=u,Ke.enabled=v,Ke.autoUpdate=I,Ke.needsUpdate=N,Ke.type=O}function oi(u){nt("WebGLRenderer: A WebGL context could not be created. Reason: ",u.statusMessage)}function Mi(u){let v=u.target;v.removeEventListener("dispose",Mi),Oa(v)}function Oa(u){Ba(u),J.remove(u)}function Ba(u){let v=J.get(u).programs;v!==void 0&&(v.forEach(function(I){ye.releaseProgram(I)}),u.isShaderMaterial&&ye.releaseShaderCache(u))}this.renderBufferDirect=function(u,v,I,N,O,ce){v===null&&(v=Ht);let ie=O.isMesh&&O.matrixWorld.determinantAffine()<0,q=w(u,v,I,N,O);M.setMaterial(N,ie);let W=I.index,Z=1;if(N.wireframe===!0){if(W=se.getWireframeAttribute(I),W===void 0)return;Z=2}let ne=I.drawRange,fe=I.attributes.position,Q=ne.start*Z,ge=(ne.start+ne.count)*Z;ce!==null&&(Q=Math.max(Q,ce.start*Z),ge=Math.min(ge,(ce.start+ce.count)*Z)),W!==null?(Q=Math.max(Q,0),ge=Math.min(ge,W.count)):fe!=null&&(Q=Math.max(Q,0),ge=Math.min(ge,fe.count));let oe=ge-Q;if(oe<0||oe===1/0)return;De.setup(O,N,q,I,W);let _e,Ie=Ee;if(W!==null&&(_e=ve.get(W),Ie=ae,Ie.setIndex(_e)),O.isMesh)N.wireframe===!0?(M.setLineWidth(N.wireframeLinewidth*Pt()),Ie.setMode(V.LINES)):Ie.setMode(V.TRIANGLES);else if(O.isLine){let st=N.linewidth;st===void 0&&(st=1),M.setLineWidth(st*Pt()),O.isLineSegments?Ie.setMode(V.LINES):O.isLineLoop?Ie.setMode(V.LINE_LOOP):Ie.setMode(V.LINE_STRIP)}else O.isPoints?Ie.setMode(V.POINTS):O.isSprite&&Ie.setMode(V.TRIANGLES);if(O.isBatchedMesh)if(Mt.get("WEBGL_multi_draw"))Ie.renderMultiDraw(O._multiDrawStarts,O._multiDrawCounts,O._multiDrawCount);else{let st=O._multiDrawStarts,Me=O._multiDrawCounts,mt=O._multiDrawCount,Be=W?ve.get(W).bytesPerElement:1,Et=J.get(N).currentProgram.getUniforms();for(let bt=0;bt<mt;bt++)Et.setValue(V,"_gl_DrawID",bt),Ie.render(st[bt]/Be,Me[bt])}else if(O.isInstancedMesh)Ie.renderInstances(Q,oe,O.count);else if(I.isInstancedBufferGeometry){let st=I._maxInstanceCount!==void 0?I._maxInstanceCount:1/0,Me=Math.min(I.instanceCount,st);Ie.renderInstances(Q,oe,Me)}else Ie.render(Q,oe)};function Jr(u,v,I,N){B!==null&&u.isNodeMaterial&&B.setObject(N,u),Oe===!0&&ke.setState(u,I,!1),u.transparent===!0&&u.side===ii&&u.forceSinglePass===!1?(u.side=Ct,u.needsUpdate=!0,Nn(u,v,N),u.side=Ti,u.needsUpdate=!0,Nn(u,v,N),u.side=ii):Nn(u,v,N)}this.compile=function(u,v,I=null){I===null&&(I=u),B!==null&&B.renderStart(u,v,I),b=Te.get(I),b.init(v),d.push(b),I.traverseVisible(function(O){O.isLight&&O.layers.test(v.layers)&&(b.pushLight(O),O.castShadow&&b.pushShadow(O))}),u!==I&&u.traverseVisible(function(O){O.isLight&&O.layers.test(v.layers)&&(b.pushLight(O),O.castShadow&&b.pushShadow(O))}),b.setupLights(),B!==null&&B.updateLights(b.state.lightsArray),At=this.localClippingEnabled,Oe=ke.init(this.clippingPlanes,At),Oe===!0&&ke.setGlobalState(this.clippingPlanes,v),B!==null&&Ke.render(b.state.shadowsArray,I,v);let N=new Set;return u.traverse(function(O){if(!(O.isMesh||O.isPoints||O.isLine||O.isSprite))return;let ce=O.material;if(ce)if(Array.isArray(ce))for(let ie=0;ie<ce.length;ie++){let q=ce[ie];Jr(q,I,v,O),N.add(q)}else Jr(ce,I,v,O),N.add(ce)}),b=d.pop(),B!==null&&B.renderEnd(),N},this.compileAsync=function(u,v,I=null){let N=this.compile(u,v,I);return new Promise(O=>{function ce(){if(N.forEach(function(ie){let W=J.get(ie).currentProgram;(W===void 0||W.isReady())&&N.delete(ie)}),N.size===0){O(u);return}setTimeout(ce,10)}Mt.get("KHR_parallel_shader_compile")!==null?ce():setTimeout(ce,10)})};let $r=null;function Ga(u){$r&&$r(u)}function Qr(){gi.stop()}function jr(){gi.start()}let gi=new ba;gi.setAnimationLoop(Ga),typeof self<"u"&&gi.setContext(self),this.setAnimationLoop=function(u){$r=u,Pe.setAnimationLoop(u),u===null?gi.stop():gi.start()},Pe.addEventListener("sessionstart",Qr),Pe.addEventListener("sessionend",jr),this.render=function(u,v){if(v!==void 0&&v.isCamera!==!0){nt("WebGLRenderer.render: camera is not an instance of THREE.Camera.");return}if(F===!0)return;B!==null&&B.renderStart(u,v);let I=Pe.enabled===!0&&Pe.isPresenting===!0,N=T!==null&&(le===null||I)&&T.begin(L,le);if(u.matrixWorldAutoUpdate===!0&&u.updateMatrixWorld(),v.parent===null&&v.matrixWorldAutoUpdate===!0&&v.updateMatrixWorld(),Pe.enabled===!0&&Pe.isPresenting===!0&&(T===null||T.isCompositing()===!1)&&(Pe.cameraAutoUpdate===!0&&Pe.updateCamera(v),v=Pe.getCamera()),u.isScene===!0&&u.onBeforeRender(L,u,v,le),b=Te.get(u,d.length),b.init(v),b.state.textureUnits=re.getTextureUnits(),d.push(b),ct.multiplyMatrices(v.projectionMatrix,v.matrixWorldInverse),ot.setFromProjectionMatrix(ct,mi,v.reversedDepth),At=this.localClippingEnabled,Oe=ke.init(this.clippingPlanes,At),E=be.get(u,R.length),E.init(),R.push(E),Pe.enabled===!0&&Pe.isPresenting===!0){let ie=L.xr.getDepthSensingMesh();ie!==null&&nr(ie,v,-1/0,L.sortObjects)}nr(u,v,0,L.sortObjects),E.finish(),B!==null&&B.updateLights(b.state.lightsArray),L.sortObjects===!0&&E.sort(Ne,Je),lt=Pe.enabled===!1||Pe.isPresenting===!1||Pe.hasDepthSensing()===!1,lt&&$e.addToRenderList(E,u),this.info.render.frame++,this.info.autoReset===!0&&this.info.reset(),Oe===!0&&ke.beginShadows();let O=b.state.shadowsArray;if(Ke.render(O,u,v),Oe===!0&&ke.endShadows(),(N&&T.hasRenderPass())===!1){let ie=E.opaque,q=E.transmissive;if(b.setupLights(),v.isArrayCamera){let W=v.cameras;if(q.length>0)for(let Z=0,ne=W.length;Z<ne;Z++){let fe=W[Z];to(ie,q,u,fe)}lt&&$e.render(u);for(let Z=0,ne=W.length;Z<ne;Z++){let fe=W[Z];eo(E,u,fe,fe.viewport)}}else q.length>0&&to(ie,q,u,v),lt&&$e.render(u),eo(E,u,v)}le!==null&&j===0&&(re.updateMultisampleRenderTarget(le),re.updateRenderTargetMipmap(le)),N&&T.end(L),u.isScene===!0&&u.onAfterRender(L,u,v),De.resetDefaultState(),te=-1,he=null,d.pop(),d.length>0?(b=d[d.length-1],re.setTextureUnits(b.state.textureUnits),Oe===!0&&ke.setGlobalState(L.clippingPlanes,b.state.camera)):b=null,R.pop(),R.length>0?E=R[R.length-1]:E=null,B!==null&&B.renderEnd()};function nr(u,v,I,N){if(u.visible===!1)return;if(u.layers.test(v.layers)){if(u.isGroup)I=u.renderOrder;else if(u.isLOD)u.autoUpdate===!0&&u.update(v);else if(u.isLightProbeGrid)b.pushLightProbeGrid(u);else if(u.isLight)b.pushLight(u),u.castShadow&&b.pushShadow(u);else if(u.isSprite){if(!u.frustumCulled||u.intersectsFrustum(ot)){N&&Nt.setFromMatrixPosition(u.matrixWorld).applyMatrix4(ct);let ie=ue.update(u),q=u.material;q.visible&&E.push(u,ie,q,I,Nt.z,null,v)}}else if((u.isMesh||u.isLine||u.isPoints)&&(!u.frustumCulled||u.intersectsFrustum(ot))){let ie=ue.update(u),q=u.material;if(N&&(u.boundingSphere!==void 0?(u.boundingSphere===null&&u.computeBoundingSphere(),Nt.copy(u.boundingSphere.center)):(ie.boundingSphere===null&&ie.computeBoundingSphere(),Nt.copy(ie.boundingSphere.center)),Nt.applyMatrix4(u.matrixWorld).applyMatrix4(ct)),Array.isArray(q)){let W=ie.groups;for(let Z=0,ne=W.length;Z<ne;Z++){let fe=W[Z],Q=q[fe.materialIndex];Q&&Q.visible&&E.push(u,ie,Q,I,Nt.z,fe,v)}}else q.visible&&E.push(u,ie,q,I,Nt.z,null,v)}}let ce=u.children;for(let ie=0,q=ce.length;ie<q;ie++)nr(ce[ie],v,I,N)}function eo(u,v,I,N){let{opaque:O,transmissive:ce,transparent:ie}=u;b.setupLightsView(I),Oe===!0&&ke.setGlobalState(L.clippingPlanes,I),N&&M.viewport(pe.copy(N)),O.length>0&&Ki(O,v,I),ce.length>0&&Ki(ce,v,I),ie.length>0&&Ki(ie,v,I),M.buffers.depth.setTest(!0),M.buffers.depth.setMask(!0),M.buffers.color.setMask(!0),M.setPolygonOffset(!1)}function to(u,v,I,N){if((I.isScene===!0?I.overrideMaterial:null)!==null)return;if(b.state.transmissionRenderTarget[N.id]===void 0){let Q=Mt.has("EXT_color_buffer_half_float")||Mt.has("EXT_color_buffer_float");b.state.transmissionRenderTarget[N.id]=new Wt(1,1,{generateMipmaps:!0,type:Q?Jt:Bt,minFilter:Ni,samples:Math.max(4,C.samples),stencilBuffer:o,resolveDepthBuffer:!1,resolveStencilBuffer:!1,storeMultisampledDepthBuffer:!1,storeMultisampledStencilBuffer:!1,colorSpace:tt.workingColorSpace})}let ce=b.state.transmissionRenderTarget[N.id],ie=N.viewport||pe;ce.setSize(ie.z*L.transmissionResolutionScale,ie.w*L.transmissionResolutionScale);let q=L.getRenderTarget(),W=L.getActiveCubeFace(),Z=L.getActiveMipmapLevel();L.setRenderTarget(ce),L.getClearColor(pt),at=L.getClearAlpha(),at<1&&L.setClearColor(16777215,.5),L.clear(),lt&&$e.render(I);let ne=L.toneMapping;L.toneMapping=di;let fe=N.viewport;if(N.viewport!==void 0&&(N.viewport=void 0),b.setupLightsView(N),Oe===!0&&ke.setGlobalState(L.clippingPlanes,N),Ki(u,I,N),re.updateMultisampleRenderTarget(ce),re.updateRenderTargetMipmap(ce),Mt.has("WEBGL_multisampled_render_to_texture")===!1){let Q=!1;for(let ge=0,oe=v.length;ge<oe;ge++){let _e=v[ge],{object:Ie,geometry:st,material:Me,group:mt}=_e;if(Me.side===ii&&Ie.layers.test(N.layers)){let Be=Me.side;Me.side=Ct,Me.needsUpdate=!0,io(Ie,I,N,st,Me,mt),Me.side=Be,Me.needsUpdate=!0,Q=!0}}Q===!0&&(re.updateMultisampleRenderTarget(ce),re.updateRenderTargetMipmap(ce))}L.setRenderTarget(q,W,Z),L.setClearColor(pt,at),fe!==void 0&&(N.viewport=fe),L.toneMapping=ne}function Ki(u,v,I){let N=v.isScene===!0?v.overrideMaterial:null;for(let O=0,ce=u.length;O<ce;O++){let ie=u[O],{object:q,geometry:W,group:Z}=ie,ne=ie.material;ne.allowOverride===!0&&N!==null&&(ne=N),q.layers.test(I.layers)&&io(q,v,I,W,ne,Z)}}function io(u,v,I,N,O,ce){B!==null&&O.isNodeMaterial&&B.setObject(u,O),u.onBeforeRender(L,v,I,N,O,ce),u.modelViewMatrix.multiplyMatrices(I.matrixWorldInverse,u.matrixWorld),u.normalMatrix.getNormalMatrix(u.modelViewMatrix),O.onBeforeRender(L,v,I,N,u,ce),O.transparent===!0&&O.side===ii&&O.forceSinglePass===!1?(O.side=Ct,O.needsUpdate=!0,L.renderBufferDirect(I,v,N,O,u,ce),O.side=Ti,O.needsUpdate=!0,L.renderBufferDirect(I,v,N,O,u,ce),O.side=ii):L.renderBufferDirect(I,v,N,O,u,ce),u.onAfterRender(L,v,I,N,O,ce)}function Nn(u,v,I){v.isScene!==!0&&(v=Ht);let N=J.get(u),O=b.state.lights,ce=b.state.shadowsArray,ie=O.state.version,q=ye.getParameters(u,O.state,ce,v,I,b.state.lightProbeGridArray),W=ye.getProgramCacheKey(q),Z=N.programs;N.environment=u.isMeshStandardMaterial||u.isMeshLambertMaterial||u.isMeshPhongMaterial?v.environment:null,N.fog=v.fog;let ne=u.isMeshStandardMaterial||u.isMeshLambertMaterial&&!u.envMap||u.isMeshPhongMaterial&&!u.envMap;N.envMap=xe.get(u.envMap||N.environment,ne),N.envMapRotation=N.environment!==null&&u.envMap===null?v.environmentRotation:u.envMapRotation,Z===void 0&&(u.addEventListener("dispose",Mi),Z=new Map,N.programs=Z);let fe=Z.get(W);if(fe!==void 0){if(N.currentProgram===fe&&N.lightsStateVersion===ie)return Un(u,q),fe}else q.uniforms=ye.getUniforms(u),B!==null&&u.isNodeMaterial&&B.build(u,I,q),u.onBeforeCompile(q,L),fe=ye.acquireProgram(q,W),Z.set(W,fe),N.uniforms=q.uniforms;let Q=N.uniforms;return(!u.isShaderMaterial&&!u.isRawShaderMaterial||u.clipping===!0)&&(Q.clippingPlanes=ke.uniform),Un(u,q),N.needsLights=G(u),N.lightsStateVersion=ie,N.needsLights&&(Q.ambientLightColor.value=O.state.ambient,Q.lightProbe.value=O.state.probe,Q.sunLights.value=O.state.sun,Q.sunLightShadows.value=O.state.sunShadow,Q.directionalLights.value=O.state.directional,Q.directionalLightShadows.value=O.state.directionalShadow,Q.spotLights.value=O.state.spot,Q.spotLightShadows.value=O.state.spotShadow,Q.rectAreaLights.value=O.state.rectArea,Q.ltc_1.value=O.state.rectAreaLTC1,Q.ltc_2.value=O.state.rectAreaLTC2,Q.pointLights.value=O.state.point,Q.pointLightShadows.value=O.state.pointShadow,Q.hemisphereLights.value=O.state.hemi,Q.sunShadowMatrix.value=O.state.sunShadowMatrix,Q.sunShadowCascade.value=O.state.sunShadowCascade,Q.directionalShadowMatrix.value=O.state.directionalShadowMatrix,Q.spotLightMatrix.value=O.state.spotLightMatrix,Q.spotLightMap.value=O.state.spotLightMap,Q.pointShadowMatrix.value=O.state.pointShadowMatrix),N.lightProbeGrid=b.state.lightProbeGridArray.length>0,N.currentProgram=fe,N.uniformsList=null,fe}function no(u){if(u.uniformsList===null){let v=u.currentProgram.getUniforms();u.uniformsList=Ln.seqWithValue(v.seq,u.uniforms)}return u.uniformsList}function Un(u,v){let I=J.get(u);I.outputColorSpace=v.outputColorSpace,I.batching=v.batching,I.batchingColor=v.batchingColor,I.instancing=v.instancing,I.instancingColor=v.instancingColor,I.instancingMorph=v.instancingMorph,I.skinning=v.skinning,I.morphTargets=v.morphTargets,I.morphNormals=v.morphNormals,I.morphColors=v.morphColors,I.morphTargetsCount=v.morphTargetsCount,I.numClippingPlanes=v.numClippingPlanes,I.numIntersection=v.numClipIntersection,I.vertexAlphas=v.vertexAlphas,I.vertexTangents=v.vertexTangents,I.toneMapping=v.toneMapping}function za(u,v){if(u.length===0)return null;if(u.length===1)return u[0].texture!==null?u[0]:null;y.setFromMatrixPosition(v.matrixWorld);for(let I=0,N=u.length;I<N;I++){let O=u[I];if(O.texture!==null&&O.boundingBox.containsPoint(y))return O}return null}function w(u,v,I,N,O){v.isScene!==!0&&(v=Ht),re.resetTextureUnits();let ce=v.fog,ie=N.isMeshStandardMaterial||N.isMeshLambertMaterial||N.isMeshPhongMaterial?v.environment:null,q=le===null?L.outputColorSpace:le.isXRRenderTarget===!0?le.texture.colorSpace:tt.workingColorSpace,W=N.isMeshStandardMaterial||N.isMeshLambertMaterial&&!N.envMap||N.isMeshPhongMaterial&&!N.envMap,Z=xe.get(N.envMap||ie,W),ne=N.vertexColors===!0&&!!I.attributes.color&&I.attributes.color.itemSize===4,fe=!!I.attributes.tangent&&(!!N.normalMap||N.anisotropy>0),Q=!!I.morphAttributes.position,ge=!!I.morphAttributes.normal,oe=!!I.morphAttributes.color,_e=di;N.toneMapped&&(le===null||le.isXRRenderTarget===!0)&&(_e=L.toneMapping);let Ie=I.morphAttributes.position||I.morphAttributes.normal||I.morphAttributes.color,st=Ie!==void 0?Ie.length:0,Me=J.get(N),mt=b.state.lights;if(Oe===!0&&(At===!0||u!==he)){let et=u===he&&N.id===te;ke.setState(N,u,et)}let Be=!1;N.version===Me.__version?(Me.needsLights&&Me.lightsStateVersion!==mt.state.version||Me.outputColorSpace!==q||O.isBatchedMesh&&Me.batching===!1||!O.isBatchedMesh&&Me.batching===!0||O.isBatchedMesh&&Me.batchingColor===!0&&O._colorsTexture===null||O.isBatchedMesh&&Me.batchingColor===!1&&O._colorsTexture!==null||O.isInstancedMesh&&Me.instancing===!1||!O.isInstancedMesh&&Me.instancing===!0||O.isSkinnedMesh&&Me.skinning===!1||!O.isSkinnedMesh&&Me.skinning===!0||O.isInstancedMesh&&Me.instancingColor===!0&&O.instanceColor===null||O.isInstancedMesh&&Me.instancingColor===!1&&O.instanceColor!==null||O.isInstancedMesh&&Me.instancingMorph===!0&&O.morphTexture===null||O.isInstancedMesh&&Me.instancingMorph===!1&&O.morphTexture!==null||Me.envMap!==Z||N.fog===!0&&Me.fog!==ce||Me.numClippingPlanes!==void 0&&(Me.numClippingPlanes!==ke.numPlanes||Me.numIntersection!==ke.numIntersection)||Me.vertexAlphas!==ne||Me.vertexTangents!==fe||Me.morphTargets!==Q||Me.morphNormals!==ge||Me.morphColors!==oe||Me.toneMapping!==_e||Me.morphTargetsCount!==st||!!Me.lightProbeGrid!=b.state.lightProbeGridArray.length>0)&&(Be=!0):(Be=!0,Me.__version=N.version);let Et=Me.currentProgram;Be===!0&&(Et=Nn(N,v,O),B&&N.isNodeMaterial&&B.onUpdateProgram(N,Et,Me));let bt=!1,we=!1,He=!1,Ve=Et.getUniforms(),Ze=Me.uniforms;if(M.useProgram(Et.program)&&(bt=!0,we=!0,He=!0),N.id!==te&&(te=N.id,we=!0),Me.needsLights){let et=za(b.state.lightProbeGridArray,O);Me.lightProbeGrid!==et&&(Me.lightProbeGrid=et,we=!0)}if(bt||he!==u){M.buffers.depth.getReversed()&&u.reversedDepth!==!0&&(u._reversedDepth=!0,u.updateProjectionMatrix()),Ve.setValue(V,"projectionMatrix",u.projectionMatrix),Ve.setValue(V,"viewMatrix",u.matrixWorldInverse);let Lt=Ve.map.cameraPosition;Lt!==void 0&&Lt.setValue(V,Rt.setFromMatrixPosition(u.matrixWorld)),C.logarithmicDepthBuffer&&Ve.setValue(V,"logDepthBufFC",2/(Math.log(u.far+1)/Math.LN2)),(N.isMeshPhongMaterial||N.isMeshToonMaterial||N.isMeshLambertMaterial||N.isMeshBasicMaterial||N.isMeshStandardMaterial||N.isShaderMaterial)&&Ve.setValue(V,"isOrthographic",u.isOrthographicCamera===!0),he!==u&&(he=u,we=!0,He=!0)}if(Me.needsLights&&(mt.state.sunShadowMap.length>0&&Ve.setValue(V,"sunShadowMap",mt.state.sunShadowMap,re),mt.state.directionalShadowMap.length>0&&Ve.setValue(V,"directionalShadowMap",mt.state.directionalShadowMap,re),mt.state.spotShadowMap.length>0&&Ve.setValue(V,"spotShadowMap",mt.state.spotShadowMap,re),mt.state.pointShadowMap.length>0&&Ve.setValue(V,"pointShadowMap",mt.state.pointShadowMap,re)),O.isSkinnedMesh){Ve.setOptional(V,O,"bindMatrix"),Ve.setOptional(V,O,"bindMatrixInverse");let et=O.skeleton;et&&(et.boneTexture===null&&et.computeBoneTexture(),Ve.setValue(V,"boneTexture",et.boneTexture,re))}O.isBatchedMesh&&(Ve.setOptional(V,O,"batchingTexture"),Ve.setValue(V,"batchingTexture",O._matricesTexture,re),Ve.setOptional(V,O,"batchingIdTexture"),Ve.setValue(V,"batchingIdTexture",O._indirectTexture,re),Ve.setOptional(V,O,"batchingColorTexture"),O._colorsTexture!==null&&Ve.setValue(V,"batchingColorTexture",O._colorsTexture,re));let ut=I.morphAttributes;if((ut.position!==void 0||ut.normal!==void 0||ut.color!==void 0)&&H.update(O,I,Et),(we||Me.receiveShadow!==O.receiveShadow)&&(Me.receiveShadow=O.receiveShadow,Ve.setValue(V,"receiveShadow",O.receiveShadow)),(N.isMeshStandardMaterial||N.isMeshLambertMaterial||N.isMeshPhongMaterial)&&N.envMap===null&&v.environment!==null&&(Ze.envMapIntensity.value=v.environmentIntensity),Ze.dfgLUT!==void 0&&(Ze.dfgLUT.value=Wd()),we){if(Ve.setValue(V,"toneMappingExposure",L.toneMappingExposure),Me.needsLights&&z(Ze,He),ce&&N.fog===!0&&Ge.refreshFogUniforms(Ze,ce),Ge.refreshMaterialUniforms(Ze,N,de,$,b.state.transmissionRenderTarget[u.id]),Me.needsLights&&Me.lightProbeGrid){let et=Me.lightProbeGrid;Ze.probesSH.value=et.texture,Ze.probesMin.value.copy(et.boundingBox.min),Ze.probesMax.value.copy(et.boundingBox.max),Ze.probesResolution.value.copy(et.resolution)}Ln.upload(V,no(Me),Ze,re)}if(N.isShaderMaterial&&N.uniformsNeedUpdate===!0&&(Ln.upload(V,no(Me),Ze,re),N.uniformsNeedUpdate=!1),N.isSpriteMaterial&&Ve.setValue(V,"center",O.center),Ve.setValue(V,"modelViewMatrix",O.modelViewMatrix),Ve.setValue(V,"normalMatrix",O.normalMatrix),Ve.setValue(V,"modelMatrix",O.matrixWorld),N.uniformsGroups!==void 0){let et=N.uniformsGroups;for(let Lt=0,zt=et.length;Lt<zt;Lt++){let Zi=et[Lt];me.update(Zi,Et),me.bind(Zi,Et)}}return Et}function z(u,v){u.ambientLightColor.needsUpdate=v,u.lightProbe.needsUpdate=v,u.sunLights.needsUpdate=v,u.sunLightShadows.needsUpdate=v,u.directionalLights.needsUpdate=v,u.directionalLightShadows.needsUpdate=v,u.pointLights.needsUpdate=v,u.pointLightShadows.needsUpdate=v,u.spotLights.needsUpdate=v,u.spotLightShadows.needsUpdate=v,u.rectAreaLights.needsUpdate=v,u.hemisphereLights.needsUpdate=v}function G(u){return u.isMeshLambertMaterial||u.isMeshToonMaterial||u.isMeshPhongMaterial||u.isMeshStandardMaterial||u.isShadowMaterial||u.isShaderMaterial&&u.lights===!0}this.getActiveCubeFace=function(){return ee},this.getActiveMipmapLevel=function(){return j},this.getRenderTarget=function(){return le},this.setRenderTargetTextures=function(u,v,I){let N=J.get(u);N.__autoAllocateDepthBuffer=u.resolveDepthBuffer===!1,N.__autoAllocateDepthBuffer===!1&&(N.__useRenderToTexture=!1),J.get(u.texture).__webglTexture=v,J.get(u.depthTexture).__webglTexture=N.__autoAllocateDepthBuffer?void 0:I,N.__hasExternalTextures=!0},this.setRenderTargetFramebuffer=function(u,v){let I=J.get(u);I.__webglFramebuffer=v,I.__useDefaultFramebuffer=v===void 0},this.setRenderTarget=function(u,v=0,I=0){le=u,ee=v,j=I;let N=null,O=!1,ce=!1;if(u){let q=J.get(u);if(q.__useDefaultFramebuffer!==void 0){M.bindFramebuffer(V.FRAMEBUFFER,q.__webglFramebuffer),pe.copy(u.viewport),We.copy(u.scissor),ze=u.scissorTest,M.viewport(pe),M.scissor(We),M.setScissorTest(ze),te=-1;return}else if(q.__webglFramebuffer===void 0)re.setupRenderTarget(u);else if(q.__hasExternalTextures)re.rebindTextures(u,J.get(u.texture).__webglTexture,J.get(u.depthTexture).__webglTexture);else if(u.depthBuffer){let ne=u.depthTexture;if(q.__boundDepthTexture!==ne){if(ne!==null&&J.has(ne)&&(u.width!==ne.image.width||u.height!==ne.image.height))throw new Error("THREE.WebGLRenderer: Attached DepthTexture is initialized to the incorrect size.");re.setupDepthRenderbuffer(u)}}let W=u.texture;(W.isData3DTexture||W.isDataArrayTexture||W.isCompressedArrayTexture)&&(ce=!0);let Z=J.get(u).__webglFramebuffer;u.isWebGLCubeRenderTarget?(Array.isArray(Z[v])?N=Z[v][I]:N=Z[v],O=!0):u.samples>0&&re.useMultisampledRTT(u)===!1?N=J.get(u).__webglMultisampledFramebuffer:Array.isArray(Z)?N=Z[I]:N=Z,pe.copy(u.viewport),We.copy(u.scissor),ze=u.scissorTest}else pe.copy(Fe).multiplyScalar(de).floor(),We.copy(Ye).multiplyScalar(de).floor(),ze=vt;if(I!==0&&(N=X),M.bindFramebuffer(V.FRAMEBUFFER,N)&&M.drawBuffers(u,N),M.viewport(pe),M.scissor(We),M.setScissorTest(ze),O){let q=J.get(u.texture);V.framebufferTexture2D(V.FRAMEBUFFER,V.COLOR_ATTACHMENT0,V.TEXTURE_CUBE_MAP_POSITIVE_X+v,q.__webglTexture,I)}else if(ce){let q=v;for(let W=0;W<u.textures.length;W++){let Z=J.get(u.textures[W]);V.framebufferTextureLayer(V.FRAMEBUFFER,V.COLOR_ATTACHMENT0+W,Z.__webglTexture,I,q)}}else if(u!==null&&I!==0){let q=J.get(u.texture);V.framebufferTexture2D(V.FRAMEBUFFER,V.COLOR_ATTACHMENT0,V.TEXTURE_2D,q.__webglTexture,I)}te=-1};function k(u){let v=J.get(u);return(v.__readFormat!==u.format||v.__readType!==u.type)&&(v.__readFormat=u.format,v.__readType=u.type,v.__formatReadable=C.textureFormatReadable(u.format),v.__typeReadable=C.textureTypeReadable(u.type)),v}this.readRenderTargetPixels=function(u,v,I,N,O,ce,ie,q=0){if(!(u&&u.isWebGLRenderTarget)){nt("WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");return}let W=J.get(u).__webglFramebuffer;if(u.isWebGLCubeRenderTarget&&ie!==void 0&&(W=W[ie]),W){M.bindFramebuffer(V.FRAMEBUFFER,W);try{let Z=u.textures[q],ne=Z.format,fe=Z.type;u.textures.length>1&&V.readBuffer(V.COLOR_ATTACHMENT0+q);let Q=k(Z);if(Q.__formatReadable===!1){nt("WebGLRenderer.readRenderTargetPixels: renderTarget is not in RGBA or implementation defined format.");return}if(Q.__typeReadable===!1){nt("WebGLRenderer.readRenderTargetPixels: renderTarget is not in UnsignedByteType or implementation defined type.");return}v>=0&&v<=u.width-N&&I>=0&&I<=u.height-O&&V.readPixels(v,I,N,O,Ae.convert(ne),Ae.convert(fe),ce)}finally{let Z=le!==null?J.get(le).__webglFramebuffer:null;M.bindFramebuffer(V.FRAMEBUFFER,Z)}}},this.readRenderTargetPixelsAsync=async function(u,v,I,N,O,ce,ie,q=0){if(!(u&&u.isWebGLRenderTarget))throw new Error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");let W=J.get(u).__webglFramebuffer;if(u.isWebGLCubeRenderTarget&&ie!==void 0&&(W=W[ie]),W)if(v>=0&&v<=u.width-N&&I>=0&&I<=u.height-O){M.bindFramebuffer(V.FRAMEBUFFER,W);let Z=u.textures[q],ne=Z.format,fe=Z.type;u.textures.length>1&&V.readBuffer(V.COLOR_ATTACHMENT0+q);let Q=k(Z);if(Q.__formatReadable===!1)throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in RGBA or implementation defined format.");if(Q.__typeReadable===!1)throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in UnsignedByteType or implementation defined type.");let ge=V.createBuffer();V.bindBuffer(V.PIXEL_PACK_BUFFER,ge),V.bufferData(V.PIXEL_PACK_BUFFER,ce.byteLength,V.STREAM_READ),V.readPixels(v,I,N,O,Ae.convert(ne),Ae.convert(fe),0),V.bindBuffer(V.PIXEL_PACK_BUFFER,null);let oe=le!==null?J.get(le).__webglFramebuffer:null;M.bindFramebuffer(V.FRAMEBUFFER,oe);let _e=V.fenceSync(V.SYNC_GPU_COMMANDS_COMPLETE,0);return V.flush(),await Rc(V,_e,4),V.bindBuffer(V.PIXEL_PACK_BUFFER,ge),V.getBufferSubData(V.PIXEL_PACK_BUFFER,0,ce),V.bindBuffer(V.PIXEL_PACK_BUFFER,null),V.deleteBuffer(ge),V.deleteSync(_e),ce}else throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: requested read bounds are out of range.")},this.copyFramebufferToTexture=function(u,v=null,I=0){let N=Math.pow(2,-I),O=Math.floor(u.image.width*N),ce=Math.floor(u.image.height*N),ie=v!==null?v.x:0,q=v!==null?v.y:0;re.setTexture2D(u,0),V.copyTexSubImage2D(V.TEXTURE_2D,I,0,0,ie,q,O,ce),M.unbindTexture()},this.copyTextureToTexture=function(u,v,I=null,N=null,O=0,ce=0){let ie,q,W,Z,ne,fe,Q,ge,oe,_e=u.isCompressedTexture?u.mipmaps[ce]:u.image;if(I!==null)ie=I.max.x-I.min.x,q=I.max.y-I.min.y,W=I.isBox3?I.max.z-I.min.z:1,Z=I.min.x,ne=I.min.y,fe=I.isBox3?I.min.z:0;else{let Ze=Math.pow(2,-O);ie=Math.floor(_e.width*Ze),q=Math.floor(_e.height*Ze),u.isDataArrayTexture?W=_e.depth:u.isData3DTexture?W=Math.floor(_e.depth*Ze):W=1,Z=0,ne=0,fe=0}N!==null?(Q=N.x,ge=N.y,oe=N.z):(Q=0,ge=0,oe=0);let Ie=Ae.convert(v.format),st=Ae.convert(v.type),Me;v.isData3DTexture?(re.setTexture3D(v,0),Me=V.TEXTURE_3D):v.isDataArrayTexture||v.isCompressedArrayTexture?(re.setTexture2DArray(v,0),Me=V.TEXTURE_2D_ARRAY):(re.setTexture2D(v,0),Me=V.TEXTURE_2D),M.activeTexture(V.TEXTURE0),M.pixelStorei(V.UNPACK_FLIP_Y_WEBGL,v.flipY),M.pixelStorei(V.UNPACK_PREMULTIPLY_ALPHA_WEBGL,v.premultiplyAlpha),M.pixelStorei(V.UNPACK_ALIGNMENT,v.unpackAlignment);let mt=M.getParameter(V.UNPACK_ROW_LENGTH),Be=M.getParameter(V.UNPACK_IMAGE_HEIGHT),Et=M.getParameter(V.UNPACK_SKIP_PIXELS),bt=M.getParameter(V.UNPACK_SKIP_ROWS),we=M.getParameter(V.UNPACK_SKIP_IMAGES);M.pixelStorei(V.UNPACK_ROW_LENGTH,_e.width),M.pixelStorei(V.UNPACK_IMAGE_HEIGHT,_e.height),M.pixelStorei(V.UNPACK_SKIP_PIXELS,Z),M.pixelStorei(V.UNPACK_SKIP_ROWS,ne),M.pixelStorei(V.UNPACK_SKIP_IMAGES,fe);let He=u.isDataArrayTexture||u.isData3DTexture,Ve=v.isDataArrayTexture||v.isData3DTexture;if(u.isDepthTexture){let Ze=J.get(u),ut=J.get(v),et=J.get(Ze.__renderTarget),Lt=J.get(ut.__renderTarget);M.bindFramebuffer(V.READ_FRAMEBUFFER,et.__webglFramebuffer),M.bindFramebuffer(V.DRAW_FRAMEBUFFER,Lt.__webglFramebuffer);for(let zt=0;zt<W;zt++)He&&(V.framebufferTextureLayer(V.READ_FRAMEBUFFER,V.COLOR_ATTACHMENT0,J.get(u).__webglTexture,O,fe+zt),V.framebufferTextureLayer(V.DRAW_FRAMEBUFFER,V.COLOR_ATTACHMENT0,J.get(v).__webglTexture,ce,oe+zt)),V.blitFramebuffer(Z,ne,ie,q,Q,ge,ie,q,V.DEPTH_BUFFER_BIT,V.NEAREST);M.bindFramebuffer(V.READ_FRAMEBUFFER,null),M.bindFramebuffer(V.DRAW_FRAMEBUFFER,null)}else if(O!==0||u.isRenderTargetTexture||J.has(u)){let Ze=J.get(u),ut=J.get(v);M.bindFramebuffer(V.READ_FRAMEBUFFER,U),M.bindFramebuffer(V.DRAW_FRAMEBUFFER,K);for(let et=0;et<W;et++)He?V.framebufferTextureLayer(V.READ_FRAMEBUFFER,V.COLOR_ATTACHMENT0,Ze.__webglTexture,O,fe+et):V.framebufferTexture2D(V.READ_FRAMEBUFFER,V.COLOR_ATTACHMENT0,V.TEXTURE_2D,Ze.__webglTexture,O),Ve?V.framebufferTextureLayer(V.DRAW_FRAMEBUFFER,V.COLOR_ATTACHMENT0,ut.__webglTexture,ce,oe+et):V.framebufferTexture2D(V.DRAW_FRAMEBUFFER,V.COLOR_ATTACHMENT0,V.TEXTURE_2D,ut.__webglTexture,ce),O!==0?V.blitFramebuffer(Z,ne,ie,q,Q,ge,ie,q,V.COLOR_BUFFER_BIT,V.NEAREST):Ve?V.copyTexSubImage3D(Me,ce,Q,ge,oe+et,Z,ne,ie,q):V.copyTexSubImage2D(Me,ce,Q,ge,Z,ne,ie,q);M.bindFramebuffer(V.READ_FRAMEBUFFER,null),M.bindFramebuffer(V.DRAW_FRAMEBUFFER,null)}else Ve?u.isDataTexture||u.isData3DTexture?V.texSubImage3D(Me,ce,Q,ge,oe,ie,q,W,Ie,st,_e.data):v.isCompressedArrayTexture?V.compressedTexSubImage3D(Me,ce,Q,ge,oe,ie,q,W,Ie,_e.data):V.texSubImage3D(Me,ce,Q,ge,oe,ie,q,W,Ie,st,_e):u.isDataTexture?V.texSubImage2D(V.TEXTURE_2D,ce,Q,ge,ie,q,Ie,st,_e.data):u.isCompressedTexture?V.compressedTexSubImage2D(V.TEXTURE_2D,ce,Q,ge,_e.width,_e.height,Ie,_e.data):V.texSubImage2D(V.TEXTURE_2D,ce,Q,ge,ie,q,Ie,st,_e);M.pixelStorei(V.UNPACK_ROW_LENGTH,mt),M.pixelStorei(V.UNPACK_IMAGE_HEIGHT,Be),M.pixelStorei(V.UNPACK_SKIP_PIXELS,Et),M.pixelStorei(V.UNPACK_SKIP_ROWS,bt),M.pixelStorei(V.UNPACK_SKIP_IMAGES,we),ce===0&&v.generateMipmaps&&V.generateMipmap(Me),M.unbindTexture()},this.initRenderTarget=function(u){J.get(u).__webglFramebuffer===void 0&&re.setupRenderTarget(u)},this.initTexture=function(u){u.isCubeTexture?re.setTextureCube(u,0):u.isData3DTexture?re.setTexture3D(u,0):u.isDataArrayTexture||u.isCompressedArrayTexture?re.setTexture2DArray(u,0):re.setTexture2D(u,0),M.unbindTexture()},this.resetState=function(){ee=0,j=0,le=null,M.reset(),De.reset()},typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}get coordinateSystem(){return mi}get outputColorSpace(){return this._outputColorSpace}set outputColorSpace(e){this._outputColorSpace=e;let t=this.getContext();t.drawingBufferColorSpace=tt._getDrawingBufferColorSpace(e),t.unpackColorSpace=tt._getUnpackColorSpace()}};var Xd={type:"change"},Ul={type:"start"},Yd={type:"end"},La=new Ei,qd=new ui,u0=Math.cos(70*Ka.DEG2RAD),Yt=new D,xi=2*Math.PI,Tt={NONE:-1,ROTATE:0,DOLLY:1,PAN:2,TOUCH_ROTATE:3,TOUCH_PAN:4,TOUCH_DOLLY_PAN:5,TOUCH_DOLLY_ROTATE:6},Nl=1e-6,Da=class extends rs{constructor(e,t=null){super(e,t),this.state=Tt.NONE,this.target=new D,this.cursor=new D,this.minDistance=0,this.maxDistance=1/0,this.minZoom=0,this.maxZoom=1/0,this.minTargetRadius=0,this.maxTargetRadius=1/0,this.minPolarAngle=0,this.maxPolarAngle=Math.PI,this.minAzimuthAngle=-1/0,this.maxAzimuthAngle=1/0,this.enableDamping=!1,this.dampingFactor=.05,this.enableZoom=!0,this.zoomSpeed=1,this.enableRotate=!0,this.rotateSpeed=1,this.keyRotateSpeed=1,this.enablePan=!0,this.panSpeed=1,this.screenSpacePanning=!0,this.keyPanSpeed=7,this.zoomToCursor=!1,this.autoRotate=!1,this.autoRotateSpeed=2,this.keys={LEFT:"ArrowLeft",UP:"ArrowUp",RIGHT:"ArrowRight",BOTTOM:"ArrowDown"},this.mouseButtons={LEFT:On.ROTATE,MIDDLE:On.DOLLY,RIGHT:On.PAN},this.touches={ONE:Bn.ROTATE,TWO:Bn.DOLLY_PAN},this.target0=this.target.clone(),this.position0=this.object.position.clone(),this.zoom0=this.object.zoom,this._cursorStyle="auto",this._domElementKeyEvents=null,this._lastPosition=new D,this._lastQuaternion=new li,this._lastTargetPosition=new D,this._quat=new li().setFromUnitVectors(e.up,new D(0,1,0)),this._quatInverse=this._quat.clone().invert(),this._spherical=new Wr,this._sphericalDelta=new Wr,this._scale=1,this._panOffset=new D,this._rotateStart=new Ce,this._rotateEnd=new Ce,this._rotateDelta=new Ce,this._panStart=new Ce,this._panEnd=new Ce,this._panDelta=new Ce,this._dollyStart=new Ce,this._dollyEnd=new Ce,this._dollyDelta=new Ce,this._dollyDirection=new D,this._mouse=new Ce,this._performCursorZoom=!1,this._pointers=[],this._pointerPositions={},this._controlActive=!1,this._onPointerMove=h0.bind(this),this._onPointerDown=f0.bind(this),this._onPointerUp=d0.bind(this),this._onContextMenu=S0.bind(this),this._onMouseWheel=g0.bind(this),this._onKeyDown=_0.bind(this),this._onTouchStart=x0.bind(this),this._onTouchMove=M0.bind(this),this._onMouseDown=p0.bind(this),this._onMouseMove=m0.bind(this),this._interceptControlDown=v0.bind(this),this._interceptControlUp=y0.bind(this),this.domElement!==null&&this.connect(this.domElement),this.update()}set cursorStyle(e){this._cursorStyle=e,e==="grab"?this.domElement.style.cursor="grab":this.domElement.style.cursor="auto"}get cursorStyle(){return this._cursorStyle}connect(e){super.connect(e),this.domElement.addEventListener("pointerdown",this._onPointerDown),this.domElement.addEventListener("pointercancel",this._onPointerUp),this.domElement.addEventListener("contextmenu",this._onContextMenu),this.domElement.addEventListener("wheel",this._onMouseWheel,{passive:!1}),this.domElement.getRootNode().addEventListener("keydown",this._interceptControlDown,{passive:!0,capture:!0}),this.domElement.style.touchAction="none"}disconnect(){this.state=Tt.NONE,this.domElement.removeEventListener("pointerdown",this._onPointerDown),this.domElement.ownerDocument.removeEventListener("pointermove",this._onPointerMove),this.domElement.ownerDocument.removeEventListener("pointerup",this._onPointerUp),this.domElement.removeEventListener("pointercancel",this._onPointerUp),this.domElement.removeEventListener("wheel",this._onMouseWheel),this.domElement.removeEventListener("contextmenu",this._onContextMenu),this.stopListenToKeyEvents();let e=this.domElement.getRootNode();e.removeEventListener("keydown",this._interceptControlDown,{capture:!0}),e.removeEventListener("keyup",this._interceptControlUp,{capture:!0}),this._controlActive=!1,this._pointers.length=0,this._pointerPositions={},this.domElement.style.touchAction="",this.domElement.style.cursor="auto"}dispose(){this.disconnect()}getPolarAngle(){return this._spherical.phi}getAzimuthalAngle(){return this._spherical.theta}getDistance(){return this.object.position.distanceTo(this.target)}listenToKeyEvents(e){e.addEventListener("keydown",this._onKeyDown),this._domElementKeyEvents=e}stopListenToKeyEvents(){this._domElementKeyEvents!==null&&(this._domElementKeyEvents.removeEventListener("keydown",this._onKeyDown),this._domElementKeyEvents=null)}saveState(){this.target0.copy(this.target),this.position0.copy(this.object.position),this.zoom0=this.object.zoom}reset(){this.target.copy(this.target0),this.object.position.copy(this.position0),this.object.zoom=this.zoom0,this.object.updateProjectionMatrix(),this.dispatchEvent(Xd),this.update(),this.state=Tt.NONE}pan(e,t){this._pan(e,t),this.update()}dollyIn(e){this._dollyIn(e),this.update()}dollyOut(e){this._dollyOut(e),this.update()}rotateLeft(e){this._rotateLeft(e),this.update()}rotateUp(e){this._rotateUp(e),this.update()}update(e=null){let t=this.object.position;Yt.copy(t).sub(this.target),Yt.applyQuaternion(this._quat),this._spherical.setFromVector3(Yt),this.autoRotate&&this.state===Tt.NONE&&this._rotateLeft(this._getAutoRotationAngle(e)),this.enableDamping?(this._spherical.theta+=this._sphericalDelta.theta*this.dampingFactor,this._spherical.phi+=this._sphericalDelta.phi*this.dampingFactor):(this._spherical.theta+=this._sphericalDelta.theta,this._spherical.phi+=this._sphericalDelta.phi);let i=this.minAzimuthAngle,r=this.maxAzimuthAngle;isFinite(i)&&isFinite(r)&&(i<-Math.PI?i+=xi:i>Math.PI&&(i-=xi),r<-Math.PI?r+=xi:r>Math.PI&&(r-=xi),i<=r?this._spherical.theta=Math.max(i,Math.min(r,this._spherical.theta)):this._spherical.theta=this._spherical.theta>(i+r)/2?Math.max(i,this._spherical.theta):Math.min(r,this._spherical.theta)),this._spherical.phi=Math.max(this.minPolarAngle,Math.min(this.maxPolarAngle,this._spherical.phi)),this._spherical.makeSafe(),this.enableDamping===!0?this.target.addScaledVector(this._panOffset,this.dampingFactor):this.target.add(this._panOffset),this.target.sub(this.cursor),this.target.clampLength(this.minTargetRadius,this.maxTargetRadius),this.target.add(this.cursor);let o=!1;if(this.zoomToCursor&&this._performCursorZoom||this.object.isOrthographicCamera)this._spherical.radius=this._clampDistance(this._spherical.radius);else{let s=this._spherical.radius;this._spherical.radius=this._clampDistance(this._spherical.radius*this._scale),o=s!=this._spherical.radius}if(Yt.setFromSpherical(this._spherical),Yt.applyQuaternion(this._quatInverse),t.copy(this.target).add(Yt),this.object.lookAt(this.target),this.enableDamping===!0?(this._sphericalDelta.theta*=1-this.dampingFactor,this._sphericalDelta.phi*=1-this.dampingFactor,this._panOffset.multiplyScalar(1-this.dampingFactor)):(this._sphericalDelta.set(0,0,0),this._panOffset.set(0,0,0)),this.zoomToCursor&&this._performCursorZoom){let s=null;if(this.object.isPerspectiveCamera){let a=Yt.length();s=this._clampDistance(a*this._scale);let c=a-s;this.object.position.addScaledVector(this._dollyDirection,c),this.object.updateMatrixWorld(),o=!!c}else if(this.object.isOrthographicCamera){let a=new D(this._mouse.x,this._mouse.y,0);a.unproject(this.object);let c=this.object.zoom;this.object.zoom=Math.max(this.minZoom,Math.min(this.maxZoom,this.object.zoom/this._scale)),this.object.updateProjectionMatrix(),o=c!==this.object.zoom;let l=new D(this._mouse.x,this._mouse.y,0);l.unproject(this.object),this.object.position.sub(l).add(a),this.object.updateMatrixWorld(),s=Yt.length()}else console.warn("WARNING: OrbitControls.js encountered an unknown camera type - zoom to cursor disabled."),this.zoomToCursor=!1;s!==null&&(this.screenSpacePanning?this.target.set(0,0,-1).transformDirection(this.object.matrix).multiplyScalar(s).add(this.object.position):(La.origin.copy(this.object.position),La.direction.set(0,0,-1).transformDirection(this.object.matrix),Math.abs(this.object.up.dot(La.direction))<u0?this.object.lookAt(this.target):(qd.setFromNormalAndCoplanarPoint(this.object.up,this.target),La.intersectPlane(qd,this.target))))}else if(this.object.isOrthographicCamera){let s=this.object.zoom;this.object.zoom=Math.max(this.minZoom,Math.min(this.maxZoom,this.object.zoom/this._scale)),s!==this.object.zoom&&(this.object.updateProjectionMatrix(),o=!0)}return this._scale=1,this._performCursorZoom=!1,o||this._lastPosition.distanceToSquared(this.object.position)>Nl||8*(1-this._lastQuaternion.dot(this.object.quaternion))>Nl||this._lastTargetPosition.distanceToSquared(this.target)>Nl?(this.dispatchEvent(Xd),this._lastPosition.copy(this.object.position),this._lastQuaternion.copy(this.object.quaternion),this._lastTargetPosition.copy(this.target),!0):!1}_getAutoRotationAngle(e){return e!==null?xi/60*this.autoRotateSpeed*e:xi/60/60*this.autoRotateSpeed}_getZoomScale(e){let t=Math.abs(e*.01);return Math.pow(.95,this.zoomSpeed*t)}_rotateLeft(e){this._sphericalDelta.theta-=e}_rotateUp(e){this._sphericalDelta.phi-=e}_panLeft(e,t){Yt.setFromMatrixColumn(t,0),Yt.multiplyScalar(-e),this._panOffset.add(Yt)}_panUp(e,t){this.screenSpacePanning===!0?Yt.setFromMatrixColumn(t,1):(Yt.setFromMatrixColumn(t,0),Yt.crossVectors(this.object.up,Yt)),Yt.multiplyScalar(e),this._panOffset.add(Yt)}_pan(e,t){let i=this.domElement;if(this.object.isPerspectiveCamera){let r=this.object.position;Yt.copy(r).sub(this.target);let o=Yt.length();o*=Math.tan(this.object.fov/2*Math.PI/180),this._panLeft(2*e*o/i.clientHeight,this.object.matrix),this._panUp(2*t*o/i.clientHeight,this.object.matrix)}else this.object.isOrthographicCamera?(this._panLeft(e*(this.object.right-this.object.left)/this.object.zoom/i.clientWidth,this.object.matrix),this._panUp(t*(this.object.top-this.object.bottom)/this.object.zoom/i.clientHeight,this.object.matrix)):(console.warn("WARNING: OrbitControls.js encountered an unknown camera type - pan disabled."),this.enablePan=!1)}_dollyOut(e){this.object.isPerspectiveCamera||this.object.isOrthographicCamera?this._scale/=e:(console.warn("WARNING: OrbitControls.js encountered an unknown camera type - dolly/zoom disabled."),this.enableZoom=!1)}_dollyIn(e){this.object.isPerspectiveCamera||this.object.isOrthographicCamera?this._scale*=e:(console.warn("WARNING: OrbitControls.js encountered an unknown camera type - dolly/zoom disabled."),this.enableZoom=!1)}_updateZoomParameters(e,t){if(!this.zoomToCursor)return;this._performCursorZoom=!0;let i=this.domElement.getBoundingClientRect(),r=e-i.left,o=t-i.top,s=i.width,a=i.height;this._mouse.x=r/s*2-1,this._mouse.y=-(o/a)*2+1,this._dollyDirection.set(this._mouse.x,this._mouse.y,1).unproject(this.object).sub(this.object.position).normalize()}_clampDistance(e){return Math.max(this.minDistance,Math.min(this.maxDistance,e))}_handleMouseDownRotate(e){this._rotateStart.set(e.clientX,e.clientY)}_handleMouseDownDolly(e){this._updateZoomParameters(e.clientX,e.clientX),this._dollyStart.set(e.clientX,e.clientY)}_handleMouseDownPan(e){this._panStart.set(e.clientX,e.clientY)}_handleMouseMoveRotate(e){this._rotateEnd.set(e.clientX,e.clientY),this._rotateDelta.subVectors(this._rotateEnd,this._rotateStart).multiplyScalar(this.rotateSpeed);let t=this.domElement;this._rotateLeft(xi*this._rotateDelta.x/t.clientHeight),this._rotateUp(xi*this._rotateDelta.y/t.clientHeight),this._rotateStart.copy(this._rotateEnd),this.update()}_handleMouseMoveDolly(e){this._dollyEnd.set(e.clientX,e.clientY),this._dollyDelta.subVectors(this._dollyEnd,this._dollyStart),this._dollyDelta.y>0?this._dollyOut(this._getZoomScale(this._dollyDelta.y)):this._dollyDelta.y<0&&this._dollyIn(this._getZoomScale(this._dollyDelta.y)),this._dollyStart.copy(this._dollyEnd),this.update()}_handleMouseMovePan(e){this._panEnd.set(e.clientX,e.clientY),this._panDelta.subVectors(this._panEnd,this._panStart).multiplyScalar(this.panSpeed),this._pan(this._panDelta.x,this._panDelta.y),this._panStart.copy(this._panEnd),this.update()}_handleMouseWheel(e){this._updateZoomParameters(e.clientX,e.clientY),e.deltaY<0?this._dollyIn(this._getZoomScale(e.deltaY)):e.deltaY>0&&this._dollyOut(this._getZoomScale(e.deltaY)),this.update()}_handleKeyDown(e){let t=!1;switch(e.code){case this.keys.UP:e.ctrlKey||e.metaKey||e.shiftKey?this.enableRotate&&this._rotateUp(xi*this.keyRotateSpeed/this.domElement.clientHeight):this.enablePan&&this._pan(0,this.keyPanSpeed),t=!0;break;case this.keys.BOTTOM:e.ctrlKey||e.metaKey||e.shiftKey?this.enableRotate&&this._rotateUp(-xi*this.keyRotateSpeed/this.domElement.clientHeight):this.enablePan&&this._pan(0,-this.keyPanSpeed),t=!0;break;case this.keys.LEFT:e.ctrlKey||e.metaKey||e.shiftKey?this.enableRotate&&this._rotateLeft(xi*this.keyRotateSpeed/this.domElement.clientHeight):this.enablePan&&this._pan(this.keyPanSpeed,0),t=!0;break;case this.keys.RIGHT:e.ctrlKey||e.metaKey||e.shiftKey?this.enableRotate&&this._rotateLeft(-xi*this.keyRotateSpeed/this.domElement.clientHeight):this.enablePan&&this._pan(-this.keyPanSpeed,0),t=!0;break}t&&(e.preventDefault(),this.update())}_handleTouchStartRotate(e){if(this._pointers.length===1)this._rotateStart.set(e.pageX,e.pageY);else{let t=this._getSecondPointerPosition(e),i=.5*(e.pageX+t.x),r=.5*(e.pageY+t.y);this._rotateStart.set(i,r)}}_handleTouchStartPan(e){if(this._pointers.length===1)this._panStart.set(e.pageX,e.pageY);else{let t=this._getSecondPointerPosition(e),i=.5*(e.pageX+t.x),r=.5*(e.pageY+t.y);this._panStart.set(i,r)}}_handleTouchStartDolly(e){let t=this._getSecondPointerPosition(e),i=e.pageX-t.x,r=e.pageY-t.y,o=Math.sqrt(i*i+r*r);this._dollyStart.set(0,o)}_handleTouchStartDollyPan(e){this.enableZoom&&this._handleTouchStartDolly(e),this.enablePan&&this._handleTouchStartPan(e)}_handleTouchStartDollyRotate(e){this.enableZoom&&this._handleTouchStartDolly(e),this.enableRotate&&this._handleTouchStartRotate(e)}_handleTouchMoveRotate(e){if(this._pointers.length==1)this._rotateEnd.set(e.pageX,e.pageY);else{let i=this._getSecondPointerPosition(e),r=.5*(e.pageX+i.x),o=.5*(e.pageY+i.y);this._rotateEnd.set(r,o)}this._rotateDelta.subVectors(this._rotateEnd,this._rotateStart).multiplyScalar(this.rotateSpeed);let t=this.domElement;this._rotateLeft(xi*this._rotateDelta.x/t.clientHeight),this._rotateUp(xi*this._rotateDelta.y/t.clientHeight),this._rotateStart.copy(this._rotateEnd)}_handleTouchMovePan(e){if(this._pointers.length===1)this._panEnd.set(e.pageX,e.pageY);else{let t=this._getSecondPointerPosition(e),i=.5*(e.pageX+t.x),r=.5*(e.pageY+t.y);this._panEnd.set(i,r)}this._panDelta.subVectors(this._panEnd,this._panStart).multiplyScalar(this.panSpeed),this._pan(this._panDelta.x,this._panDelta.y),this._panStart.copy(this._panEnd)}_handleTouchMoveDolly(e){let t=this._getSecondPointerPosition(e),i=e.pageX-t.x,r=e.pageY-t.y,o=Math.sqrt(i*i+r*r);this._dollyEnd.set(0,o),this._dollyDelta.set(0,Math.pow(this._dollyEnd.y/this._dollyStart.y,this.zoomSpeed)),this._dollyOut(this._dollyDelta.y),this._dollyStart.copy(this._dollyEnd);let s=(e.pageX+t.x)*.5,a=(e.pageY+t.y)*.5;this._updateZoomParameters(s,a)}_handleTouchMoveDollyPan(e){this.enableZoom&&this._handleTouchMoveDolly(e),this.enablePan&&this._handleTouchMovePan(e)}_handleTouchMoveDollyRotate(e){this.enableZoom&&this._handleTouchMoveDolly(e),this.enableRotate&&this._handleTouchMoveRotate(e)}_addPointer(e){this._pointers.push(e.pointerId)}_removePointer(e){delete this._pointerPositions[e.pointerId];for(let t=0;t<this._pointers.length;t++)if(this._pointers[t]==e.pointerId){this._pointers.splice(t,1);return}}_isTrackingPointer(e){for(let t=0;t<this._pointers.length;t++)if(this._pointers[t]==e.pointerId)return!0;return!1}_trackPointer(e){let t=this._pointerPositions[e.pointerId];t===void 0&&(t=new Ce,this._pointerPositions[e.pointerId]=t),t.set(e.pageX,e.pageY)}_getSecondPointerPosition(e){let t=e.pointerId===this._pointers[0]?this._pointers[1]:this._pointers[0];return this._pointerPositions[t]}_customWheelEvent(e){let t=e.deltaMode,i={clientX:e.clientX,clientY:e.clientY,deltaY:e.deltaY};switch(t){case 1:i.deltaY*=16;break;case 2:i.deltaY*=100;break}return e.ctrlKey&&!this._controlActive&&(i.deltaY*=10),i}};function f0(n){this.enabled!==!1&&(this._pointers.length===0&&(this.domElement.setPointerCapture(n.pointerId),this.domElement.ownerDocument.addEventListener("pointermove",this._onPointerMove),this.domElement.ownerDocument.addEventListener("pointerup",this._onPointerUp)),!this._isTrackingPointer(n)&&(this._addPointer(n),n.pointerType==="touch"?this._onTouchStart(n):this._onMouseDown(n),this._cursorStyle==="grab"&&(this.domElement.style.cursor="grabbing")))}function h0(n){this.enabled!==!1&&(n.pointerType==="touch"?this._onTouchMove(n):this._onMouseMove(n))}function d0(n){switch(this._removePointer(n),this._pointers.length){case 0:this.domElement.releasePointerCapture(n.pointerId),this.domElement.ownerDocument.removeEventListener("pointermove",this._onPointerMove),this.domElement.ownerDocument.removeEventListener("pointerup",this._onPointerUp),this.dispatchEvent(Yd),this.state=Tt.NONE,this._cursorStyle==="grab"&&(this.domElement.style.cursor="grab");break;case 1:let e=this._pointers[0],t=this._pointerPositions[e];this._onTouchStart({pointerId:e,pageX:t.x,pageY:t.y});break}}function p0(n){let e;switch(n.button){case 0:e=this.mouseButtons.LEFT;break;case 1:e=this.mouseButtons.MIDDLE;break;case 2:e=this.mouseButtons.RIGHT;break;default:e=-1}switch(e){case On.DOLLY:if(this.enableZoom===!1)return;this._handleMouseDownDolly(n),this.state=Tt.DOLLY;break;case On.ROTATE:if(n.ctrlKey||n.metaKey||n.shiftKey){if(this.enablePan===!1)return;this._handleMouseDownPan(n),this.state=Tt.PAN}else{if(this.enableRotate===!1)return;this._handleMouseDownRotate(n),this.state=Tt.ROTATE}break;case On.PAN:if(n.ctrlKey||n.metaKey||n.shiftKey){if(this.enableRotate===!1)return;this._handleMouseDownRotate(n),this.state=Tt.ROTATE}else{if(this.enablePan===!1)return;this._handleMouseDownPan(n),this.state=Tt.PAN}break;default:this.state=Tt.NONE}this.state!==Tt.NONE&&this.dispatchEvent(Ul)}function m0(n){switch(this.state){case Tt.ROTATE:if(this.enableRotate===!1)return;this._handleMouseMoveRotate(n);break;case Tt.DOLLY:if(this.enableZoom===!1)return;this._handleMouseMoveDolly(n);break;case Tt.PAN:if(this.enablePan===!1)return;this._handleMouseMovePan(n);break}}function g0(n){this.enabled===!1||this.enableZoom===!1||this.state!==Tt.NONE||(n.preventDefault(),this.dispatchEvent(Ul),this._handleMouseWheel(this._customWheelEvent(n)),this.dispatchEvent(Yd))}function _0(n){this.enabled!==!1&&this._handleKeyDown(n)}function x0(n){switch(this._trackPointer(n),this._pointers.length){case 1:switch(this.touches.ONE){case Bn.ROTATE:if(this.enableRotate===!1)return;this._handleTouchStartRotate(n),this.state=Tt.TOUCH_ROTATE;break;case Bn.PAN:if(this.enablePan===!1)return;this._handleTouchStartPan(n),this.state=Tt.TOUCH_PAN;break;default:this.state=Tt.NONE}break;case 2:switch(this.touches.TWO){case Bn.DOLLY_PAN:if(this.enableZoom===!1&&this.enablePan===!1)return;this._handleTouchStartDollyPan(n),this.state=Tt.TOUCH_DOLLY_PAN;break;case Bn.DOLLY_ROTATE:if(this.enableZoom===!1&&this.enableRotate===!1)return;this._handleTouchStartDollyRotate(n),this.state=Tt.TOUCH_DOLLY_ROTATE;break;default:this.state=Tt.NONE}break;default:this.state=Tt.NONE}this.state!==Tt.NONE&&this.dispatchEvent(Ul)}function M0(n){switch(this._trackPointer(n),this.state){case Tt.TOUCH_ROTATE:if(this.enableRotate===!1)return;this._handleTouchMoveRotate(n),this.update();break;case Tt.TOUCH_PAN:if(this.enablePan===!1)return;this._handleTouchMovePan(n),this.update();break;case Tt.TOUCH_DOLLY_PAN:if(this.enableZoom===!1&&this.enablePan===!1)return;this._handleTouchMoveDollyPan(n),this.update();break;case Tt.TOUCH_DOLLY_ROTATE:if(this.enableZoom===!1&&this.enableRotate===!1)return;this._handleTouchMoveDollyRotate(n),this.update();break;default:this.state=Tt.NONE}}function S0(n){this.enabled!==!1&&n.preventDefault()}function v0(n){n.key==="Control"&&(this._controlActive=!0,this.domElement.getRootNode().addEventListener("keyup",this._interceptControlUp,{passive:!0,capture:!0}))}function y0(n){n.key==="Control"&&(this._controlActive=!1,this.domElement.getRootNode().removeEventListener("keyup",this._interceptControlUp,{passive:!0,capture:!0}))}var Dn=class extends St{constructor(e=document.createElement("div")){super(),this.isCSS2DObject=!0,this.element=e,this.element.style.position="absolute",this.element.style.userSelect="none",this.element.setAttribute("draggable",!1),this.center=new Ce(.5,.5),this.rotation2D=0,this.addEventListener("removed",function(){this.traverse(function(t){t.element&&t.element instanceof t.element.ownerDocument.defaultView.Element&&t.element.parentNode!==null&&t.element.remove()})})}copy(e,t){return super.copy(e,t),this.element=e.element.cloneNode(!0),this.center=e.center,this.rotation2D=e.rotation2D,this}},Zr=new D,Kd=new it,Zd=new it,Jd=new D,$d=new D,Ia=class{constructor(e={}){let t=this,i,r,o,s,a={objects:new WeakMap},c=e.element!==void 0?e.element:document.createElement("div");c.style.overflow="hidden",this.domElement=c,this.sortObjects=!0,this.getSize=function(){return{width:i,height:r}},this.render=function(x,S){x.matrixWorldAutoUpdate===!0&&x.updateMatrixWorld(),S.parent===null&&S.matrixWorldAutoUpdate===!0&&S.updateMatrixWorld(),Kd.copy(S.matrixWorldInverse),Zd.multiplyMatrices(S.projectionMatrix,Kd),h(x,x,S),this.sortObjects&&g(x)},this.setSize=function(x,S){i=x,r=S,o=i/2,s=r/2,c.style.width=x+"px",c.style.height=S+"px"};function l(x){x.isCSS2DObject&&(x.element.style.display="none");for(let S=0,_=x.children.length;S<_;S++)l(x.children[S])}function h(x,S,_){if(x.visible===!1){l(x);return}if(x.isCSS2DObject){Zr.setFromMatrixPosition(x.matrixWorld),Zr.applyMatrix4(Zd);let p=Zr.z>=-1&&Zr.z<=1&&x.layers.test(_.layers)===!0,A=x.element;if(A.style.display=p===!0?"":"none",p===!0){x.onBeforeRender(t,S,_);let y=100*x.center.x,E=100*x.center.y;A.style.transformOrigin=`${y}% ${E}%`;let b=-x.rotation2D,R=Zr.x*o+o,d=-Zr.y*s+s;A.style.transform=`translate(${-y}%, ${-E}%) translate(${R}px, ${d}px) rotate(${b}rad)`,A.parentNode!==c&&c.appendChild(A),x.onAfterRender(t,S,_)}let P={distanceToCameraSquared:m(_,x)};a.objects.set(x,P)}for(let p=0,A=x.children.length;p<A;p++)h(x.children[p],S,_)}function m(x,S){return Jd.setFromMatrixPosition(x.matrixWorld),$d.setFromMatrixPosition(S.matrixWorld),Jd.distanceToSquared($d)}function f(x){let S=[];return x.traverseVisible(function(_){_.isCSS2DObject&&S.push(_)}),S}function g(x){let S=f(x).sort(function(p,A){if(p.renderOrder!==A.renderOrder)return A.renderOrder-p.renderOrder;let P=a.objects.get(p).distanceToCameraSquared,y=a.objects.get(A).distanceToCameraSquared;return P-y}),_=S.length;for(let p=0,A=S.length;p<A;p++)S[p].element.style.zIndex=_-p}}};var jd=["loc","player","org","trade","danger","distress","rumor","unknown","comms","infra","resource","threshold","economy","event"];var Qd={loc:{id:"loc",label:"Location",meaning:"here",fallback:"here",category:"LOCATION",counterpart:"room",d:"M3.2 3.2h9.6v9.6H3.2z M6.2 6.2h3.6v3.6H6.2z"},player:{id:"player",label:"Player",meaning:"a Player",fallback:"P",category:"PLAYER",counterpart:"player",d:"M8 2.4l5.6 5.6L8 13.6 2.4 8z"},org:{id:"org",label:"Institution",meaning:"institution",fallback:"org",category:"INSTITUTION",counterpart:"organization",d:"M3.5 13V5.4 M8 13V3.4 M12.5 13V5.4 M3 13.2h10"},trade:{id:"trade",label:"Trade",meaning:"trade or opportunity",fallback:"trade",category:"TRADE",counterpart:"trade",d:"M2.6 5.4h8.4 M8.4 3.2l3 2.2-3 2.2 M13.4 10.6H5 M7.6 8.4l-3 2.2 3 2.2"},danger:{id:"danger",label:"Danger",meaning:"hostile or contested",fallback:"danger",category:"DANGER",counterpart:"contest",d:"M8 2.6l6.2 10.6H1.8z M8 6.6v3.2 M8 11.6v.9"},distress:{id:"distress",label:"Distress",meaning:"strained or failing works",fallback:"strained",category:"DISTRESS",counterpart:"condition",d:"M3.4 3.2h9.2 M3.4 12.8h9.2 M3.4 3.2l9.2 9.6 M12.6 3.2l-9.2 9.6"},rumor:{id:"rumor",label:"Rumor",meaning:"unconfirmed claim",fallback:"rumor",category:"RUMOR",counterpart:"rumor",d:"M3 11.2h3.4 M6.2 8h4 M10.2 4.8h2.8"},unknown:{id:"unknown",label:"Unknown",meaning:"incomplete or unreadable",fallback:"?",category:"UNKNOWN",counterpart:"artifact",d:"M5.2 3.2H12.8V7 M12.8 9.2v3.6H3.2V5.6"},comms:{id:"comms",label:"Signal",meaning:"message or board traffic",fallback:"message",category:"COMMUNICATION",counterpart:"message",d:"M8 12.6v-1.4 M5.2 9.2a3.6 3.6 0 0 1 5.6 0 M3.4 7a6.2 6.2 0 0 1 9.2 0"},infra:{id:"infra",label:"Works",meaning:"infrastructure",fallback:"works",category:"INFRASTRUCTURE",counterpart:"infrastructure",d:"M3.2 3.2h4.2v4.2H3.2z M8.6 3.2h4.2v4.2H8.6z M3.2 8.6h4.2v4.2H3.2z M8.6 8.6h4.2v4.2H8.6z"},resource:{id:"resource",label:"Resource",meaning:"stock or harvest",fallback:"stock",category:"RESOURCE",counterpart:"resource",d:"M4.2 12.2V7.2h2.2v5 M7 12.2V4.4h2.2v7.8 M9.8 12.2V8.4h2.2v3.8 M3.4 12.4h9.4"},threshold:{id:"threshold",label:"Threshold",meaning:"consequential change",fallback:"change",category:"THRESHOLD",counterpart:"exit",d:"M4.2 13V3.8h7.6V13 M6.6 13V8.2h2.8V13"},economy:{id:"economy",label:"Economy",meaning:"economic change",fallback:"trade",category:"ECONOMIC CHANGE",counterpart:"market",d:"M8 3.2v9.4 M3.4 6.6L8 4.4l4.6 2.2 M3.6 11.4h3.2 M9.2 11.4h3.2"},event:{id:"event",label:"Event",meaning:"world event",fallback:"event",category:"WORLD EVENT",counterpart:"event",d:"M8 2.6v3.2 M8 10.2v3.2 M2.6 8h3.2 M10.2 8h3.2 M4.4 4.4l2.2 2.2 M9.4 9.4l2.2 2.2 M11.6 4.4l-2.2 2.2 M6.6 9.4l-2.2 2.2"}};function ep(n){return Qd[n]||Qd.unknown}var rp=320,op=180;var Y2=100*1024,K2=200*1024;var b0=Object.fromEntries(jd.map(n=>[n,ep(n).d]));var tp={north:[0,-1],n:[0,-1],south:[0,1],s:[0,1],east:[1,0],e:[1,0],west:[-1,0],w:[-1,0],up:[.35,-.65],down:[-.35,.65],northeast:[1,-1],northwest:[-1,-1],southeast:[1,1],southwest:[-1,1]},Fl={NORMAL:280,NOTABLE:560,MAJOR:920};function Na(n){if(!n||!n.room_id||n.hidden===!0)return!1;let e=n.tags||[];for(let t=0;t<e.length;t++){let i=String(e[t]||"").toLowerCase();if(i==="hidden"||i==="secret"||i==="unpublished")return!1}return!0}function sp(n){return String(n||"").replace(/[<>&"'`]/g,"").replace(/[\u0000-\u001f\u007f]/g,"").slice(0,24)}function E0(n,e,t){if(!Array.isArray(n))return[];let i=String(e||"").trim().toLowerCase(),r=String(t||"").trim().toLowerCase(),o=r.replace(/^room\./,""),s=[];for(let a=0;a<n.length;a++){let c=sp(n[a]);if(!c)continue;let l=c.toLowerCase();l.startsWith("room.")||i&&l===i||r&&(l===r||l===o)||s.indexOf(c)>=0||s.push(c)}return s}function T0(n,e,t){if(!Na(n))return"unknown";let i=Number(n.players_present||0),r=String(t||"");if(r){if(String(n.room_id||"")===r)return"active"}else if(n.active===!0||i>0)return"active";let o=n.room_id||"";if(!r&&(e||[]).some(l=>l.room_id===o))return"active";if((n.entities||[]).filter(c=>c&&c.hidden!==!0).length||String(n.description||"").trim()||r&&i>0)return"known";let a=n.tags||[];for(let c=0;c<a.length;c++)if(String(a[c]||"").toLowerCase()==="partial")return"partial";return"empty"}function ip(n){let e=String(n||"");return!e||e==="loc"||e==="player"||!Object.prototype.hasOwnProperty.call(b0,e)?null:e}function A0(n,e){let t={},i=[];function r(c){!c||t[c]||(t[c]=!0,i.push(c))}let o=n.entities||[];for(let c=0;c<o.length;c++){let l=o[c];!l||l.hidden===!0||r(ip(l.glyph))}let s=n.room_id||"",a=e||[];for(let c=0;c<a.length;c++){let l=a[c];!l||l.room_id!==s||r(ip(l.glyph))}return i.sort(),i.slice(0,4)}function w0(n,e){let t=[],i=n.exits||[];for(let r=0;r<i.length;r++){let o=i[r];if(!o||o.hidden===!0)continue;let s=String(o.to_room_id||"");!s||!e.has(s)||t.push(o)}return t}function R0(n,e){let t=String(n||"").toLowerCase().trim();if(tp[t])return tp[t];let i=(e%4+4)%4;return i===0?[1,0]:i===1?[0,1]:i===2?[-1,0]:[0,-1]}function us(n,e){return Math.round(n*2)/2+","+Math.round(e*2)/2}function np(n,e,t){if(!t.has(us(n,e)))return[n,e];let i=[1,-1,2,-2,3,-3];for(let r=0;r<i.length;r++){let o=i[r];for(let s=0;s<i.length;s++){let a=n+o*.5,c=e+i[s]*.5;if(!t.has(us(a,c)))return[a,c]}}return[n+.75,e+.75]}function ap(n,e,t){let i=(n||[]).filter(Na).slice().sort((E,b)=>String(E.room_id).localeCompare(String(b.room_id))),r=new Set(i.map(E=>String(E.room_id))),o=new Map,s=new Set,a=[],c=new Set;if(i.length){let E=String(i[0].room_id);o.set(E,[0,0]),s.add(us(0,0));let b=[E],R=new Set([E]);for(;b.length;){let T=b.shift(),L=i.find(X=>X.room_id===T);if(!L)continue;let F=o.get(T)||[0,0],B=w0(L,r).slice().sort((X,U)=>String(X.direction||"").localeCompare(String(U.direction||""))||String(X.to_room_id||"").localeCompare(String(U.to_room_id||"")));for(let X=0;X<B.length;X++){let U=String(B[X].to_room_id),K=T<U?T+">"+U:U+">"+T;if(c.has(K)||(c.add(K),a.push({from:T,to:U,direction:String(B[X].direction||"")})),R.has(U))continue;let ee=R0(B[X].direction,X+T.length),j=F[0]+ee[0]*2,le=F[1]+ee[1]*2,te=np(j,le,s);j=te[0],le=te[1],o.set(U,[j,le]),s.add(us(j,le)),R.add(U),b.push(U)}}let d=0;for(let T=0;T<i.length;T++){let L=String(i[T].room_id);if(o.has(L))continue;let F=np(d*2,2,s);o.set(L,F),s.add(us(F[0],F[1])),d+=1}}let l=1/0,h=1/0,m=-1/0,f=-1/0;o.forEach(E=>{E[0]<l&&(l=E[0]),E[1]<h&&(h=E[1]),E[0]>m&&(m=E[0]),E[1]>f&&(f=E[1])}),Number.isFinite(l)||(l=0,h=0,m=0,f=0);let g=Math.max(1,m-l),x=Math.max(1,f-h),S=28,_=24,p=rp-S*2,A=op-_*2,P=i.map(E=>{let b=String(E.room_id),R=o.get(b)||[0,0],d=S+(R[0]-l)/g*p,T=_+(R[1]-h)/x*A,L=C0(d,T),F=sp(E.name||b),B=E0(E.public_player_labels,F,b);return{room_id:b,name:F,x:L.x,y:L.y,gx:R[0],gy:R[1],certainty:T0(E,e,t),players:Math.max(0,Number(E.players_present||0)||0),labels:B,marks:A0(E,e)}}),y=new Map(P.map(E=>[E.room_id,E.certainty]));for(let E=0;E<a.length;E++){let b=a[E],R=y.get(b.from),d=y.get(b.to);b.dashed=R==="partial"||d==="partial"}return{nodes:P,edges:a}}function C0(n,e){return{x:Math.max(12,Math.min(rp-12,Math.round(n))),y:Math.max(14,Math.min(op-14,Math.round(e)))}}var $2=160*1024,fs=4,P0=20*Math.PI/180,L0=70*Math.PI/180,fp=Fl.NOTABLE,D0=3,I0={NORMAL:2500,NOTABLE:3500,MAJOR:4e3},hn={MIN_GAP_MS:400,MAX_GAP_MS:2500,UNKNOWN_GAP_MS:600,MAX_TOTAL_MS:9e3},Bl=1100,Gl=3e3,lp={DWELL_MS:4e3,MAJOR_PREEMPT_MS:1500};function hp(n){let e=[];for(let r of Array.isArray(n)?n:[]){let o=r?.sequence;if(typeof o!="number"||!Number.isSafeInteger(o))continue;let s=r?.occurredAt,a=typeof s=="number"&&Number.isFinite(s)?s:null,c=e.find(l=>l.sequence===o);if(c){c.occurredAt===null&&a!==null&&(c.occurredAt=a);continue}e.push({sequence:o,occurredAt:a})}e.sort((r,o)=>r.sequence-o.sequence);let t=[];for(let r=0;r<e.length;r++){let o=0;if(r>0){let s=e[r-1].occurredAt,a=e[r].occurredAt,c=hn.UNKNOWN_GAP_MS;if(s!==null&&a!==null){let l=a-s;l>=0&&(c=Math.min(hn.MAX_GAP_MS,Math.max(hn.MIN_GAP_MS,l)))}o=t[r-1].atMs+c}t.push({sequence:e[r].sequence,atMs:o})}let i=t.length?t[t.length-1].atMs:0;if(i>hn.MAX_TOTAL_MS){let r=hn.MAX_TOTAL_MS/i;for(let o of t)o.atMs=Math.round(o.atMs*r)}return t}function dp(n,e){let t=typeof e=="number"&&Number.isFinite(e)?e:0,i=t;for(let o of Array.isArray(n)?n:[])typeof o!="number"||!Number.isFinite(o)||o>i&&(i=o);let r=i-t;return r>hn.MAX_TOTAL_MS?{flush:!0,offsetMs:0}:r<=0?{flush:!1,offsetMs:0}:{flush:!1,offsetMs:r+hn.MIN_GAP_MS}}var N0=["faint","marked","deep"],cp=["low","moderate","high"];function Ol(n,e){let t=String(n??"").trim().toLowerCase();return e.includes(t)?t:""}function U0(n){let e={},t=n&&typeof n=="object"?n.base:null,i=t&&Array.isArray(t.rooms)?t.rooms:[];for(let r of i){if(!r||typeof r!="object")continue;let o=r,s=String(o.room_id||"");if(!s)continue;let a={scar:Ol(o.scar_band,N0),pressure:Ol(o.pressure_band,cp),protocol:Ol(o.protocol_band,cp)};(a.scar||a.pressure||a.protocol)&&(e[s]=a)}return e}function pp(n){let e=[];return n.scar&&e.push("scar "+n.scar),n.pressure&&e.push("pressure "+n.pressure),n.protocol&&e.push("protocol "+n.protocol),e.join(" \xB7 ")}var fn={MAX_OPACITY:.55,MIN_OPACITY:.18,SIZE:4.2};function mp(n){let e=n?.active===!0,t=n?.major===!0,i=n?.followed===!0,r=Math.max(0,Number(n?.players)||0);if(!e&&!t&&!i&&r<=0)return 0;let o=fn.MIN_OPACITY+(fn.MAX_OPACITY-fn.MIN_OPACITY)*Math.min(1,r/6);return t&&(o=Math.min(fn.MAX_OPACITY,o+.15)),i&&(o=Math.max(o,fn.MIN_OPACITY+.1)),o=Math.max(0,Math.min(fn.MAX_OPACITY,o)),Math.round(o*1e3)/1e3}var F0=/\b(?:player|room|entity|ctrl|event|controller|device)\.[a-z0-9._-]+/i;function In(n,e){let t=String(n??"").replace(/[\u0000-\u001f\u007f]/g,"").replace(/\s+/g," ").trim();return!t||F0.test(t)?"":t.length>e?t.slice(0,e):t}function gp(n){return In(n,48)}function O0(n){let e=gp(n.name).toLowerCase(),t=[];for(let i of Array.isArray(n.public_player_labels)?n.public_player_labels:[]){let r=In(i,32);!r||r.toLowerCase()===e||t.includes(r)||t.push(r)}return t}function up(n,e){let t=e+" ";for(let i of Array.isArray(n)?n:[])if(String(i??"").startsWith(t))return In(i,120);return""}function B0(n,e){let t=up(n.public_focus_lines,e);return t||up(n.public_title_lines,e)}function _p(n,e={}){let t=Array.isArray(n?.rooms)?n.rooms:[],i=Array.isArray(n?.recent_events)?n.recent_events:[],r=ap(t,i),o=new Map;for(let S of t)Na(S)&&o.set(String(S.room_id),S);let s=U0(e.map),a={scar:"",pressure:"",protocol:""},c=r.nodes.filter(S=>o.has(S.room_id)),l=c.length?c.reduce((S,_)=>S+(_.gx??0),0)/c.length:0,h=c.length?c.reduce((S,_)=>S+(_.gy??0),0)/c.length:0,m=[],f=0;for(let S of c){let _=o.get(S.room_id),p=gp(_.name);if(!p)continue;let A=((S.gx??0)-l)*fs,P=((S.gy??0)-h)*fs;f=Math.max(f,Math.hypot(A,P));let y=Array.isArray(_.traces)?_.traces.filter(d=>d&&In(d.text,400)).length:0,E=Math.max(0,Number(_.players_present)||0),b=O0(_),R=b.slice(0,6).map(d=>({handle:d,line:B0(_,d)}));m.push({id:S.room_id,name:p,x:A,z:P,certainty:S.certainty,active:_.active===!0||S.certainty==="active",players:E,handles:b,tokens:R,unnamed:Math.max(0,Math.min(E,6)-R.length),more:Math.max(0,Math.max(E,b.length)-6),traces:y,selected:!!e.selectedId&&e.selectedId===S.room_id,followed:!!e.followRoomId&&e.followRoomId===S.room_id,major:!!e.majorRoomId&&e.majorRoomId===S.room_id,bands:s[S.room_id]||a})}let g=new Set(m.map(S=>S.id)),x=[];for(let S of r.edges){if(!g.has(S.from)||!g.has(S.to))continue;let _=(o.get(S.to)?.exits||[]).some(p=>p&&p.hidden!==!0&&String(p.to_room_id)===S.from);x.push({from:S.from,to:S.to,direction:S.direction,dashed:!!S.dashed,oneWay:!_})}return{sites:m,routes:x,radius:f+fs*.75}}function xp(n){let e=String(n||"").toUpperCase();return e==="MAJOR"||e==="NOTABLE"?e:"NORMAL"}function Mp(n,e,t,i={}){let r=new Set(t),o=[],s=e;for(let l of Array.isArray(n)?n:[]){let h=l?.sequence;if(typeof h!="number"||!Number.isSafeInteger(h)||((s===null||h>s)&&(s=h),e===null||h<=e))continue;let m=String(l.room_id||"");if(!r.has(m))continue;let f=xp(l.tier),g={roomId:m,tier:f,ttl:Fl[f],sequence:h},x=l.projection_id;typeof x=="string"&&x&&(g.projectionId=x),o.push(g)}if(e===null){let l=Number.isSafeInteger(i.snapshotSequence)?i.snapshotSequence:0;return{pulses:[],lastSequence:Math.max(s??l,l)}}if(i.reduce)return{pulses:[],lastSequence:s};o.sort((l,h)=>h.sequence-l.sequence);let a=o.find(l=>l.tier==="MAJOR"),c=o.filter(l=>l.tier!=="MAJOR").slice(0,D0);return{pulses:a?[a,...c]:c,lastSequence:s}}function G0(n,e){let t=i=>i.replace(/\.+$/,"").toLowerCase();return t(n)===t(e)}function Sp(n,e,t){if(e===null)return[];let i=new Set(t),r=[];for(let a of Array.isArray(n)?n:[]){let c=a,l=c?.sequence;if(typeof l!="number"||!Number.isSafeInteger(l)||l<=e)continue;let h=String(c.room_id||"");if(!i.has(h))continue;let m=In(c.line,120);if(!m)continue;let f=xp(c.tier),g=In(c.actor_label,32),x=In(c.consequence,120);x&&G0(x,m)&&(x=""),r.push({roomId:h,tier:f,sequence:l,line:m,actor:g,consequence:x,holdMs:I0[f]})}r.sort((a,c)=>c.sequence-a.sequence);let o=r.find(a=>a.tier==="MAJOR"),s=r.filter(a=>a.tier!=="MAJOR").slice(0,2);return o?[o,...s]:s}function vp(n,e){let t=new Set;for(let i of Array.isArray(n)?n:[])for(let r of e)(r.from===i.roomId||r.to===i.roomId)&&t.add(r.from+"|"+r.to);return t}function zl(n){let e=new Map,t=new Set,i=Array.isArray(n?.sites)?n.sites:[];for(let r of i){let o=Array.isArray(r.handles)?r.handles:[];for(let s of o){if(!s||t.has(s))continue;let a=e.get(s);a===void 0?e.set(s,r.id):a!==r.id&&(e.delete(s),t.add(s))}}return e}function z0(n,e,t){for(let i of Array.isArray(n)?n:[])if(i&&(i.from===e&&i.to===t||i.from===t&&i.to===e&&i.oneWay===!1))return!0;return!1}function yp(n,e,t,i){let r=zl(e),o=new Map;for(let a of Array.isArray(i)?i:[]){if(!a||typeof a!="object")continue;let c=a,l=c.sequence;if(typeof l!="number"||!Number.isSafeInteger(l))continue;let h=l+"|"+String(c.room_id||"");o.has(h)||o.set(h,c)}let s=new Map;for(let a of Array.isArray(t)?t:[]){if(!a||a.projectionId!=="agent_move")continue;let c=o.get(a.sequence+"|"+a.roomId);if(!c)continue;let l=In(c.actor_label,32);if(!l)continue;let h=n?n.get(l):void 0,m=r.get(l);if(!h||!m||h===m||m!==a.roomId||!z0(e.routes,h,m))continue;let f=s.get(l);f&&f.sequence>=a.sequence||s.set(l,{handle:l,from:h,to:m,sequence:a.sequence})}return Array.from(s.values()).sort((a,c)=>a.sequence-c.sequence)}function kl(n){let e=Math.max(n,fs*2);return{minDistance:e*.8,maxDistance:e*3.2,maxTargetRadius:e,minPolarAngle:P0,maxPolarAngle:L0}}function bp(n){let t=Math.max(n,fs*2)*2.3,i=40*Math.PI/180,r=-.35;return{target:[0,0,0],position:[t*Math.sin(i)*Math.sin(r),t*Math.cos(i),t*Math.sin(i)*Math.cos(r)]}}function Ep(n,e,t,i){return e.selectedId&&e.selectedId!==n.selectedId?e.selectedId:e.followRoomId&&e.followRoomId!==n.followRoomId?e.followRoomId:i?"":t||""}function Ua(n){return n==="MAJOR"?1:0}function Tp(n,e,t){let i=null;for(let s of Array.isArray(e)?e:[]){if(!s)continue;let a=String(s.roomId||"");if(!a)continue;let c=String(s.tier||"").toUpperCase();if(c!=="MAJOR"&&c!=="NOTABLE")continue;let l=typeof s.sequence=="number"&&Number.isFinite(s.sequence)?s.sequence:0,h=c;(!i||Ua(h)>Ua(i.tier)||Ua(h)===Ua(i.tier)&&l>i.sequence)&&(i={roomId:a,tier:h,sequence:l})}if(!i)return null;let r={roomId:i.roomId,tier:i.tier,sequence:i.sequence,at:t};if(!n)return r;if(i.roomId===n.roomId)return null;let o=t-n.at;return o>=lp.DWELL_MS||i.tier==="MAJOR"&&n.tier!=="MAJOR"&&o>=lp.MAJOR_PREEMPT_MS?r:null}var k0={NORMAL:.25,NOTABLE:.45,MAJOR:.7},H0={low:.12,moderate:.24,high:.38},V0={faint:.45,marked:.72,deep:1},It=2.4,Ap=-.82,wp=new D(0,1,0),W0=new Set(["ArrowLeft","ArrowRight","ArrowUp","ArrowDown"]);function tr(n,e){try{return getComputedStyle(document.documentElement).getPropertyValue(n).trim()||e}catch{return e}}function X0(){return{world:new Le(tr("--color-surface-world","#0B0F15")),plate:new Le("#212C39"),raised:new Le("#273444"),selected:new Le("#304052"),edge:new Le("#3A4E63"),ink:new Le(tr("--color-text-primary","#F0EAE0")),active:new Le(tr("--color-state-active","#3DDCFF")),warning:new Le(tr("--color-state-warning","#FFB020")),social:new Le(tr("--color-state-social","#D4B68A")),unknown:new Le(tr("--color-state-unknown","#9B6DFF")),machine:new Le(tr("--color-text-machine","#8CB8C8")),route:new Le("#35495E")}}var Rp=[4054271,16756768,5432744,11963647,16739211,7387391];function Hl(n){if(!n)return 13216898;let e=0;for(let t=0;t<n.length;t++)e=e*31+n.charCodeAt(t)>>>0;return Rp[e%Rp.length]}function ir(n,e){try{let t=document.createElement("canvas");t.width=n,t.height=e;let i=typeof t.getContext=="function"?t.getContext("2d"):null;return i?{canvas:t,ctx2d:i}:null}catch{return null}}function Fa(n){let e=n>>>0;return()=>{e=e+1831565813|0;let t=Math.imul(e^e>>>15,1|e);return t=t+Math.imul(t^t>>>7,61|t)^t,((t^t>>>14)>>>0)/4294967296}}function q0(){let n=ir(128,128);if(!n)return null;let{canvas:e,ctx2d:t}=n,i=t.createRadialGradient(64,64,0,64,64,64);return i.addColorStop(0,"rgba(255,255,255,1)"),i.addColorStop(.16,"rgba(255,255,255,0.88)"),i.addColorStop(.36,"rgba(255,255,255,0.44)"),i.addColorStop(.64,"rgba(255,255,255,0.14)"),i.addColorStop(.86,"rgba(255,255,255,0.03)"),i.addColorStop(1,"rgba(255,255,255,0)"),t.fillStyle=i,t.fillRect(0,0,128,128),new ki(e)}function Y0(){let n=ir(64,128);if(!n)return null;let{canvas:e,ctx2d:t}=n,i=t.createLinearGradient(0,128,0,0);i.addColorStop(0,"rgba(255,255,255,0.85)"),i.addColorStop(.28,"rgba(255,255,255,0.34)"),i.addColorStop(.65,"rgba(255,255,255,0.09)"),i.addColorStop(1,"rgba(255,255,255,0)"),t.fillStyle=i,t.fillRect(0,0,64,128),t.globalCompositeOperation="multiply";let r=t.createLinearGradient(0,0,64,0);return r.addColorStop(0,"rgba(180,180,180,1)"),r.addColorStop(.25,"rgba(255,255,255,1)"),r.addColorStop(.5,"rgba(195,195,195,1)"),r.addColorStop(.75,"rgba(255,255,255,1)"),r.addColorStop(1,"rgba(180,180,180,1)"),t.fillStyle=r,t.fillRect(0,0,64,128),new ki(e)}function K0(){let n=ir(256,256);if(!n)return null;let{canvas:e,ctx2d:t}=n,i=t.createLinearGradient(0,0,0,256);i.addColorStop(0,"#06090F"),i.addColorStop(.36,"#090E17"),i.addColorStop(.64,"#0D1521"),i.addColorStop(.84,"#101927"),i.addColorStop(.94,"#142030"),i.addColorStop(1,"#0B0F15"),t.fillStyle=i,t.fillRect(0,0,256,256);let r=Fa(4117);for(let s=0;s<155;s++){let a=r()*256,c=r()*150,l=r(),h=.2+l*.72,m=l>.86?1.5:1;t.fillStyle=l>.7?`rgba(214,234,255,${h.toFixed(2)})`:`rgba(186,208,232,${(h*.75).toFixed(2)})`,t.fillRect(a,c,m,m)}let o=new ki(e);return o.colorSpace=Vt,o}function Z0(){let n=ir(512,512),e=ir(512,512);if(!n||!e)return null;let t=n.ctx2d,i=e.ctx2d,r=t.createRadialGradient(256,256,16,256,256,256);r.addColorStop(0,"#0D121A"),r.addColorStop(.26,"#111824"),r.addColorStop(.5,"#172230"),r.addColorStop(.76,"#1F2D40"),r.addColorStop(1,"#111824"),t.fillStyle=r,t.fillRect(0,0,512,512),i.fillStyle="#808080",i.fillRect(0,0,512,512);let o=Fa(9021);for(let l=0;l<72;l++){let h=o()*Math.PI*2,m=68+o()*176,f=256+Math.cos(h)*m,g=256+Math.sin(h)*m,x=22+o()*52,S=t.createRadialGradient(f,g,0,f,g,x),_=o()>.38;S.addColorStop(0,_?"rgba(38,56,78,0.20)":"rgba(12,18,28,0.28)"),S.addColorStop(1,"rgba(0,0,0,0)"),t.fillStyle=S,t.fillRect(f-x,g-x,x*2,x*2)}let s=t.createRadialGradient(256,256,12,256,256,66);s.addColorStop(0,"rgba(4,6,10,0.56)"),s.addColorStop(.78,"rgba(7,10,16,0.32)"),s.addColorStop(1,"rgba(0,0,0,0)"),t.fillStyle=s,t.fillRect(184,184,144,144),t.lineWidth=1.1,i.lineWidth=1.5;for(let l=22;l<=240;l+=13){let h=l<62;t.strokeStyle=h?"rgba(46,66,88,0.22)":"rgba(58,82,108,0.24)",i.strokeStyle=h?"rgba(58,58,58,0.52)":"rgba(188,188,188,0.44)",t.beginPath(),i.beginPath();for(let m=0;m<=72;m++){let f=m/72*Math.PI*2,g=h?0:Math.sin(f*5+l*.08)*2.8+Math.cos(f*3-l*.05)*2,x=256+Math.cos(f)*(l+g),S=256+Math.sin(f)*(l+g);m===0?(t.moveTo(x,S),i.moveTo(x,S)):(t.lineTo(x,S),i.lineTo(x,S))}t.stroke(),i.stroke()}t.lineWidth=.85;for(let l=0;l<12;l++){let h=l/12*Math.PI*2,m=l%3===0;t.strokeStyle=m?"rgba(140,117,88,0.24)":"rgba(52,72,96,0.16)",t.beginPath(),t.moveTo(256+Math.cos(h)*20,256+Math.sin(h)*20),t.lineTo(256+Math.cos(h)*108,256+Math.sin(h)*108),t.stroke()}for(let l=0;l<4200;l++){let h=o()*512|0,m=o()*512|0,f=o();t.fillStyle=f>.5?"rgba(164,196,226,0.036)":"rgba(0,0,0,0.09)",t.fillRect(h,m,2,2);let g=92+f*72|0;i.fillStyle=`rgb(${g},${g},${g})`,i.fillRect(h,m,2,2)}let a=new ki(n.canvas);a.colorSpace=Vt;let c=new ki(e.canvas);return{map:a,bump:c}}function J0(){let n=ir(256,256),e=ir(256,256);if(!n||!e)return null;let t=n.ctx2d,i=e.ctx2d;t.fillStyle="#b8c4d0",t.fillRect(0,0,256,256),i.fillStyle="#a0a0a0",i.fillRect(0,0,256,256);let r=Fa(3141),o=64;for(let c=0;c<4;c++)for(let l=0;l<4;l++){let h=176+(r()*24|0);t.fillStyle=`rgb(${h},${h+6},${h+14})`,t.fillRect(l*o+2,c*o+2,o-4,o-4);let m=148+(r()*36|0);i.fillStyle=`rgb(${m},${m},${m})`,i.fillRect(l*o+2,c*o+2,o-4,o-4),t.fillStyle="#525e6b",i.fillStyle="#484848";for(let[f,g]of[[7,7],[o-9,7],[7,o-9],[o-9,o-9]])t.fillRect(l*o+f,c*o+g,2.5,2.5),i.fillRect(l*o+f,c*o+g,2.5,2.5)}t.strokeStyle="#485462",t.lineWidth=2,i.strokeStyle="#323232",i.lineWidth=2.5;for(let c=0;c<=256;c+=o)t.beginPath(),t.moveTo(c,0),t.lineTo(c,256),t.stroke(),t.beginPath(),t.moveTo(0,c),t.lineTo(256,c),t.stroke(),i.beginPath(),i.moveTo(c,0),i.lineTo(c,256),i.stroke(),i.beginPath(),i.moveTo(0,c),i.lineTo(256,c),i.stroke();t.strokeStyle="#8a99a8",t.lineWidth=2,t.strokeRect(8,8,240,240),i.strokeStyle="#d0d0d0",i.lineWidth=2.5,i.strokeRect(8,8,240,240);for(let c=0;c<420;c++){let l=r()*256,h=r()*256,m=10+r()*34;t.fillStyle=r()>.5?"rgba(220,238,255,0.045)":"rgba(18,24,34,0.065)",t.fillRect(l,h,m,1)}let s=new ki(n.canvas);s.colorSpace=Vt,s.wrapS=s.wrapT=xn;let a=new ki(e.canvas);return a.wrapS=a.wrapT=xn,{map:s,bump:a}}function Cp(n,e,t,i,r,o){let l=new Float32Array(972),h=[];for(let g=0;g<=80;g++){let x=g/80*Math.PI*2,S=Math.cos(x),_=Math.sin(x),p=.5+.25*Math.sin(x*3+r)+.15*Math.cos(x*5-r*1.3)+.08*Math.sin(x*8+r*.7),A=t+p*i,P=n+(p-.5)*1.3,y=P+1.15,E=e-1.2+(p-.5)*1.6,b=e+.9+(p-.5)*1.6,R=[[P,-.24],[y,A],[E,A*.88],[b,-.24]];for(let d=0;d<4;d++){let T=(g*4+d)*3;l[T]=S*R[d][0],l[T+1]=R[d][1],l[T+2]=_*R[d][0]}if(g<80)for(let d=0;d<3;d++){let T=g*4+d,L=(g+1)*4+d,F=(g+1)*4+d+1,B=g*4+d+1;h.push(T,L,B,L,F,B)}}let m=new gt;m.setAttribute("position",new ri(l,3)),m.setIndex(h),m.computeVertexNormals();let f=new Se(m,o);return f.receiveShadow=!0,f.raycast=()=>{},f}function $0(n,e,t){let i=new Gt,r=new cn(128,128,160,160),o=r.attributes.position,s=new Float32Array(o.count);for(let d=0;d<o.count;d++){let T=o.getX(d),L=o.getY(d),F=Math.hypot(T,L),B=0;if(F>15.8){let X=Math.min(1,(F-15.8)/10.5),U=X*X*(3-2*X),K=Math.atan2(L,T),j=(1.05+.42*Math.sin(K*3+.6)+.24*Math.cos(K*5-1.1)+.14*Math.sin(K*7+.3))*Math.min(3.6,(F-15.8)*.16),le=Math.round(j*2.2)/2.2;B=Math.max(0,U*(j*.55+le*.45))}s[d]=B,o.setZ(d,B)}r.computeVertexNormals();let a=new je({color:n?14411506:1054240,map:n?n.map:null,bumpMap:n?n.bump:null,bumpScale:.36,roughness:.88,metalness:.14}),c=new Se(r,a);c.rotation.x=-Math.PI/2,c.position.y=-.15,c.receiveShadow=!0,c.raycast=()=>{},i.add(c);let l="";function h(d,T){let L=d.map(F=>F.x.toFixed(2)+","+F.z.toFixed(2)).join("|")+";"+T.map(F=>F.x.toFixed(2)+","+F.z.toFixed(2)).join("|");if(L!==l){l=L;for(let F=0;F<o.count;F++){let B=s[F],X=o.getX(F),U=-o.getY(F);if(d.length&&Math.hypot(X,U)<15.6){let K=!1;for(let ee=0;ee<T.length;ee++)if(Math.abs(X-T[ee].x)<1.38&&Math.abs(U-T[ee].z)<1.38){K=!0;break}if(!K)for(let ee=0;ee<d.length;ee++){let j=Math.max(Math.abs(X-d[ee].x),Math.abs(U-d[ee].z));if(j<1.54)B=Math.min(B,-.94);else if(j<2.16){let le=(j-1.54)/.6200000000000001,te=le*le*(3-2*le);B=Math.min(B,-.94*(1-te))}}}o.setZ(F,B)}o.needsUpdate=!0,r.computeVertexNormals()}}let m=new je({color:2372420,emissive:1450544,emissiveIntensity:.26,roughness:.48,metalness:.68,transparent:!0,opacity:.55}),f=new Se(new wn(14.16,14.28,96),m);f.rotation.x=-Math.PI/2,f.position.y=-.138,f.raycast=()=>{},i.add(f);let g=new Se(new wn(15.22,15.29,96),new ei({color:2372420,transparent:!0,opacity:.42,depthWrite:!1}));g.rotation.x=-Math.PI/2,g.position.y=-.139,g.raycast=()=>{},i.add(g);let x=new je({color:9205080,emissive:3878688,emissiveIntensity:.22,roughness:.42,metalness:.72}),S=new wt(.08,.014,.68),_=new wt(.055,.012,.36);for(let d=0;d<8;d++){let T=d/8*Math.PI*2,L=d%2===0,F=new Se(L?S:_,x),B=14.22;F.position.set(Math.sin(T)*B,-.134,-Math.cos(T)*B),F.rotation.y=-T,F.raycast=()=>{},i.add(F)}let p=new je({color:1845048,emissive:857376,emissiveIntensity:.32,roughness:.8,metalness:.16}),A=new je({color:2372423,emissive:857376,emissiveIntensity:.32,roughness:.8,metalness:.14});if(i.add(Cp(16.8,22,.72,.95,.4,p)),i.add(Cp(21.4,28.4,1.45,1.55,2.1,A)),e){let d=new Se(new Di(48,48,28,48,1,!0),new ei({map:e,side:Ct,fog:!1,depthWrite:!1}));d.position.y=8,d.raycast=()=>{},i.add(d)}let P=120,y=new Float32Array(P*3),E=Fa(1337);for(let d=0;d<P;d++){let T=E()*Math.PI*2,L=3.2+E()*20,F=.6+E()*4.6;y[d*3]=Math.cos(T)*L,y[d*3+1]=F,y[d*3+2]=Math.sin(T)*L}let b=new gt;b.setAttribute("position",new ri(y,3));let R=new jo(b,new Qn({color:10405088,map:t||null,size:t?.24:.11,transparent:!0,opacity:.28,blending:Ai,depthWrite:!1}));return R.raycast=()=>{},i.add(R),{grp:i,updatePits:h}}var Vl=n=>1-Math.pow(1-n,3);function Q0(n,e){let t=e.canvas,i=e.labels,r=!!e.reduce,o=typeof e.onSelect=="function"?e.onSelect:()=>{},s=typeof e.onLost=="function"?e.onLost:()=>{},a=X0(),c=q0(),l=Y0(),h=K0(),m=Z0(),f=J0();try{let w=typeof t.getContext=="function"?t.getContext("webgl2")||t.getContext("webgl"):null;w&&typeof w.pixelStorei=="function"&&(w.pixelStorei(w.UNPACK_FLIP_Y_WEBGL,!1),w.pixelStorei(w.UNPACK_PREMULTIPLY_ALPHA_WEBGL,!1))}catch{}let g=new cs({canvas:t,antialias:!0,powerPreference:"low-power"});g.setPixelRatio(Math.min(window.devicePixelRatio||1,2)),g.setClearColor(724757,1),g.toneMapping=rr,g.toneMappingExposure=1.32,g.shadowMap.enabled=!0,g.shadowMap.type=dn;let x=new Ia({element:i}),S=new Ko;S.fog=new Yo(725015,.0068);let _=$0(m,h,c),p=_.grp;S.add(p);let A=new ts(10204884,1054756,1.38);S.add(A);let P=new kr(13164276,2.45);P.position.set(-14,17,11),P.castShadow=!0,P.shadow.mapSize.set(2048,2048),P.shadow.radius=2.5,P.shadow.camera.left=-18,P.shadow.camera.right=18,P.shadow.camera.top=18,P.shadow.camera.bottom=-18,P.shadow.camera.near=2,P.shadow.camera.far=52,P.shadow.bias=-4e-4,P.shadow.normalBias=.025,S.add(P);let y=new kr(4966640,1.25);y.position.set(15,10,-13),S.add(y);let E=new is(16757844,2.6,26,1.28);E.position.set(-1,2.8,-1.2),S.add(E);let b=new Ot(38,1,.1,2e3),R=new Da(b,t);R.enableDamping=!0,R.dampingFactor=.08,R.screenSpacePanning=!1,R.listenToKeyEvents(n);let d={subBase:new wt(It+.3,.14,It+.3),collar:new wt(It+.12,.07,It+.12),plate:new wt(It,.22,It),curbX:new wt(It+.04,.042,.045),curbZ:new wt(.045,.042,It+.04),trimX:new wt(It-.14,.026,.026),trimZ:new wt(.026,.026,It-.14),cornerPost:new wt(.11,.11,.11),ring:new wt(It+.56,.04,It+.56),scar:new wt(It-.56,.02,It-.56),beacon:new Di(It*.46,It*.6,1.35,24,1,!0),pipBase:new Di(.18,.21,.055,10),pipRing:new wn(.18,.25,16),pip:new Di(.11,.19,.36,8),pipCollar:new Or(.125,.022,6,12),pipHead:new jn(.13,0),pipVisor:new wt(.14,.055,.09),trailDot:new jn(.065,0),core:new jn(.28,0),torus:new Or(.46,.036,8,28),torusSm:new Or(.32,.028,8,24),pillar:new wt(.16,.88,.16),beam:new wt(.12,.12,1),fin:new wt(.08,.62,.38),dish:new es(.36,.22,14,1,!0),monolith:new wt(.2,.96,.1),silo:new Di(.21,.23,.68,12),dome:new Di(.28,.56,.36,8),crate:new wt(.34,.22,.24),pipe:new Di(.065,.065,.85,8),unitBox:new wt(1,1,1),trace:new jn(.13,0),arrow:new es(.18,.46,6),pulse:new wn(1.66,1.88,48),pulseInner:new wn(1.26,1.38,48),halo:new cn(1,1)},T=new Set(Object.values(d)),L=[],F=[],B=new Gt;S.add(B);let X=null,U={sites:[],routes:[],radius:8},K={},ee=null,j=[],le=null,te=!1,he=null,pe=!1,We=0,ze=!1,pt=!1,at="",ht="",$=new Map,de=[],Ne=[],Je=new Map,Fe=new Map,Ye=[],vt=[];function ot(w,z){return w.userData.siteId=z,w}function Oe(w,z,G,k,u){let v=new Se(d.unitBox,k);return v.scale.set(w,z,G),u!==!1&&(v.castShadow=!0,v.receiveShadow=!0),v}function At(w,z){let G=new Gt,k=[],u=new Le(2041649).lerp(new Le(w),.34),v=new ei({color:w,transparent:!0,opacity:z?.8:.36,blending:Ai,depthWrite:!1,side:ii});k.push(v);let I=new Se(d.pipRing,v);I.rotation.x=-Math.PI/2,I.position.y=.015,I.raycast=()=>{},G.add(I);let N=new je({color:3161162,roughness:.42,metalness:.68});k.push(N);let O=new Se(d.pipBase,N);O.position.y=.04,O.castShadow=!0,O.receiveShadow=!0,G.add(O);let ce=new je({color:u,emissive:w,emissiveIntensity:z?.32:.12,roughness:.38,metalness:.4});k.push(ce);let ie=new Se(d.pip,ce);ie.position.y=.24,ie.castShadow=!0,ie.receiveShadow=!0,G.add(ie);let q=new je({color:w,emissive:w,emissiveIntensity:z?1.25:.4,roughness:.22,metalness:.42});k.push(q);let W=new Se(d.pipCollar,q);W.rotation.x=Math.PI/2,W.position.y=.43,G.add(W);let Z=new Gt;Z.position.y=.59;let ne=new je({color:16317439,emissive:w,emissiveIntensity:z?1.45:.45,roughness:.16,metalness:.3});k.push(ne);let fe=new Se(d.pipHead,ne);fe.castShadow=!0,Z.add(fe);let Q=new je({color:1054752,emissive:w,emissiveIntensity:z?1.8:.5,roughness:.1,metalness:.6});k.push(Q);let ge=new Se(d.pipVisor,Q);return ge.position.set(0,0,.07),Z.add(ge),G.add(Z),G.scale.setScalar(1.14),{root:G,head:Z,bodyMat:ce,ringMat:v,glowMats:[ce,q,ne,Q],mats:k}}function ct(w,z,G){let k=String(z.id||""),u=new Gt;u.position.set(0,G,0),u.scale.setScalar(1.2),w.add(u);let v=0,I=new je({color:2503490,roughness:.46,metalness:.62}),N=new je({color:6124168,roughness:.36,metalness:.62}),O=new je({color:11570268,roughness:.35,metalness:.72}),ce=new je({color:10285311,emissive:4054271,emissiveIntensity:1.55,roughness:.18}),ie=new je({color:16768140,emissive:16751130,emissiveIntensity:1.65,roughness:.18}),q=new je({color:14271231,emissive:10186239,emissiveIntensity:1.48,roughness:.2});if(k.includes("generator")){let W=new Se(d.dome,I);W.scale.set(1.1,.38,1.1),W.position.set(0,v+.07,-.58),W.castShadow=!0,W.receiveShadow=!0,u.add(W);for(let Q of[-.62,.62]){let ge=new Se(d.fin,N);ge.position.set(Q,v+.34,-.58),ge.rotation.z=Q<0?.16:-.16,ge.castShadow=!0,ge.receiveShadow=!0,u.add(ge);let oe=Oe(.11,.06,.34,O);oe.position.set(Q*.94,v+.66,-.58),u.add(oe)}let Z=new Se(d.core,ie);Z.position.set(0,v+.56,-.58),Z.castShadow=!0,Z.userData.spin=1.25,u.add(Z),L.push(Z);let ne=new Se(d.torus,ce);ne.position.copy(Z.position),ne.rotation.x=Math.PI/3,ne.userData.spin=-.85,u.add(ne),L.push(ne);let fe=new Se(d.torusSm,ce);if(fe.position.copy(Z.position),fe.rotation.set(-Math.PI/3.4,.6,Math.PI/4),fe.userData.spin=1.1,u.add(fe),L.push(fe),c){let Q=new Se(d.halo,new ei({map:c,color:16754227,transparent:!0,opacity:.45,blending:Ai,depthWrite:!1}));Q.rotation.x=-Math.PI/2,Q.position.set(0,v+.02,-.58),Q.scale.set(1.6,1.6,1),Q.raycast=()=>{},u.add(Q)}}else if(k.includes("relay")){let W=Oe(.76,.18,.66,I);W.position.set(.5,v+.09,-.62),u.add(W);let Z=new Se(d.pillar,N);Z.scale.set(.85,1.15,.85),Z.position.set(.5,v+.58,-.62),Z.castShadow=!0,u.add(Z);for(let _e of[.36,.62,.86]){let Ie=Oe(.32,.04,.32,O);Ie.position.set(.5,v+_e,-.62),u.add(Ie)}let ne=new Gt;ne.position.set(.5,v+1.12,-.62),ne.userData.spin=.55;let fe=new Se(d.dish,new je({color:10796747,emissive:4054271,emissiveIntensity:.25,roughness:.32,metalness:.58,side:ii}));fe.rotation.z=.68,fe.castShadow=!0,ne.add(fe);let Q=new Se(d.trace,ce);Q.scale.setScalar(.55),Q.position.set(-.18,.14,0),ne.add(Q),u.add(ne),L.push(ne);let ge=Oe(.055,.74,.055,N);ge.position.set(-.58,v+.37,-.74),u.add(ge);let oe=new Se(d.trace,ie);oe.scale.setScalar(.45),oe.position.set(-.58,v+.78,-.74),u.add(oe)}else if(k.includes("archive")){let W=new Se(d.dome,I);W.scale.set(1.5,.35,1),W.position.set(0,v+.06,-.64),W.receiveShadow=!0,u.add(W);let Z=new je({color:1713458,emissive:2525352,emissiveIntensity:.34,metalness:.62,roughness:.24}),ne=[[-.78,-.52,.35,.84],[-.42,-.76,.18,1.02],[0,-.84,0,1.18],[.42,-.76,-.18,1.02],[.78,-.52,-.35,.84]];for(let[Q,ge,oe,_e]of ne){let Ie=new Se(d.monolith,Z);Ie.scale.set(.9,_e,1),Ie.position.set(Q,v+.48*_e,ge),Ie.rotation.y=oe,Ie.castShadow=!0,Ie.receiveShadow=!0,u.add(Ie);let st=Oe(.04,.62*_e,.115,ce,!1);st.position.set(Q,v+.5*_e,ge),st.rotation.y=oe,u.add(st)}let fe=new Se(d.core,ce);fe.scale.setScalar(.68),fe.position.set(0,v+.58,-.44),fe.userData.spin=.9,u.add(fe),L.push(fe)}else if(k.includes("civic")){let W=[[-.86,-.82],[.86,-.82],[-.86,.14],[.86,.14]];for(let[Q,ge]of W){let oe=new Se(d.pillar,N);oe.scale.set(.75,ge<0?.96:.62,.75),oe.position.set(Q,v+(ge<0?.42:.27),ge),oe.castShadow=!0,u.add(oe);let _e=new Se(d.trace,ie);_e.scale.setScalar(.58),_e.position.set(Q,v+(ge<0?.92:.62),ge),u.add(_e)}let Z=new Se(d.torus,O);Z.scale.setScalar(1.32),Z.rotation.x=Math.PI/2,Z.position.set(0,v+.05,-.34),u.add(Z);let ne=new Se(d.torusSm,ie);ne.rotation.x=Math.PI/2,ne.position.set(0,v+.09,-.34),u.add(ne);let fe=new Se(d.core,ie);fe.scale.set(.62,.42,.62),fe.position.set(0,v+.66,-.34),fe.userData.spin=.5,u.add(fe),L.push(fe)}else if(k.includes("transit")){for(let Z of[-.74,-.24]){let ne=new Se(d.torus,N);ne.position.set(0,v+.44,Z),ne.scale.set(1.48,1.32,1.4),ne.castShadow=!0,u.add(ne);let fe=new Se(d.torus,ce);fe.position.set(0,v+.44,Z),fe.scale.set(1.36,1.22,.65),u.add(fe)}for(let[Z,ne]of[[-.86,-.49],[.86,-.49],[-.86,.2],[.86,.2]]){let fe=Oe(.11,.26,.11,I);fe.position.set(Z,v+.13,ne),u.add(fe);let Q=Oe(.12,.04,.12,ce,!1);Q.position.set(Z,v+.28,ne),u.add(Q)}let W=new Se(d.torusSm,ce);W.rotation.x=Math.PI/2,W.position.set(0,v+.03,-.49),W.userData.spin=.7,u.add(W),L.push(W)}else if(k.includes("foundry")){let W=new Se(d.silo,I);W.scale.set(1.18,1.55,1.18),W.position.set(-.62,v+.52,-.68),W.castShadow=!0,u.add(W);let Z=new Se(d.torusSm,O);Z.rotation.x=Math.PI/2,Z.scale.setScalar(.86),Z.position.set(-.62,v+.88,-.68),u.add(Z);let ne=new Se(d.trace,ie);ne.scale.set(.95,.35,.95),ne.position.set(-.62,v+1.06,-.68),u.add(ne);let fe=Oe(1.06,.22,.44,I);fe.position.set(.28,v+.11,-.62),u.add(fe);let Q=Oe(.9,.08,.26,ie,!1);Q.position.set(.28,v+.22,-.62),u.add(Q);for(let ge of[-.08,.28,.64]){let oe=new Se(d.fin,N);oe.scale.set(.9,.72,.85),oe.position.set(ge,v+.38,-.78),oe.rotation.x=.28,oe.castShadow=!0,u.add(oe)}}else if(k.includes("storage")){for(let[Q,ge,oe]of[[-.68,-.72,1.15],[-.22,-.78,.95],[-.46,-.34,.82]]){let _e=new Se(d.silo,N);_e.scale.set(.95,oe,.95),_e.position.set(Q,v+.34*oe,ge),_e.castShadow=!0,_e.receiveShadow=!0,u.add(_e);let Ie=new Se(d.torusSm,I);Ie.rotation.x=Math.PI/2,Ie.scale.setScalar(.72),Ie.position.set(Q,v+.46*oe,ge),u.add(Ie)}let W=new je({color:8086342,roughness:.62,metalness:.28}),Z=new Se(d.crate,W);Z.position.set(.48,v+.11,-.68),Z.castShadow=!0,u.add(Z);let ne=new Se(d.crate,I);ne.position.set(.52,v+.33,-.66),ne.rotation.y=.18,ne.castShadow=!0,u.add(ne);for(let Q of[.16,.86]){let ge=Oe(.08,.78,.08,O);ge.position.set(Q,v+.39,-.68),u.add(ge)}let fe=Oe(.82,.08,.14,O);fe.position.set(.51,v+.78,-.68),u.add(fe)}else if(k.includes("vault")){let W=new Se(d.dome,I);W.scale.set(1.25,1.15,1.15),W.position.set(0,v+.21,-.64),W.castShadow=!0,W.receiveShadow=!0,u.add(W);let Z=Oe(.46,.1,.46,N);Z.position.set(0,v+.44,-.64),u.add(Z);for(let Q of[-.62,.62]){let ge=new Se(d.pipe,O);ge.rotation.z=Math.PI/2,ge.scale.set(1,.56,1),ge.position.set(Q,v+.14,-.64),ge.castShadow=!0,u.add(ge)}let ne=Oe(.52,.03,.22,ce,!1);ne.position.set(0,v+.02,-.12),u.add(ne);let fe=new Se(d.trace,ie);fe.scale.setScalar(.48),fe.position.set(0,v+.56,-.64),u.add(fe)}else if(k.includes("outer")){let W=new Se(d.pillar,N);W.scale.set(.85,1.12,.85),W.position.set(-.62,v+.49,-.68),W.castShadow=!0,u.add(W);let Z=Oe(.08,.08,1.05,O);Z.position.set(-.32,v+.92,-.44),Z.rotation.set(-.34,-.58,0),u.add(Z);for(let fe of[.22,.74]){let Q=Oe(.06,.52,.06,I);Q.position.set(fe,v+.26,-.76),u.add(Q);let ge=Oe(.14,.07,.09,ie,!1);ge.position.set(fe,v+.54,-.72),ge.rotation.x=.35,u.add(ge)}let ne=new Se(d.core,q);ne.scale.setScalar(.55),ne.position.set(-.62,v+1.12,-.68),ne.userData.spin=1.1,u.add(ne),L.push(ne)}else{for(let fe of[-.66,.66]){let Q=new Se(d.pillar,I);Q.scale.set(1.25,1.18,1.15),Q.position.set(fe,v+.52,-.68),Q.castShadow=!0,Q.receiveShadow=!0,u.add(Q);let ge=Oe(.05,.76,.2,ce,!1);ge.position.set(fe*.84,v+.5,-.68),u.add(ge)}let W=Oe(1.76,.16,.3,N);W.position.set(0,v+1.06,-.68),u.add(W);let Z=Oe(1.18,.06,.1,ie,!1);Z.position.set(0,v+1.16,-.68),u.add(Z);let ne=Oe(.84,.03,.1,q,!1);ne.position.set(0,v+.02,-.68),u.add(ne)}}function Rt(w){let z=Hl(w),G=new Gt,k=new je({color:z,roughness:.32,metalness:.35,emissive:z,emissiveIntensity:.9}),u=new Se(d.pip,k);u.castShadow=!0,G.add(u);let v=new je({color:16777215,emissive:z,emissiveIntensity:1.35,roughness:.18}),I=new Se(d.pipHead,v);I.position.y=.34,G.add(I);let N=[];for(let O=0;O<6;O++){let ce=new ei({color:z,transparent:!0,opacity:.65*(1-O/6),blending:Ai,depthWrite:!1}),ie=new Se(d.trailDot,ce);ie.scale.setScalar(1-O*.13),ie.raycast=()=>{},B.add(ie),N.push({mesh:ie,mat:ce})}return{group:G,mat:k,extraMats:[v],trail:N}}function Nt(w){if(w.mesh&&B.remove(w.mesh),w.mat&&w.mat.dispose(),w.extraMats)for(let z of w.extraMats)z.dispose();if(w.trail)for(let z of w.trail)B.remove(z.mesh),z.mat.dispose();w.mesh=null,w.mat=null,w.extraMats=null,w.trail=null}function Ht(){let w=Math.max(1,n.clientWidth),z=Math.max(1,n.clientHeight);if(g.setSize(w,z,!1),x.setSize(w,z),b.aspect=w/z,b.updateProjectionMatrix(),pe&&!te&&!le&&Te()){let G=be();b.position.copy(G.position),R.update()}lt()}function lt(){if(!(pt||We)){if(document.hidden){ze=!0;return}We=requestAnimationFrame(V)}}function Pt(w){if(w)if(B.remove(w),w.userData&&w.userData.rings)for(let z of w.userData.rings)z.material&&z.material.dispose();else w.material&&w.material.dispose()}function V(w){if(We=0,pt)return;let z=!1;if(le){let k=le.ms>0?Math.min(1,(w-le.start)/le.ms):1,u=Vl(k);R.target.lerpVectors(le.fromTarget,le.toTarget,u),b.position.lerpVectors(le.fromPos,le.toPos,u),R.update(),k>=1?le=null:z=!0}for(let k of $.values())k.position.y=k.userData.baseY||0;j=j.filter(k=>{let u=$.get(k.roomId);k.start===void 0&&(k.start=w);let v=(w-k.start)/k.ttl;if(!u||v>=1)return Pt(k.ring),!1;if(u.position.y=Math.max(u.position.y,(u.userData.baseY||0)+Math.sin(v*Math.PI)*k0[k.tier]),k.ring){let I=k.ring.userData&&k.ring.userData.rings;if(I){I[0].scale.setScalar(1+v*.95),I[0].material.opacity=.92*(1-v);let N=Math.max(0,(v-.14)/.86);I[1].scale.setScalar(1+N*1.18),I[1].material.opacity=v>.14?.66*(1-N):0}else k.ring.scale.setScalar(1+v*.9),k.ring.material.opacity=.92*(1-v)}return z=!0,!0});for(let k=vt.length-1;k>=0;k--){let u=vt[k];if(r||!u.ring)continue;let v=u.ms>0?(w-u.start)/u.ms:1;if(v>=1){ae(u.roomId);continue}let I=u.ring.userData&&u.ring.userData.rings;I?(I[0].scale.setScalar(1.12+.24*Math.sin(v*Math.PI*6)),I[0].material.opacity=.56*(1-v*v),I[1].scale.setScalar(1.02+.16*Math.sin(v*Math.PI*6+1.2)),I[1].material.opacity=.42*(1-v*v)):(u.ring.scale.setScalar(1.15+.25*Math.sin(v*Math.PI*6)),u.ring.material.opacity=.58*(1-v*v)),z=!0}for(let k=Ye.length-1;k>=0;k--){let u=Ye[k];if(!u.mesh||!u.mat||!u.destMesh)continue;u.start<0&&(u.start=w);let v=Math.min(1,(w-u.start)/Bl),I=Vl(v),N=u.from.x+(u.to.x-u.from.x)*I,O=u.from.y+(u.to.y-u.from.y)*I+Math.sin(v*Math.PI)*.85,ce=u.from.z+(u.to.z-u.from.z)*I;u.mesh.position.set(N,O,ce);let ie=u.to.x-u.from.x,q=u.to.z-u.from.z;if(ie*ie+q*q>1e-6&&(u.mesh.rotation.y=Math.atan2(ie,q),u.mesh.rotation.x=.24*Math.sin(v*Math.PI)),u.trail)for(let W=0;W<u.trail.length;W++){let Z=Math.max(0,v-(W+1)*.045),ne=Vl(Z);u.trail[W].mesh.position.set(u.from.x+ie*ne,u.from.y+(u.to.y-u.from.y)*ne+Math.sin(Z*Math.PI)*.85+.14,u.from.z+q*ne),u.trail[W].mat.opacity=Z>0?.62*(1-W/u.trail.length)*(1-v*.35):0}v>=1?(Nt(u),u.destMesh.visible=!0,u.destPlate&&(u.destPlate.visible=!0,u.destPlate.element&&(u.destPlate.element.style.visibility="")),Ye.splice(k,1)):z=!0}let G=vp(j.filter(k=>k.projectionId==="agent_move"),U.routes);for(let k of Ye)k.fromId&&k.toId&&(G.add(k.fromId+"|"+k.toId),G.add(k.toId+"|"+k.fromId));for(let k of de){let u=G.has(k.from+"|"+k.to);for(let v of k.mats)v.color.copy(u?a.active:a.route),v.emissive&&(v.emissive.setHex(u?a.active.getHex():2504778),v.emissiveIntensity=u?2.2:.14)}if(!r){let k=w*.001;for(let u of L)u.rotation.y=k*(u.userData.spin||.7);for(let u of F)u.position.y=u.userData.baseY+Math.sin(k*2.2+(u.userData.phase||0))*.05,u.userData.head&&(u.userData.head.rotation.y=k*1.25);!document.hidden&&(L.length>0||F.length>0)&&(z=!0)}R.enableDamping&&R.update(),g.render(S,b),x.render(S,b),Kt(),z&&lt()}function Kt(){let w=Array.from(i.querySelectorAll(".stage3d-label, .stage3d-nameplate"));w.sort((ie,q)=>Number(q.dataset.priority||0)-Number(ie.dataset.priority||0));let z=n.getBoundingClientRect(),G=[],k=new Map,u=7,v=5,I=(ie,q)=>ie.left<q.right+u&&ie.right>q.left-u&&ie.top<q.bottom+v&&ie.bottom>q.top-v,N=(ie,q)=>{let W=Math.min(ie.right+u,q.right+u)-Math.max(ie.left-u,q.left-u),Z=Math.min(ie.bottom+v,q.bottom+v)-Math.max(ie.top-v,q.top-v);return W>0&&Z>0?W*Z:0},O=(ie,q,W,Z)=>{let ne=Math.hypot(q,W);if(ne>Z&&(q=q/ne*Z,W=W/ne*Z),z.width>40&&z.height>40){let fe=z.left+8-ie.left,Q=z.right-8-ie.right,ge=z.top+8-ie.top,oe=z.bottom-8-ie.bottom;fe<=Q&&(q=Math.max(fe,Math.min(Q,q))),ge<=oe&&(W=Math.max(ge,Math.min(oe,W)))}return[q,W]},ce=[[0,0],[0,-20],[18,-22],[-18,-22],[0,-38],[-50,-18],[50,-18],[0,24],[-66,0],[66,0],[-56,-40],[56,-40],[0,-64],[-84,-24],[84,-24],[-62,24],[62,24],[0,46]];for(let ie of w){if(ie.classList.remove("is-tucked"),ie.style.marginLeft="",ie.style.marginTop="",ie.style.display==="none"||ie.style.visibility==="hidden")continue;let q=ie.getBoundingClientRect();if(q.width<=0||q.height<=0)continue;let W=ie.classList.contains("stage3d-nameplate"),Z=W?112:76,ne=0,fe=0,Q={left:q.left,right:q.right,top:q.top,bottom:q.bottom},ge=!G.some(Be=>I(Q,Be)),oe=0,_e=0,Ie=Q,st=1/0;if(!ge)for(let[Be,Et]of ce){let[bt,we]=O(q,Be,Et,Z),He={left:q.left+bt,right:q.right+bt,top:q.top+we,bottom:q.bottom+we},Ve=0;for(let ut of G)Ve+=N(He,ut);let Ze=Ve*100+Math.hypot(bt,we);if(Ve===0){ne=bt,fe=we,Q=He,ge=!0;break}Ze<st&&(st=Ze,oe=bt,_e=we,Ie=He)}if(!ge){ne=oe,fe=_e,Q=Ie;for(let Be=0;Be<8;Be++){let Et=0,bt=0,we=0;for(let Ze of G){if(!I(Q,Ze))continue;we++;let ut=Math.min(Q.right+u-Ze.left,Ze.right+u-Q.left),et=Math.min(Q.bottom+v-Ze.top,Ze.bottom+v-Q.top),Lt=(Q.left+Q.right)*.5-(Ze.left+Ze.right)*.5,zt=(Q.top+Q.bottom)*.5-(Ze.top+Ze.bottom)*.5;et<=ut*1.15?bt+=(zt===0?W?-1:1:Math.sign(zt))*(et+3):Et+=(Lt===0?1:Math.sign(Lt))*(ut+3)}if(!we){ge=!0;break}[ne,fe]=O(q,ne+Et,fe+bt,Z),Q={left:q.left+ne,right:q.right+ne,top:q.top+fe,bottom:q.bottom+fe};let He=0;for(let Ze of G)He+=N(Q,Ze);let Ve=He*100+Math.hypot(ne,fe);if(He===0){ge=!0;break}Ve<st&&(st=Ve,oe=ne,_e=fe,Ie=Q)}}let Me=ie.dataset.siteId||"",mt=W&&k.get(Me)||0;if(ge||W&&mt<4){let Be=ge?ne:oe,Et=ge?fe:_e,bt=ge?Q:Ie;Math.abs(Be)>=1&&(ie.style.marginLeft=Math.round(Be)+"px"),Math.abs(Et)>=1&&(ie.style.marginTop=Math.round(Et)+"px"),G.push(bt),W&&k.set(Me,mt+1)}else ie.classList.add("is-tucked")}}function Mt(w,z){let G=document.createElement("div");G.className="stage3d-label",G.dataset.siteId=w.id;let k=[];w.active&&k.push("active"),w.selected&&k.push("selected"),w.followed&&k.push("followed"),w.major&&k.push("major"),(w.certainty==="partial"||w.certainty==="unknown")&&k.push("partial"),G.setAttribute("data-state",k.join(" ")),G.dataset.priority=String((w.selected?40:0)+(w.followed?32:0)+(w.major?16:0)+(w.active?8:0)+(w.players>0?4:0)),G.title=w.name;let u=document.createElement("span");if(u.textContent=w.name,G.append(u),w.handles.length){let q=document.createElement("span");q.className="stage3d-handles",q.textContent=w.handles.join(", "),G.append(q)}else if(w.players>0){let q=document.createElement("span");q.className="stage3d-handles",q.textContent=w.players===1?"1 agent":w.players+" agents",G.append(q)}for(let q of w.tokens.filter(W=>W.line).slice(0,2)){let W=document.createElement("span");W.className="stage3d-lines",W.textContent=q.line,G.append(W)}let v=pp(w.bands);if(v){let q=document.createElement("span");q.className="stage3d-bands",q.textContent=v,G.append(q)}let I=w.major?"MAJOR":w.followed?"Followed":w.selected?"Selected":"";if(I){let q=document.createElement("span");q.className="stage3d-state",q.textContent=I,G.append(q)}G.addEventListener("click",q=>{q.stopPropagation(),o(w.id)});let N=new Dn(G),O=0,ce=.08,ie=It/2+.24;for(let q of z||[]){if(q.id===w.id)continue;let W=q.x-w.x,Z=q.z-w.z,ne=Math.hypot(W,Z);if(Z>.5&&ne<3.4){O=-.35,ce=.14,ie=-It/2-.24;break}Z>.5&&W>.5&&ne<4.2&&(O=-.45)}return N.position.set(O,ce,ie),{obj:N,el:G}}function C(w){let z=-.15-Ap,G=z+.14,k=-.14+G*.5,u=1.44,v=.22,I=(u+v)*2,N=new je({color:922912,roughness:.84,metalness:.28}),O=new je({color:2503749,roughness:.46,metalness:.64}),ce=new je({color:5425384,emissive:2660542,emissiveIntensity:.65,roughness:.28}),ie=new je({color:461584,roughness:.9,metalness:.18}),q=Oe(u*2+.1,.06,u*2+.1,ie,!1);q.position.set(0,-.14,0),q.receiveShadow=!0,q.raycast=()=>{},w.add(q);for(let W of[-1,1]){let Z=Oe(I,G,v,N,!1);Z.position.set(0,k,W*(u+v*.5)),Z.receiveShadow=!0,Z.raycast=()=>{},w.add(Z);let ne=Oe(v,G,u*2,N,!1);ne.position.set(W*(u+v*.5),k,0),ne.receiveShadow=!0,ne.raycast=()=>{},w.add(ne);let fe=Oe(I+.46,.055,.44,O,!1);fe.position.set(0,z+.015,W*(u+.22)),fe.receiveShadow=!0,fe.raycast=()=>{},w.add(fe);let Q=Oe(.44,.055,u*2,O,!1);Q.position.set(W*(u+.22),z+.015,0),Q.receiveShadow=!0,Q.raycast=()=>{},w.add(Q);let ge=Oe(u*2-.08,.025,.028,ce,!1);ge.position.set(0,z-.09,W*(u-.01)),ge.raycast=()=>{},w.add(ge);let oe=Oe(.028,.025,u*2-.08,ce,!1);oe.position.set(W*(u-.01),z-.09,0),oe.raycast=()=>{},w.add(oe)}}function M(w,z,G){let k=new Gt;k.userData.siteId=w.id;let u=z?Ap:0;k.userData.baseY=u,k.userData.isSunken=!!z;let v=w.certainty==="partial"||w.certainty==="unknown",I=w.selected?.14:0;if(z&&C(k),c){let we=new Se(d.halo,new ei({map:c,color:197896,transparent:!0,opacity:v?.34:.68,depthWrite:!1}));we.rotation.x=-Math.PI/2,we.position.y=-.105,we.scale.set(It+1.15,It+1.15,1),we.renderOrder=-2,we.raycast=()=>{},k.add(we)}let N=new Se(d.subBase,new je({color:1252132,roughness:.76,metalness:.44,transparent:v,opacity:v?.5:1}));N.position.y=-.02+I*.4,N.castShadow=!0,N.receiveShadow=!0,ot(N,w.id),k.add(N);let O=new Se(d.collar,new je({color:2503490,roughness:.48,metalness:.62,transparent:v,opacity:v?.52:1}));O.position.y=.08+I*.75,O.castShadow=!0,O.receiveShadow=!0,ot(O,w.id),k.add(O);let ce=(w.selected?a.selected:w.active?a.raised:a.plate).clone();w.bands.pressure&&ce.lerp(a.warning,H0[w.bands.pressure]);let ie=new je({color:ce,map:f?f.map:null,bumpMap:f?f.bump:null,bumpScale:.065,roughness:.68,metalness:.36,emissive:new Le(0),emissiveIntensity:0,transparent:v,opacity:v?.58:1}),q=new Se(d.plate,ie);q.position.y=.21+I,q.castShadow=!0,q.receiveShadow=!0,ot(q,w.id),k.add(q);let W=It/2,Z=new je({color:3294038,roughness:.44,metalness:.64,transparent:v,opacity:v?.52:1}),ne=q.position.y+.092;for(let we of[-W,W]){let He=new Se(d.curbX,Z);He.position.set(0,ne,we),k.add(He)}for(let we of[-W,W]){let He=new Se(d.curbZ,Z);He.position.set(we,ne,0),k.add(He)}let fe=w.major?a.warning:w.selected?a.ink:w.active||w.followed?a.active:a.edge,Q=w.major?1.25:w.active||w.followed?.92:w.selected?.82:.05,ge=new je({color:fe,emissive:fe.clone(),emissiveIntensity:Q,roughness:.26,metalness:.42,transparent:v,opacity:v?.55:1}),oe=q.position.y+.105,_e=W-.075;for(let we of[-_e,_e]){let He=new Se(d.trimX,ge);He.position.set(0,oe,we),k.add(He)}for(let we of[-_e,_e]){let He=new Se(d.trimZ,ge);He.position.set(we,oe,0),k.add(He)}let Ie=new je({color:1844528,roughness:.44,metalness:.72});for(let[we,He]of[[-W,-W],[W,-W],[-W,W],[W,W]]){let Ve=new Se(d.cornerPost,Ie);Ve.position.set(we,q.position.y+.075,He),Ve.castShadow=!0,k.add(Ve)}if(w.bands.pressure){let we=w.bands.pressure==="high"?4:w.bands.pressure==="moderate"?3:2,He=w.bands.pressure==="high"?1.85:w.bands.pressure==="moderate"?1.35:.95,Ve=new je({color:16765056,emissive:16751136,emissiveIntensity:He,roughness:.22});for(let Ze=0;Ze<we;Ze++){let ut=(Ze-(we-1)*.5)*.42,et=Oe(.24,.042,.024,Ve,!1);et.position.set(ut,q.position.y-.01,W+.008),k.add(et);let Lt=Oe(.024,.042,.24,Ve,!1);Lt.position.set(W+.008,q.position.y-.01,ut),k.add(Lt)}}if(v){let we=new $n(new Fr(d.plate),new Br({color:fe,dashSize:.25,gapSize:.18}));we.position.copy(q.position),we.computeLineDistances(),k.add(we)}if(w.followed||w.major){let we=new $n(new Fr(d.ring),new ln({color:w.major?a.warning:a.active}));we.position.y=.01,k.add(we)}let st=mp(w);if(st>0&&c){let we=w.major?a.warning:w.followed||w.active?a.active:a.social,He=new Se(d.halo,new ei({map:c,color:we,transparent:!0,opacity:Math.min(.62,st*1.08),blending:Ai,depthWrite:!1}));if(He.rotation.x=-Math.PI/2,He.position.y=-.07,He.scale.set(fn.SIZE*1.18,fn.SIZE*1.18,1),He.userData.glow=!0,He.renderOrder=-1,He.raycast=()=>{},k.add(He),l&&(w.major||w.followed||w.active)){let Ve=new Se(d.beacon,new ei({map:l,color:we,transparent:!0,opacity:w.major?.3:w.followed?.22:.12,blending:Ai,depthWrite:!1,side:ii}));Ve.position.y=q.position.y+.72,Ve.raycast=()=>{},k.add(Ve)}}if(w.bands.scar){let we=V0[w.bands.scar],He=new $n(new Fr(d.scar),new Br({color:a.unknown,dashSize:.2,gapSize:.12,transparent:!0,opacity:we}));He.position.y=q.position.y+.13,He.computeLineDistances(),k.add(He);let Ve=new je({color:13217535,emissive:10186239,emissiveIntensity:.85+we*.65,roughness:.2,metalness:.35}),Ze=[[-W+.2,.22,-W+.2,.45,1.55,.45,.2,.3,-.25],[-W+.34,.17,-W+.14,.34,1.15,.34,-.15,.9,-.4],[-W+.16,.16,-W+.35,.32,1,.32,.35,.4,.2]];for(let[ut,et,Lt,zt,Zi,Vi,Fn,hs,ro]of Ze){let Ji=new Se(d.trace,Ve);Ji.position.set(ut,q.position.y+et,Lt),Ji.scale.set(zt,Zi*(.75+we*.35),Vi),Ji.rotation.set(Fn,hs,ro),k.add(Ji)}}let Me=q.position.y+.11;ct(k,w,Me);let mt=w.tokens.slice(0,6),Be=mt.length+w.unnamed,Et=new Map;for(let we=0;we<Be;we++){let He=mt[we],Ve=Hl(He?He.handle:""),Ze=At(Ve,!!He),ut=Ze.root,et=Me+.01,Lt=0,zt=.34,Zi=0;if(Be===1)Lt=0,zt=.34;else if(Be===2)Lt=we===0?-.68:.68,zt=we===0?.28:.48;else if(Be===3)Lt=(we-1)*.72,zt=we===1?.56:.24;else{let Vi=we%3;Zi=Math.floor(we/3);let Fn=Math.min(3,Be-Zi*3);Lt=(Vi-(Fn-1)*.5)*.72,zt=Zi===0?.22:.72}if(ut.position.set(Lt,et,zt),ut.userData.baseY=et,ut.userData.phase=we*1.15,ut.userData.head=Ze.head,k.add(ut),F.push(ut),He){ut.userData.handle=He.handle;let Vi=document.createElement("div");Vi.className="stage3d-nameplate",Vi.dataset.priority=String(we<4?26-we:2),Vi.dataset.siteId=w.id,Vi.dataset.handle=He.handle;let Fn=document.createElement("span");Fn.className="stage3d-dot",Fn.style.background="#"+Ve.toString(16).padStart(6,"0");let hs=document.createElement("span");hs.textContent=He.handle,Vi.append(Fn,hs);let ro=new Dn(Vi),Ji=ut.position.x,ka=et+1.24;Be===1?Ji+=w.x>=0?.42:-.42:Be===2?(Ji=we===0?ut.position.x-.22:ut.position.x+.22,ka=et+(we===0?1.04:1.32)):(Ji=ut.position.x*1.15,ka=et+1.04+we%3*.28+Zi*.22),ro.position.set(Ji,ka,ut.position.z-.08),k.add(ro),Et.set(He.handle,{mesh:ut,nameplate:ro,ringMat:Ze.ringMat,glowMats:Ze.glowMats,baseEmissives:Ze.glowMats.map(Pp=>Pp.emissiveIntensity),baseRingOpacity:Ze.ringMat.opacity})}}if(k.userData.tokens=Et,w.more>0){let we=document.createElement("div");we.className="stage3d-more",we.textContent="+"+w.more;let He=new Dn(we);He.position.set(.95,Me+.35,.95),k.add(He)}if(w.traces>0){let we=new Se(d.trace,new je({color:a.machine,emissive:a.machine,emissiveIntensity:.72,roughness:.26}));we.position.set(It/2-.3,Me+.14,It/2-.3),k.add(we)}let bt=Mt(w,G);return k.add(bt.obj),k.userData.highlightRefs={trimMat:ge,plateMat:ie,baseTrimEmissive:Q,baseEdgeHex:fe.getHex(),isMajor:!!w.major,labelEl:bt.el},k.position.set(w.x,u,w.z),k}function Y(w,z,G){let k=new Gt,u=G.x-z.x,v=G.z-z.z,I=Math.hypot(u,v);if(I<.01)return k;let N=Math.atan2(u,v),O=new je({color:1778993,roughness:.56,metalness:.58,transparent:w.dashed,opacity:w.dashed?.62:1});O.userData.isBed=!0;let ce=new je({color:a.route.clone(),emissive:new Le(2504778),emissiveIntensity:.14,roughness:.28,metalness:.32});ce.userData.routeGlow=!0;let ie=(W,Z,ne,fe,Q,ge,oe)=>{let _e=fe-W,Ie=Q-Z,st=ge-ne,Me=Math.hypot(_e,st),mt=Math.hypot(Me,Ie);if(mt<.05)return;let Be=(W+fe)*.5,Et=(Z+Q)*.5,bt=(ne+ge)*.5,we=Math.atan2(_e,st),He=-Math.atan2(Ie,Me),Ve=new Gt;Ve.position.set(Be,Et,bt),Ve.rotation.order="YXZ",Ve.rotation.y=we,Ve.rotation.x=He;let Ze=Oe(.36,.052,mt,O,!1);if(Ze.receiveShadow=!0,Ze.position.y=-.05,Ve.add(Ze),oe){let ut=Math.max(3,Math.floor(mt/.55));for(let et=0;et<ut;et++){let Lt=(et+.5)/ut-.5,zt=Oe(.09,.028,.26,ce,!1);zt.position.set(0,-.018,Lt*mt),Ve.add(zt)}}else{let ut=Oe(.085,.028,mt,ce,!1);ut.position.y=-.018,Ve.add(ut)}k.add(Ve)},q=G.y-z.y;if(Math.abs(q)>.12&&I>2.2){let W=z.y>=G.y?z:G,Z=z.y>=G.y?G:z,ne=Z.x-W.x,fe=Z.z-W.z,Q=Math.hypot(ne,fe),ge=ne/Q,oe=fe/Q,_e=Math.min(1.66,Q*.42),Ie=Z.x-ge*_e,st=Z.z-oe*_e;ie(W.x,W.y,W.z,Ie,W.y,st,w.dashed),ie(Ie,W.y,st,Z.x,Z.y,Z.z,w.dashed);let Me=Math.abs(q)+.58,mt=Z.y-.06+Me*.5,Be=new je({color:2240317,roughness:.44,metalness:.68}),Et=Oe(.24,Me,.24,Be,!0);Et.position.set(Ie,mt,st),Et.rotation.y=N,k.add(Et);let bt=Oe(.055,Me-.14,.26,ce,!1);bt.position.set(Ie,mt,st),bt.rotation.y=N,k.add(bt);let we=new je({color:10285311,emissive:4054271,emissiveIntensity:1.25,roughness:.2}),He=Oe(.28,.05,.28,we,!1);He.position.set(Ie,Z.y-.06+Me+.025,st),He.rotation.y=N,k.add(He)}else ie(z.x,z.y,z.z,G.x,G.y,G.z,w.dashed);if(w.oneWay){let W=new D(u,q,v).normalize(),Z=new je({color:a.route.clone(),emissive:new Le(2504778),emissiveIntensity:.22,roughness:.24});Z.userData.routeGlow=!0;let ne=new Se(d.arrow,Z);ne.position.set(z.x+u*.58,z.y+q*.58+.06,z.z+v*.58),ne.quaternion.setFromUnitVectors(wp,W),k.add(ne)}return k}function J(){for(let w of Ye)Nt(w);Ye.length=0}function re(){for(let w of Ye)Nt(w),w.destMesh=null,w.destPlate=null}function xe(w){let z=!1;for(let G=Ye.length-1;G>=0;G--){let k=Ye[G],u=k.start<0?w:k.start;if(w-u>=Bl){Ye.splice(G,1);continue}let v=$.get(k.fromId),I=$.get(k.toId),N=I&&I.userData.tokens?I.userData.tokens.get(k.handle):null;if(!v||!I||!N||!N.mesh){Ye.splice(G,1);continue}let O=(v.userData.baseY||0)+N.mesh.position.y+.24,ce=(I.userData.baseY||0)+N.mesh.position.y+.24,ie=Rt(k.handle),q=ie.mat instanceof je?ie.mat:new je({color:Hl(k.handle)}),W=ie.group;W.position.set(v.position.x,O,v.position.z),B.add(W),k.start=u,k.mesh=W,k.mat=q,k.extraMats=ie.extraMats,k.trail=ie.trail,k.from=new D(v.position.x,O,v.position.z),k.to=new D(I.position.x,ce,I.position.z),k.destMesh=N.mesh,k.destPlate=N.nameplate||null,N.mesh.visible=!1,N.nameplate&&(N.nameplate.visible=!1,N.nameplate.element&&(N.nameplate.element.style.visibility="hidden")),z=!0}z&&lt()}function ve(){re();for(let z of vt)z.timer&&clearTimeout(z.timer),z.timer=0,Pt(z.ring),z.label&&z.label.classList.remove("is-moment"),z.ring=null,z.label=null;let w=new Set;B.traverse(z=>{z.isCSS2DObject&&z.element&&z.element.parentNode&&z.element.remove(),z.geometry&&!T.has(z.geometry)&&z.geometry.dispose(),z.material&&!w.has(z.material)&&(w.add(z.material),z.material.dispose())}),S.remove(B),B=new Gt,S.add(B),$.clear(),de=[],L=[],F=[];for(let z of j)z.ring=null}function se(w){X&&(X.element&&X.element.parentNode&&X.element.remove(),S.remove(X));let z=document.createElement("div");z.className="stage3d-compass",z.textContent="N",X=new Dn(z),X.position.set(0,.05,-w-1.2),S.add(X)}function ue(w){let z=kl(w);R.minDistance=z.minDistance,R.maxDistance=z.maxDistance,R.maxTargetRadius=z.maxTargetRadius,R.minPolarAngle=z.minPolarAngle,R.maxPolarAngle=z.maxPolarAngle}function ye(w,z){le={start:performance.now(),ms:r?0:fp,fromTarget:R.target.clone(),toTarget:w,fromPos:b.position.clone(),toPos:z},lt()}function Ge(w){let z=$.get(w);if(!z)return;let G=new D(z.position.x,z.userData.baseY||0,z.position.z),k=b.position.clone().sub(R.target);ye(G,G.clone().add(k))}function be(){let w=bp(U.radius),z=new D(w.target[0],w.target[1]-.14,w.target[2]+.58),G=new D(...w.position).multiplyScalar(.87);G.applyAxisAngle(wp,.11);let k=Math.atan(Math.tan(b.fov*Math.PI/360)*b.aspect),u=U.radius*.96/Math.tan(k),v=kl(U.radius);return G.setLength(Math.min(v.maxDistance,Math.max(G.length(),u))),{target:z,position:z.clone().add(G)}}function Te(){return R.target.distanceToSquared(be().target)<1e-4}function ke(){let w=be();te=!1,he=null,ye(w.target,w.position)}function Ke(w,z,G,k){let u=$.get(w);if(!u)return null;let v=new Gt,I=new Se(d.pulse,new ei({color:a.warning,transparent:!0,opacity:z,blending:Ai,depthWrite:!1}));I.rotation.x=-Math.PI/2,I.scale.setScalar(k);let N=new Se(d.pulseInner,new ei({color:a.warning,transparent:!0,opacity:G,blending:Ai,depthWrite:!1}));return N.rotation.x=-Math.PI/2,N.scale.setScalar(k),v.add(I,N),v.position.set(u.position.x,(u.userData.baseY||0)+.04,u.position.z),v.userData.rings=[I,N],B.add(v),v}function $e(w){return Ke(w,.92,.66,1)}function H(w){let z=$.get(w);if(!z)return null;for(let G of z.children)if(G.isCSS2DObject&&G.element&&G.element.classList.contains("stage3d-label"))return G.element;return null}function Ee(w){return Ke(w,.56,.42,r?1.18:1.12)}function ae(w){for(let z=vt.length-1;z>=0;z--){let G=vt[z];w!==void 0&&G.roomId!==w||(G.timer&&clearTimeout(G.timer),G.timer=0,Pt(G.ring),G.label&&G.label.classList.remove("is-moment"),vt.splice(z,1))}}function Ae(w){if(!$.has(w))return;ae(w);let z=Ee(w);if(!z)return;let G=H(w);G&&G.classList.add("is-moment");let k={roomId:w,ring:z,label:G,start:performance.now(),ms:Gl,timer:0};if(r){let u=z.userData&&z.userData.rings;u?(u[0].material.opacity=.45,u[1].material.opacity=.34):z.material&&(z.material.opacity=.45),k.timer=setTimeout(()=>{ae(w),lt()},Gl)}vt.push(k),lt()}function De(w){for(let z=vt.length-1;z>=0;z--){let G=vt[z],k=w-G.start;if(k>=G.ms||!$.has(G.roomId)){ae(G.roomId);continue}if(G.ring=Ee(G.roomId),!G.ring){ae(G.roomId);continue}if(G.label=H(G.roomId),G.label&&G.label.classList.add("is-moment"),r){let u=Math.max(0,G.ms-k);G.timer=setTimeout(()=>{ae(G.roomId),lt()},u)}}}function me(w){let z=Je.get(w);if(z)return z;let G=$.get(w);if(!G)return null;let k=document.createElement("div");k.className="stage3d-says";let u=document.createElement("div");u.className="stage3d-says-list",k.append(u);let v=new Dn(k);return v.position.set(0,1.55,-It/2),G.add(v),z={obj:v,el:u,anchor:k},Je.set(w,z),z}function Xe(w){let z=me(w.roomId);if(!z)return;let G=document.createElement("div");if(G.className="stage3d-say"+(w.tier==="MAJOR"?" is-major":""),w.actor){let v=document.createElement("b");v.textContent=w.actor,G.append(v," ")}let k=document.createElement("span");if(k.className="stage3d-say-line",k.textContent=w.line,G.append(k),w.consequence){let v=document.createElement("span");v.className="stage3d-say-consequence",v.textContent=w.consequence,G.append(v)}w.tier==="MAJOR"?z.el.prepend(G):z.el.append(G);let u={caption:w,el:G,timer:0};u.timer=setTimeout(()=>{Ne=Ne.filter(v=>v!==u),G.remove(),z.el.childElementCount||(z.obj.parent&&z.obj.parent.remove(z.obj),z.anchor.remove(),Je.get(w.roomId)===z&&Je.delete(w.roomId)),lt()},Math.max(0,w.holdMs)),Ne.push(u),lt()}let Pe=[],yt=!1;function _t(w){if(r)return;for(let O=Ye.length-1;O>=0;O--){let ce=Ye[O];ce.handle===w.handle&&(Nt(ce),ce.destMesh&&(ce.destMesh.visible=!0),ce.destPlate&&(ce.destPlate.visible=!0,ce.destPlate.element&&(ce.destPlate.element.style.visibility="")),Ye.splice(O,1))}let z=$.get(w.from),G=$.get(w.to);if(!z||!G)return;let k=G.userData.tokens&&G.userData.tokens.get(w.handle);if(!k||!k.mesh)return;let u=(z.userData.baseY||0)+k.mesh.position.y+.24,v=(G.userData.baseY||0)+k.mesh.position.y+.24,I=Rt(w.handle),N=I.group;N.position.set(z.position.x,u,z.position.z),B.add(N),k.mesh.visible=!1,k.nameplate&&(k.nameplate.visible=!1,k.nameplate.element&&(k.nameplate.element.style.visibility="hidden")),Ye.push({handle:w.handle,fromId:w.from,toId:w.to,mesh:N,mat:I.mat,extraMats:I.extraMats,trail:I.trail,from:new D(z.position.x,u,z.position.z),to:new D(G.position.x,v,G.position.z),start:-1,destMesh:k.mesh,destPlate:k.nameplate||null}),lt()}function oi(w){for(let z of w.pulses)$.has(z.roomId)&&(z.tier==="MAJOR"&&(z.ring=$e(z.roomId)),j.push(z));for(let z of w.moments||[])Ae(z);for(let z of w.captions)Xe(z);for(let z of w.travels)_t(z);if(pe&&!te&&!K.followRoomId){let z=Tp(he,w.pulses.filter(G=>$.has(G.roomId)),performance.now());z&&(he=z,Ge(z.roomId))}lt()}function Mi(w){let z=Pe.indexOf(w);z>=0&&Pe.splice(z,1),w.timer=0;let G=Pe.filter(k=>k.sequence<w.sequence).sort((k,u)=>k.sequence-u.sequence);for(let k of G){let u=Pe.indexOf(k);u>=0&&Pe.splice(u,1),k.timer&&clearTimeout(k.timer),k.timer=0,oi(k.slot)}oi(w.slot)}function Oa(w,z){let G={timer:0,sequence:w.sequence,atMs:z,startedAt:performance.now(),remaining:z,slot:w};Pe.push(G),yt||(G.timer=setTimeout(()=>Mi(G),z))}function Ba(w){let z=performance.now();for(let G of Pe)G.timer&&(clearTimeout(G.timer),G.remaining=Math.max(0,G.atMs-(z-G.startedAt)),G.timer=0);if(yt=!!w,!w)for(let G of Pe){let k=Math.max(0,G.remaining);G.atMs=k,G.startedAt=performance.now(),G.timer=setTimeout(()=>Mi(G),k)}}function Jr(){for(let[w,z]of $){let G=z.userData.highlightRefs,k=!!at&&w===at;G&&(k?(G.trimMat.emissive.setHex(G.isMajor?a.warning.getHex():a.active.getHex()),G.trimMat.emissiveIntensity=Math.max(1.55,G.baseTrimEmissive+.85),G.plateMat.emissive.setHex(G.isMajor?2496520:926256),G.plateMat.emissiveIntensity=.55):(G.trimMat.emissive.setHex(G.baseEdgeHex),G.trimMat.emissiveIntensity=G.baseTrimEmissive,G.plateMat.emissive.setHex(0),G.plateMat.emissiveIntensity=0),G.labelEl&&G.labelEl.classList.toggle("is-hovered",k));let u=z.userData.tokens;if(u)for(let[v,I]of u){let N=!!ht&&v===ht;if(I.glowMats&&I.baseEmissives)for(let O=0;O<I.glowMats.length;O++)I.glowMats[O].emissiveIntensity=N?I.baseEmissives[O]+.9:I.baseEmissives[O];I.ringMat&&(I.ringMat.opacity=N?1:I.baseRingOpacity),I.mesh&&I.mesh.scale.setScalar(N?1.26:1.14),I.nameplate&&I.nameplate.element&&I.nameplate.element.classList.toggle("is-hovered",N)}}}function $r(w,z){if(pt)return;let G=String(w||""),k=String(z||"");G===at&&k===ht||(at=G,ht=k,Jr(),lt())}function Ga(w,z){if(pt)return;let G=K;K=z||{};let k=U.radius,u=Fe;U=_p(w,K),ve();let v=new Set;for(let oe of U.routes){let _e=String(oe.direction||"").toLowerCase();_e==="down"?v.add(oe.to):_e==="up"&&v.add(oe.from)}for(let oe of U.sites){let _e=String(oe.id||"").toLowerCase();(_e.includes("archive")||_e.includes("vault"))&&v.add(oe.id)}let I=[],N=[];for(let oe of U.sites){let _e=v.has(oe.id);_e?I.push(oe):N.push(oe);let Ie=M(oe,_e,U.sites);$.set(oe.id,Ie),B.add(Ie)}_.updatePits(I,N),de=[];for(let oe of U.routes){let _e=$.get(oe.from),Ie=$.get(oe.to);if(!_e||!Ie)continue;let st=Y(oe,_e.position,Ie.position);B.add(st);let Me=[],mt=new Set;st.traverse(Be=>{Be.material&&Be.material.color&&Be.material.userData&&Be.material.userData.routeGlow&&!mt.has(Be.material)&&(mt.add(Be.material),Me.push(Be.material))}),de.push({from:oe.from,to:oe.to,mats:Me})}(!pe||Math.abs(k-U.radius)>.01)&&(se(U.radius),ue(U.radius));for(let oe of j)oe.tier==="MAJOR"&&!oe.ring&&$.has(oe.roomId)&&(oe.ring=$e(oe.roomId));De(performance.now());for(let[oe,_e]of Je){let Ie=$.get(oe);Ie&&Ie.add(_e.obj)}xe(performance.now()),Jr();let O=Mp(w&&w.recent_events,ee,$.keys(),{reduce:r,snapshotSequence:w&&w.sequence}),ce=Sp(w&&w.recent_events,ee,$.keys());ee=O.lastSequence;let ie=r?[]:yp(u,U,O.pulses,w&&w.recent_events);Fe=zl(U);let q=new Map,W=Array.isArray(w&&w.recent_events)?w.recent_events:[];for(let oe of W)oe&&typeof oe.sequence=="number"&&typeof oe.occurred_at=="number"&&q.set(oe.sequence,oe.occurred_at);let Z=new Map,ne=oe=>{let _e=Z.get(oe);return _e||(_e={sequence:oe,occurredAt:q.get(oe),pulses:[],captions:[],travels:[],moments:[]},Z.set(oe,_e)),_e};for(let oe of O.pulses)ne(oe.sequence).pulses.push(oe);for(let oe of ce){let _e=ne(oe.sequence);_e.captions.push(oe),oe.tier==="MAJOR"&&!_e.moments.includes(oe.roomId)&&_e.moments.push(oe.roomId)}for(let oe of ie)ne(oe.sequence).travels.push(oe);let fe=performance.now(),Q=fe;for(let oe of Pe){let _e=oe.timer?oe.startedAt+oe.atMs:fe+oe.remaining;_e>Q&&(Q=_e)}let ge=dp([Q],fe);if(!yt&&(ge.flush||Q-fe>hn.MAX_TOTAL_MS)){let oe=Pe.slice().sort((_e,Ie)=>_e.sequence-Ie.sequence);Pe.length=0;for(let _e of oe)_e.timer&&clearTimeout(_e.timer),_e.timer=0,oi(_e.slot)}for(let oe of hp(Array.from(Z.values()))){let _e=Z.get(oe.sequence);if(!_e)continue;let Ie=ge.offsetMs+oe.atMs;Ie<=0?oi(_e):Oa(_e,Ie)}if(pe){let oe=Ep(G,K,"",te);oe&&((oe===K.selectedId||oe===K.followRoomId)&&(te=!1),Ge(oe))}else{pe=!0;let oe=be();R.target.copy(oe.target),b.position.copy(oe.position),R.update()}lt()}let Qr=new ns,jr=new Ce,gi=null,nr=w=>{gi={x:w.clientX,y:w.clientY}},eo=w=>{if(!gi||Math.hypot(w.clientX-gi.x,w.clientY-gi.y)>5){gi=null;return}gi=null;let z=t.getBoundingClientRect();jr.set((w.clientX-z.left)/z.width*2-1,-((w.clientY-z.top)/z.height)*2+1),Qr.setFromCamera(jr,b);let G=Qr.intersectObjects(B.children,!0).find(k=>k.object.userData&&k.object.userData.siteId);G&&o(G.object.userData.siteId)};t.addEventListener("pointerdown",nr),t.addEventListener("pointerup",eo),R.addEventListener("start",()=>{te=!0,le=null,he=null}),R.addEventListener("change",lt);let to=w=>{W0.has(w.key)&&(te=!0,le=null,he=null)};n.addEventListener("keydown",to);let Ki=e.reset,io=()=>ke();Ki&&Ki.addEventListener("click",io);let Nn=()=>{!document.hidden&&ze&&(ze=!1,lt())};document.addEventListener("visibilitychange",Nn);let no=w=>{w.preventDefault(),s()};t.addEventListener("webglcontextlost",no);let Un=typeof ResizeObserver=="function"?new ResizeObserver(Ht):null;Un?Un.observe(n):window.addEventListener("resize",Ht),Ht();function za(){if(pt)return;pt=!0,We&&cancelAnimationFrame(We);for(let G of Ne)G.timer&&clearTimeout(G.timer);Ne=[];for(let G of Pe)G.timer&&clearTimeout(G.timer);Pe.length=0;for(let G of Je.values())G.anchor.remove();Je.clear(),J(),ve(),vt.length=0;let w=new Set,z=new Set;p.traverse(G=>{G.geometry&&!w.has(G.geometry)&&(w.add(G.geometry),G.geometry.dispose()),G.material&&!z.has(G.material)&&(z.add(G.material),G.material.dispose())}),P.shadow&&typeof P.shadow.dispose=="function"&&P.shadow.dispose(),typeof A.dispose=="function"&&A.dispose(),typeof P.dispose=="function"&&P.dispose(),typeof y.dispose=="function"&&y.dispose(),typeof E.dispose=="function"&&E.dispose();for(let G of Object.values(d))G.dispose();c&&c.dispose(),l&&l.dispose(),h&&h.dispose(),m&&(m.map.dispose(),m.bump.dispose()),f&&(f.map.dispose(),f.bump.dispose()),R.dispose(),t.removeEventListener("pointerdown",nr),t.removeEventListener("pointerup",eo),t.removeEventListener("webglcontextlost",no),n.removeEventListener("keydown",to),R.stopListenToKeyEvents(),document.removeEventListener("visibilitychange",Nn),Ki&&Ki.removeEventListener("click",io),Un?Un.disconnect():window.removeEventListener("resize",Ht),i.replaceChildren();try{let G=g.getContext();G&&typeof G.pixelStorei=="function"&&(G.pixelStorei(G.UNPACK_FLIP_Y_WEBGL,!1),G.pixelStorei(G.UNPACK_PREMULTIPLY_ALPHA_WEBGL,!1))}catch{}g.dispose()}return{update:Ga,focus:Ge,reset:ke,dispose:za,pause:Ba,setHighlight:$r}}window.NoemaWatchStage={mount:Q0};
