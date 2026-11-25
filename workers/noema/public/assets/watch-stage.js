/*! NOEMA WATCH Chamber stage. Bundles three.js (MIT, Copyright 2010-2026 three.js authors); see /assets/THREE-LICENSE.txt */
var dn={LEFT:0,MIDDLE:1,RIGHT:2,ROTATE:0,DOLLY:1,PAN:2},pn={ROTATE:0,PAN:1,DOLLY_PAN:2,DOLLY_ROTATE:3},hl=0,na=1,fl=2;var Un=1,dl=2,mn=3,li=0,gt=1,ei=2,ti=0,Zi=1,ra=2,oa=3,sa=4,pl=5;var Ji=100,ml=101,gl=102,_l=103,xl=104,vl=200,Sl=201,Ml=202,yl=203,No=204,Uo=205,bl=206,El=207,Tl=208,Al=209,wl=210,Rl=211,Cl=212,Pl=213,Ll=214,wr=0,Rr=1,Cr=2,$i=3,Pr=4,Lr=5,Dr=6,Ir=7,Fo=0,Dl=1,Il=2,qt=0,Oo=1,Bo=2,Go=3,zo=4,ko=5,Ho=6,Vo=7;var aa=300,ci=301,Ni=302,Wo=303,Xo=304,Qi=306,Nr=1e3,Jt=1001,Ur=1002,pt=1003,Nl=1004;var Fr=1005;var _t=1006,qo=1007;var mi=1008;var vt=1009,Yo=1010,Ko=1011,Ui=1012,Fn=1013,Pt=1014,Ot=1015,Lt=1016,On=1017,Bn=1018,Fi=1020,Zo=35902,Jo=35899,$o=1021,Qo=1022,Dt=1023,Yt=1026,gi=1027,jo=1028,Gn=1029,ii=1030,zn=1031;var kn=1033,Hn=33776,Vn=33777,Wn=33778,Xn=33779,Or=35840,Br=35841,Gr=35842,zr=35843,kr=36196,Hr=37492,Vr=37496,Wr=37488,Xr=37489,gn=37490,qr=37491,Yr=37808,Kr=37809,Zr=37810,Jr=37811,$r=37812,Qr=37813,jr=37814,eo=37815,to=37816,io=37817,no=37818,ro=37819,oo=37820,so=37821,ao=36492,lo=36494,co=36495,uo=36283,ho=36284,_n=36285,fo=36286;var Ul=3200;var po=0,Fl=1,ui="",Kt="srgb",xn="srgb-linear",vn="linear",qe="srgb";var es=7680;var Ol=519,Bl=512,Gl=513,zl=514,qn=515,kl=516,Hl=517,Yn=518,Vl=519,Wl=35044;var la="300 es",Zt=2e3,Oi=2001;function ql(n){for(let e=n.length-1;e>=0;--e)if(n[e]>=65535)return!0;return!1}function Zn(n){return document.createElementNS("http://www.w3.org/1999/xhtml",n)}function Yl(){let n=Zn("canvas");return n.style.display="block",n}var Xl={},Kn=null;function ca(...n){let e="THREE."+n.shift();Kn?Kn("log",e,...n):console.log(e,...n)}function Kl(n){let e=n[0];if(typeof e=="string"&&e.startsWith("TSL:")){let t=n[1];t&&t.isStackTrace?n[0]+=" "+t.getLocation():n[1]='Stack trace not available. Enable "THREE.Node.captureStackTrace" to capture stack traces.'}return n}function xe(...n){n=Kl(n);let e="THREE."+n.shift();if(Kn)Kn("warn",e,...n);else{let t=n[0];t&&t.isStackTrace?console.warn(t.getError(e)):console.warn(e,...n)}}function Fe(...n){n=Kl(n);let e="THREE."+n.shift();if(Kn)Kn("error",e,...n);else{let t=n[0];t&&t.isStackTrace?console.error(t.getError(e)):console.error(e,...n)}}function Ri(...n){let e=n.join(" ");e in Xl||(Xl[e]=!0,xe(...n))}function Zl(n,e,t){return new Promise(function(i,r){function o(){switch(n.clientWaitSync(e,n.SYNC_FLUSH_COMMANDS_BIT,0)){case n.WAIT_FAILED:r();break;case n.TIMEOUT_EXPIRED:setTimeout(o,t);break;default:i()}}setTimeout(o,t)})}var Jl={[wr]:Rr,[Cr]:Dr,[Pr]:Ir,[$i]:Lr,[Rr]:wr,[Dr]:Cr,[Ir]:Pr,[Lr]:$i};var It=class{addEventListener(e,t){this._listeners===void 0&&(this._listeners={});let i=this._listeners;i[e]===void 0&&(i[e]=[]),i[e].indexOf(t)===-1&&i[e].push(t)}hasEventListener(e,t){let i=this._listeners;return i===void 0?!1:i[e]!==void 0&&i[e].indexOf(t)!==-1}removeEventListener(e,t){let i=this._listeners;if(i===void 0)return;let r=i[e];if(r!==void 0){let o=r.indexOf(t);o!==-1&&r.splice(o,1)}}dispatchEvent(e){let t=this._listeners;if(t===void 0)return;let i=t[e.type];if(i!==void 0){e.target=this;let r=i.slice(0);for(let o=0,s=r.length;o<s;o++)r[o].call(this,e);e.target=null}}};var Gt=["00","01","02","03","04","05","06","07","08","09","0a","0b","0c","0d","0e","0f","10","11","12","13","14","15","16","17","18","19","1a","1b","1c","1d","1e","1f","20","21","22","23","24","25","26","27","28","29","2a","2b","2c","2d","2e","2f","30","31","32","33","34","35","36","37","38","39","3a","3b","3c","3d","3e","3f","40","41","42","43","44","45","46","47","48","49","4a","4b","4c","4d","4e","4f","50","51","52","53","54","55","56","57","58","59","5a","5b","5c","5d","5e","5f","60","61","62","63","64","65","66","67","68","69","6a","6b","6c","6d","6e","6f","70","71","72","73","74","75","76","77","78","79","7a","7b","7c","7d","7e","7f","80","81","82","83","84","85","86","87","88","89","8a","8b","8c","8d","8e","8f","90","91","92","93","94","95","96","97","98","99","9a","9b","9c","9d","9e","9f","a0","a1","a2","a3","a4","a5","a6","a7","a8","a9","aa","ab","ac","ad","ae","af","b0","b1","b2","b3","b4","b5","b6","b7","b8","b9","ba","bb","bc","bd","be","bf","c0","c1","c2","c3","c4","c5","c6","c7","c8","c9","ca","cb","cc","cd","ce","cf","d0","d1","d2","d3","d4","d5","d6","d7","d8","d9","da","db","dc","dd","de","df","e0","e1","e2","e3","e4","e5","e6","e7","e8","e9","ea","eb","ec","ed","ee","ef","f0","f1","f2","f3","f4","f5","f6","f7","f8","f9","fa","fb","fc","fd","fe","ff"],$l=1234567,ji=Math.PI/180,Sn=180/Math.PI;function _i(){let n=Math.random()*4294967295|0,e=Math.random()*4294967295|0,t=Math.random()*4294967295|0,i=Math.random()*4294967295|0;return(Gt[n&255]+Gt[n>>8&255]+Gt[n>>16&255]+Gt[n>>24&255]+"-"+Gt[e&255]+Gt[e>>8&255]+"-"+Gt[e>>16&15|64]+Gt[e>>24&255]+"-"+Gt[t&63|128]+Gt[t>>8&255]+"-"+Gt[t>>16&255]+Gt[t>>24&255]+Gt[i&255]+Gt[i>>8&255]+Gt[i>>16&255]+Gt[i>>24&255]).toLowerCase()}function Ne(n,e,t){return Math.max(e,Math.min(t,n))}function ts(n,e){return(n%e+e)%e}function Yd(n,e,t,i,r){return i+(n-e)*(r-i)/(t-e)}function Kd(n,e,t){return n!==e?(t-n)/(e-n):0}function Jn(n,e,t){return(1-t)*n+t*e}function Zd(n,e,t,i){return Jn(n,e,1-Math.exp(-t*i))}function Jd(n,e=1){return e-Math.abs(ts(n,e*2)-e)}function $d(n,e,t){return n<=e?0:n>=t?1:(n=(n-e)/(t-e),n*n*(3-2*n))}function Qd(n,e,t){return n<=e?0:n>=t?1:(n=(n-e)/(t-e),n*n*n*(n*(n*6-15)+10))}function jd(n,e){return n+Math.floor(Math.random()*(e-n+1))}function ep(n,e){return n+Math.random()*(e-n)}function tp(n){return n*(.5-Math.random())}function ip(n){n!==void 0&&($l=n);let e=$l+=1831565813;return e=Math.imul(e^e>>>15,e|1),e^=e+Math.imul(e^e>>>7,e|61),((e^e>>>14)>>>0)/4294967296}function np(n){return n*ji}function rp(n){return n*Sn}function op(n){return n>0&&Number.isInteger(n)&&2**Math.round(Math.log2(n))===n}function sp(n){return Math.pow(2,Math.ceil(Math.log(n)/Math.LN2))}function ap(n){return Math.pow(2,Math.floor(Math.log(n)/Math.LN2))}function lp(n,e,t,i,r){let o=Math.cos,s=Math.sin,a=o(t/2),l=s(t/2),c=o((e+i)/2),f=s((e+i)/2),m=o((e-i)/2),u=s((e-i)/2),p=o((i-e)/2),_=s((i-e)/2);switch(r){case"XYX":n.set(a*f,l*m,l*u,a*c);break;case"YZY":n.set(l*u,a*f,l*m,a*c);break;case"ZXZ":n.set(l*m,l*u,a*f,a*c);break;case"XZX":n.set(a*f,l*_,l*p,a*c);break;case"YXY":n.set(l*p,a*f,l*_,a*c);break;case"ZYZ":n.set(l*_,l*p,a*f,a*c);break;default:xe("MathUtils: .setQuaternionFromProperEuler() encountered an unknown order: "+r)}}function Mn(n,e){switch(e.constructor){case Float32Array:return n;case Uint32Array:return n/4294967295;case Uint16Array:return n/65535;case Uint8Array:case Uint8ClampedArray:return n/255;case Int32Array:return Math.max(n/2147483647,-1);case Int16Array:return Math.max(n/32767,-1);case Int8Array:return Math.max(n/127,-1);default:throw new Error("THREE.MathUtils: Invalid component type.")}}function zt(n,e){switch(e.constructor){case Float32Array:return n;case Uint32Array:return Math.round(n*4294967295);case Uint16Array:return Math.round(n*65535);case Uint8Array:case Uint8ClampedArray:return Math.round(n*255);case Int32Array:return Math.round(n*2147483647);case Int16Array:return Math.round(n*32767);case Int8Array:return Math.round(n*127);default:throw new Error("THREE.MathUtils: Invalid component type.")}}var ua={DEG2RAD:ji,RAD2DEG:Sn,generateUUID:_i,clamp:Ne,euclideanModulo:ts,mapLinear:Yd,inverseLerp:Kd,lerp:Jn,damp:Zd,pingpong:Jd,smoothstep:$d,smootherstep:Qd,randInt:jd,randFloat:ep,randFloatSpread:tp,seededRandom:ip,degToRad:np,radToDeg:rp,isPowerOfTwo:op,ceilPowerOfTwo:sp,floorPowerOfTwo:ap,setQuaternionFromProperEuler:lp,normalize:zt,denormalize:Mn};var _e=class n{static{n.prototype.isVector2=!0}constructor(e=0,t=0){this.x=e,this.y=t}get width(){return this.x}set width(e){this.x=e}get height(){return this.y}set height(e){this.y=e}set(e,t){return this.x=e,this.y=t,this}setScalar(e){return this.x=e,this.y=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;default:throw new Error("THREE.Vector2: index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;default:throw new Error("THREE.Vector2: index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y)}copy(e){return this.x=e.x,this.y=e.y,this}add(e){return this.x+=e.x,this.y+=e.y,this}addScalar(e){return this.x+=e,this.y+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this}subScalar(e){return this.x-=e,this.y-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this}multiply(e){return this.x*=e.x,this.y*=e.y,this}multiplyScalar(e){return this.x*=e,this.y*=e,this}divide(e){return this.x/=e.x,this.y/=e.y,this}divideScalar(e){return this.multiplyScalar(1/e)}applyMatrix3(e){let t=this.x,i=this.y,r=e.elements;return this.x=r[0]*t+r[3]*i+r[6],this.y=r[1]*t+r[4]*i+r[7],this}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this}clamp(e,t){return this.x=Ne(this.x,e.x,t.x),this.y=Ne(this.y,e.y,t.y),this}clampScalar(e,t){return this.x=Ne(this.x,e,t),this.y=Ne(this.y,e,t),this}clampLength(e,t){let i=this.length();return this.divideScalar(i||1).multiplyScalar(Ne(i,e,t))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this}negate(){return this.x=-this.x,this.y=-this.y,this}dot(e){return this.x*e.x+this.y*e.y}cross(e){return this.x*e.y-this.y*e.x}lengthSq(){return this.x*this.x+this.y*this.y}length(){return Math.sqrt(this.x*this.x+this.y*this.y)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)}normalize(){return this.divideScalar(this.length()||1)}angle(){return Math.atan2(-this.y,-this.x)+Math.PI}angleTo(e){let t=Math.sqrt(this.lengthSq()*e.lengthSq());if(t===0)return Math.PI/2;let i=this.dot(e)/t;return Math.acos(Ne(i,-1,1))}distanceTo(e){return Math.sqrt(this.distanceToSquared(e))}distanceToSquared(e){let t=this.x-e.x,i=this.y-e.y;return t*t+i*i}manhattanDistanceTo(e){return Math.abs(this.x-e.x)+Math.abs(this.y-e.y)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this}lerpVectors(e,t,i){return this.x=e.x+(t.x-e.x)*i,this.y=e.y+(t.y-e.y)*i,this}equals(e){return e.x===this.x&&e.y===this.y}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this}rotateAround(e,t){let i=Math.cos(t),r=Math.sin(t),o=this.x-e.x,s=this.y-e.y;return this.x=o*i-s*r+e.x,this.y=o*r+s*i+e.y,this}random(){return this.x=Math.random(),this.y=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y}};var kt=class{constructor(e=0,t=0,i=0,r=1){this.isQuaternion=!0,this._x=e,this._y=t,this._z=i,this._w=r}static slerpFlat(e,t,i,r,o,s,a){let l=i[r+0],c=i[r+1],f=i[r+2],m=i[r+3],u=o[s+0],p=o[s+1],_=o[s+2],S=o[s+3];if(m!==S||l!==u||c!==p||f!==_){let d=l*u+c*p+f*_+m*S;d<0&&(u=-u,p=-p,_=-_,S=-S,d=-d);let h=1-a;if(d<.9995){let A=Math.acos(d),I=Math.sin(A);h=Math.sin(h*A)/I,a=Math.sin(a*A)/I,l=l*h+u*a,c=c*h+p*a,f=f*h+_*a,m=m*h+S*a}else{l=l*h+u*a,c=c*h+p*a,f=f*h+_*a,m=m*h+S*a;let A=1/Math.sqrt(l*l+c*c+f*f+m*m);l*=A,c*=A,f*=A,m*=A}}e[t]=l,e[t+1]=c,e[t+2]=f,e[t+3]=m}static multiplyQuaternionsFlat(e,t,i,r,o,s){let a=i[r],l=i[r+1],c=i[r+2],f=i[r+3],m=o[s],u=o[s+1],p=o[s+2],_=o[s+3];return e[t]=a*_+f*m+l*p-c*u,e[t+1]=l*_+f*u+c*m-a*p,e[t+2]=c*_+f*p+a*u-l*m,e[t+3]=f*_-a*m-l*u-c*p,e}get x(){return this._x}set x(e){this._x=e,this._onChangeCallback()}get y(){return this._y}set y(e){this._y=e,this._onChangeCallback()}get z(){return this._z}set z(e){this._z=e,this._onChangeCallback()}get w(){return this._w}set w(e){this._w=e,this._onChangeCallback()}set(e,t,i,r){return this._x=e,this._y=t,this._z=i,this._w=r,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._w)}copy(e){return this._x=e.x,this._y=e.y,this._z=e.z,this._w=e.w,this._onChangeCallback(),this}setFromEuler(e,t=!0){let i=e._x,r=e._y,o=e._z,s=e._order,a=Math.cos,l=Math.sin,c=a(i/2),f=a(r/2),m=a(o/2),u=l(i/2),p=l(r/2),_=l(o/2);switch(s){case"XYZ":this._x=u*f*m+c*p*_,this._y=c*p*m-u*f*_,this._z=c*f*_+u*p*m,this._w=c*f*m-u*p*_;break;case"YXZ":this._x=u*f*m+c*p*_,this._y=c*p*m-u*f*_,this._z=c*f*_-u*p*m,this._w=c*f*m+u*p*_;break;case"ZXY":this._x=u*f*m-c*p*_,this._y=c*p*m+u*f*_,this._z=c*f*_+u*p*m,this._w=c*f*m-u*p*_;break;case"ZYX":this._x=u*f*m-c*p*_,this._y=c*p*m+u*f*_,this._z=c*f*_-u*p*m,this._w=c*f*m+u*p*_;break;case"YZX":this._x=u*f*m+c*p*_,this._y=c*p*m+u*f*_,this._z=c*f*_-u*p*m,this._w=c*f*m-u*p*_;break;case"XZY":this._x=u*f*m-c*p*_,this._y=c*p*m-u*f*_,this._z=c*f*_+u*p*m,this._w=c*f*m+u*p*_;break;default:xe("Quaternion: .setFromEuler() encountered an unknown order: "+s)}return t===!0&&this._onChangeCallback(),this}setFromAxisAngle(e,t){let i=t/2,r=Math.sin(i);return this._x=e.x*r,this._y=e.y*r,this._z=e.z*r,this._w=Math.cos(i),this._onChangeCallback(),this}setFromRotationMatrix(e){let t=e.elements,i=t[0],r=t[4],o=t[8],s=t[1],a=t[5],l=t[9],c=t[2],f=t[6],m=t[10],u=i+a+m;if(u>0){let p=.5/Math.sqrt(u+1);this._w=.25/p,this._x=(f-l)*p,this._y=(o-c)*p,this._z=(s-r)*p}else if(i>a&&i>m){let p=2*Math.sqrt(1+i-a-m);this._w=(f-l)/p,this._x=.25*p,this._y=(r+s)/p,this._z=(o+c)/p}else if(a>m){let p=2*Math.sqrt(1+a-i-m);this._w=(o-c)/p,this._x=(r+s)/p,this._y=.25*p,this._z=(l+f)/p}else{let p=2*Math.sqrt(1+m-i-a);this._w=(s-r)/p,this._x=(o+c)/p,this._y=(l+f)/p,this._z=.25*p}return this._onChangeCallback(),this}setFromUnitVectors(e,t){let i=e.dot(t)+1;return i<1e-8?(i=0,Math.abs(e.x)>Math.abs(e.z)?(this._x=-e.y,this._y=e.x,this._z=0,this._w=i):(this._x=0,this._y=-e.z,this._z=e.y,this._w=i)):(this._x=e.y*t.z-e.z*t.y,this._y=e.z*t.x-e.x*t.z,this._z=e.x*t.y-e.y*t.x,this._w=i),this.normalize()}angleTo(e){return 2*Math.acos(Math.abs(Ne(this.dot(e),-1,1)))}rotateTowards(e,t){let i=this.angleTo(e);if(i===0)return this;let r=Math.min(1,t/i);return this.slerp(e,r),this}identity(){return this.set(0,0,0,1)}invert(){return this.conjugate()}conjugate(){return this._x*=-1,this._y*=-1,this._z*=-1,this._onChangeCallback(),this}dot(e){return this._x*e._x+this._y*e._y+this._z*e._z+this._w*e._w}lengthSq(){return this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w}length(){return Math.sqrt(this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w)}normalize(){let e=this.length();return e===0?(this._x=0,this._y=0,this._z=0,this._w=1):(e=1/e,this._x=this._x*e,this._y=this._y*e,this._z=this._z*e,this._w=this._w*e),this._onChangeCallback(),this}multiply(e){return this.multiplyQuaternions(this,e)}premultiply(e){return this.multiplyQuaternions(e,this)}multiplyQuaternions(e,t){let i=e._x,r=e._y,o=e._z,s=e._w,a=t._x,l=t._y,c=t._z,f=t._w;return this._x=i*f+s*a+r*c-o*l,this._y=r*f+s*l+o*a-i*c,this._z=o*f+s*c+i*l-r*a,this._w=s*f-i*a-r*l-o*c,this._onChangeCallback(),this}slerp(e,t){let i=e._x,r=e._y,o=e._z,s=e._w,a=this.dot(e);a<0&&(i=-i,r=-r,o=-o,s=-s,a=-a);let l=1-t;if(a<.9995){let c=Math.acos(a),f=Math.sin(c);l=Math.sin(l*c)/f,t=Math.sin(t*c)/f,this._x=this._x*l+i*t,this._y=this._y*l+r*t,this._z=this._z*l+o*t,this._w=this._w*l+s*t,this._onChangeCallback()}else this._x=this._x*l+i*t,this._y=this._y*l+r*t,this._z=this._z*l+o*t,this._w=this._w*l+s*t,this.normalize();return this}slerpQuaternions(e,t,i){return this.copy(e).slerp(t,i)}random(){let e=2*Math.PI*Math.random(),t=2*Math.PI*Math.random(),i=Math.random(),r=Math.sqrt(1-i),o=Math.sqrt(i);return this.set(r*Math.sin(e),r*Math.cos(e),o*Math.sin(t),o*Math.cos(t))}equals(e){return e._x===this._x&&e._y===this._y&&e._z===this._z&&e._w===this._w}fromArray(e,t=0){return this._x=e[t],this._y=e[t+1],this._z=e[t+2],this._w=e[t+3],this._onChangeCallback(),this}toArray(e=[],t=0){return e[t]=this._x,e[t+1]=this._y,e[t+2]=this._z,e[t+3]=this._w,e}fromBufferAttribute(e,t){return this._x=e.getX(t),this._y=e.getY(t),this._z=e.getZ(t),this._w=e.getW(t),this._onChangeCallback(),this}toJSON(){return this.toArray()}_onChange(e){return this._onChangeCallback=e,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._w}};var P=class n{static{n.prototype.isVector3=!0}constructor(e=0,t=0,i=0){this.x=e,this.y=t,this.z=i}set(e,t,i){return i===void 0&&(i=this.z),this.x=e,this.y=t,this.z=i,this}setScalar(e){return this.x=e,this.y=e,this.z=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setZ(e){return this.z=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;case 2:this.z=t;break;default:throw new Error("THREE.Vector3: index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;case 2:return this.z;default:throw new Error("THREE.Vector3: index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y,this.z)}copy(e){return this.x=e.x,this.y=e.y,this.z=e.z,this}add(e){return this.x+=e.x,this.y+=e.y,this.z+=e.z,this}addScalar(e){return this.x+=e,this.y+=e,this.z+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this.z=e.z+t.z,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this.z+=e.z*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this.z-=e.z,this}subScalar(e){return this.x-=e,this.y-=e,this.z-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this.z=e.z-t.z,this}multiply(e){return this.x*=e.x,this.y*=e.y,this.z*=e.z,this}multiplyScalar(e){return this.x*=e,this.y*=e,this.z*=e,this}multiplyVectors(e,t){return this.x=e.x*t.x,this.y=e.y*t.y,this.z=e.z*t.z,this}applyEuler(e){return this.applyQuaternion(Ql.setFromEuler(e))}applyAxisAngle(e,t){return this.applyQuaternion(Ql.setFromAxisAngle(e,t))}applyMatrix3(e){let t=this.x,i=this.y,r=this.z,o=e.elements;return this.x=o[0]*t+o[3]*i+o[6]*r,this.y=o[1]*t+o[4]*i+o[7]*r,this.z=o[2]*t+o[5]*i+o[8]*r,this}applyNormalMatrix(e){return this.applyMatrix3(e).normalize()}applyMatrix4(e){let t=this.x,i=this.y,r=this.z,o=e.elements,s=1/(o[3]*t+o[7]*i+o[11]*r+o[15]);return this.x=(o[0]*t+o[4]*i+o[8]*r+o[12])*s,this.y=(o[1]*t+o[5]*i+o[9]*r+o[13])*s,this.z=(o[2]*t+o[6]*i+o[10]*r+o[14])*s,this}applyQuaternion(e){let t=this.x,i=this.y,r=this.z,o=e.x,s=e.y,a=e.z,l=e.w,c=2*(s*r-a*i),f=2*(a*t-o*r),m=2*(o*i-s*t);return this.x=t+l*c+s*m-a*f,this.y=i+l*f+a*c-o*m,this.z=r+l*m+o*f-s*c,this}project(e){return this.applyMatrix4(e.matrixWorldInverse).applyMatrix4(e.projectionMatrix)}unproject(e){return this.applyMatrix4(e.projectionMatrixInverse).applyMatrix4(e.matrixWorld)}transformDirection(e){let t=this.x,i=this.y,r=this.z,o=e.elements;return this.x=o[0]*t+o[4]*i+o[8]*r,this.y=o[1]*t+o[5]*i+o[9]*r,this.z=o[2]*t+o[6]*i+o[10]*r,this.normalize()}divide(e){return this.x/=e.x,this.y/=e.y,this.z/=e.z,this}divideScalar(e){return this.multiplyScalar(1/e)}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this.z=Math.min(this.z,e.z),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this.z=Math.max(this.z,e.z),this}clamp(e,t){return this.x=Ne(this.x,e.x,t.x),this.y=Ne(this.y,e.y,t.y),this.z=Ne(this.z,e.z,t.z),this}clampScalar(e,t){return this.x=Ne(this.x,e,t),this.y=Ne(this.y,e,t),this.z=Ne(this.z,e,t),this}clampLength(e,t){let i=this.length();return this.divideScalar(i||1).multiplyScalar(Ne(i,e,t))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this}dot(e){return this.x*e.x+this.y*e.y+this.z*e.z}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)}normalize(){return this.divideScalar(this.length()||1)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this.z+=(e.z-this.z)*t,this}lerpVectors(e,t,i){return this.x=e.x+(t.x-e.x)*i,this.y=e.y+(t.y-e.y)*i,this.z=e.z+(t.z-e.z)*i,this}cross(e){return this.crossVectors(this,e)}crossVectors(e,t){let i=e.x,r=e.y,o=e.z,s=t.x,a=t.y,l=t.z;return this.x=r*l-o*a,this.y=o*s-i*l,this.z=i*a-r*s,this}projectOnVector(e){let t=e.lengthSq();if(t===0)return this.set(0,0,0);let i=e.dot(this)/t;return this.copy(e).multiplyScalar(i)}projectOnPlane(e){return ha.copy(this).projectOnVector(e),this.sub(ha)}reflect(e){return this.sub(ha.copy(e).multiplyScalar(2*this.dot(e)))}angleTo(e){let t=Math.sqrt(this.lengthSq()*e.lengthSq());if(t===0)return Math.PI/2;let i=this.dot(e)/t;return Math.acos(Ne(i,-1,1))}distanceTo(e){return Math.sqrt(this.distanceToSquared(e))}distanceToSquared(e){let t=this.x-e.x,i=this.y-e.y,r=this.z-e.z;return t*t+i*i+r*r}manhattanDistanceTo(e){return Math.abs(this.x-e.x)+Math.abs(this.y-e.y)+Math.abs(this.z-e.z)}setFromSpherical(e){return this.setFromSphericalCoords(e.radius,e.phi,e.theta)}setFromSphericalCoords(e,t,i){let r=Math.sin(t)*e;return this.x=r*Math.sin(i),this.y=Math.cos(t)*e,this.z=r*Math.cos(i),this}setFromCylindrical(e){return this.setFromCylindricalCoords(e.radius,e.theta,e.y)}setFromCylindricalCoords(e,t,i){return this.x=e*Math.sin(t),this.y=i,this.z=e*Math.cos(t),this}setFromMatrixPosition(e){let t=e.elements;return this.x=t[12],this.y=t[13],this.z=t[14],this}setFromMatrixScale(e){let t=this.setFromMatrixColumn(e,0).length(),i=this.setFromMatrixColumn(e,1).length(),r=this.setFromMatrixColumn(e,2).length();return this.x=t,this.y=i,this.z=r,this}setFromMatrixColumn(e,t){return this.fromArray(e.elements,t*4)}setFromMatrix3Column(e,t){return this.fromArray(e.elements,t*3)}setFromEuler(e){return this.x=e._x,this.y=e._y,this.z=e._z,this}setFromColor(e){return this.x=e.r,this.y=e.g,this.z=e.b,this}equals(e){return e.x===this.x&&e.y===this.y&&e.z===this.z}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this.z=e[t+2],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e[t+2]=this.z,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this.z=e.getZ(t),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this}randomDirection(){let e=Math.random()*Math.PI*2,t=Math.random()*2-1,i=Math.sqrt(1-t*t);return this.x=i*Math.cos(e),this.y=t,this.z=i*Math.sin(e),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z}},ha=new P,Ql=new kt;var Le=class n{static{n.prototype.isMatrix3=!0}constructor(e,t,i,r,o,s,a,l,c){this.elements=[1,0,0,0,1,0,0,0,1],e!==void 0&&this.set(e,t,i,r,o,s,a,l,c)}set(e,t,i,r,o,s,a,l,c){let f=this.elements;return f[0]=e,f[1]=r,f[2]=a,f[3]=t,f[4]=o,f[5]=l,f[6]=i,f[7]=s,f[8]=c,this}identity(){return this.set(1,0,0,0,1,0,0,0,1),this}copy(e){let t=this.elements,i=e.elements;return t[0]=i[0],t[1]=i[1],t[2]=i[2],t[3]=i[3],t[4]=i[4],t[5]=i[5],t[6]=i[6],t[7]=i[7],t[8]=i[8],this}extractBasis(e,t,i){return e.setFromMatrix3Column(this,0),t.setFromMatrix3Column(this,1),i.setFromMatrix3Column(this,2),this}setFromMatrix4(e){let t=e.elements;return this.set(t[0],t[4],t[8],t[1],t[5],t[9],t[2],t[6],t[10]),this}multiply(e){return this.multiplyMatrices(this,e)}premultiply(e){return this.multiplyMatrices(e,this)}multiplyMatrices(e,t){let i=e.elements,r=t.elements,o=this.elements,s=i[0],a=i[3],l=i[6],c=i[1],f=i[4],m=i[7],u=i[2],p=i[5],_=i[8],S=r[0],d=r[3],h=r[6],A=r[1],I=r[4],M=r[7],y=r[2],b=r[5],C=r[8];return o[0]=s*S+a*A+l*y,o[3]=s*d+a*I+l*b,o[6]=s*h+a*M+l*C,o[1]=c*S+f*A+m*y,o[4]=c*d+f*I+m*b,o[7]=c*h+f*M+m*C,o[2]=u*S+p*A+_*y,o[5]=u*d+p*I+_*b,o[8]=u*h+p*M+_*C,this}multiplyScalar(e){let t=this.elements;return t[0]*=e,t[3]*=e,t[6]*=e,t[1]*=e,t[4]*=e,t[7]*=e,t[2]*=e,t[5]*=e,t[8]*=e,this}determinant(){let e=this.elements,t=e[0],i=e[1],r=e[2],o=e[3],s=e[4],a=e[5],l=e[6],c=e[7],f=e[8];return t*s*f-t*a*c-i*o*f+i*a*l+r*o*c-r*s*l}invert(){let e=this.elements,t=e[0],i=e[1],r=e[2],o=e[3],s=e[4],a=e[5],l=e[6],c=e[7],f=e[8],m=f*s-a*c,u=a*l-f*o,p=c*o-s*l,_=t*m+i*u+r*p;if(_===0)return this.set(0,0,0,0,0,0,0,0,0);let S=1/_;return e[0]=m*S,e[1]=(r*c-f*i)*S,e[2]=(a*i-r*s)*S,e[3]=u*S,e[4]=(f*t-r*l)*S,e[5]=(r*o-a*t)*S,e[6]=p*S,e[7]=(i*l-c*t)*S,e[8]=(s*t-i*o)*S,this}transpose(){let e,t=this.elements;return e=t[1],t[1]=t[3],t[3]=e,e=t[2],t[2]=t[6],t[6]=e,e=t[5],t[5]=t[7],t[7]=e,this}getNormalMatrix(e){return this.setFromMatrix4(e).invert().transpose()}transposeIntoArray(e){let t=this.elements;return e[0]=t[0],e[1]=t[3],e[2]=t[6],e[3]=t[1],e[4]=t[4],e[5]=t[7],e[6]=t[2],e[7]=t[5],e[8]=t[8],this}setUvTransform(e,t,i,r,o,s,a){let l=Math.cos(o),c=Math.sin(o);return this.set(i*l,i*c,-i*(l*s+c*a)+s+e,-r*c,r*l,-r*(-c*s+l*a)+a+t,0,0,1),this}scale(e,t){return Ri("Matrix3: .scale() is deprecated. Use .makeScale() instead."),this.premultiply(fa.makeScale(e,t)),this}rotate(e){return Ri("Matrix3: .rotate() is deprecated. Use .makeRotation() instead."),this.premultiply(fa.makeRotation(-e)),this}translate(e,t){return Ri("Matrix3: .translate() is deprecated. Use .makeTranslation() instead."),this.premultiply(fa.makeTranslation(e,t)),this}makeTranslation(e,t){return e.isVector2?this.set(1,0,e.x,0,1,e.y,0,0,1):this.set(1,0,e,0,1,t,0,0,1),this}makeRotation(e){let t=Math.cos(e),i=Math.sin(e);return this.set(t,-i,0,i,t,0,0,0,1),this}makeScale(e,t){return this.set(e,0,0,0,t,0,0,0,1),this}equals(e){let t=this.elements,i=e.elements;for(let r=0;r<9;r++)if(t[r]!==i[r])return!1;return!0}fromArray(e,t=0){for(let i=0;i<9;i++)this.elements[i]=e[i+t];return this}toArray(e=[],t=0){let i=this.elements;return e[t]=i[0],e[t+1]=i[1],e[t+2]=i[2],e[t+3]=i[3],e[t+4]=i[4],e[t+5]=i[5],e[t+6]=i[6],e[t+7]=i[7],e[t+8]=i[8],e}clone(){return new this.constructor().fromArray(this.elements)}},fa=new Le;var jl=new Le().set(.4123908,.3575843,.1804808,.212639,.7151687,.0721923,.0193308,.1191948,.9505322),ec=new Le().set(3.2409699,-1.5373832,-.4986108,-.9692436,1.8759675,.0415551,.0556301,-.203977,1.0569715);function cp(){let n={enabled:!0,workingColorSpace:xn,spaces:{},convert:function(r,o,s){return this.enabled===!1||o===s||!o||!s||(this.spaces[o].transfer===qe&&(r.r=xi(r.r),r.g=xi(r.g),r.b=xi(r.b)),this.spaces[o].primaries!==this.spaces[s].primaries&&(r.applyMatrix3(this.spaces[o].toXYZ),r.applyMatrix3(this.spaces[s].fromXYZ)),this.spaces[s].transfer===qe&&(r.r=yn(r.r),r.g=yn(r.g),r.b=yn(r.b))),r},workingToColorSpace:function(r,o){return this.convert(r,this.workingColorSpace,o)},colorSpaceToWorking:function(r,o){return this.convert(r,o,this.workingColorSpace)},getPrimaries:function(r){return this.spaces[r].primaries},getTransfer:function(r){return r===ui?vn:this.spaces[r].transfer},getToneMappingMode:function(r){return this.spaces[r].outputColorSpaceConfig.toneMappingMode||"standard"},getLuminanceCoefficients:function(r,o=this.workingColorSpace){return r.fromArray(this.spaces[o].luminanceCoefficients)},define:function(r){Object.assign(this.spaces,r)},_getMatrix:function(r,o,s){return r.copy(this.spaces[o].toXYZ).multiply(this.spaces[s].fromXYZ)},_getDrawingBufferColorSpace:function(r){return this.spaces[r].outputColorSpaceConfig.drawingBufferColorSpace},_getUnpackColorSpace:function(r=this.workingColorSpace){return this.spaces[r].workingColorSpaceConfig.unpackColorSpace},fromWorkingColorSpace:function(r,o){return Ri("ColorManagement: .fromWorkingColorSpace() has been renamed to .workingToColorSpace()."),n.workingToColorSpace(r,o)},toWorkingColorSpace:function(r,o){return Ri("ColorManagement: .toWorkingColorSpace() has been renamed to .colorSpaceToWorking()."),n.colorSpaceToWorking(r,o)}},e=[.64,.33,.3,.6,.15,.06],t=[.2126,.7152,.0722],i=[.3127,.329];return n.define({[xn]:{primaries:e,whitePoint:i,transfer:vn,toXYZ:jl,fromXYZ:ec,luminanceCoefficients:t,workingColorSpaceConfig:{unpackColorSpace:Kt},outputColorSpaceConfig:{drawingBufferColorSpace:Kt}},[Kt]:{primaries:e,whitePoint:i,transfer:qe,toXYZ:jl,fromXYZ:ec,luminanceCoefficients:t,outputColorSpaceConfig:{drawingBufferColorSpace:Kt}}}),n}var Ue=cp();function xi(n){return n<.04045?n*.0773993808:Math.pow(n*.9478672986+.0521327014,2.4)}function yn(n){return n<.0031308?n*12.92:1.055*Math.pow(n,.41666)-.055}var $n,is=class{static getDataURL(e,t="image/png"){if(/^data:/i.test(e.src)||typeof HTMLCanvasElement>"u")return e.src;let i;if(e instanceof HTMLCanvasElement)i=e;else{$n===void 0&&($n=Zn("canvas")),$n.width=e.width,$n.height=e.height;let r=$n.getContext("2d");e instanceof ImageData?r.putImageData(e,0,0):r.drawImage(e,0,0,e.width,e.height),i=$n}return i.toDataURL(t)}static sRGBToLinear(e){if(typeof HTMLImageElement<"u"&&e instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&e instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&e instanceof ImageBitmap){let t=Zn("canvas");t.width=e.width,t.height=e.height;let i=t.getContext("2d");i.drawImage(e,0,0,e.width,e.height);let r=i.getImageData(0,0,e.width,e.height),o=r.data;for(let s=0;s<o.length;s++)o[s]=xi(o[s]/255)*255;return i.putImageData(r,0,0),t}else if(e.data){let t=e.data.slice(0);for(let i=0;i<t.length;i++)t instanceof Uint8Array||t instanceof Uint8ClampedArray?t[i]=Math.floor(xi(t[i]/255)*255):t[i]=xi(t[i]);return{data:t,width:e.width,height:e.height}}else return xe("ImageUtils.sRGBToLinear(): Unsupported image type. No color space conversion applied."),e}};var up=0,en=class{constructor(e=null){this.isTextureSource=!0,Object.defineProperty(this,"id",{value:up++}),this.uuid=_i(),this.data=e,this.dataReady=!0,this.version=0}getSize(e){let t=this.data;return typeof HTMLVideoElement<"u"&&t instanceof HTMLVideoElement?e.set(t.videoWidth,t.videoHeight,0):typeof VideoFrame<"u"&&t instanceof VideoFrame?e.set(t.displayWidth,t.displayHeight,0):t!==null?e.set(t.width,t.height,t.depth||0):e.set(0,0,0),e}set needsUpdate(e){e===!0&&this.version++}toJSON(e){let t=e===void 0||typeof e=="string";if(!t&&e.images[this.uuid]!==void 0)return e.images[this.uuid];let i={uuid:this.uuid,url:""},r=this.data;if(r!==null){let o;if(Array.isArray(r)){o=[];for(let s=0,a=r.length;s<a;s++)r[s].isDataTexture?o.push(da(r[s].image)):o.push(da(r[s]))}else o=da(r);i.url=o}return t||(e.images[this.uuid]=i),i}};function da(n){return typeof HTMLImageElement<"u"&&n instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&n instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&n instanceof ImageBitmap?is.getDataURL(n):n.data?{data:Array.from(n.data),width:n.width,height:n.height,type:n.data.constructor.name}:(xe("Texture: Unable to serialize Texture."),{})}var hp=0,pa=new P,St=class n extends It{constructor(e=n.DEFAULT_IMAGE,t=n.DEFAULT_MAPPING,i=Jt,r=Jt,o=_t,s=mi,a=Dt,l=vt,c=n.DEFAULT_ANISOTROPY,f=ui){super(),this.isTexture=!0,Object.defineProperty(this,"id",{value:hp++}),this.uuid=_i(),this.name="",this.source=new en(e),this.mipmaps=[],this.mapping=t,this.channel=0,this.wrapS=i,this.wrapT=r,this.magFilter=o,this.minFilter=s,this.anisotropy=c,this.format=a,this.internalFormat=null,this.type=l,this.offset=new _e(0,0),this.repeat=new _e(1,1),this.center=new _e(0,0),this.rotation=0,this.matrixAutoUpdate=!0,this.matrix=new Le,this.generateMipmaps=!0,this.premultiplyAlpha=!1,this.flipY=!0,this.unpackAlignment=4,this.colorSpace=f,this.userData={},this.updateRanges=[],this.version=0,this.onUpdate=null,this.renderTarget=null,this.isRenderTargetTexture=!1,this.isArrayTexture=!!(e&&e.depth&&e.depth>1),this.pmremVersion=0,this.normalized=!1}get width(){return this.source.getSize(pa).x}get height(){return this.source.getSize(pa).y}get depth(){return this.source.getSize(pa).z}get image(){return this.source.data}set image(e){this.source.data=e}updateMatrix(){this.matrix.setUvTransform(this.offset.x,this.offset.y,this.repeat.x,this.repeat.y,this.rotation,this.center.x,this.center.y)}addUpdateRange(e,t){this.updateRanges.push({start:e,count:t})}clearUpdateRanges(){this.updateRanges.length=0}clone(){return new this.constructor().copy(this)}copy(e){return this.name=e.name,this.source=e.source,this.mipmaps=e.mipmaps.slice(0),this.mapping=e.mapping,this.channel=e.channel,this.wrapS=e.wrapS,this.wrapT=e.wrapT,this.magFilter=e.magFilter,this.minFilter=e.minFilter,this.anisotropy=e.anisotropy,this.format=e.format,this.internalFormat=e.internalFormat,this.type=e.type,this.normalized=e.normalized,this.offset.copy(e.offset),this.repeat.copy(e.repeat),this.center.copy(e.center),this.rotation=e.rotation,this.matrixAutoUpdate=e.matrixAutoUpdate,this.matrix.copy(e.matrix),this.generateMipmaps=e.generateMipmaps,this.premultiplyAlpha=e.premultiplyAlpha,this.flipY=e.flipY,this.unpackAlignment=e.unpackAlignment,this.colorSpace=e.colorSpace,this.renderTarget=e.renderTarget,this.isRenderTargetTexture=e.isRenderTargetTexture,this.isArrayTexture=e.isArrayTexture,this.userData=JSON.parse(JSON.stringify(e.userData)),this.needsUpdate=!0,this}setValues(e){for(let t in e){let i=e[t];if(i===void 0){xe(`Texture.setValues(): parameter '${t}' has value of undefined.`);continue}let r=this[t];if(r===void 0){xe(`Texture.setValues(): property '${t}' does not exist.`);continue}r&&i&&r.isVector2&&i.isVector2||r&&i&&r.isVector3&&i.isVector3||r&&i&&r.isMatrix3&&i.isMatrix3?r.copy(i):this[t]=i}}toJSON(e){let t=e===void 0||typeof e=="string";if(!t&&e.textures[this.uuid]!==void 0)return e.textures[this.uuid];let i={metadata:{version:4.7,type:"Texture",generator:"Texture.toJSON"},uuid:this.uuid,name:this.name,image:this.source.toJSON(e).uuid,mapping:this.mapping,channel:this.channel,repeat:[this.repeat.x,this.repeat.y],offset:[this.offset.x,this.offset.y],center:[this.center.x,this.center.y],rotation:this.rotation,wrap:[this.wrapS,this.wrapT],format:this.format,internalFormat:this.internalFormat,type:this.type,normalized:this.normalized,colorSpace:this.colorSpace,minFilter:this.minFilter,magFilter:this.magFilter,anisotropy:this.anisotropy,flipY:this.flipY,generateMipmaps:this.generateMipmaps,premultiplyAlpha:this.premultiplyAlpha,unpackAlignment:this.unpackAlignment};return Object.keys(this.userData).length>0&&(i.userData=this.userData),t||(e.textures[this.uuid]=i),i}dispose(){this.dispatchEvent({type:"dispose"})}transformUv(e){if(this.mapping!==aa)return e;if(e.applyMatrix3(this.matrix),e.x<0||e.x>1)switch(this.wrapS){case Nr:e.x=e.x-Math.floor(e.x);break;case Jt:e.x=e.x<0?0:1;break;case Ur:Math.abs(Math.floor(e.x)%2)===1?e.x=Math.ceil(e.x)-e.x:e.x=e.x-Math.floor(e.x);break}if(e.y<0||e.y>1)switch(this.wrapT){case Nr:e.y=e.y-Math.floor(e.y);break;case Jt:e.y=e.y<0?0:1;break;case Ur:Math.abs(Math.floor(e.y)%2)===1?e.y=Math.ceil(e.y)-e.y:e.y=e.y-Math.floor(e.y);break}return this.flipY&&(e.y=1-e.y),e}set needsUpdate(e){e===!0&&(this.version++,this.source.needsUpdate=!0)}set needsPMREMUpdate(e){e===!0&&this.pmremVersion++}};St.DEFAULT_IMAGE=null;St.DEFAULT_MAPPING=aa;St.DEFAULT_ANISOTROPY=1;var $e=class n{static{n.prototype.isVector4=!0}constructor(e=0,t=0,i=0,r=1){this.x=e,this.y=t,this.z=i,this.w=r}get width(){return this.z}set width(e){this.z=e}get height(){return this.w}set height(e){this.w=e}set(e,t,i,r){return this.x=e,this.y=t,this.z=i,this.w=r,this}setScalar(e){return this.x=e,this.y=e,this.z=e,this.w=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setZ(e){return this.z=e,this}setW(e){return this.w=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;case 2:this.z=t;break;case 3:this.w=t;break;default:throw new Error("THREE.Vector4: index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;case 2:return this.z;case 3:return this.w;default:throw new Error("THREE.Vector4: index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y,this.z,this.w)}copy(e){return this.x=e.x,this.y=e.y,this.z=e.z,this.w=e.w!==void 0?e.w:1,this}add(e){return this.x+=e.x,this.y+=e.y,this.z+=e.z,this.w+=e.w,this}addScalar(e){return this.x+=e,this.y+=e,this.z+=e,this.w+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this.z=e.z+t.z,this.w=e.w+t.w,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this.z+=e.z*t,this.w+=e.w*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this.z-=e.z,this.w-=e.w,this}subScalar(e){return this.x-=e,this.y-=e,this.z-=e,this.w-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this.z=e.z-t.z,this.w=e.w-t.w,this}multiply(e){return this.x*=e.x,this.y*=e.y,this.z*=e.z,this.w*=e.w,this}multiplyScalar(e){return this.x*=e,this.y*=e,this.z*=e,this.w*=e,this}applyMatrix4(e){let t=this.x,i=this.y,r=this.z,o=this.w,s=e.elements;return this.x=s[0]*t+s[4]*i+s[8]*r+s[12]*o,this.y=s[1]*t+s[5]*i+s[9]*r+s[13]*o,this.z=s[2]*t+s[6]*i+s[10]*r+s[14]*o,this.w=s[3]*t+s[7]*i+s[11]*r+s[15]*o,this}divide(e){return this.x/=e.x,this.y/=e.y,this.z/=e.z,this.w/=e.w,this}divideScalar(e){return this.multiplyScalar(1/e)}setAxisAngleFromQuaternion(e){this.w=2*Math.acos(e.w);let t=Math.sqrt(1-e.w*e.w);return t<1e-4?(this.x=1,this.y=0,this.z=0):(this.x=e.x/t,this.y=e.y/t,this.z=e.z/t),this}setAxisAngleFromRotationMatrix(e){let t,i,r,o,l=e.elements,c=l[0],f=l[4],m=l[8],u=l[1],p=l[5],_=l[9],S=l[2],d=l[6],h=l[10];if(Math.abs(f-u)<.01&&Math.abs(m-S)<.01&&Math.abs(_-d)<.01){if(Math.abs(f+u)<.1&&Math.abs(m+S)<.1&&Math.abs(_+d)<.1&&Math.abs(c+p+h-3)<.1)return this.set(1,0,0,0),this;t=Math.PI;let I=(c+1)/2,M=(p+1)/2,y=(h+1)/2,b=(f+u)/4,C=(m+S)/4,x=(_+d)/4;return I>M&&I>y?I<.01?(i=0,r=.707106781,o=.707106781):(i=Math.sqrt(I),r=b/i,o=C/i):M>y?M<.01?(i=.707106781,r=0,o=.707106781):(r=Math.sqrt(M),i=b/r,o=x/r):y<.01?(i=.707106781,r=.707106781,o=0):(o=Math.sqrt(y),i=C/o,r=x/o),this.set(i,r,o,t),this}let A=Math.sqrt((d-_)*(d-_)+(m-S)*(m-S)+(u-f)*(u-f));return Math.abs(A)<.001&&(A=1),this.x=(d-_)/A,this.y=(m-S)/A,this.z=(u-f)/A,this.w=Math.acos((c+p+h-1)/2),this}setFromMatrixPosition(e){let t=e.elements;return this.x=t[12],this.y=t[13],this.z=t[14],this.w=t[15],this}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this.z=Math.min(this.z,e.z),this.w=Math.min(this.w,e.w),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this.z=Math.max(this.z,e.z),this.w=Math.max(this.w,e.w),this}clamp(e,t){return this.x=Ne(this.x,e.x,t.x),this.y=Ne(this.y,e.y,t.y),this.z=Ne(this.z,e.z,t.z),this.w=Ne(this.w,e.w,t.w),this}clampScalar(e,t){return this.x=Ne(this.x,e,t),this.y=Ne(this.y,e,t),this.z=Ne(this.z,e,t),this.w=Ne(this.w,e,t),this}clampLength(e,t){let i=this.length();return this.divideScalar(i||1).multiplyScalar(Ne(i,e,t))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this.w=Math.floor(this.w),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this.w=Math.ceil(this.w),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this.w=Math.round(this.w),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this.w=Math.trunc(this.w),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this.w=-this.w,this}dot(e){return this.x*e.x+this.y*e.y+this.z*e.z+this.w*e.w}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)+Math.abs(this.w)}normalize(){return this.divideScalar(this.length()||1)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this.z+=(e.z-this.z)*t,this.w+=(e.w-this.w)*t,this}lerpVectors(e,t,i){return this.x=e.x+(t.x-e.x)*i,this.y=e.y+(t.y-e.y)*i,this.z=e.z+(t.z-e.z)*i,this.w=e.w+(t.w-e.w)*i,this}equals(e){return e.x===this.x&&e.y===this.y&&e.z===this.z&&e.w===this.w}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this.z=e[t+2],this.w=e[t+3],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e[t+2]=this.z,e[t+3]=this.w,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this.z=e.getZ(t),this.w=e.getW(t),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this.w=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z,yield this.w}};var ns=class extends It{constructor(e=1,t=1,i={}){super(),i=Object.assign({generateMipmaps:!1,internalFormat:null,minFilter:_t,depthBuffer:!0,stencilBuffer:!1,resolveColorBuffer:!0,resolveDepthBuffer:!0,resolveStencilBuffer:!0,storeMultisampledColorBuffer:!0,storeMultisampledDepthBuffer:!0,storeMultisampledStencilBuffer:!0,depthTexture:null,samples:0,count:1,depth:1,multiview:!1,useArrayDepthTexture:!1},i),this.isRenderTarget=!0,this.width=e,this.height=t,this.depth=i.depth,this.scissor=new $e(0,0,e,t),this.scissorTest=!1,this.viewport=new $e(0,0,e,t),this.textures=[];let r={width:e,height:t,depth:i.depth},o=new St(r),s=i.count;for(let a=0;a<s;a++)this.textures[a]=o.clone(),this.textures[a].isRenderTargetTexture=!0,this.textures[a].renderTarget=this;this._setTextureOptions(i),this.depthBuffer=i.depthBuffer,this.stencilBuffer=i.stencilBuffer,this.resolveColorBuffer=i.resolveColorBuffer,this.resolveDepthBuffer=i.resolveDepthBuffer,this.resolveStencilBuffer=i.resolveStencilBuffer,this.storeMultisampledColorBuffer=i.storeMultisampledColorBuffer,this.storeMultisampledDepthBuffer=i.storeMultisampledDepthBuffer,this.storeMultisampledStencilBuffer=i.storeMultisampledStencilBuffer,this._depthTexture=null,this.depthTexture=i.depthTexture,this.samples=i.samples,this.multiview=i.multiview,this.useArrayDepthTexture=i.useArrayDepthTexture}_setTextureOptions(e={}){let t={minFilter:_t,generateMipmaps:!1,flipY:!1,internalFormat:null};e.mapping!==void 0&&(t.mapping=e.mapping),e.wrapS!==void 0&&(t.wrapS=e.wrapS),e.wrapT!==void 0&&(t.wrapT=e.wrapT),e.wrapR!==void 0&&(t.wrapR=e.wrapR),e.magFilter!==void 0&&(t.magFilter=e.magFilter),e.minFilter!==void 0&&(t.minFilter=e.minFilter),e.format!==void 0&&(t.format=e.format),e.type!==void 0&&(t.type=e.type),e.anisotropy!==void 0&&(t.anisotropy=e.anisotropy),e.colorSpace!==void 0&&(t.colorSpace=e.colorSpace),e.flipY!==void 0&&(t.flipY=e.flipY),e.generateMipmaps!==void 0&&(t.generateMipmaps=e.generateMipmaps),e.internalFormat!==void 0&&(t.internalFormat=e.internalFormat);for(let i=0;i<this.textures.length;i++)this.textures[i].setValues(t)}get texture(){return this.textures[0]}set texture(e){this.textures[0]=e}set depthTexture(e){this._depthTexture!==null&&this._depthTexture.renderTarget===this&&(this._depthTexture.renderTarget=null),e!==null&&e.renderTarget===null&&(e.renderTarget=this),this._depthTexture=e}get depthTexture(){return this._depthTexture}setSize(e,t,i=1){if(this.width!==e||this.height!==t||this.depth!==i){this.width=e,this.height=t,this.depth=i;for(let r=0,o=this.textures.length;r<o;r++)this.textures[r].image.width=e,this.textures[r].image.height=t,this.textures[r].image.depth=i,this.textures[r].isData3DTexture!==!0&&(this.textures[r].isArrayTexture=this.textures[r].image.depth>1);this.dispose()}this.viewport.set(0,0,e,t),this.scissor.set(0,0,e,t)}clone(){return new this.constructor().copy(this)}copy(e){this.width=e.width,this.height=e.height,this.depth=e.depth,this.scissor.copy(e.scissor),this.scissorTest=e.scissorTest,this.viewport.copy(e.viewport),this.textures.length=0;for(let t=0,i=e.textures.length;t<i;t++){this.textures[t]=e.textures[t].clone(),this.textures[t].isRenderTargetTexture=!0,this.textures[t].renderTarget=this;let r=Object.assign({},e.textures[t].image);this.textures[t].source=new en(r)}if(this.depthBuffer=e.depthBuffer,this.stencilBuffer=e.stencilBuffer,this.resolveColorBuffer=e.resolveColorBuffer,this.resolveDepthBuffer=e.resolveDepthBuffer,this.resolveStencilBuffer=e.resolveStencilBuffer,this.storeMultisampledColorBuffer=e.storeMultisampledColorBuffer,this.storeMultisampledDepthBuffer=e.storeMultisampledDepthBuffer,this.storeMultisampledStencilBuffer=e.storeMultisampledStencilBuffer,e.depthTexture!==null)if(e.depthTexture.renderTarget===e){let t=e.depthTexture.clone();t.renderTarget=null,this.depthTexture=t}else this.depthTexture=e.depthTexture;return this.samples=e.samples,this.multiview=e.multiview,this.useArrayDepthTexture=e.useArrayDepthTexture,this}dispose(){this.dispatchEvent({type:"dispose"})}};var At=class extends ns{constructor(e=1,t=1,i={}){super(e,t,i),this.isWebGLRenderTarget=!0}};var Qn=class extends St{constructor(e=null,t=1,i=1,r=1){super(null),this.isDataArrayTexture=!0,this.image={data:e,width:t,height:i,depth:r},this.magFilter=pt,this.minFilter=pt,this.wrapR=Jt,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1,this.layerUpdates=new Set}copy(e){return super.copy(e),this.wrapR=e.wrapR,this}addLayerUpdate(e){this.layerUpdates.add(e)}clearLayerUpdates(){this.layerUpdates.clear()}};var rs=class extends St{constructor(e=null,t=1,i=1,r=1){super(null),this.isData3DTexture=!0,this.image={data:e,width:t,height:i,depth:r},this.magFilter=pt,this.minFilter=pt,this.wrapR=Jt,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}copy(e){return super.copy(e),this.wrapR=e.wrapR,this}};var Oe=class n{static{n.prototype.isMatrix4=!0}constructor(e,t,i,r,o,s,a,l,c,f,m,u,p,_,S,d){this.elements=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],e!==void 0&&this.set(e,t,i,r,o,s,a,l,c,f,m,u,p,_,S,d)}set(e,t,i,r,o,s,a,l,c,f,m,u,p,_,S,d){let h=this.elements;return h[0]=e,h[4]=t,h[8]=i,h[12]=r,h[1]=o,h[5]=s,h[9]=a,h[13]=l,h[2]=c,h[6]=f,h[10]=m,h[14]=u,h[3]=p,h[7]=_,h[11]=S,h[15]=d,this}identity(){return this.set(1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1),this}clone(){return new n().fromArray(this.elements)}copy(e){let t=this.elements,i=e.elements;return t[0]=i[0],t[1]=i[1],t[2]=i[2],t[3]=i[3],t[4]=i[4],t[5]=i[5],t[6]=i[6],t[7]=i[7],t[8]=i[8],t[9]=i[9],t[10]=i[10],t[11]=i[11],t[12]=i[12],t[13]=i[13],t[14]=i[14],t[15]=i[15],this}copyPosition(e){let t=this.elements,i=e.elements;return t[12]=i[12],t[13]=i[13],t[14]=i[14],this}setFromMatrix3(e){let t=e.elements;return this.set(t[0],t[3],t[6],0,t[1],t[4],t[7],0,t[2],t[5],t[8],0,0,0,0,1),this}extractBasis(e,t,i){return this.determinantAffine()===0?(e.set(1,0,0),t.set(0,1,0),i.set(0,0,1),this):(e.setFromMatrixColumn(this,0),t.setFromMatrixColumn(this,1),i.setFromMatrixColumn(this,2),this)}makeBasis(e,t,i){return this.set(e.x,t.x,i.x,0,e.y,t.y,i.y,0,e.z,t.z,i.z,0,0,0,0,1),this}extractRotation(e){if(e.determinantAffine()===0)return this.identity();let t=this.elements,i=e.elements,r=1/jn.setFromMatrixColumn(e,0).length(),o=1/jn.setFromMatrixColumn(e,1).length(),s=1/jn.setFromMatrixColumn(e,2).length();return t[0]=i[0]*r,t[1]=i[1]*r,t[2]=i[2]*r,t[3]=0,t[4]=i[4]*o,t[5]=i[5]*o,t[6]=i[6]*o,t[7]=0,t[8]=i[8]*s,t[9]=i[9]*s,t[10]=i[10]*s,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,this}makeRotationFromEuler(e){let t=this.elements,i=e.x,r=e.y,o=e.z,s=Math.cos(i),a=Math.sin(i),l=Math.cos(r),c=Math.sin(r),f=Math.cos(o),m=Math.sin(o);if(e.order==="XYZ"){let u=s*f,p=s*m,_=a*f,S=a*m;t[0]=l*f,t[4]=-l*m,t[8]=c,t[1]=p+_*c,t[5]=u-S*c,t[9]=-a*l,t[2]=S-u*c,t[6]=_+p*c,t[10]=s*l}else if(e.order==="YXZ"){let u=l*f,p=l*m,_=c*f,S=c*m;t[0]=u+S*a,t[4]=_*a-p,t[8]=s*c,t[1]=s*m,t[5]=s*f,t[9]=-a,t[2]=p*a-_,t[6]=S+u*a,t[10]=s*l}else if(e.order==="ZXY"){let u=l*f,p=l*m,_=c*f,S=c*m;t[0]=u-S*a,t[4]=-s*m,t[8]=_+p*a,t[1]=p+_*a,t[5]=s*f,t[9]=S-u*a,t[2]=-s*c,t[6]=a,t[10]=s*l}else if(e.order==="ZYX"){let u=s*f,p=s*m,_=a*f,S=a*m;t[0]=l*f,t[4]=_*c-p,t[8]=u*c+S,t[1]=l*m,t[5]=S*c+u,t[9]=p*c-_,t[2]=-c,t[6]=a*l,t[10]=s*l}else if(e.order==="YZX"){let u=s*l,p=s*c,_=a*l,S=a*c;t[0]=l*f,t[4]=S-u*m,t[8]=_*m+p,t[1]=m,t[5]=s*f,t[9]=-a*f,t[2]=-c*f,t[6]=p*m+_,t[10]=u-S*m}else if(e.order==="XZY"){let u=s*l,p=s*c,_=a*l,S=a*c;t[0]=l*f,t[4]=-m,t[8]=c*f,t[1]=u*m+S,t[5]=s*f,t[9]=p*m-_,t[2]=_*m-p,t[6]=a*f,t[10]=S*m+u}return t[3]=0,t[7]=0,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,this}makeRotationFromQuaternion(e){return this.compose(fp,e,dp)}lookAt(e,t,i){let r=this.elements;return ni.subVectors(e,t),ni.lengthSq()===0&&(ni.z=1),ni.normalize(),tn.crossVectors(i,ni),tn.lengthSq()===0&&(Math.abs(i.z)===1?ni.x+=1e-4:ni.z+=1e-4,ni.normalize(),tn.crossVectors(i,ni)),tn.normalize(),os.crossVectors(ni,tn),r[0]=tn.x,r[4]=os.x,r[8]=ni.x,r[1]=tn.y,r[5]=os.y,r[9]=ni.y,r[2]=tn.z,r[6]=os.z,r[10]=ni.z,this}multiply(e){return this.multiplyMatrices(this,e)}premultiply(e){return this.multiplyMatrices(e,this)}multiplyMatrices(e,t){let i=e.elements,r=t.elements,o=this.elements,s=i[0],a=i[4],l=i[8],c=i[12],f=i[1],m=i[5],u=i[9],p=i[13],_=i[2],S=i[6],d=i[10],h=i[14],A=i[3],I=i[7],M=i[11],y=i[15],b=r[0],C=r[4],x=r[8],E=r[12],D=r[1],U=r[5],G=r[9],k=r[13],L=r[2],H=r[6],K=r[10],$=r[14],oe=r[3],Q=r[7],re=r[11],se=r[15];return o[0]=s*b+a*D+l*L+c*oe,o[4]=s*C+a*U+l*H+c*Q,o[8]=s*x+a*G+l*K+c*re,o[12]=s*E+a*k+l*$+c*se,o[1]=f*b+m*D+u*L+p*oe,o[5]=f*C+m*U+u*H+p*Q,o[9]=f*x+m*G+u*K+p*re,o[13]=f*E+m*k+u*$+p*se,o[2]=_*b+S*D+d*L+h*oe,o[6]=_*C+S*U+d*H+h*Q,o[10]=_*x+S*G+d*K+h*re,o[14]=_*E+S*k+d*$+h*se,o[3]=A*b+I*D+M*L+y*oe,o[7]=A*C+I*U+M*H+y*Q,o[11]=A*x+I*G+M*K+y*re,o[15]=A*E+I*k+M*$+y*se,this}multiplyScalar(e){let t=this.elements;return t[0]*=e,t[4]*=e,t[8]*=e,t[12]*=e,t[1]*=e,t[5]*=e,t[9]*=e,t[13]*=e,t[2]*=e,t[6]*=e,t[10]*=e,t[14]*=e,t[3]*=e,t[7]*=e,t[11]*=e,t[15]*=e,this}determinant(){let e=this.elements,t=e[0],i=e[4],r=e[8],o=e[12],s=e[1],a=e[5],l=e[9],c=e[13],f=e[2],m=e[6],u=e[10],p=e[14],_=e[3],S=e[7],d=e[11],h=e[15],A=l*p-c*u,I=a*p-c*m,M=a*u-l*m,y=s*p-c*f,b=s*u-l*f,C=s*m-a*f;return t*(S*A-d*I+h*M)-i*(_*A-d*y+h*b)+r*(_*I-S*y+h*C)-o*(_*M-S*b+d*C)}determinantAffine(){let e=this.elements,t=e[0],i=e[4],r=e[8],o=e[1],s=e[5],a=e[9],l=e[2],c=e[6],f=e[10];return t*(s*f-a*c)-i*(o*f-a*l)+r*(o*c-s*l)}transpose(){let e=this.elements,t;return t=e[1],e[1]=e[4],e[4]=t,t=e[2],e[2]=e[8],e[8]=t,t=e[6],e[6]=e[9],e[9]=t,t=e[3],e[3]=e[12],e[12]=t,t=e[7],e[7]=e[13],e[13]=t,t=e[11],e[11]=e[14],e[14]=t,this}setPosition(e,t,i){let r=this.elements;return e.isVector3?(r[12]=e.x,r[13]=e.y,r[14]=e.z):(r[12]=e,r[13]=t,r[14]=i),this}invert(){let e=this.elements,t=e[0],i=e[1],r=e[2],o=e[3],s=e[4],a=e[5],l=e[6],c=e[7],f=e[8],m=e[9],u=e[10],p=e[11],_=e[12],S=e[13],d=e[14],h=e[15],A=t*a-i*s,I=t*l-r*s,M=t*c-o*s,y=i*l-r*a,b=i*c-o*a,C=r*c-o*l,x=f*S-m*_,E=f*d-u*_,D=f*h-p*_,U=m*d-u*S,G=m*h-p*S,k=u*h-p*d,L=A*k-I*G+M*U+y*D-b*E+C*x;if(L===0)return this.set(0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0);let H=1/L;return e[0]=(a*k-l*G+c*U)*H,e[1]=(r*G-i*k-o*U)*H,e[2]=(S*C-d*b+h*y)*H,e[3]=(u*b-m*C-p*y)*H,e[4]=(l*D-s*k-c*E)*H,e[5]=(t*k-r*D+o*E)*H,e[6]=(d*M-_*C-h*I)*H,e[7]=(f*C-u*M+p*I)*H,e[8]=(s*G-a*D+c*x)*H,e[9]=(i*D-t*G-o*x)*H,e[10]=(_*b-S*M+h*A)*H,e[11]=(m*M-f*b-p*A)*H,e[12]=(a*E-s*U-l*x)*H,e[13]=(t*U-i*E+r*x)*H,e[14]=(S*I-_*y-d*A)*H,e[15]=(f*y-m*I+u*A)*H,this}scale(e){let t=this.elements,i=e.x,r=e.y,o=e.z;return t[0]*=i,t[4]*=r,t[8]*=o,t[1]*=i,t[5]*=r,t[9]*=o,t[2]*=i,t[6]*=r,t[10]*=o,t[3]*=i,t[7]*=r,t[11]*=o,this}getMaxScaleOnAxis(){let e=this.elements,t=e[0]*e[0]+e[1]*e[1]+e[2]*e[2],i=e[4]*e[4]+e[5]*e[5]+e[6]*e[6],r=e[8]*e[8]+e[9]*e[9]+e[10]*e[10];return Math.sqrt(Math.max(t,i,r))}makeTranslation(e,t,i){return e.isVector3?this.set(1,0,0,e.x,0,1,0,e.y,0,0,1,e.z,0,0,0,1):this.set(1,0,0,e,0,1,0,t,0,0,1,i,0,0,0,1),this}makeRotationX(e){let t=Math.cos(e),i=Math.sin(e);return this.set(1,0,0,0,0,t,-i,0,0,i,t,0,0,0,0,1),this}makeRotationY(e){let t=Math.cos(e),i=Math.sin(e);return this.set(t,0,i,0,0,1,0,0,-i,0,t,0,0,0,0,1),this}makeRotationZ(e){let t=Math.cos(e),i=Math.sin(e);return this.set(t,-i,0,0,i,t,0,0,0,0,1,0,0,0,0,1),this}makeRotationAxis(e,t){let i=Math.cos(t),r=Math.sin(t),o=1-i,s=e.x,a=e.y,l=e.z,c=o*s,f=o*a;return this.set(c*s+i,c*a-r*l,c*l+r*a,0,c*a+r*l,f*a+i,f*l-r*s,0,c*l-r*a,f*l+r*s,o*l*l+i,0,0,0,0,1),this}makeScale(e,t,i){return this.set(e,0,0,0,0,t,0,0,0,0,i,0,0,0,0,1),this}makeShear(e,t,i,r,o,s){return this.set(1,i,o,0,e,1,s,0,t,r,1,0,0,0,0,1),this}compose(e,t,i){let r=this.elements,o=t._x,s=t._y,a=t._z,l=t._w,c=o+o,f=s+s,m=a+a,u=o*c,p=o*f,_=o*m,S=s*f,d=s*m,h=a*m,A=l*c,I=l*f,M=l*m,y=i.x,b=i.y,C=i.z;return r[0]=(1-(S+h))*y,r[1]=(p+M)*y,r[2]=(_-I)*y,r[3]=0,r[4]=(p-M)*b,r[5]=(1-(u+h))*b,r[6]=(d+A)*b,r[7]=0,r[8]=(_+I)*C,r[9]=(d-A)*C,r[10]=(1-(u+S))*C,r[11]=0,r[12]=e.x,r[13]=e.y,r[14]=e.z,r[15]=1,this}decompose(e,t,i){let r=this.elements;e.x=r[12],e.y=r[13],e.z=r[14];let o=this.determinantAffine();if(o===0)return i.set(1,1,1),t.identity(),this;let s=jn.set(r[0],r[1],r[2]).length(),a=jn.set(r[4],r[5],r[6]).length(),l=jn.set(r[8],r[9],r[10]).length();o<0&&(s=-s),vi.copy(this);let c=1/s,f=1/a,m=1/l;return vi.elements[0]*=c,vi.elements[1]*=c,vi.elements[2]*=c,vi.elements[4]*=f,vi.elements[5]*=f,vi.elements[6]*=f,vi.elements[8]*=m,vi.elements[9]*=m,vi.elements[10]*=m,t.setFromRotationMatrix(vi),i.x=s,i.y=a,i.z=l,this}makePerspective(e,t,i,r,o,s,a=Zt,l=!1){let c=this.elements,f=2*o/(t-e),m=2*o/(i-r),u=(t+e)/(t-e),p=(i+r)/(i-r),_,S;if(l)_=o/(s-o),S=s*o/(s-o);else if(a===Zt)_=-(s+o)/(s-o),S=-2*s*o/(s-o);else if(a===Oi)_=-s/(s-o),S=-s*o/(s-o);else throw new Error("THREE.Matrix4.makePerspective(): Invalid coordinate system: "+a);return c[0]=f,c[4]=0,c[8]=u,c[12]=0,c[1]=0,c[5]=m,c[9]=p,c[13]=0,c[2]=0,c[6]=0,c[10]=_,c[14]=S,c[3]=0,c[7]=0,c[11]=-1,c[15]=0,this}makeOrthographic(e,t,i,r,o,s,a=Zt,l=!1){let c=this.elements,f=2/(t-e),m=2/(i-r),u=-(t+e)/(t-e),p=-(i+r)/(i-r),_,S;if(l)_=1/(s-o),S=s/(s-o);else if(a===Zt)_=-2/(s-o),S=-(s+o)/(s-o);else if(a===Oi)_=-1/(s-o),S=-o/(s-o);else throw new Error("THREE.Matrix4.makeOrthographic(): Invalid coordinate system: "+a);return c[0]=f,c[4]=0,c[8]=0,c[12]=u,c[1]=0,c[5]=m,c[9]=0,c[13]=p,c[2]=0,c[6]=0,c[10]=_,c[14]=S,c[3]=0,c[7]=0,c[11]=0,c[15]=1,this}equals(e){let t=this.elements,i=e.elements;for(let r=0;r<16;r++)if(t[r]!==i[r])return!1;return!0}fromArray(e,t=0){for(let i=0;i<16;i++)this.elements[i]=e[i+t];return this}toArray(e=[],t=0){let i=this.elements;return e[t]=i[0],e[t+1]=i[1],e[t+2]=i[2],e[t+3]=i[3],e[t+4]=i[4],e[t+5]=i[5],e[t+6]=i[6],e[t+7]=i[7],e[t+8]=i[8],e[t+9]=i[9],e[t+10]=i[10],e[t+11]=i[11],e[t+12]=i[12],e[t+13]=i[13],e[t+14]=i[14],e[t+15]=i[15],e}},jn=new P,vi=new Oe,fp=new P(0,0,0),dp=new P(1,1,1),tn=new P,os=new P,ni=new P;var tc=new Oe,ic=new kt,hi=class n{constructor(e=0,t=0,i=0,r=n.DEFAULT_ORDER){this.isEuler=!0,this._x=e,this._y=t,this._z=i,this._order=r}get x(){return this._x}set x(e){this._x=e,this._onChangeCallback()}get y(){return this._y}set y(e){this._y=e,this._onChangeCallback()}get z(){return this._z}set z(e){this._z=e,this._onChangeCallback()}get order(){return this._order}set order(e){this._order=e,this._onChangeCallback()}set(e,t,i,r=this._order){return this._x=e,this._y=t,this._z=i,this._order=r,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._order)}copy(e){return this._x=e._x,this._y=e._y,this._z=e._z,this._order=e._order,this._onChangeCallback(),this}setFromRotationMatrix(e,t=this._order,i=!0){let r=e.elements,o=r[0],s=r[4],a=r[8],l=r[1],c=r[5],f=r[9],m=r[2],u=r[6],p=r[10];switch(t){case"XYZ":this._y=Math.asin(Ne(a,-1,1)),Math.abs(a)<.9999999?(this._x=Math.atan2(-f,p),this._z=Math.atan2(-s,o)):(this._x=Math.atan2(u,c),this._z=0);break;case"YXZ":this._x=Math.asin(-Ne(f,-1,1)),Math.abs(f)<.9999999?(this._y=Math.atan2(a,p),this._z=Math.atan2(l,c)):(this._y=Math.atan2(-m,o),this._z=0);break;case"ZXY":this._x=Math.asin(Ne(u,-1,1)),Math.abs(u)<.9999999?(this._y=Math.atan2(-m,p),this._z=Math.atan2(-s,c)):(this._y=0,this._z=Math.atan2(l,o));break;case"ZYX":this._y=Math.asin(-Ne(m,-1,1)),Math.abs(m)<.9999999?(this._x=Math.atan2(u,p),this._z=Math.atan2(l,o)):(this._x=0,this._z=Math.atan2(-s,c));break;case"YZX":this._z=Math.asin(Ne(l,-1,1)),Math.abs(l)<.9999999?(this._x=Math.atan2(-f,c),this._y=Math.atan2(-m,o)):(this._x=0,this._y=Math.atan2(a,p));break;case"XZY":this._z=Math.asin(-Ne(s,-1,1)),Math.abs(s)<.9999999?(this._x=Math.atan2(u,c),this._y=Math.atan2(a,o)):(this._x=Math.atan2(-f,p),this._y=0);break;default:xe("Euler: .setFromRotationMatrix() encountered an unknown order: "+t)}return this._order=t,i===!0&&this._onChangeCallback(),this}setFromQuaternion(e,t,i){return tc.makeRotationFromQuaternion(e),this.setFromRotationMatrix(tc,t,i)}setFromVector3(e,t=this._order){return this.set(e.x,e.y,e.z,t)}reorder(e){return ic.setFromEuler(this),this.setFromQuaternion(ic,e)}equals(e){return e._x===this._x&&e._y===this._y&&e._z===this._z&&e._order===this._order}fromArray(e){return this._x=e[0],this._y=e[1],this._z=e[2],e[3]!==void 0&&(this._order=e[3]),this._onChangeCallback(),this}toArray(e=[],t=0){return e[t]=this._x,e[t+1]=this._y,e[t+2]=this._z,e[t+3]=this._order,e}_onChange(e){return this._onChangeCallback=e,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._order}};hi.DEFAULT_ORDER="XYZ";var nn=class{constructor(){this.mask=1}set(e){this.mask=(1<<e|0)>>>0}enable(e){this.mask|=1<<e|0}enableAll(){this.mask=-1}toggle(e){this.mask^=1<<e|0}disable(e){this.mask&=~(1<<e|0)}disableAll(){this.mask=0}test(e){return(this.mask&e.mask)!==0}isEnabled(e){return(this.mask&(1<<e|0))!==0}};var pp=0,nc=new P,er=new kt,Bi=new Oe,ss=new P,mo=new P,mp=new P,gp=new kt,rc=new P(1,0,0),oc=new P(0,1,0),sc=new P(0,0,1),ac={type:"added"},_p={type:"removed"},tr={type:"childadded",child:null},ma={type:"childremoved",child:null},it=class n extends It{constructor(){super(),this.isObject3D=!0,Object.defineProperty(this,"id",{value:pp++}),this.uuid=_i(),this.name="",this.type="Object3D",this.parent=null,this.children=[],this.up=n.DEFAULT_UP.clone();let e=new P,t=new hi,i=new kt,r=new P(1,1,1);function o(){i.setFromEuler(t,!1)}function s(){t.setFromQuaternion(i,void 0,!1)}t._onChange(o),i._onChange(s),Object.defineProperties(this,{position:{configurable:!0,enumerable:!0,value:e},rotation:{configurable:!0,enumerable:!0,value:t},quaternion:{configurable:!0,enumerable:!0,value:i},scale:{configurable:!0,enumerable:!0,value:r},modelViewMatrix:{value:new Oe},normalMatrix:{value:new Le}}),this.matrix=new Oe,this.matrixWorld=new Oe,this.matrixAutoUpdate=n.DEFAULT_MATRIX_AUTO_UPDATE,this.matrixWorldAutoUpdate=n.DEFAULT_MATRIX_WORLD_AUTO_UPDATE,this.matrixWorldNeedsUpdate=!1,this.layers=new nn,this.visible=!0,this.castShadow=!1,this.receiveShadow=!1,this.frustumCulled=!0,this.renderOrder=0,this.animations=[],this.customDepthMaterial=void 0,this.customDistanceMaterial=void 0,this.static=!1,this.userData={},this.pivot=null}onBeforeShadow(){}onAfterShadow(){}onBeforeRender(){}onAfterRender(){}applyMatrix4(e){this.matrixAutoUpdate&&this.updateMatrix(),this.matrix.premultiply(e),this.matrix.decompose(this.position,this.quaternion,this.scale)}applyQuaternion(e){return this.quaternion.premultiply(e),this}setRotationFromAxisAngle(e,t){this.quaternion.setFromAxisAngle(e,t)}setRotationFromEuler(e){this.quaternion.setFromEuler(e,!0)}setRotationFromMatrix(e){this.quaternion.setFromRotationMatrix(e)}setRotationFromQuaternion(e){this.quaternion.copy(e)}rotateOnAxis(e,t){return er.setFromAxisAngle(e,t),this.quaternion.multiply(er),this}rotateOnWorldAxis(e,t){return er.setFromAxisAngle(e,t),this.quaternion.premultiply(er),this}rotateX(e){return this.rotateOnAxis(rc,e)}rotateY(e){return this.rotateOnAxis(oc,e)}rotateZ(e){return this.rotateOnAxis(sc,e)}translateOnAxis(e,t){return nc.copy(e).applyQuaternion(this.quaternion),this.position.add(nc.multiplyScalar(t)),this}translateX(e){return this.translateOnAxis(rc,e)}translateY(e){return this.translateOnAxis(oc,e)}translateZ(e){return this.translateOnAxis(sc,e)}localToWorld(e){return this.updateWorldMatrix(!0,!1),e.applyMatrix4(this.matrixWorld)}worldToLocal(e){return this.updateWorldMatrix(!0,!1),e.applyMatrix4(Bi.copy(this.matrixWorld).invert())}lookAt(e,t,i){e.isVector3?ss.copy(e):ss.set(e,t,i);let r=this.parent;this.updateWorldMatrix(!0,!1),mo.setFromMatrixPosition(this.matrixWorld),this.isCamera||this.isLight?Bi.lookAt(mo,ss,this.up):Bi.lookAt(ss,mo,this.up),this.quaternion.setFromRotationMatrix(Bi),r&&(Bi.extractRotation(r.matrixWorld),er.setFromRotationMatrix(Bi),this.quaternion.premultiply(er.invert()))}add(e){if(arguments.length>1){for(let t=0;t<arguments.length;t++)this.add(arguments[t]);return this}return e===this?(Fe("Object3D.add: object can't be added as a child of itself.",e),this):(e&&e.isObject3D?(e.removeFromParent(),e.parent=this,this.children.push(e),e.dispatchEvent(ac),tr.child=e,this.dispatchEvent(tr),tr.child=null):Fe("Object3D.add: object not an instance of THREE.Object3D.",e),this)}remove(e){if(arguments.length>1){for(let i=0;i<arguments.length;i++)this.remove(arguments[i]);return this}let t=this.children.indexOf(e);return t!==-1&&(e.parent=null,this.children.splice(t,1),e.dispatchEvent(_p),ma.child=e,this.dispatchEvent(ma),ma.child=null),this}removeFromParent(){let e=this.parent;return e!==null&&e.remove(this),this}clear(){return this.remove(...this.children)}attach(e){return this.updateWorldMatrix(!0,!1),Bi.copy(this.matrixWorld).invert(),e.parent!==null&&(e.parent.updateWorldMatrix(!0,!1),Bi.multiply(e.parent.matrixWorld)),e.applyMatrix4(Bi),e.removeFromParent(),e.parent=this,this.children.push(e),e.updateWorldMatrix(!1,!0),e.dispatchEvent(ac),tr.child=e,this.dispatchEvent(tr),tr.child=null,this}getObjectById(e){return this.getObjectByProperty("id",e)}getObjectByName(e){return this.getObjectByProperty("name",e)}getObjectByProperty(e,t){if(this[e]===t)return this;for(let i=0,r=this.children.length;i<r;i++){let s=this.children[i].getObjectByProperty(e,t);if(s!==void 0)return s}}getObjectsByProperty(e,t,i=[]){this[e]===t&&i.push(this);let r=this.children;for(let o=0,s=r.length;o<s;o++)r[o].getObjectsByProperty(e,t,i);return i}getWorldPosition(e){return this.updateWorldMatrix(!0,!1),e.setFromMatrixPosition(this.matrixWorld)}getWorldQuaternion(e){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(mo,e,mp),e}getWorldScale(e){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(mo,gp,e),e}getWorldDirection(e){this.updateWorldMatrix(!0,!1);let t=this.matrixWorld.elements;return e.set(t[8],t[9],t[10]).normalize()}raycast(){}intersectsFrustum(){}traverse(e){e(this);let t=this.children;for(let i=0,r=t.length;i<r;i++)t[i].traverse(e)}traverseVisible(e){if(this.visible===!1)return;e(this);let t=this.children;for(let i=0,r=t.length;i<r;i++)t[i].traverseVisible(e)}traverseAncestors(e){let t=this.parent;t!==null&&(e(t),t.traverseAncestors(e))}updateMatrix(){this.matrix.compose(this.position,this.quaternion,this.scale);let e=this.pivot;if(e!==null){let t=e.x,i=e.y,r=e.z,o=this.matrix.elements;o[12]+=t-o[0]*t-o[4]*i-o[8]*r,o[13]+=i-o[1]*t-o[5]*i-o[9]*r,o[14]+=r-o[2]*t-o[6]*i-o[10]*r}this.matrixWorldNeedsUpdate=!0}updateMatrixWorld(e){this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||e)&&(this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),this.matrixWorldNeedsUpdate=!1,e=!0);let t=this.children;for(let i=0,r=t.length;i<r;i++)t[i].updateMatrixWorld(e)}updateWorldMatrix(e,t,i=!1){let r=this.parent;if(e===!0&&r!==null&&r.updateWorldMatrix(!0,!1),this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||i)&&(this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),this.matrixWorldNeedsUpdate=!1,i=!0),t===!0){let o=this.children;for(let s=0,a=o.length;s<a;s++)o[s].updateWorldMatrix(!1,!0,i)}}toJSON(e){let t=e===void 0||typeof e=="string",i={};t&&(e={geometries:{},materials:{},textures:{},images:{},shapes:{},skeletons:{},animations:{},nodes:{}},i.metadata={version:4.7,type:"Object",generator:"Object3D.toJSON"});let r={};r.uuid=this.uuid,r.type=this.type,r.name=this.name,r.castShadow=this.castShadow,r.receiveShadow=this.receiveShadow,r.visible=this.visible,r.frustumCulled=this.frustumCulled,r.renderOrder=this.renderOrder,r.static=this.static,r.matrixAutoUpdate=this.matrixAutoUpdate,Object.keys(this.userData).length>0&&(r.userData=this.userData),r.layers=this.layers.mask,r.matrix=this.matrix.toArray(),r.up=this.up.toArray(),this.pivot!==null&&(r.pivot=this.pivot.toArray()),this.morphTargetDictionary!==void 0&&(r.morphTargetDictionary=Object.assign({},this.morphTargetDictionary)),this.morphTargetInfluences!==void 0&&(r.morphTargetInfluences=this.morphTargetInfluences.slice()),this.isInstancedMesh&&(r.type="InstancedMesh",r.count=this.count,r.instanceMatrix=this.instanceMatrix.toJSON(),this.instanceColor!==null&&(r.instanceColor=this.instanceColor.toJSON())),this.isBatchedMesh&&(r.type="BatchedMesh",r.perObjectFrustumCulled=this.perObjectFrustumCulled,r.sortObjects=this.sortObjects,r.drawRanges=this._drawRanges,r.reservedRanges=this._reservedRanges,r.geometryInfo=this._geometryInfo.map(a=>({...a,boundingBox:a.boundingBox?a.boundingBox.toJSON():void 0,boundingSphere:a.boundingSphere?a.boundingSphere.toJSON():void 0})),r.instanceInfo=this._instanceInfo.map(a=>({...a})),r.availableInstanceIds=this._availableInstanceIds.slice(),r.availableGeometryIds=this._availableGeometryIds.slice(),r.nextIndexStart=this._nextIndexStart,r.nextVertexStart=this._nextVertexStart,r.geometryCount=this._geometryCount,r.maxInstanceCount=this._maxInstanceCount,r.maxVertexCount=this._maxVertexCount,r.maxIndexCount=this._maxIndexCount,r.geometryInitialized=this._geometryInitialized,r.matricesTexture=this._matricesTexture.toJSON(e),r.indirectTexture=this._indirectTexture.toJSON(e),this._colorsTexture!==null&&(r.colorsTexture=this._colorsTexture.toJSON(e)),this.boundingSphere!==null&&(r.boundingSphere=this.boundingSphere.toJSON()),this.boundingBox!==null&&(r.boundingBox=this.boundingBox.toJSON()));function o(a,l){return a[l.uuid]===void 0&&(a[l.uuid]=l.toJSON(e)),l.uuid}if(this.isScene)this.background&&(this.background.isColor?r.background=this.background.toJSON():this.background.isTexture&&(r.background=this.background.toJSON(e).uuid)),this.environment&&this.environment.isTexture&&this.environment.isRenderTargetTexture!==!0&&(r.environment=this.environment.toJSON(e).uuid);else if(this.isMesh||this.isLine||this.isPoints){r.geometry=o(e.geometries,this.geometry);let a=this.geometry.parameters;if(a!==void 0&&a.shapes!==void 0){let l=a.shapes;if(Array.isArray(l))for(let c=0,f=l.length;c<f;c++){let m=l[c];o(e.shapes,m)}else o(e.shapes,l)}}if(this.isSkinnedMesh&&(r.bindMode=this.bindMode,r.bindMatrix=this.bindMatrix.toArray(),this.skeleton!==void 0&&(o(e.skeletons,this.skeleton),r.skeleton=this.skeleton.uuid)),this.material!==void 0)if(Array.isArray(this.material)){let a=[];for(let l=0,c=this.material.length;l<c;l++)a.push(o(e.materials,this.material[l]));r.material=a}else r.material=o(e.materials,this.material);if(this.children.length>0){r.children=[];for(let a=0;a<this.children.length;a++)r.children.push(this.children[a].toJSON(e).object)}if(this.animations.length>0){r.animations=[];for(let a=0;a<this.animations.length;a++){let l=this.animations[a];r.animations.push(o(e.animations,l))}}if(t){let a=s(e.geometries),l=s(e.materials),c=s(e.textures),f=s(e.images),m=s(e.shapes),u=s(e.skeletons),p=s(e.animations),_=s(e.nodes);a.length>0&&(i.geometries=a),l.length>0&&(i.materials=l),c.length>0&&(i.textures=c),f.length>0&&(i.images=f),m.length>0&&(i.shapes=m),u.length>0&&(i.skeletons=u),p.length>0&&(i.animations=p),_.length>0&&(i.nodes=_)}return i.object=r,i;function s(a){let l=[];for(let c in a){let f=a[c];delete f.metadata,l.push(f)}return l}}clone(e){return new this.constructor().copy(this,e)}copy(e,t=!0){if(this.name=e.name,this.up.copy(e.up),this.position.copy(e.position),this.rotation.order=e.rotation.order,this.quaternion.copy(e.quaternion),this.scale.copy(e.scale),this.pivot=e.pivot!==null?e.pivot.clone():null,this.matrix.copy(e.matrix),this.matrixWorld.copy(e.matrixWorld),this.matrixAutoUpdate=e.matrixAutoUpdate,this.matrixWorldAutoUpdate=e.matrixWorldAutoUpdate,this.matrixWorldNeedsUpdate=e.matrixWorldNeedsUpdate,this.layers.mask=e.layers.mask,this.visible=e.visible,this.castShadow=e.castShadow,this.receiveShadow=e.receiveShadow,this.frustumCulled=e.frustumCulled,this.renderOrder=e.renderOrder,this.static=e.static,this.animations=e.animations.slice(),this.userData=JSON.parse(JSON.stringify(e.userData)),t===!0)for(let i=0;i<e.children.length;i++){let r=e.children[i];this.add(r.clone())}return this}dispose(){this.dispatchEvent({type:"dispose"})}};it.DEFAULT_UP=new P(0,1,0);it.DEFAULT_MATRIX_AUTO_UPDATE=!0;it.DEFAULT_MATRIX_WORLD_AUTO_UPDATE=!0;var ri=class extends it{constructor(){super(),this.isGroup=!0,this.type="Group"}};var xp={type:"move"},ir=class{constructor(){this._targetRay=null,this._grip=null,this._hand=null}getHandSpace(){return this._hand===null&&(this._hand=new ri,this._hand.matrixAutoUpdate=!1,this._hand.visible=!1,this._hand.joints={},this._hand.inputState={pinching:!1}),this._hand}getTargetRaySpace(){return this._targetRay===null&&(this._targetRay=new ri,this._targetRay.matrixAutoUpdate=!1,this._targetRay.visible=!1,this._targetRay.hasLinearVelocity=!1,this._targetRay.linearVelocity=new P,this._targetRay.hasAngularVelocity=!1,this._targetRay.angularVelocity=new P),this._targetRay}getGripSpace(){return this._grip===null&&(this._grip=new ri,this._grip.matrixAutoUpdate=!1,this._grip.visible=!1,this._grip.hasLinearVelocity=!1,this._grip.linearVelocity=new P,this._grip.hasAngularVelocity=!1,this._grip.angularVelocity=new P,this._grip.eventsEnabled=!1),this._grip}dispatchEvent(e){return this._targetRay!==null&&this._targetRay.dispatchEvent(e),this._grip!==null&&this._grip.dispatchEvent(e),this._hand!==null&&this._hand.dispatchEvent(e),this}connect(e){if(e&&e.hand){let t=this._hand;if(t)for(let i of e.hand.values())this._getHandJoint(t,i)}return this.dispatchEvent({type:"connected",data:e}),this}disconnect(e){return this.dispatchEvent({type:"disconnected",data:e}),this._targetRay!==null&&(this._targetRay.visible=!1),this._grip!==null&&(this._grip.visible=!1),this._hand!==null&&(this._hand.visible=!1),this}update(e,t,i){let r=null,o=null,s=null,a=this._targetRay,l=this._grip,c=this._hand;if(e&&t.session.visibilityState!=="visible-blurred"){if(c&&e.hand){s=!0;for(let S of e.hand.values()){let d=t.getJointPose(S,i),h=this._getHandJoint(c,S);d!==null&&(h.matrix.fromArray(d.transform.matrix),h.matrix.decompose(h.position,h.rotation,h.scale),h.matrixWorldNeedsUpdate=!0,h.jointRadius=d.radius),h.visible=d!==null}let f=c.joints["index-finger-tip"],m=c.joints["thumb-tip"],u=f.position.distanceTo(m.position),p=.02,_=.005;c.inputState.pinching&&u>p+_?(c.inputState.pinching=!1,this.dispatchEvent({type:"pinchend",handedness:e.handedness,target:this})):!c.inputState.pinching&&u<=p-_&&(c.inputState.pinching=!0,this.dispatchEvent({type:"pinchstart",handedness:e.handedness,target:this}))}else l!==null&&e.gripSpace&&(o=t.getPose(e.gripSpace,i),o!==null&&(l.matrix.fromArray(o.transform.matrix),l.matrix.decompose(l.position,l.rotation,l.scale),l.matrixWorldNeedsUpdate=!0,o.linearVelocity?(l.hasLinearVelocity=!0,l.linearVelocity.copy(o.linearVelocity)):l.hasLinearVelocity=!1,o.angularVelocity?(l.hasAngularVelocity=!0,l.angularVelocity.copy(o.angularVelocity)):l.hasAngularVelocity=!1,l.eventsEnabled&&l.dispatchEvent({type:"gripUpdated",data:e,target:this})));a!==null&&(r=t.getPose(e.targetRaySpace,i),r===null&&o!==null&&(r=o),r!==null&&(a.matrix.fromArray(r.transform.matrix),a.matrix.decompose(a.position,a.rotation,a.scale),a.matrixWorldNeedsUpdate=!0,r.linearVelocity?(a.hasLinearVelocity=!0,a.linearVelocity.copy(r.linearVelocity)):a.hasLinearVelocity=!1,r.angularVelocity?(a.hasAngularVelocity=!0,a.angularVelocity.copy(r.angularVelocity)):a.hasAngularVelocity=!1,this.dispatchEvent(xp)))}return a!==null&&(a.visible=r!==null),l!==null&&(l.visible=o!==null),c!==null&&(c.visible=s!==null),this}_getHandJoint(e,t){if(e.joints[t.jointName]===void 0){let i=new ri;i.matrixAutoUpdate=!1,i.visible=!1,e.joints[t.jointName]=i,e.add(i)}return e.joints[t.jointName]}};var lc={aliceblue:15792383,antiquewhite:16444375,aqua:65535,aquamarine:8388564,azure:15794175,beige:16119260,bisque:16770244,black:0,blanchedalmond:16772045,blue:255,blueviolet:9055202,brown:10824234,burlywood:14596231,cadetblue:6266528,chartreuse:8388352,chocolate:13789470,coral:16744272,cornflowerblue:6591981,cornsilk:16775388,crimson:14423100,cyan:65535,darkblue:139,darkcyan:35723,darkgoldenrod:12092939,darkgray:11119017,darkgreen:25600,darkgrey:11119017,darkkhaki:12433259,darkmagenta:9109643,darkolivegreen:5597999,darkorange:16747520,darkorchid:10040012,darkred:9109504,darksalmon:15308410,darkseagreen:9419919,darkslateblue:4734347,darkslategray:3100495,darkslategrey:3100495,darkturquoise:52945,darkviolet:9699539,deeppink:16716947,deepskyblue:49151,dimgray:6908265,dimgrey:6908265,dodgerblue:2003199,firebrick:11674146,floralwhite:16775920,forestgreen:2263842,fuchsia:16711935,gainsboro:14474460,ghostwhite:16316671,gold:16766720,goldenrod:14329120,gray:8421504,green:32768,greenyellow:11403055,grey:8421504,honeydew:15794160,hotpink:16738740,indianred:13458524,indigo:4915330,ivory:16777200,khaki:15787660,lavender:15132410,lavenderblush:16773365,lawngreen:8190976,lemonchiffon:16775885,lightblue:11393254,lightcoral:15761536,lightcyan:14745599,lightgoldenrodyellow:16448210,lightgray:13882323,lightgreen:9498256,lightgrey:13882323,lightpink:16758465,lightsalmon:16752762,lightseagreen:2142890,lightskyblue:8900346,lightslategray:7833753,lightslategrey:7833753,lightsteelblue:11584734,lightyellow:16777184,lime:65280,limegreen:3329330,linen:16445670,magenta:16711935,maroon:8388608,mediumaquamarine:6737322,mediumblue:205,mediumorchid:12211667,mediumpurple:9662683,mediumseagreen:3978097,mediumslateblue:8087790,mediumspringgreen:64154,mediumturquoise:4772300,mediumvioletred:13047173,midnightblue:1644912,mintcream:16121850,mistyrose:16770273,moccasin:16770229,navajowhite:16768685,navy:128,oldlace:16643558,olive:8421376,olivedrab:7048739,orange:16753920,orangered:16729344,orchid:14315734,palegoldenrod:15657130,palegreen:10025880,paleturquoise:11529966,palevioletred:14381203,papayawhip:16773077,peachpuff:16767673,peru:13468991,pink:16761035,plum:14524637,powderblue:11591910,purple:8388736,rebeccapurple:6697881,red:16711680,rosybrown:12357519,royalblue:4286945,saddlebrown:9127187,salmon:16416882,sandybrown:16032864,seagreen:3050327,seashell:16774638,sienna:10506797,silver:12632256,skyblue:8900331,slateblue:6970061,slategray:7372944,slategrey:7372944,snow:16775930,springgreen:65407,steelblue:4620980,tan:13808780,teal:32896,thistle:14204888,tomato:16737095,turquoise:4251856,violet:15631086,wheat:16113331,white:16777215,whitesmoke:16119285,yellow:16776960,yellowgreen:10145074},rn={h:0,s:0,l:0},as={h:0,s:0,l:0};function ga(n,e,t){return t<0&&(t+=1),t>1&&(t-=1),t<1/6?n+(e-n)*6*t:t<1/2?e:t<2/3?n+(e-n)*6*(2/3-t):n}var be=class{constructor(e,t,i){return this.isColor=!0,this.r=1,this.g=1,this.b=1,this.set(e,t,i)}set(e,t,i){if(t===void 0&&i===void 0){let r=e;r&&r.isColor?this.copy(r):typeof r=="number"?this.setHex(r):typeof r=="string"&&this.setStyle(r)}else this.setRGB(e,t,i);return this}setScalar(e){return this.r=e,this.g=e,this.b=e,this}setHex(e,t=Kt){return e=Math.floor(e),this.r=(e>>16&255)/255,this.g=(e>>8&255)/255,this.b=(e&255)/255,Ue.colorSpaceToWorking(this,t),this}setRGB(e,t,i,r=Ue.workingColorSpace){return this.r=e,this.g=t,this.b=i,Ue.colorSpaceToWorking(this,r),this}setHSL(e,t,i,r=Ue.workingColorSpace){if(e=ts(e,1),t=Ne(t,0,1),i=Ne(i,0,1),t===0)this.r=this.g=this.b=i;else{let o=i<=.5?i*(1+t):i+t-i*t,s=2*i-o;this.r=ga(s,o,e+1/3),this.g=ga(s,o,e),this.b=ga(s,o,e-1/3)}return Ue.colorSpaceToWorking(this,r),this}setStyle(e,t=Kt){function i(o){o!==void 0&&parseFloat(o)<1&&xe("Color: Alpha component of "+e+" will be ignored.")}let r;if(r=/^(\w+)\(([^\)]*)\)/.exec(e)){let o,s=r[1],a=r[2];switch(s){case"rgb":case"rgba":if(o=/^\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(a))return i(o[4]),this.setRGB(Math.min(255,parseInt(o[1],10))/255,Math.min(255,parseInt(o[2],10))/255,Math.min(255,parseInt(o[3],10))/255,t);if(o=/^\s*(\d+)\%\s*,\s*(\d+)\%\s*,\s*(\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(a))return i(o[4]),this.setRGB(Math.min(100,parseInt(o[1],10))/100,Math.min(100,parseInt(o[2],10))/100,Math.min(100,parseInt(o[3],10))/100,t);break;case"hsl":case"hsla":if(o=/^\s*(\d*\.?\d+)\s*,\s*(\d*\.?\d+)\%\s*,\s*(\d*\.?\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(a))return i(o[4]),this.setHSL(parseFloat(o[1])/360,parseFloat(o[2])/100,parseFloat(o[3])/100,t);break;default:xe("Color: Unknown color model "+e)}}else if(r=/^\#([A-Fa-f\d]+)$/.exec(e)){let o=r[1],s=o.length;if(s===3)return this.setRGB(parseInt(o.charAt(0),16)/15,parseInt(o.charAt(1),16)/15,parseInt(o.charAt(2),16)/15,t);if(s===6)return this.setHex(parseInt(o,16),t);xe("Color: Invalid hex color "+e)}else if(e&&e.length>0)return this.setColorName(e,t);return this}setColorName(e,t=Kt){let i=lc[e.toLowerCase()];return i!==void 0?this.setHex(i,t):xe("Color: Unknown color "+e),this}clone(){return new this.constructor(this.r,this.g,this.b)}copy(e){return this.r=e.r,this.g=e.g,this.b=e.b,this}copySRGBToLinear(e){return this.r=xi(e.r),this.g=xi(e.g),this.b=xi(e.b),this}copyLinearToSRGB(e){return this.r=yn(e.r),this.g=yn(e.g),this.b=yn(e.b),this}convertSRGBToLinear(){return this.copySRGBToLinear(this),this}convertLinearToSRGB(){return this.copyLinearToSRGB(this),this}getHex(e=Kt){return Ue.workingToColorSpace(Ht.copy(this),e),Math.round(Ne(Ht.r*255,0,255))*65536+Math.round(Ne(Ht.g*255,0,255))*256+Math.round(Ne(Ht.b*255,0,255))}getHexString(e=Kt){return("000000"+this.getHex(e).toString(16)).slice(-6)}getHSL(e,t=Ue.workingColorSpace){Ue.workingToColorSpace(Ht.copy(this),t);let i=Ht.r,r=Ht.g,o=Ht.b,s=Math.max(i,r,o),a=Math.min(i,r,o),l,c,f=(a+s)/2;if(a===s)l=0,c=0;else{let m=s-a;switch(c=f<=.5?m/(s+a):m/(2-s-a),s){case i:l=(r-o)/m+(r<o?6:0);break;case r:l=(o-i)/m+2;break;case o:l=(i-r)/m+4;break}l/=6}return e.h=l,e.s=c,e.l=f,e}getRGB(e,t=Ue.workingColorSpace){return Ue.workingToColorSpace(Ht.copy(this),t),e.r=Ht.r,e.g=Ht.g,e.b=Ht.b,e}getStyle(e=Kt){Ue.workingToColorSpace(Ht.copy(this),e);let t=Ht.r,i=Ht.g,r=Ht.b;return e!==Kt?`color(${e} ${t.toFixed(3)} ${i.toFixed(3)} ${r.toFixed(3)})`:`rgb(${Math.round(t*255)},${Math.round(i*255)},${Math.round(r*255)})`}offsetHSL(e,t,i){return this.getHSL(rn),this.setHSL(rn.h+e,rn.s+t,rn.l+i)}add(e){return this.r+=e.r,this.g+=e.g,this.b+=e.b,this}addColors(e,t){return this.r=e.r+t.r,this.g=e.g+t.g,this.b=e.b+t.b,this}addScalar(e){return this.r+=e,this.g+=e,this.b+=e,this}sub(e){return this.r=Math.max(0,this.r-e.r),this.g=Math.max(0,this.g-e.g),this.b=Math.max(0,this.b-e.b),this}multiply(e){return this.r*=e.r,this.g*=e.g,this.b*=e.b,this}multiplyScalar(e){return this.r*=e,this.g*=e,this.b*=e,this}lerp(e,t){return this.r+=(e.r-this.r)*t,this.g+=(e.g-this.g)*t,this.b+=(e.b-this.b)*t,this}lerpColors(e,t,i){return this.r=e.r+(t.r-e.r)*i,this.g=e.g+(t.g-e.g)*i,this.b=e.b+(t.b-e.b)*i,this}lerpHSL(e,t){this.getHSL(rn),e.getHSL(as);let i=Jn(rn.h,as.h,t),r=Jn(rn.s,as.s,t),o=Jn(rn.l,as.l,t);return this.setHSL(i,r,o),this}setFromVector3(e){return this.r=e.x,this.g=e.y,this.b=e.z,this}applyMatrix3(e){let t=this.r,i=this.g,r=this.b,o=e.elements;return this.r=o[0]*t+o[3]*i+o[6]*r,this.g=o[1]*t+o[4]*i+o[7]*r,this.b=o[2]*t+o[5]*i+o[8]*r,this}equals(e){return e.r===this.r&&e.g===this.g&&e.b===this.b}fromArray(e,t=0){return this.r=e[t],this.g=e[t+1],this.b=e[t+2],this}toArray(e=[],t=0){return e[t]=this.r,e[t+1]=this.g,e[t+2]=this.b,e}fromBufferAttribute(e,t){return this.r=e.getX(t),this.g=e.getY(t),this.b=e.getZ(t),this}toJSON(){return this.getHex()}*[Symbol.iterator](){yield this.r,yield this.g,yield this.b}},Ht=new be;be.NAMES=lc;var go=class extends it{constructor(){super(),this.isScene=!0,this.type="Scene",this.background=null,this.environment=null,this.fog=null,this.backgroundBlurriness=0,this.backgroundIntensity=1,this.backgroundRotation=new hi,this.environmentIntensity=1,this.environmentRotation=new hi,this.overrideMaterial=null,typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}copy(e,t){return super.copy(e,t),e.background!==null&&(this.background=e.background.clone()),e.environment!==null&&(this.environment=e.environment.clone()),e.fog!==null&&(this.fog=e.fog.clone()),this.backgroundBlurriness=e.backgroundBlurriness,this.backgroundIntensity=e.backgroundIntensity,this.backgroundRotation.copy(e.backgroundRotation),this.environmentIntensity=e.environmentIntensity,this.environmentRotation.copy(e.environmentRotation),e.overrideMaterial!==null&&(this.overrideMaterial=e.overrideMaterial.clone()),this.matrixAutoUpdate=e.matrixAutoUpdate,this}toJSON(e){let t=super.toJSON(e);return this.fog!==null&&(t.object.fog=this.fog.toJSON()),t.object.backgroundBlurriness=this.backgroundBlurriness,t.object.backgroundIntensity=this.backgroundIntensity,t.object.backgroundRotation=this.backgroundRotation.toArray(),t.object.environmentIntensity=this.environmentIntensity,t.object.environmentRotation=this.environmentRotation.toArray(),t}};var Si=new P,Gi=new P,_a=new P,zi=new P,nr=new P,rr=new P,cc=new P,xa=new P,va=new P,Sa=new P,Ma=new $e,ya=new $e,ba=new $e,Ci=class n{constructor(e=new P,t=new P,i=new P){this.a=e,this.b=t,this.c=i}static getNormal(e,t,i,r){r.subVectors(i,t),Si.subVectors(e,t),r.cross(Si);let o=r.lengthSq();return o>0?r.multiplyScalar(1/Math.sqrt(o)):r.set(0,0,0)}static getBarycoord(e,t,i,r,o){Si.subVectors(r,t),Gi.subVectors(i,t),_a.subVectors(e,t);let s=Si.dot(Si),a=Si.dot(Gi),l=Si.dot(_a),c=Gi.dot(Gi),f=Gi.dot(_a),m=s*c-a*a;if(m===0)return o.set(0,0,0),null;let u=1/m,p=(c*l-a*f)*u,_=(s*f-a*l)*u;return o.set(1-p-_,_,p)}static containsPoint(e,t,i,r){return this.getBarycoord(e,t,i,r,zi)===null?!1:zi.x>=0&&zi.y>=0&&zi.x+zi.y<=1}static getInterpolation(e,t,i,r,o,s,a,l){return this.getBarycoord(e,t,i,r,zi)===null?(l.x=0,l.y=0,"z"in l&&(l.z=0),"w"in l&&(l.w=0),null):(l.setScalar(0),l.addScaledVector(o,zi.x),l.addScaledVector(s,zi.y),l.addScaledVector(a,zi.z),l)}static getInterpolatedAttribute(e,t,i,r,o,s){return Ma.setScalar(0),ya.setScalar(0),ba.setScalar(0),Ma.fromBufferAttribute(e,t),ya.fromBufferAttribute(e,i),ba.fromBufferAttribute(e,r),s.setScalar(0),s.addScaledVector(Ma,o.x),s.addScaledVector(ya,o.y),s.addScaledVector(ba,o.z),s}static isFrontFacing(e,t,i,r){return Si.subVectors(i,t),Gi.subVectors(e,t),Si.cross(Gi).dot(r)<0}set(e,t,i){return this.a.copy(e),this.b.copy(t),this.c.copy(i),this}setFromPointsAndIndices(e,t,i,r){return this.a.copy(e[t]),this.b.copy(e[i]),this.c.copy(e[r]),this}setFromAttributeAndIndices(e,t,i,r){return this.a.fromBufferAttribute(e,t),this.b.fromBufferAttribute(e,i),this.c.fromBufferAttribute(e,r),this}clone(){return new this.constructor().copy(this)}copy(e){return this.a.copy(e.a),this.b.copy(e.b),this.c.copy(e.c),this}getArea(){return Si.subVectors(this.c,this.b),Gi.subVectors(this.a,this.b),Si.cross(Gi).length()*.5}getMidpoint(e){return e.addVectors(this.a,this.b).add(this.c).multiplyScalar(1/3)}getNormal(e){return n.getNormal(this.a,this.b,this.c,e)}getPlane(e){return e.setFromCoplanarPoints(this.a,this.b,this.c)}getBarycoord(e,t){return n.getBarycoord(e,this.a,this.b,this.c,t)}getInterpolation(e,t,i,r,o){return n.getInterpolation(e,this.a,this.b,this.c,t,i,r,o)}containsPoint(e){return n.containsPoint(e,this.a,this.b,this.c)}isFrontFacing(e){return n.isFrontFacing(this.a,this.b,this.c,e)}intersectsBox(e){return e.intersectsTriangle(this)}closestPointToPoint(e,t){let i=this.a,r=this.b,o=this.c,s,a;nr.subVectors(r,i),rr.subVectors(o,i),xa.subVectors(e,i);let l=nr.dot(xa),c=rr.dot(xa);if(l<=0&&c<=0)return t.copy(i);va.subVectors(e,r);let f=nr.dot(va),m=rr.dot(va);if(f>=0&&m<=f)return t.copy(r);let u=l*m-f*c;if(u<=0&&l>=0&&f<=0)return s=l/(l-f),t.copy(i).addScaledVector(nr,s);Sa.subVectors(e,o);let p=nr.dot(Sa),_=rr.dot(Sa);if(_>=0&&p<=_)return t.copy(o);let S=p*c-l*_;if(S<=0&&c>=0&&_<=0)return a=c/(c-_),t.copy(i).addScaledVector(rr,a);let d=f*_-p*m;if(d<=0&&m-f>=0&&p-_>=0)return cc.subVectors(o,r),a=(m-f)/(m-f+(p-_)),t.copy(r).addScaledVector(cc,a);let h=1/(d+S+u);return s=S*h,a=u*h,t.copy(i).addScaledVector(nr,s).addScaledVector(rr,a)}equals(e){return e.a.equals(this.a)&&e.b.equals(this.b)&&e.c.equals(this.c)}};var Hi=class{constructor(e=new P(1/0,1/0,1/0),t=new P(-1/0,-1/0,-1/0)){this.isBox3=!0,this.min=e,this.max=t}set(e,t){return this.min.copy(e),this.max.copy(t),this}setFromArray(e){this.makeEmpty();for(let t=0,i=e.length;t<i;t+=3)this.expandByPoint(Mi.fromArray(e,t));return this}setFromBufferAttribute(e){this.makeEmpty();for(let t=0,i=e.count;t<i;t++)this.expandByPoint(Mi.fromBufferAttribute(e,t));return this}setFromPoints(e){this.makeEmpty();for(let t=0,i=e.length;t<i;t++)this.expandByPoint(e[t]);return this}setFromCenterAndSize(e,t){let i=Mi.copy(t).multiplyScalar(.5);return this.min.copy(e).sub(i),this.max.copy(e).add(i),this}setFromObject(e,t=!1){return this.makeEmpty(),this.expandByObject(e,t)}clone(){return new this.constructor().copy(this)}copy(e){return this.min.copy(e.min),this.max.copy(e.max),this}makeEmpty(){return this.min.x=this.min.y=this.min.z=1/0,this.max.x=this.max.y=this.max.z=-1/0,this}isEmpty(){return this.max.x<this.min.x||this.max.y<this.min.y||this.max.z<this.min.z}getCenter(e){return this.isEmpty()?e.set(0,0,0):e.addVectors(this.min,this.max).multiplyScalar(.5)}getSize(e){return this.isEmpty()?e.set(0,0,0):e.subVectors(this.max,this.min)}expandByPoint(e){return this.min.min(e),this.max.max(e),this}expandByVector(e){return this.min.sub(e),this.max.add(e),this}expandByScalar(e){return this.min.addScalar(-e),this.max.addScalar(e),this}expandByObject(e,t=!1){e.updateWorldMatrix(!1,!1);let i=e.geometry;if(i!==void 0){let o=i.getAttribute("position");if(t===!0&&o!==void 0&&e.isInstancedMesh!==!0)for(let s=0,a=o.count;s<a;s++)e.isMesh===!0?e.getVertexPosition(s,Mi):Mi.fromBufferAttribute(o,s),Mi.applyMatrix4(e.matrixWorld),this.expandByPoint(Mi);else e.boundingBox!==void 0?(e.boundingBox===null&&e.computeBoundingBox(),ls.copy(e.boundingBox)):(i.boundingBox===null&&i.computeBoundingBox(),ls.copy(i.boundingBox)),ls.applyMatrix4(e.matrixWorld),this.union(ls)}let r=e.children;for(let o=0,s=r.length;o<s;o++)this.expandByObject(r[o],t);return this}containsPoint(e){return e.x>=this.min.x&&e.x<=this.max.x&&e.y>=this.min.y&&e.y<=this.max.y&&e.z>=this.min.z&&e.z<=this.max.z}containsBox(e){return this.min.x<=e.min.x&&e.max.x<=this.max.x&&this.min.y<=e.min.y&&e.max.y<=this.max.y&&this.min.z<=e.min.z&&e.max.z<=this.max.z}getParameter(e,t){return t.set((e.x-this.min.x)/(this.max.x-this.min.x),(e.y-this.min.y)/(this.max.y-this.min.y),(e.z-this.min.z)/(this.max.z-this.min.z))}intersectsBox(e){return e.max.x>=this.min.x&&e.min.x<=this.max.x&&e.max.y>=this.min.y&&e.min.y<=this.max.y&&e.max.z>=this.min.z&&e.min.z<=this.max.z}intersectsSphere(e){return this.clampPoint(e.center,Mi),Mi.distanceToSquared(e.center)<=e.radius*e.radius}intersectsPlane(e){let t,i;return e.normal.x>0?(t=e.normal.x*this.min.x,i=e.normal.x*this.max.x):(t=e.normal.x*this.max.x,i=e.normal.x*this.min.x),e.normal.y>0?(t+=e.normal.y*this.min.y,i+=e.normal.y*this.max.y):(t+=e.normal.y*this.max.y,i+=e.normal.y*this.min.y),e.normal.z>0?(t+=e.normal.z*this.min.z,i+=e.normal.z*this.max.z):(t+=e.normal.z*this.max.z,i+=e.normal.z*this.min.z),t<=-e.constant&&i>=-e.constant}intersectsTriangle(e){if(this.isEmpty())return!1;this.getCenter(_o),cs.subVectors(this.max,_o),or.subVectors(e.a,_o),sr.subVectors(e.b,_o),ar.subVectors(e.c,_o),on.subVectors(sr,or),sn.subVectors(ar,sr),bn.subVectors(or,ar);let t=[0,-on.z,on.y,0,-sn.z,sn.y,0,-bn.z,bn.y,on.z,0,-on.x,sn.z,0,-sn.x,bn.z,0,-bn.x,-on.y,on.x,0,-sn.y,sn.x,0,-bn.y,bn.x,0];return!Ea(t,or,sr,ar,cs)||(t=[1,0,0,0,1,0,0,0,1],!Ea(t,or,sr,ar,cs))?!1:(us.crossVectors(on,sn),t=[us.x,us.y,us.z],Ea(t,or,sr,ar,cs))}clampPoint(e,t){return t.copy(e).clamp(this.min,this.max)}distanceToPoint(e){return this.clampPoint(e,Mi).distanceTo(e)}getBoundingSphere(e){return this.isEmpty()?e.makeEmpty():(this.getCenter(e.center),e.radius=this.getSize(Mi).length()*.5),e}intersect(e){return this.min.max(e.min),this.max.min(e.max),this.isEmpty()&&this.makeEmpty(),this}union(e){return this.min.min(e.min),this.max.max(e.max),this}applyMatrix4(e){return this.isEmpty()?this:(ki[0].set(this.min.x,this.min.y,this.min.z).applyMatrix4(e),ki[1].set(this.min.x,this.min.y,this.max.z).applyMatrix4(e),ki[2].set(this.min.x,this.max.y,this.min.z).applyMatrix4(e),ki[3].set(this.min.x,this.max.y,this.max.z).applyMatrix4(e),ki[4].set(this.max.x,this.min.y,this.min.z).applyMatrix4(e),ki[5].set(this.max.x,this.min.y,this.max.z).applyMatrix4(e),ki[6].set(this.max.x,this.max.y,this.min.z).applyMatrix4(e),ki[7].set(this.max.x,this.max.y,this.max.z).applyMatrix4(e),this.setFromPoints(ki),this)}translate(e){return this.min.add(e),this.max.add(e),this}equals(e){return e.min.equals(this.min)&&e.max.equals(this.max)}toJSON(){return{min:this.min.toArray(),max:this.max.toArray()}}fromJSON(e){return this.min.fromArray(e.min),this.max.fromArray(e.max),this}},ki=[new P,new P,new P,new P,new P,new P,new P,new P],Mi=new P,ls=new Hi,or=new P,sr=new P,ar=new P,on=new P,sn=new P,bn=new P,_o=new P,cs=new P,us=new P,En=new P;function Ea(n,e,t,i,r){for(let o=0,s=n.length-3;o<=s;o+=3){En.fromArray(n,o);let a=r.x*Math.abs(En.x)+r.y*Math.abs(En.y)+r.z*Math.abs(En.z),l=e.dot(En),c=t.dot(En),f=i.dot(En);if(Math.max(-Math.max(l,c,f),Math.min(l,c,f))>a)return!1}return!0}var bt=new P,hs=new _e,vp=0,$t=class extends It{constructor(e,t,i=!1){if(super(),Array.isArray(e))throw new TypeError("THREE.BufferAttribute: array should be a Typed Array.");this.isBufferAttribute=!0,Object.defineProperty(this,"id",{value:vp++}),this.name="",this.array=e,this.itemSize=t,this.count=e!==void 0?e.length/t:0,this.normalized=i,this.usage=Wl,this.updateRanges=[],this.gpuType=Ot,this.version=0}onUploadCallback(){}set needsUpdate(e){e===!0&&this.version++}setUsage(e){return this.usage=e,this}addUpdateRange(e,t){this.updateRanges.push({start:e,count:t})}clearUpdateRanges(){this.updateRanges.length=0}copy(e){return this.name=e.name,this.array=new e.array.constructor(e.array),this.itemSize=e.itemSize,this.count=e.count,this.normalized=e.normalized,this.usage=e.usage,this.gpuType=e.gpuType,this}copyAt(e,t,i){e*=this.itemSize,i*=t.itemSize;for(let r=0,o=this.itemSize;r<o;r++)this.array[e+r]=t.array[i+r];return this}copyArray(e){return this.array.set(e),this}applyMatrix3(e){if(this.itemSize===2)for(let t=0,i=this.count;t<i;t++)hs.fromBufferAttribute(this,t),hs.applyMatrix3(e),this.setXY(t,hs.x,hs.y);else if(this.itemSize===3)for(let t=0,i=this.count;t<i;t++)bt.fromBufferAttribute(this,t),bt.applyMatrix3(e),this.setXYZ(t,bt.x,bt.y,bt.z);return this}applyMatrix4(e){for(let t=0,i=this.count;t<i;t++)bt.fromBufferAttribute(this,t),bt.applyMatrix4(e),this.setXYZ(t,bt.x,bt.y,bt.z);return this}applyNormalMatrix(e){for(let t=0,i=this.count;t<i;t++)bt.fromBufferAttribute(this,t),bt.applyNormalMatrix(e),this.setXYZ(t,bt.x,bt.y,bt.z);return this}transformDirection(e){for(let t=0,i=this.count;t<i;t++)bt.fromBufferAttribute(this,t),bt.transformDirection(e),this.setXYZ(t,bt.x,bt.y,bt.z);return this}set(e,t=0){return this.array.set(e,t),this}getComponent(e,t){let i=this.array[e*this.itemSize+t];return this.normalized&&(i=Mn(i,this.array)),i}setComponent(e,t,i){return this.normalized&&(i=zt(i,this.array)),this.array[e*this.itemSize+t]=i,this}getX(e){let t=this.array[e*this.itemSize];return this.normalized&&(t=Mn(t,this.array)),t}setX(e,t){return this.normalized&&(t=zt(t,this.array)),this.array[e*this.itemSize]=t,this}getY(e){let t=this.array[e*this.itemSize+1];return this.normalized&&(t=Mn(t,this.array)),t}setY(e,t){return this.normalized&&(t=zt(t,this.array)),this.array[e*this.itemSize+1]=t,this}getZ(e){let t=this.array[e*this.itemSize+2];return this.normalized&&(t=Mn(t,this.array)),t}setZ(e,t){return this.normalized&&(t=zt(t,this.array)),this.array[e*this.itemSize+2]=t,this}getW(e){let t=this.array[e*this.itemSize+3];return this.normalized&&(t=Mn(t,this.array)),t}setW(e,t){return this.normalized&&(t=zt(t,this.array)),this.array[e*this.itemSize+3]=t,this}setXY(e,t,i){return e*=this.itemSize,this.normalized&&(t=zt(t,this.array),i=zt(i,this.array)),this.array[e+0]=t,this.array[e+1]=i,this}setXYZ(e,t,i,r){return e*=this.itemSize,this.normalized&&(t=zt(t,this.array),i=zt(i,this.array),r=zt(r,this.array)),this.array[e+0]=t,this.array[e+1]=i,this.array[e+2]=r,this}setXYZW(e,t,i,r,o){return e*=this.itemSize,this.normalized&&(t=zt(t,this.array),i=zt(i,this.array),r=zt(r,this.array),o=zt(o,this.array)),this.array[e+0]=t,this.array[e+1]=i,this.array[e+2]=r,this.array[e+3]=o,this}onUpload(e){return this.onUploadCallback=e,this}clone(){return new this.constructor(this.array,this.itemSize).copy(this)}toJSON(){let e={itemSize:this.itemSize,type:this.array.constructor.name,array:Array.from(this.array),normalized:this.normalized};return e.name=this.name,e.usage=this.usage,e.gpuType=this.gpuType,e}dispose(){this.dispatchEvent({type:"dispose"})}};var lr=class extends $t{constructor(e,t,i){super(new Uint16Array(e),t,i)}};var cr=class extends $t{constructor(e,t,i){super(new Uint32Array(e),t,i)}};var nt=class extends $t{constructor(e,t,i){super(new Float32Array(e),t,i)}};var Sp=new Hi,xo=new P,Ta=new P,Pi=class{constructor(e=new P,t=-1){this.isSphere=!0,this.center=e,this.radius=t}set(e,t){return this.center.copy(e),this.radius=t,this}setFromPoints(e,t){let i=this.center;t!==void 0?i.copy(t):Sp.setFromPoints(e).getCenter(i);let r=0;for(let o=0,s=e.length;o<s;o++)r=Math.max(r,i.distanceToSquared(e[o]));return this.radius=Math.sqrt(r),this}copy(e){return this.center.copy(e.center),this.radius=e.radius,this}isEmpty(){return this.radius<0}makeEmpty(){return this.center.set(0,0,0),this.radius=-1,this}containsPoint(e){return e.distanceToSquared(this.center)<=this.radius*this.radius}distanceToPoint(e){return e.distanceTo(this.center)-this.radius}intersectsSphere(e){let t=this.radius+e.radius;return e.center.distanceToSquared(this.center)<=t*t}intersectsBox(e){return e.intersectsSphere(this)}intersectsPlane(e){return Math.abs(e.distanceToPoint(this.center))<=this.radius}clampPoint(e,t){let i=this.center.distanceToSquared(e);return t.copy(e),i>this.radius*this.radius&&(t.sub(this.center).normalize(),t.multiplyScalar(this.radius).add(this.center)),t}getBoundingBox(e){return this.isEmpty()?(e.makeEmpty(),e):(e.set(this.center,this.center),e.expandByScalar(this.radius),e)}applyMatrix4(e){return this.center.applyMatrix4(e),this.radius=this.radius*e.getMaxScaleOnAxis(),this}translate(e){return this.center.add(e),this}expandByPoint(e){if(this.isEmpty())return this.center.copy(e),this.radius=0,this;xo.subVectors(e,this.center);let t=xo.lengthSq();if(t>this.radius*this.radius){let i=Math.sqrt(t),r=(i-this.radius)*.5;this.center.addScaledVector(xo,r/i),this.radius+=r}return this}union(e){return e.isEmpty()?this:this.isEmpty()?(this.copy(e),this):(this.center.equals(e.center)===!0?this.radius=Math.max(this.radius,e.radius):(Ta.subVectors(e.center,this.center).setLength(e.radius),this.expandByPoint(xo.copy(e.center).add(Ta)),this.expandByPoint(xo.copy(e.center).sub(Ta))),this)}equals(e){return e.center.equals(this.center)&&e.radius===this.radius}clone(){return new this.constructor().copy(this)}toJSON(){return{radius:this.radius,center:this.center.toArray()}}fromJSON(e){return this.radius=e.radius,this.center.fromArray(e.center),this}};var Mp=0,fi=new Oe,Aa=new it,ur=new P,oi=new Hi,vo=new Hi,Nt=new P,ft=class n extends It{constructor(){super(),this.isBufferGeometry=!0,Object.defineProperty(this,"id",{value:Mp++}),this.uuid=_i(),this.name="",this.type="BufferGeometry",this.index=null,this.indirect=null,this.indirectOffset=0,this.attributes={},this.morphAttributes={},this.morphTargetsRelative=!1,this.groups=[],this.boundingBox=null,this.boundingSphere=null,this.drawRange={start:0,count:1/0},this.userData={},this._transformed=!1}getIndex(){return this.index}setIndex(e){return Array.isArray(e)?this.index=new(ql(e)?cr:lr)(e,1):this.index=e,this}setIndirect(e,t=0){return this.indirect=e,this.indirectOffset=t,this}getIndirect(){return this.indirect}getAttribute(e){return this.attributes[e]}setAttribute(e,t){return this.attributes[e]=t,this}deleteAttribute(e){return delete this.attributes[e],this}hasAttribute(e){return this.attributes[e]!==void 0}addGroup(e,t,i=0){this.groups.push({start:e,count:t,materialIndex:i})}clearGroups(){this.groups=[]}setDrawRange(e,t){this.drawRange.start=e,this.drawRange.count=t}applyMatrix4(e){let t=this.attributes.position;t!==void 0&&(t.applyMatrix4(e),t.needsUpdate=!0);let i=this.attributes.normal;if(i!==void 0){let o=new Le().getNormalMatrix(e);i.applyNormalMatrix(o),i.needsUpdate=!0}let r=this.attributes.tangent;return r!==void 0&&(r.transformDirection(e),r.needsUpdate=!0),this.boundingBox!==null&&this.computeBoundingBox(),this.boundingSphere!==null&&this.computeBoundingSphere(),this._transformed=!0,this}applyQuaternion(e){return fi.makeRotationFromQuaternion(e),this.applyMatrix4(fi),this}rotateX(e){return fi.makeRotationX(e),this.applyMatrix4(fi),this}rotateY(e){return fi.makeRotationY(e),this.applyMatrix4(fi),this}rotateZ(e){return fi.makeRotationZ(e),this.applyMatrix4(fi),this}translate(e,t,i){return fi.makeTranslation(e,t,i),this.applyMatrix4(fi),this}scale(e,t,i){return fi.makeScale(e,t,i),this.applyMatrix4(fi),this}lookAt(e){return Aa.lookAt(e),Aa.updateMatrix(),this.applyMatrix4(Aa.matrix),this}center(){return this.computeBoundingBox(),this.boundingBox.getCenter(ur).negate(),this.translate(ur.x,ur.y,ur.z),this}setFromPoints(e){let t=this.getAttribute("position");if(t===void 0){let i=[];for(let r=0,o=e.length;r<o;r++){let s=e[r];i.push(s.x,s.y,s.z||0)}this.setAttribute("position",new nt(i,3))}else{let i=Math.min(e.length,t.count);for(let r=0;r<i;r++){let o=e[r];t.setXYZ(r,o.x,o.y,o.z||0)}e.length>t.count&&xe("BufferGeometry: Buffer size too small for points data. Use .dispose() and create a new geometry."),t.needsUpdate=!0}return this}computeBoundingBox(){this.boundingBox===null&&(this.boundingBox=new Hi);let e=this.attributes.position,t=this.morphAttributes.position;if(e&&e.isGLBufferAttribute){Fe("BufferGeometry.computeBoundingBox(): GLBufferAttribute requires a manual bounding box.",this),this.boundingBox.set(new P(-1/0,-1/0,-1/0),new P(1/0,1/0,1/0));return}if(e!==void 0){if(this.boundingBox.setFromBufferAttribute(e),t)for(let i=0,r=t.length;i<r;i++){let o=t[i];oi.setFromBufferAttribute(o),this.morphTargetsRelative?(Nt.addVectors(this.boundingBox.min,oi.min),this.boundingBox.expandByPoint(Nt),Nt.addVectors(this.boundingBox.max,oi.max),this.boundingBox.expandByPoint(Nt)):(this.boundingBox.expandByPoint(oi.min),this.boundingBox.expandByPoint(oi.max))}}else this.boundingBox.makeEmpty();(isNaN(this.boundingBox.min.x)||isNaN(this.boundingBox.min.y)||isNaN(this.boundingBox.min.z))&&Fe('BufferGeometry.computeBoundingBox(): Computed min/max have NaN values. The "position" attribute is likely to have NaN values.',this)}computeBoundingSphere(){this.boundingSphere===null&&(this.boundingSphere=new Pi);let e=this.attributes.position,t=this.morphAttributes.position;if(e&&e.isGLBufferAttribute){Fe("BufferGeometry.computeBoundingSphere(): GLBufferAttribute requires a manual bounding sphere.",this),this.boundingSphere.set(new P,1/0);return}if(e){let i=this.boundingSphere.center;if(oi.setFromBufferAttribute(e),t)for(let o=0,s=t.length;o<s;o++){let a=t[o];vo.setFromBufferAttribute(a),this.morphTargetsRelative?(Nt.addVectors(oi.min,vo.min),oi.expandByPoint(Nt),Nt.addVectors(oi.max,vo.max),oi.expandByPoint(Nt)):(oi.expandByPoint(vo.min),oi.expandByPoint(vo.max))}oi.getCenter(i);let r=0;for(let o=0,s=e.count;o<s;o++)Nt.fromBufferAttribute(e,o),r=Math.max(r,i.distanceToSquared(Nt));if(t)for(let o=0,s=t.length;o<s;o++){let a=t[o],l=this.morphTargetsRelative;for(let c=0,f=a.count;c<f;c++)Nt.fromBufferAttribute(a,c),l&&(ur.fromBufferAttribute(e,c),Nt.add(ur)),r=Math.max(r,i.distanceToSquared(Nt))}this.boundingSphere.radius=Math.sqrt(r),isNaN(this.boundingSphere.radius)&&Fe('BufferGeometry.computeBoundingSphere(): Computed radius is NaN. The "position" attribute is likely to have NaN values.',this)}}computeTangents(){let e=this.index,t=this.attributes;if(e===null||t.position===void 0||t.normal===void 0||t.uv===void 0){Fe("BufferGeometry: .computeTangents() failed. Missing required attributes (index, position, normal or uv)");return}let i=t.position,r=t.normal,o=t.uv,s=this.getAttribute("tangent");(s===void 0||s.count!==i.count)&&(s=new $t(new Float32Array(4*i.count),4),this.setAttribute("tangent",s));let a=[],l=[];for(let x=0;x<i.count;x++)a[x]=new P,l[x]=new P;let c=new P,f=new P,m=new P,u=new _e,p=new _e,_=new _e,S=new P,d=new P;function h(x,E,D){c.fromBufferAttribute(i,x),f.fromBufferAttribute(i,E),m.fromBufferAttribute(i,D),u.fromBufferAttribute(o,x),p.fromBufferAttribute(o,E),_.fromBufferAttribute(o,D),f.sub(c),m.sub(c),p.sub(u),_.sub(u);let U=1/(p.x*_.y-_.x*p.y);isFinite(U)&&(S.copy(f).multiplyScalar(_.y).addScaledVector(m,-p.y).multiplyScalar(U),d.copy(m).multiplyScalar(p.x).addScaledVector(f,-_.x).multiplyScalar(U),a[x].add(S),a[E].add(S),a[D].add(S),l[x].add(d),l[E].add(d),l[D].add(d))}let A=this.groups;A.length===0&&(A=[{start:0,count:e.count}]);for(let x=0,E=A.length;x<E;++x){let D=A[x],U=D.start,G=D.count;for(let k=U,L=U+G;k<L;k+=3)h(e.getX(k+0),e.getX(k+1),e.getX(k+2))}let I=new P,M=new P,y=new P,b=new P;function C(x){y.fromBufferAttribute(r,x),b.copy(y);let E=a[x];I.copy(E),I.sub(y.multiplyScalar(y.dot(E))).normalize(),M.crossVectors(b,E);let U=M.dot(l[x])<0?-1:1;s.setXYZW(x,I.x,I.y,I.z,U)}for(let x=0,E=A.length;x<E;++x){let D=A[x],U=D.start,G=D.count;for(let k=U,L=U+G;k<L;k+=3)C(e.getX(k+0)),C(e.getX(k+1)),C(e.getX(k+2))}this._transformed=!0}computeVertexNormals(){let e=this.index,t=this.getAttribute("position");if(t!==void 0){let i=this.getAttribute("normal");if(i===void 0||i.count!==t.count)i=new $t(new Float32Array(t.count*3),3),this.setAttribute("normal",i);else for(let u=0,p=i.count;u<p;u++)i.setXYZ(u,0,0,0);let r=new P,o=new P,s=new P,a=new P,l=new P,c=new P,f=new P,m=new P;if(e)for(let u=0,p=e.count;u<p;u+=3){let _=e.getX(u+0),S=e.getX(u+1),d=e.getX(u+2);r.fromBufferAttribute(t,_),o.fromBufferAttribute(t,S),s.fromBufferAttribute(t,d),f.subVectors(s,o),m.subVectors(r,o),f.cross(m),a.fromBufferAttribute(i,_),l.fromBufferAttribute(i,S),c.fromBufferAttribute(i,d),a.add(f),l.add(f),c.add(f),i.setXYZ(_,a.x,a.y,a.z),i.setXYZ(S,l.x,l.y,l.z),i.setXYZ(d,c.x,c.y,c.z)}else for(let u=0,p=t.count;u<p;u+=3)r.fromBufferAttribute(t,u+0),o.fromBufferAttribute(t,u+1),s.fromBufferAttribute(t,u+2),f.subVectors(s,o),m.subVectors(r,o),f.cross(m),i.setXYZ(u+0,f.x,f.y,f.z),i.setXYZ(u+1,f.x,f.y,f.z),i.setXYZ(u+2,f.x,f.y,f.z);this.normalizeNormals(),i.needsUpdate=!0}}normalizeNormals(){let e=this.attributes.normal;for(let t=0,i=e.count;t<i;t++)Nt.fromBufferAttribute(e,t),Nt.normalize(),e.setXYZ(t,Nt.x,Nt.y,Nt.z)}toNonIndexed(){function e(a,l){let c=a.array,f=a.itemSize,m=a.normalized,u=new c.constructor(l.length*f),p=0,_=0;for(let S=0,d=l.length;S<d;S++){a.isInterleavedBufferAttribute?p=l[S]*a.data.stride+a.offset:p=l[S]*f;for(let h=0;h<f;h++)u[_++]=c[p++]}return new $t(u,f,m)}if(this.index===null)return xe("BufferGeometry.toNonIndexed(): BufferGeometry is already non-indexed."),this;let t=new n,i=this.index.array,r=this.attributes;for(let a in r){let l=r[a],c=e(l,i);t.setAttribute(a,c)}let o=this.morphAttributes;for(let a in o){let l=[],c=o[a];for(let f=0,m=c.length;f<m;f++){let u=c[f],p=e(u,i);l.push(p)}t.morphAttributes[a]=l}t.morphTargetsRelative=this.morphTargetsRelative;let s=this.groups;for(let a=0,l=s.length;a<l;a++){let c=s[a];t.addGroup(c.start,c.count,c.materialIndex)}return t}toJSON(){let e={metadata:{version:4.7,type:"BufferGeometry",generator:"BufferGeometry.toJSON"}};if(e.uuid=this.uuid,e.type=this.parameters!==void 0&&this._transformed===!0?"BufferGeometry":this.type,e.name=this.name,Object.keys(this.userData).length>0&&(e.userData=this.userData),this.parameters!==void 0&&this._transformed!==!0){let l=this.parameters;for(let c in l)l[c]!==void 0&&(e[c]=l[c]);return e}e.data={attributes:{}};let t=this.index;t!==null&&(e.data.index={type:t.array.constructor.name,array:Array.prototype.slice.call(t.array)});let i=this.attributes;for(let l in i){let c=i[l];e.data.attributes[l]=c.toJSON(e.data)}let r={},o=!1;for(let l in this.morphAttributes){let c=this.morphAttributes[l],f=[];for(let m=0,u=c.length;m<u;m++){let p=c[m];f.push(p.toJSON(e.data))}f.length>0&&(r[l]=f,o=!0)}o&&(e.data.morphAttributes=r,e.data.morphTargetsRelative=this.morphTargetsRelative);let s=this.groups;s.length>0&&(e.data.groups=JSON.parse(JSON.stringify(s)));let a=this.boundingSphere;return a!==null&&(e.data.boundingSphere=a.toJSON()),e}clone(){return new this.constructor().copy(this)}copy(e){this.index=null,this.attributes={},this.morphAttributes={},this.groups=[],this.boundingBox=null,this.boundingSphere=null;let t={};this.name=e.name;let i=e.index;i!==null&&this.setIndex(i.clone());let r=e.attributes;for(let c in r){let f=r[c];this.setAttribute(c,f.clone(t))}let o=e.morphAttributes;for(let c in o){let f=[],m=o[c];for(let u=0,p=m.length;u<p;u++)f.push(m[u].clone(t));this.morphAttributes[c]=f}this.morphTargetsRelative=e.morphTargetsRelative;let s=e.groups;for(let c=0,f=s.length;c<f;c++){let m=s[c];this.addGroup(m.start,m.count,m.materialIndex)}let a=e.boundingBox;a!==null&&(this.boundingBox=a.clone());let l=e.boundingSphere;return l!==null&&(this.boundingSphere=l.clone()),this.drawRange.start=e.drawRange.start,this.drawRange.count=e.drawRange.count,this.userData=e.userData,this._transformed=e._transformed,this}dispose(){this.dispatchEvent({type:"dispose"})}};var wa=new P,yp=new P,bp=new Le,Vt=class{constructor(e=new P(1,0,0),t=0){this.isPlane=!0,this.normal=e,this.constant=t}set(e,t){return this.normal.copy(e),this.constant=t,this}setComponents(e,t,i,r){return this.normal.set(e,t,i),this.constant=r,this}setFromNormalAndCoplanarPoint(e,t){return this.normal.copy(e),this.constant=-t.dot(this.normal),this}setFromCoplanarPoints(e,t,i){let r=wa.subVectors(i,t).cross(yp.subVectors(e,t)).normalize();return this.setFromNormalAndCoplanarPoint(r,e),this}copy(e){return this.normal.copy(e.normal),this.constant=e.constant,this}normalize(){let e=1/this.normal.length();return this.normal.multiplyScalar(e),this.constant*=e,this}negate(){return this.constant*=-1,this.normal.negate(),this}distanceToPoint(e){return this.normal.dot(e)+this.constant}distanceToSphere(e){return this.distanceToPoint(e.center)-e.radius}projectPoint(e,t){return t.copy(e).addScaledVector(this.normal,-this.distanceToPoint(e))}intersectLine(e,t,i=!0){let r=e.delta(wa),o=this.normal.dot(r);if(o===0)return this.distanceToPoint(e.start)===0?t.copy(e.start):null;let s=-(e.start.dot(this.normal)+this.constant)/o;return i===!0&&(s<0||s>1)?null:t.copy(e.start).addScaledVector(r,s)}intersectsLine(e){let t=this.distanceToPoint(e.start),i=this.distanceToPoint(e.end);return t<0&&i>0||i<0&&t>0}intersectsBox(e){return e.intersectsPlane(this)}intersectsSphere(e){return e.intersectsPlane(this)}coplanarPoint(e){return e.copy(this.normal).multiplyScalar(-this.constant)}applyMatrix4(e,t){let i=t||bp.getNormalMatrix(e),r=this.coplanarPoint(wa).applyMatrix4(e),o=this.normal.applyMatrix3(i).normalize();return this.constant=-r.dot(o),this}translate(e){return this.constant-=e.dot(this.normal),this}equals(e){return e.normal.equals(this.normal)&&e.constant===this.constant}clone(){return new this.constructor().copy(this)}toJSON(){return{normal:this.normal.toArray(),constant:this.constant}}fromJSON(e){return this.normal.fromArray(e.normal),this.constant=e.constant,this}};var Ep=0,Qt=class extends It{constructor(){super(),this.isMaterial=!0,Object.defineProperty(this,"id",{value:Ep++}),this.uuid=_i(),this.name="",this.type="Material",this.blending=Zi,this.side=li,this.vertexColors=!1,this.opacity=1,this.transparent=!1,this.alphaHash=!1,this.blendSrc=No,this.blendDst=Uo,this.blendEquation=Ji,this.blendSrcAlpha=null,this.blendDstAlpha=null,this.blendEquationAlpha=null,this.blendColor=new be(0,0,0),this.blendAlpha=0,this.depthFunc=$i,this.depthTest=!0,this.depthWrite=!0,this.stencilWriteMask=255,this.stencilFunc=Ol,this.stencilRef=0,this.stencilFuncMask=255,this.stencilFail=es,this.stencilZFail=es,this.stencilZPass=es,this.stencilWrite=!1,this.clippingPlanes=null,this.clipIntersection=!1,this.clipShadows=!1,this.shadowSide=null,this.colorWrite=!0,this.precision=null,this.polygonOffset=!1,this.polygonOffsetFactor=0,this.polygonOffsetUnits=0,this.dithering=!1,this.alphaToCoverage=!1,this.premultipliedAlpha=!1,this.forceSinglePass=!1,this.allowOverride=!0,this.visible=!0,this.toneMapped=!0,this.userData={},this.version=0,this._alphaTest=0}get alphaTest(){return this._alphaTest}set alphaTest(e){this._alphaTest>0!=e>0&&this.version++,this._alphaTest=e}onBeforeRender(){}onBeforeCompile(){}customProgramCacheKey(){return this.onBeforeCompile.toString()}setValues(e){if(e!==void 0)for(let t in e){let i=e[t];if(i===void 0){xe(`Material: parameter '${t}' has value of undefined.`);continue}let r=this[t];if(r===void 0){xe(`Material: '${t}' is not a property of THREE.${this.type}.`);continue}r&&r.isColor?r.set(i):r&&r.isVector2&&i&&i.isVector2||r&&r.isEuler&&i&&i.isEuler||r&&r.isVector3&&i&&i.isVector3?r.copy(i):this[t]=i}}toJSON(e){let t=e===void 0||typeof e=="string";t&&(e={textures:{},images:{}});let i={metadata:{version:4.7,type:"Material",generator:"Material.toJSON"}};i.uuid=this.uuid,i.type=this.type,i.blending=this.blending,i.side=this.side,i.shadowSide=this.shadowSide,i.vertexColors=this.vertexColors,i.opacity=this.opacity,i.transparent=this.transparent,i.blendSrc=this.blendSrc,i.blendDst=this.blendDst,i.blendEquation=this.blendEquation,i.blendSrcAlpha=this.blendSrcAlpha,i.blendDstAlpha=this.blendDstAlpha,i.blendEquationAlpha=this.blendEquationAlpha,i.blendColor=this.blendColor.getHex(),i.blendAlpha=this.blendAlpha,i.depthFunc=this.depthFunc,i.depthTest=this.depthTest,i.depthWrite=this.depthWrite,i.colorWrite=this.colorWrite,i.clipIntersection=this.clipIntersection,i.clipShadows=this.clipShadows,i.stencilWriteMask=this.stencilWriteMask,i.stencilFunc=this.stencilFunc,i.stencilRef=this.stencilRef,i.stencilFuncMask=this.stencilFuncMask,i.stencilFail=this.stencilFail,i.stencilZFail=this.stencilZFail,i.stencilZPass=this.stencilZPass,i.stencilWrite=this.stencilWrite,i.polygonOffset=this.polygonOffset,i.polygonOffsetFactor=this.polygonOffsetFactor,i.polygonOffsetUnits=this.polygonOffsetUnits,i.dithering=this.dithering,i.alphaTest=this.alphaTest,i.alphaHash=this.alphaHash,i.alphaToCoverage=this.alphaToCoverage,i.premultipliedAlpha=this.premultipliedAlpha,i.forceSinglePass=this.forceSinglePass,i.allowOverride=this.allowOverride,i.visible=this.visible,i.toneMapped=this.toneMapped,i.name=this.name,this.color&&this.color.isColor&&(i.color=this.color.getHex()),this.roughness!==void 0&&(i.roughness=this.roughness),this.metalness!==void 0&&(i.metalness=this.metalness),this.sheen!==void 0&&(i.sheen=this.sheen),this.sheenColor&&this.sheenColor.isColor&&(i.sheenColor=this.sheenColor.getHex()),this.sheenRoughness!==void 0&&(i.sheenRoughness=this.sheenRoughness),this.emissive&&this.emissive.isColor&&(i.emissive=this.emissive.getHex()),this.emissiveIntensity!==void 0&&(i.emissiveIntensity=this.emissiveIntensity),this.specular&&this.specular.isColor&&(i.specular=this.specular.getHex()),this.specularIntensity!==void 0&&(i.specularIntensity=this.specularIntensity),this.specularColor&&this.specularColor.isColor&&(i.specularColor=this.specularColor.getHex()),this.shininess!==void 0&&(i.shininess=this.shininess),this.clearcoat!==void 0&&(i.clearcoat=this.clearcoat),this.clearcoatRoughness!==void 0&&(i.clearcoatRoughness=this.clearcoatRoughness),this.clearcoatMap&&this.clearcoatMap.isTexture&&(i.clearcoatMap=this.clearcoatMap.toJSON(e).uuid),this.clearcoatRoughnessMap&&this.clearcoatRoughnessMap.isTexture&&(i.clearcoatRoughnessMap=this.clearcoatRoughnessMap.toJSON(e).uuid),this.clearcoatNormalMap&&this.clearcoatNormalMap.isTexture&&(i.clearcoatNormalMap=this.clearcoatNormalMap.toJSON(e).uuid,i.clearcoatNormalScale=this.clearcoatNormalScale.toArray()),this.sheenColorMap&&this.sheenColorMap.isTexture&&(i.sheenColorMap=this.sheenColorMap.toJSON(e).uuid),this.sheenRoughnessMap&&this.sheenRoughnessMap.isTexture&&(i.sheenRoughnessMap=this.sheenRoughnessMap.toJSON(e).uuid),this.dispersion!==void 0&&(i.dispersion=this.dispersion),this.retroreflectivity!==void 0&&(i.retroreflectivity=this.retroreflectivity),this.iridescence!==void 0&&(i.iridescence=this.iridescence),this.iridescenceIOR!==void 0&&(i.iridescenceIOR=this.iridescenceIOR),this.iridescenceThicknessRange!==void 0&&(i.iridescenceThicknessRange=this.iridescenceThicknessRange),this.iridescenceMap&&this.iridescenceMap.isTexture&&(i.iridescenceMap=this.iridescenceMap.toJSON(e).uuid),this.iridescenceThicknessMap&&this.iridescenceThicknessMap.isTexture&&(i.iridescenceThicknessMap=this.iridescenceThicknessMap.toJSON(e).uuid),this.anisotropy!==void 0&&(i.anisotropy=this.anisotropy),this.anisotropyRotation!==void 0&&(i.anisotropyRotation=this.anisotropyRotation),this.anisotropyMap&&this.anisotropyMap.isTexture&&(i.anisotropyMap=this.anisotropyMap.toJSON(e).uuid),this.map&&this.map.isTexture&&(i.map=this.map.toJSON(e).uuid),this.matcap&&this.matcap.isTexture&&(i.matcap=this.matcap.toJSON(e).uuid),this.alphaMap&&this.alphaMap.isTexture&&(i.alphaMap=this.alphaMap.toJSON(e).uuid),this.lightMap&&this.lightMap.isTexture&&(i.lightMap=this.lightMap.toJSON(e).uuid,i.lightMapIntensity=this.lightMapIntensity),this.aoMap&&this.aoMap.isTexture&&(i.aoMap=this.aoMap.toJSON(e).uuid,i.aoMapIntensity=this.aoMapIntensity),this.bumpMap&&this.bumpMap.isTexture&&(i.bumpMap=this.bumpMap.toJSON(e).uuid,i.bumpScale=this.bumpScale),this.normalMap&&this.normalMap.isTexture&&(i.normalMap=this.normalMap.toJSON(e).uuid,i.normalMapType=this.normalMapType,i.normalScale=this.normalScale.toArray()),this.displacementMap&&this.displacementMap.isTexture&&(i.displacementMap=this.displacementMap.toJSON(e).uuid,i.displacementScale=this.displacementScale,i.displacementBias=this.displacementBias),this.roughnessMap&&this.roughnessMap.isTexture&&(i.roughnessMap=this.roughnessMap.toJSON(e).uuid),this.metalnessMap&&this.metalnessMap.isTexture&&(i.metalnessMap=this.metalnessMap.toJSON(e).uuid),this.emissiveMap&&this.emissiveMap.isTexture&&(i.emissiveMap=this.emissiveMap.toJSON(e).uuid),this.specularMap&&this.specularMap.isTexture&&(i.specularMap=this.specularMap.toJSON(e).uuid),this.specularIntensityMap&&this.specularIntensityMap.isTexture&&(i.specularIntensityMap=this.specularIntensityMap.toJSON(e).uuid),this.specularColorMap&&this.specularColorMap.isTexture&&(i.specularColorMap=this.specularColorMap.toJSON(e).uuid),this.envMap&&this.envMap.isTexture&&(i.envMap=this.envMap.toJSON(e).uuid,this.combine!==void 0&&(i.combine=this.combine)),this.envMapRotation!==void 0&&(i.envMapRotation=this.envMapRotation.toArray()),this.envMapIntensity!==void 0&&(i.envMapIntensity=this.envMapIntensity),this.reflectivity!==void 0&&(i.reflectivity=this.reflectivity),this.refractionRatio!==void 0&&(i.refractionRatio=this.refractionRatio),this.gradientMap&&this.gradientMap.isTexture&&(i.gradientMap=this.gradientMap.toJSON(e).uuid),this.transmission!==void 0&&(i.transmission=this.transmission),this.transmissionMap&&this.transmissionMap.isTexture&&(i.transmissionMap=this.transmissionMap.toJSON(e).uuid),this.thickness!==void 0&&(i.thickness=this.thickness),this.thicknessMap&&this.thicknessMap.isTexture&&(i.thicknessMap=this.thicknessMap.toJSON(e).uuid),this.attenuationDistance!==void 0&&(i.attenuationDistance=this.attenuationDistance),this.attenuationColor!==void 0&&(i.attenuationColor=this.attenuationColor.getHex()),this.size!==void 0&&(i.size=this.size),this.sizeAttenuation!==void 0&&(i.sizeAttenuation=this.sizeAttenuation),Array.isArray(this.clippingPlanes)&&this.clippingPlanes.length>0&&(i.clippingPlanes=this.clippingPlanes.map(o=>o.toJSON())),this.rotation!==void 0&&(i.rotation=this.rotation),this.depthPacking!==void 0&&(i.depthPacking=this.depthPacking),this.linewidth!==void 0&&(i.linewidth=this.linewidth),this.linecap!==void 0&&(i.linecap=this.linecap),this.linejoin!==void 0&&(i.linejoin=this.linejoin),this.dashSize!==void 0&&(i.dashSize=this.dashSize),this.gapSize!==void 0&&(i.gapSize=this.gapSize),this.scale!==void 0&&(i.scale=this.scale),this.wireframe!==void 0&&(i.wireframe=this.wireframe),this.wireframeLinewidth!==void 0&&(i.wireframeLinewidth=this.wireframeLinewidth),this.wireframeLinecap!==void 0&&(i.wireframeLinecap=this.wireframeLinecap),this.wireframeLinejoin!==void 0&&(i.wireframeLinejoin=this.wireframeLinejoin),this.flatShading!==void 0&&(i.flatShading=this.flatShading),this.fog!==void 0&&(i.fog=this.fog),Object.keys(this.userData).length>0&&(i.userData=this.userData);function r(o){let s=[];for(let a in o){let l=o[a];delete l.metadata,s.push(l)}return s}if(t){let o=r(e.textures),s=r(e.images);o.length>0&&(i.textures=o),s.length>0&&(i.images=s)}return i}fromJSON(e,t){if(e.uuid!==void 0&&(this.uuid=e.uuid),e.name!==void 0&&(this.name=e.name),e.color!==void 0&&this.color!==void 0&&this.color.setHex(e.color),e.roughness!==void 0&&(this.roughness=e.roughness),e.metalness!==void 0&&(this.metalness=e.metalness),e.sheen!==void 0&&(this.sheen=e.sheen),e.sheenColor!==void 0&&(this.sheenColor=new be().setHex(e.sheenColor)),e.sheenRoughness!==void 0&&(this.sheenRoughness=e.sheenRoughness),e.emissive!==void 0&&this.emissive!==void 0&&this.emissive.setHex(e.emissive),e.specular!==void 0&&this.specular!==void 0&&this.specular.setHex(e.specular),e.specularIntensity!==void 0&&(this.specularIntensity=e.specularIntensity),e.specularColor!==void 0&&this.specularColor!==void 0&&this.specularColor.setHex(e.specularColor),e.shininess!==void 0&&(this.shininess=e.shininess),e.clearcoat!==void 0&&(this.clearcoat=e.clearcoat),e.clearcoatRoughness!==void 0&&(this.clearcoatRoughness=e.clearcoatRoughness),e.dispersion!==void 0&&(this.dispersion=e.dispersion),e.retroreflectivity!==void 0&&(this.retroreflectivity=e.retroreflectivity),e.iridescence!==void 0&&(this.iridescence=e.iridescence),e.iridescenceIOR!==void 0&&(this.iridescenceIOR=e.iridescenceIOR),e.iridescenceThicknessRange!==void 0&&(this.iridescenceThicknessRange=e.iridescenceThicknessRange),e.transmission!==void 0&&(this.transmission=e.transmission),e.thickness!==void 0&&(this.thickness=e.thickness),e.attenuationDistance!==void 0&&(this.attenuationDistance=e.attenuationDistance),e.attenuationColor!==void 0&&this.attenuationColor!==void 0&&this.attenuationColor.setHex(e.attenuationColor),e.anisotropy!==void 0&&(this.anisotropy=e.anisotropy),e.anisotropyRotation!==void 0&&(this.anisotropyRotation=e.anisotropyRotation),e.fog!==void 0&&(this.fog=e.fog),e.flatShading!==void 0&&(this.flatShading=e.flatShading),e.blending!==void 0&&(this.blending=e.blending),e.combine!==void 0&&(this.combine=e.combine),e.side!==void 0&&(this.side=e.side),e.shadowSide!==void 0&&(this.shadowSide=e.shadowSide),e.opacity!==void 0&&(this.opacity=e.opacity),e.transparent!==void 0&&(this.transparent=e.transparent),e.alphaTest!==void 0&&(this.alphaTest=e.alphaTest),e.alphaHash!==void 0&&(this.alphaHash=e.alphaHash),e.depthFunc!==void 0&&(this.depthFunc=e.depthFunc),e.depthTest!==void 0&&(this.depthTest=e.depthTest),e.depthWrite!==void 0&&(this.depthWrite=e.depthWrite),e.colorWrite!==void 0&&(this.colorWrite=e.colorWrite),e.clippingPlanes!==void 0&&(this.clippingPlanes=e.clippingPlanes.map(i=>new Vt().fromJSON(i))),e.clipIntersection!==void 0&&(this.clipIntersection=e.clipIntersection),e.clipShadows!==void 0&&(this.clipShadows=e.clipShadows),e.depthPacking!==void 0&&(this.depthPacking=e.depthPacking),e.blendSrc!==void 0&&(this.blendSrc=e.blendSrc),e.blendDst!==void 0&&(this.blendDst=e.blendDst),e.blendEquation!==void 0&&(this.blendEquation=e.blendEquation),e.blendSrcAlpha!==void 0&&(this.blendSrcAlpha=e.blendSrcAlpha),e.blendDstAlpha!==void 0&&(this.blendDstAlpha=e.blendDstAlpha),e.blendEquationAlpha!==void 0&&(this.blendEquationAlpha=e.blendEquationAlpha),e.blendColor!==void 0&&this.blendColor!==void 0&&this.blendColor.setHex(e.blendColor),e.blendAlpha!==void 0&&(this.blendAlpha=e.blendAlpha),e.stencilWriteMask!==void 0&&(this.stencilWriteMask=e.stencilWriteMask),e.stencilFunc!==void 0&&(this.stencilFunc=e.stencilFunc),e.stencilRef!==void 0&&(this.stencilRef=e.stencilRef),e.stencilFuncMask!==void 0&&(this.stencilFuncMask=e.stencilFuncMask),e.stencilFail!==void 0&&(this.stencilFail=e.stencilFail),e.stencilZFail!==void 0&&(this.stencilZFail=e.stencilZFail),e.stencilZPass!==void 0&&(this.stencilZPass=e.stencilZPass),e.stencilWrite!==void 0&&(this.stencilWrite=e.stencilWrite),e.wireframe!==void 0&&(this.wireframe=e.wireframe),e.wireframeLinewidth!==void 0&&(this.wireframeLinewidth=e.wireframeLinewidth),e.wireframeLinecap!==void 0&&(this.wireframeLinecap=e.wireframeLinecap),e.wireframeLinejoin!==void 0&&(this.wireframeLinejoin=e.wireframeLinejoin),e.rotation!==void 0&&(this.rotation=e.rotation),e.linewidth!==void 0&&(this.linewidth=e.linewidth),e.linecap!==void 0&&(this.linecap=e.linecap),e.linejoin!==void 0&&(this.linejoin=e.linejoin),e.dashSize!==void 0&&(this.dashSize=e.dashSize),e.gapSize!==void 0&&(this.gapSize=e.gapSize),e.scale!==void 0&&(this.scale=e.scale),e.polygonOffset!==void 0&&(this.polygonOffset=e.polygonOffset),e.polygonOffsetFactor!==void 0&&(this.polygonOffsetFactor=e.polygonOffsetFactor),e.polygonOffsetUnits!==void 0&&(this.polygonOffsetUnits=e.polygonOffsetUnits),e.dithering!==void 0&&(this.dithering=e.dithering),e.alphaToCoverage!==void 0&&(this.alphaToCoverage=e.alphaToCoverage),e.premultipliedAlpha!==void 0&&(this.premultipliedAlpha=e.premultipliedAlpha),e.forceSinglePass!==void 0&&(this.forceSinglePass=e.forceSinglePass),e.allowOverride!==void 0&&(this.allowOverride=e.allowOverride),e.visible!==void 0&&(this.visible=e.visible),e.toneMapped!==void 0&&(this.toneMapped=e.toneMapped),e.userData!==void 0&&(this.userData=e.userData),e.vertexColors!==void 0&&(typeof e.vertexColors=="number"?this.vertexColors=e.vertexColors>0:this.vertexColors=e.vertexColors),e.size!==void 0&&(this.size=e.size),e.sizeAttenuation!==void 0&&(this.sizeAttenuation=e.sizeAttenuation),e.map!==void 0&&(this.map=t[e.map]||null),e.matcap!==void 0&&(this.matcap=t[e.matcap]||null),e.alphaMap!==void 0&&(this.alphaMap=t[e.alphaMap]||null),e.bumpMap!==void 0&&(this.bumpMap=t[e.bumpMap]||null),e.bumpScale!==void 0&&(this.bumpScale=e.bumpScale),e.normalMap!==void 0&&(this.normalMap=t[e.normalMap]||null),e.normalMapType!==void 0&&(this.normalMapType=e.normalMapType),e.normalScale!==void 0){let i=e.normalScale;Array.isArray(i)===!1&&(i=[i,i]),this.normalScale=new _e().fromArray(i)}return e.displacementMap!==void 0&&(this.displacementMap=t[e.displacementMap]||null),e.displacementScale!==void 0&&(this.displacementScale=e.displacementScale),e.displacementBias!==void 0&&(this.displacementBias=e.displacementBias),e.roughnessMap!==void 0&&(this.roughnessMap=t[e.roughnessMap]||null),e.metalnessMap!==void 0&&(this.metalnessMap=t[e.metalnessMap]||null),e.emissiveMap!==void 0&&(this.emissiveMap=t[e.emissiveMap]||null),e.emissiveIntensity!==void 0&&(this.emissiveIntensity=e.emissiveIntensity),e.specularMap!==void 0&&(this.specularMap=t[e.specularMap]||null),e.specularIntensityMap!==void 0&&(this.specularIntensityMap=t[e.specularIntensityMap]||null),e.specularColorMap!==void 0&&(this.specularColorMap=t[e.specularColorMap]||null),e.envMap!==void 0&&(this.envMap=t[e.envMap]||null),e.envMapRotation!==void 0&&this.envMapRotation.fromArray(e.envMapRotation),e.envMapIntensity!==void 0&&(this.envMapIntensity=e.envMapIntensity),e.reflectivity!==void 0&&(this.reflectivity=e.reflectivity),e.refractionRatio!==void 0&&(this.refractionRatio=e.refractionRatio),e.lightMap!==void 0&&(this.lightMap=t[e.lightMap]||null),e.lightMapIntensity!==void 0&&(this.lightMapIntensity=e.lightMapIntensity),e.aoMap!==void 0&&(this.aoMap=t[e.aoMap]||null),e.aoMapIntensity!==void 0&&(this.aoMapIntensity=e.aoMapIntensity),e.gradientMap!==void 0&&(this.gradientMap=t[e.gradientMap]||null),e.clearcoatMap!==void 0&&(this.clearcoatMap=t[e.clearcoatMap]||null),e.clearcoatRoughnessMap!==void 0&&(this.clearcoatRoughnessMap=t[e.clearcoatRoughnessMap]||null),e.clearcoatNormalMap!==void 0&&(this.clearcoatNormalMap=t[e.clearcoatNormalMap]||null),e.clearcoatNormalScale!==void 0&&(this.clearcoatNormalScale=new _e().fromArray(e.clearcoatNormalScale)),e.iridescenceMap!==void 0&&(this.iridescenceMap=t[e.iridescenceMap]||null),e.iridescenceThicknessMap!==void 0&&(this.iridescenceThicknessMap=t[e.iridescenceThicknessMap]||null),e.transmissionMap!==void 0&&(this.transmissionMap=t[e.transmissionMap]||null),e.thicknessMap!==void 0&&(this.thicknessMap=t[e.thicknessMap]||null),e.anisotropyMap!==void 0&&(this.anisotropyMap=t[e.anisotropyMap]||null),e.sheenColorMap!==void 0&&(this.sheenColorMap=t[e.sheenColorMap]||null),e.sheenRoughnessMap!==void 0&&(this.sheenRoughnessMap=t[e.sheenRoughnessMap]||null),this}clone(){return new this.constructor().copy(this)}copy(e){this.name=e.name,this.blending=e.blending,this.side=e.side,this.vertexColors=e.vertexColors,this.opacity=e.opacity,this.transparent=e.transparent,this.blendSrc=e.blendSrc,this.blendDst=e.blendDst,this.blendEquation=e.blendEquation,this.blendSrcAlpha=e.blendSrcAlpha,this.blendDstAlpha=e.blendDstAlpha,this.blendEquationAlpha=e.blendEquationAlpha,this.blendColor.copy(e.blendColor),this.blendAlpha=e.blendAlpha,this.depthFunc=e.depthFunc,this.depthTest=e.depthTest,this.depthWrite=e.depthWrite,this.stencilWriteMask=e.stencilWriteMask,this.stencilFunc=e.stencilFunc,this.stencilRef=e.stencilRef,this.stencilFuncMask=e.stencilFuncMask,this.stencilFail=e.stencilFail,this.stencilZFail=e.stencilZFail,this.stencilZPass=e.stencilZPass,this.stencilWrite=e.stencilWrite;let t=e.clippingPlanes,i=null;if(t!==null){let r=t.length;i=new Array(r);for(let o=0;o!==r;++o)i[o]=t[o].clone()}return this.clippingPlanes=i,this.clipIntersection=e.clipIntersection,this.clipShadows=e.clipShadows,this.shadowSide=e.shadowSide,this.colorWrite=e.colorWrite,this.precision=e.precision,this.polygonOffset=e.polygonOffset,this.polygonOffsetFactor=e.polygonOffsetFactor,this.polygonOffsetUnits=e.polygonOffsetUnits,this.dithering=e.dithering,this.alphaTest=e.alphaTest,this.alphaHash=e.alphaHash,this.alphaToCoverage=e.alphaToCoverage,this.premultipliedAlpha=e.premultipliedAlpha,this.forceSinglePass=e.forceSinglePass,this.allowOverride=e.allowOverride,this.visible=e.visible,this.toneMapped=e.toneMapped,this.userData=JSON.parse(JSON.stringify(e.userData)),this}dispose(){this.dispatchEvent({type:"dispose"})}set needsUpdate(e){e===!0&&this.version++}};var Vi=new P,Ra=new P,fs=new P,ds=new P,yi=class{constructor(e=new P,t=new P(0,0,-1)){this.origin=e,this.direction=t}set(e,t){return this.origin.copy(e),this.direction.copy(t),this}copy(e){return this.origin.copy(e.origin),this.direction.copy(e.direction),this}at(e,t){return t.copy(this.origin).addScaledVector(this.direction,e)}lookAt(e){return this.direction.copy(e).sub(this.origin).normalize(),this}recast(e){return this.origin.copy(this.at(e,Vi)),this}closestPointToPoint(e,t){t.subVectors(e,this.origin);let i=t.dot(this.direction);return i<0?t.copy(this.origin):t.copy(this.origin).addScaledVector(this.direction,i)}distanceToPoint(e){return Math.sqrt(this.distanceSqToPoint(e))}distanceSqToPoint(e){let t=Vi.subVectors(e,this.origin).dot(this.direction);return t<0?this.origin.distanceToSquared(e):(Vi.copy(this.origin).addScaledVector(this.direction,t),Vi.distanceToSquared(e))}distanceSqToSegment(e,t,i,r){Ra.copy(e).add(t).multiplyScalar(.5),fs.copy(t).sub(e).normalize(),ds.copy(this.origin).sub(Ra);let o=e.distanceTo(t)*.5,s=-this.direction.dot(fs),a=ds.dot(this.direction),l=-ds.dot(fs),c=ds.lengthSq(),f=Math.abs(1-s*s),m,u,p,_;if(f>0)if(m=s*l-a,u=s*a-l,_=o*f,m>=0)if(u>=-_)if(u<=_){let S=1/f;m*=S,u*=S,p=m*(m+s*u+2*a)+u*(s*m+u+2*l)+c}else u=o,m=Math.max(0,-(s*u+a)),p=-m*m+u*(u+2*l)+c;else u=-o,m=Math.max(0,-(s*u+a)),p=-m*m+u*(u+2*l)+c;else u<=-_?(m=Math.max(0,-(-s*o+a)),u=m>0?-o:Math.min(Math.max(-o,-l),o),p=-m*m+u*(u+2*l)+c):u<=_?(m=0,u=Math.min(Math.max(-o,-l),o),p=u*(u+2*l)+c):(m=Math.max(0,-(s*o+a)),u=m>0?o:Math.min(Math.max(-o,-l),o),p=-m*m+u*(u+2*l)+c);else u=s>0?-o:o,m=Math.max(0,-(s*u+a)),p=-m*m+u*(u+2*l)+c;return i&&i.copy(this.origin).addScaledVector(this.direction,m),r&&r.copy(Ra).addScaledVector(fs,u),p}intersectSphere(e,t){if(e.radius<0)return null;Vi.subVectors(e.center,this.origin);let i=Vi.dot(this.direction),r=Vi.dot(Vi)-i*i,o=e.radius*e.radius;if(r>o)return null;let s=Math.sqrt(o-r),a=i-s,l=i+s;return l<0?null:a<0?this.at(l,t):this.at(a,t)}intersectsSphere(e){return e.radius<0?!1:this.distanceSqToPoint(e.center)<=e.radius*e.radius}distanceToPlane(e){let t=e.normal.dot(this.direction);if(t===0)return e.distanceToPoint(this.origin)===0?0:null;let i=-(this.origin.dot(e.normal)+e.constant)/t;return i>=0?i:null}intersectPlane(e,t){let i=this.distanceToPlane(e);return i===null?null:this.at(i,t)}intersectsPlane(e){let t=e.distanceToPoint(this.origin);return t===0||e.normal.dot(this.direction)*t<0}intersectBox(e,t){let i,r,o,s,a,l,c=1/this.direction.x,f=1/this.direction.y,m=1/this.direction.z,u=this.origin;return c>=0?(i=(e.min.x-u.x)*c,r=(e.max.x-u.x)*c):(i=(e.max.x-u.x)*c,r=(e.min.x-u.x)*c),f>=0?(o=(e.min.y-u.y)*f,s=(e.max.y-u.y)*f):(o=(e.max.y-u.y)*f,s=(e.min.y-u.y)*f),i>s||o>r||((o>i||isNaN(i))&&(i=o),(s<r||isNaN(r))&&(r=s),m>=0?(a=(e.min.z-u.z)*m,l=(e.max.z-u.z)*m):(a=(e.max.z-u.z)*m,l=(e.min.z-u.z)*m),i>l||a>r)||((a>i||i!==i)&&(i=a),(l<r||r!==r)&&(r=l),r<0)?null:this.at(i>=0?i:r,t)}intersectsBox(e){return this.intersectBox(e,Vi)!==null}intersectTriangle(e,t,i,r,o){let s=this.origin,a=this.direction,l=a.x,c=a.y,f=a.z,m=e.x-s.x,u=e.y-s.y,p=e.z-s.z,_=t.x-s.x,S=t.y-s.y,d=t.z-s.z,h=i.x-s.x,A=i.y-s.y,I=i.z-s.z,M=Math.abs(l),y=Math.abs(c),b=Math.abs(f),C,x,E,D,U,G,k,L,H,K,$,oe;if(M>=y&&M>=b?(E=l,G=m,H=_,oe=h,l>=0?(C=c,x=f,D=u,U=p,k=S,L=d,K=A,$=I):(C=f,x=c,D=p,U=u,k=d,L=S,K=I,$=A)):y>=b?(E=c,G=u,H=S,oe=A,c>=0?(C=f,x=l,D=p,U=m,k=d,L=_,K=I,$=h):(C=l,x=f,D=m,U=p,k=_,L=d,K=h,$=I)):(E=f,G=p,H=d,oe=I,f>=0?(C=l,x=c,D=m,U=u,k=_,L=S,K=h,$=A):(C=c,x=l,D=u,U=m,k=S,L=_,K=A,$=h)),E===0)return null;let Q=C/E,re=x/E,se=1/E,Pe=D-Q*G,Ce=U-re*G,ot=k-Q*H,Ve=L-re*H,Ye=K-Q*oe,j=$-re*oe,ne=Ye*Ve-j*ot,Se=Pe*j-Ce*Ye,Ie=ot*Ce-Ve*Pe;if(r){if(ne<0||Se<0||Ie<0)return null}else if((ne<0||Se<0||Ie<0)&&(ne>0||Se>0||Ie>0))return null;let ve=ne+Se+Ie;if(ve===0)return null;let ze=se*(ne*G+Se*H+Ie*oe);return(ve>0?ze<0:ze>0)?null:this.at(ze/ve,o)}applyMatrix4(e){return this.origin.applyMatrix4(e),this.direction.transformDirection(e),this}equals(e){return e.origin.equals(this.origin)&&e.direction.equals(this.direction)}clone(){return new this.constructor().copy(this)}};var bi=class extends Qt{constructor(e){super(),this.isMeshBasicMaterial=!0,this.type="MeshBasicMaterial",this.color=new be(16777215),this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.specularMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new hi,this.combine=Fo,this.reflectivity=1,this.refractionRatio=.98,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.lightMap=e.lightMap,this.lightMapIntensity=e.lightMapIntensity,this.aoMap=e.aoMap,this.aoMapIntensity=e.aoMapIntensity,this.specularMap=e.specularMap,this.alphaMap=e.alphaMap,this.envMap=e.envMap,this.envMapRotation.copy(e.envMapRotation),this.combine=e.combine,this.reflectivity=e.reflectivity,this.refractionRatio=e.refractionRatio,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.wireframeLinecap=e.wireframeLinecap,this.wireframeLinejoin=e.wireframeLinejoin,this.fog=e.fog,this}};var uc=new Oe,Tn=new yi,ps=new Pi,hc=new P,ms=new P,gs=new P,_s=new P,Ca=new P,xs=new P,fc=new P,vs=new P,mt=class extends it{constructor(e=new ft,t=new bi){super(),this.isMesh=!0,this.type="Mesh",this.geometry=e,this.material=t,this.morphTargetDictionary=void 0,this.morphTargetInfluences=void 0,this.count=1,this.updateMorphTargets()}copy(e,t){return super.copy(e,t),e.morphTargetInfluences!==void 0&&(this.morphTargetInfluences=e.morphTargetInfluences.slice()),e.morphTargetDictionary!==void 0&&(this.morphTargetDictionary=Object.assign({},e.morphTargetDictionary)),this.material=Array.isArray(e.material)?e.material.slice():e.material,this.geometry=e.geometry,this}updateMorphTargets(){let t=this.geometry.morphAttributes,i=Object.keys(t);if(i.length>0){let r=t[i[0]];if(r!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let o=0,s=r.length;o<s;o++){let a=r[o].name||String(o);this.morphTargetInfluences.push(0),this.morphTargetDictionary[a]=o}}}}getVertexPosition(e,t){let i=this.geometry,r=i.attributes.position,o=i.morphAttributes.position,s=i.morphTargetsRelative;t.fromBufferAttribute(r,e);let a=this.morphTargetInfluences;if(o&&a){xs.set(0,0,0);for(let l=0,c=o.length;l<c;l++){let f=a[l],m=o[l];f!==0&&(Ca.fromBufferAttribute(m,e),s?xs.addScaledVector(Ca,f):xs.addScaledVector(Ca.sub(t),f))}t.add(xs)}return t}intersectsFrustum(e){return e.intersectsObject(this)}raycast(e,t){let i=this.geometry,r=this.material,o=this.matrixWorld;r!==void 0&&(i.boundingSphere===null&&i.computeBoundingSphere(),ps.copy(i.boundingSphere),ps.applyMatrix4(o),Tn.copy(e.ray).recast(e.near),!(ps.containsPoint(Tn.origin)===!1&&(Tn.intersectSphere(ps,hc)===null||Tn.origin.distanceToSquared(hc)>(e.far-e.near)**2))&&(uc.copy(o).invert(),Tn.copy(e.ray).applyMatrix4(uc),!(i.boundingBox!==null&&Tn.intersectsBox(i.boundingBox)===!1)&&this._computeIntersections(e,t,Tn)))}_computeIntersections(e,t,i){let r,o=this.geometry,s=this.material,a=o.index,l=o.attributes.position,c=o.attributes.uv,f=o.attributes.uv1,m=o.attributes.normal,u=o.groups,p=o.drawRange;if(a!==null)if(Array.isArray(s))for(let _=0,S=u.length;_<S;_++){let d=u[_],h=s[d.materialIndex],A=Math.max(d.start,p.start),I=Math.min(a.count,Math.min(d.start+d.count,p.start+p.count));for(let M=A,y=I;M<y;M+=3){let b=a.getX(M),C=a.getX(M+1),x=a.getX(M+2);r=Ss(this,h,e,i,c,f,m,b,C,x),r&&(r.faceIndex=Math.floor(M/3),r.face.materialIndex=d.materialIndex,t.push(r))}}else{let _=Math.max(0,p.start),S=Math.min(a.count,p.start+p.count);for(let d=_,h=S;d<h;d+=3){let A=a.getX(d),I=a.getX(d+1),M=a.getX(d+2);r=Ss(this,s,e,i,c,f,m,A,I,M),r&&(r.faceIndex=Math.floor(d/3),t.push(r))}}else if(l!==void 0)if(Array.isArray(s))for(let _=0,S=u.length;_<S;_++){let d=u[_],h=s[d.materialIndex],A=Math.max(d.start,p.start),I=Math.min(l.count,Math.min(d.start+d.count,p.start+p.count));for(let M=A,y=I;M<y;M+=3){let b=M,C=M+1,x=M+2;r=Ss(this,h,e,i,c,f,m,b,C,x),r&&(r.faceIndex=Math.floor(M/3),r.face.materialIndex=d.materialIndex,t.push(r))}}else{let _=Math.max(0,p.start),S=Math.min(l.count,p.start+p.count);for(let d=_,h=S;d<h;d+=3){let A=d,I=d+1,M=d+2;r=Ss(this,s,e,i,c,f,m,A,I,M),r&&(r.faceIndex=Math.floor(d/3),t.push(r))}}}};function Tp(n,e,t,i,r,o,s,a){let l;if(e.side===gt?l=i.intersectTriangle(s,o,r,!0,a):l=i.intersectTriangle(r,o,s,e.side===li,a),l===null)return null;vs.copy(a),vs.applyMatrix4(n.matrixWorld);let c=t.ray.origin.distanceTo(vs);return c<t.near||c>t.far?null:{distance:c,point:vs.clone(),object:n}}function Ss(n,e,t,i,r,o,s,a,l,c){n.getVertexPosition(a,ms),n.getVertexPosition(l,gs),n.getVertexPosition(c,_s);let f=Tp(n,e,t,i,ms,gs,_s,fc);if(f){let m=new P;Ci.getBarycoord(fc,ms,gs,_s,m),r&&(f.uv=Ci.getInterpolatedAttribute(r,a,l,c,m,new _e)),o&&(f.uv1=Ci.getInterpolatedAttribute(o,a,l,c,m,new _e)),s&&(f.normal=Ci.getInterpolatedAttribute(s,a,l,c,m,new P),f.normal.dot(i.direction)>0&&f.normal.multiplyScalar(-1));let u={a,b:l,c,normal:new P,materialIndex:0};Ci.getNormal(ms,gs,_s,u.normal),f.face=u,f.barycoord=m}return f}var Ms=class extends St{constructor(e=null,t=1,i=1,r,o,s,a,l,c=pt,f=pt,m,u){super(null,s,a,l,c,f,r,o,m,u),this.isDataTexture=!0,this.image={data:e,width:t,height:i},this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}};var An=new Pi,Ap=new _e(.5,.5),ys=new P,an=class{constructor(e=new Vt,t=new Vt,i=new Vt,r=new Vt,o=new Vt,s=new Vt){this.planes=[e,t,i,r,o,s]}set(e,t,i,r,o,s){let a=this.planes;return a[0].copy(e),a[1].copy(t),a[2].copy(i),a[3].copy(r),a[4].copy(o),a[5].copy(s),this}copy(e){let t=this.planes;for(let i=0;i<6;i++)t[i].copy(e.planes[i]);return this}setFromProjectionMatrix(e,t=Zt,i=!1){let r=this.planes,o=e.elements,s=o[0],a=o[1],l=o[2],c=o[3],f=o[4],m=o[5],u=o[6],p=o[7],_=o[8],S=o[9],d=o[10],h=o[11],A=o[12],I=o[13],M=o[14],y=o[15];if(r[0].setComponents(c-s,p-f,h-_,y-A).normalize(),r[1].setComponents(c+s,p+f,h+_,y+A).normalize(),r[2].setComponents(c+a,p+m,h+S,y+I).normalize(),r[3].setComponents(c-a,p-m,h-S,y-I).normalize(),i)r[4].setComponents(l,u,d,M).normalize(),r[5].setComponents(c-l,p-u,h-d,y-M).normalize();else if(r[4].setComponents(c-l,p-u,h-d,y-M).normalize(),t===Zt)r[5].setComponents(c+l,p+u,h+d,y+M).normalize();else if(t===Oi)r[5].setComponents(l,u,d,M).normalize();else throw new Error("THREE.Frustum.setFromProjectionMatrix(): Invalid coordinate system: "+t);return this}intersectsObject(e){if(e.boundingSphere!==void 0)e.boundingSphere===null&&e.computeBoundingSphere(),An.copy(e.boundingSphere).applyMatrix4(e.matrixWorld);else{let t=e.geometry;t.boundingSphere===null&&t.computeBoundingSphere(),An.copy(t.boundingSphere).applyMatrix4(e.matrixWorld)}return this.intersectsSphere(An)}intersectsSprite(e){An.center.set(0,0,0);let t=Ap.distanceTo(e.center);return An.radius=.7071067811865476+t,An.applyMatrix4(e.matrixWorld),this.intersectsSphere(An)}intersectsSphere(e){let t=this.planes,i=e.center,r=-e.radius;for(let o=0;o<6;o++)if(t[o].distanceToPoint(i)<r)return!1;return!0}intersectsBox(e){let t=this.planes;for(let i=0;i<6;i++){let r=t[i];if(ys.x=r.normal.x>0?e.max.x:e.min.x,ys.y=r.normal.y>0?e.max.y:e.min.y,ys.z=r.normal.z>0?e.max.z:e.min.z,r.distanceToPoint(ys)<0)return!1}return!0}containsPoint(e){let t=this.planes;for(let i=0;i<6;i++)if(t[i].distanceToPoint(e)<0)return!1;return!0}clone(){return new this.constructor().copy(this)}};var Ei=class extends Qt{constructor(e){super(),this.isLineBasicMaterial=!0,this.type="LineBasicMaterial",this.color=new be(16777215),this.map=null,this.linewidth=1,this.linecap="round",this.linejoin="round",this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.linewidth=e.linewidth,this.linecap=e.linecap,this.linejoin=e.linejoin,this.fog=e.fog,this}};var Ts=new P,As=new P,dc=new Oe,So=new yi,bs=new Pi,Pa=new P,pc=new P,wn=class extends it{constructor(e=new ft,t=new Ei){super(),this.isLine=!0,this.type="Line",this.geometry=e,this.material=t,this.morphTargetDictionary=void 0,this.morphTargetInfluences=void 0,this.updateMorphTargets()}copy(e,t){return super.copy(e,t),this.material=Array.isArray(e.material)?e.material.slice():e.material,this.geometry=e.geometry,this}computeLineDistances(){let e=this.geometry;if(e.index===null){let t=e.attributes.position,i=[0];for(let r=1,o=t.count;r<o;r++)Ts.fromBufferAttribute(t,r-1),As.fromBufferAttribute(t,r),i[r]=i[r-1],i[r]+=Ts.distanceTo(As);e.setAttribute("lineDistance",new nt(i,1))}else xe("Line.computeLineDistances(): Computation only possible with non-indexed BufferGeometry.");return this}intersectsFrustum(e){return e.intersectsObject(this)}raycast(e,t){let i=this.geometry,r=this.matrixWorld,o=e.params.Line.threshold,s=i.drawRange;if(i.boundingSphere===null&&i.computeBoundingSphere(),bs.copy(i.boundingSphere),bs.applyMatrix4(r),bs.radius+=o,e.ray.intersectsSphere(bs)===!1)return;dc.copy(r).invert(),So.copy(e.ray).applyMatrix4(dc);let a=o/((this.scale.x+this.scale.y+this.scale.z)/3),l=a*a,c=this.isLineSegments?2:1,f=i.index,u=i.attributes.position;if(f!==null){let p=Math.max(0,s.start),_=Math.min(f.count,s.start+s.count);for(let S=p,d=_-1;S<d;S+=c){let h=f.getX(S),A=f.getX(S+1),I=Es(this,e,So,l,h,A,S);I&&t.push(I)}if(this.isLineLoop){let S=f.getX(_-1),d=f.getX(p),h=Es(this,e,So,l,S,d,_-1);h&&t.push(h)}}else{let p=Math.max(0,s.start),_=Math.min(u.count,s.start+s.count);for(let S=p,d=_-1;S<d;S+=c){let h=Es(this,e,So,l,S,S+1,S);h&&t.push(h)}if(this.isLineLoop){let S=Es(this,e,So,l,_-1,p,_-1);S&&t.push(S)}}}updateMorphTargets(){let t=this.geometry.morphAttributes,i=Object.keys(t);if(i.length>0){let r=t[i[0]];if(r!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let o=0,s=r.length;o<s;o++){let a=r[o].name||String(o);this.morphTargetInfluences.push(0),this.morphTargetDictionary[a]=o}}}}};function Es(n,e,t,i,r,o,s){let a=n.geometry.attributes.position;if(Ts.fromBufferAttribute(a,r),As.fromBufferAttribute(a,o),t.distanceSqToSegment(Ts,As,Pa,pc)>i)return;Pa.applyMatrix4(n.matrixWorld);let c=e.ray.origin.distanceTo(Pa);if(!(c<e.near||c>e.far))return{distance:c,point:pc.clone().applyMatrix4(n.matrixWorld),index:s,face:null,faceIndex:null,barycoord:null,object:n}}var mc=new P,gc=new P,Rn=class extends wn{constructor(e,t){super(e,t),this.isLineSegments=!0,this.type="LineSegments"}computeLineDistances(){let e=this.geometry;if(e.index===null){let t=e.attributes.position,i=[];for(let r=0,o=t.count;r<o;r+=2)mc.fromBufferAttribute(t,r),gc.fromBufferAttribute(t,r+1),i[r]=r===0?0:i[r-1],i[r+1]=i[r]+mc.distanceTo(gc);e.setAttribute("lineDistance",new nt(i,1))}else xe("LineSegments.computeLineDistances(): Computation only possible with non-indexed BufferGeometry.");return this}};var hr=class extends St{constructor(e=[],t=ci,i,r,o,s,a,l,c,f){super(e,t,i,r,o,s,a,l,c,f),this.isCubeTexture=!0,this.flipY=!1}get images(){return this.image}set images(e){this.image=e}};var Ti=class extends St{constructor(e,t,i=Pt,r,o,s,a=pt,l=pt,c,f=Yt,m=1){if(f!==Yt&&f!==gi)throw new Error("THREE.DepthTexture: format must be either THREE.DepthFormat or THREE.DepthStencilFormat");let u={width:e,height:t,depth:m};super(u,r,o,s,a,l,f,i,c),this.isDepthTexture=!0,this.flipY=!1,this.generateMipmaps=!1,this.compareFunction=null}copy(e){return super.copy(e),this.source=new en(Object.assign({},e.image)),this.compareFunction=e.compareFunction,this}toJSON(e){let t=super.toJSON(e);return t.compareFunction=this.compareFunction,t}};var ws=class extends Ti{constructor(e,t=Pt,i=ci,r,o,s=pt,a=pt,l,c=Yt){let f={width:e,height:e,depth:1},m=[f,f,f,f,f,f];super(e,e,t,i,r,o,s,a,l,c),this.image=m,this.isCubeDepthTexture=!0,this.isCubeTexture=!0}get images(){return this.image}set images(e){this.image=e}};var fr=class extends St{constructor(e=null){super(),this.sourceTexture=e,this.isExternalTexture=!0}copy(e){return super.copy(e),this.sourceTexture=e.sourceTexture,this}};var si=class n extends ft{constructor(e=1,t=1,i=1,r=1,o=1,s=1){super(),this.type="BoxGeometry",this.parameters={width:e,height:t,depth:i,widthSegments:r,heightSegments:o,depthSegments:s};let a=this;r=Math.floor(r),o=Math.floor(o),s=Math.floor(s);let l=[],c=[],f=[],m=[],u=0,p=0;_("z","y","x",-1,-1,i,t,e,s,o,0),_("z","y","x",1,-1,i,t,-e,s,o,1),_("x","z","y",1,1,e,i,t,r,s,2),_("x","z","y",1,-1,e,i,-t,r,s,3),_("x","y","z",1,-1,e,t,i,r,o,4),_("x","y","z",-1,-1,e,t,-i,r,o,5),this.setIndex(l),this.setAttribute("position",new nt(c,3)),this.setAttribute("normal",new nt(f,3)),this.setAttribute("uv",new nt(m,2));function _(S,d,h,A,I,M,y,b,C,x,E){let D=M/C,U=y/x,G=M/2,k=y/2,L=b/2,H=C+1,K=x+1,$=0,oe=0,Q=new P;for(let re=0;re<K;re++){let se=re*U-k;for(let Pe=0;Pe<H;Pe++){let Ce=Pe*D-G;Q[S]=Ce*A,Q[d]=se*I,Q[h]=L,c.push(Q.x,Q.y,Q.z),Q[S]=0,Q[d]=0,Q[h]=b>0?1:-1,f.push(Q.x,Q.y,Q.z),m.push(Pe/C),m.push(1-re/x),$+=1}}for(let re=0;re<x;re++)for(let se=0;se<C;se++){let Pe=u+se+H*re,Ce=u+se+H*(re+1),ot=u+(se+1)+H*(re+1),Ve=u+(se+1)+H*re;l.push(Pe,Ce,Ve),l.push(Ce,ot,Ve),oe+=6}a.addGroup(p,oe,E),p+=oe,u+=$}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new n(e.width,e.height,e.depth,e.widthSegments,e.heightSegments,e.depthSegments)}};var dr=class n extends ft{constructor(e=1,t=1,i=1,r=32,o=1,s=!1,a=0,l=Math.PI*2){super(),this.type="CylinderGeometry",this.parameters={radiusTop:e,radiusBottom:t,height:i,radialSegments:r,heightSegments:o,openEnded:s,thetaStart:a,thetaLength:l};let c=this;r=Math.floor(r),o=Math.floor(o);let f=[],m=[],u=[],p=[],_=0,S=[],d=i/2,h=0;A(),s===!1&&(e>0&&I(!0),t>0&&I(!1)),this.setIndex(f),this.setAttribute("position",new nt(m,3)),this.setAttribute("normal",new nt(u,3)),this.setAttribute("uv",new nt(p,2));function A(){let M=new P,y=new P,b=0,C=(t-e)/i;for(let x=0;x<=o;x++){let E=[],D=x/o,U=D*(t-e)+e;for(let G=0;G<=r;G++){let k=G/r,L=k*l+a,H=Math.sin(L),K=Math.cos(L);y.x=U*H,y.y=-D*i+d,y.z=U*K,m.push(y.x,y.y,y.z),M.set(H,C,K).normalize(),u.push(M.x,M.y,M.z),p.push(k,1-D),E.push(_++)}S.push(E)}for(let x=0;x<r;x++)for(let E=0;E<o;E++){let D=S[E][x],U=S[E+1][x],G=S[E+1][x+1],k=S[E][x+1];(e>0||E!==0)&&(f.push(D,U,k),b+=3),(t>0||E!==o-1)&&(f.push(U,G,k),b+=3)}c.addGroup(h,b,0),h+=b}function I(M){let y=_,b=new _e,C=new P,x=0,E=M===!0?e:t,D=M===!0?1:-1;for(let G=1;G<=r;G++)m.push(0,d*D,0),u.push(0,D,0),p.push(.5,.5),_++;let U=_;for(let G=0;G<=r;G++){let L=G/r*l+a,H=Math.cos(L),K=Math.sin(L);C.x=E*K,C.y=d*D,C.z=E*H,m.push(C.x,C.y,C.z),u.push(0,D,0),b.x=H*.5+.5,b.y=K*.5*D+.5,p.push(b.x,b.y),_++}for(let G=0;G<r;G++){let k=y+G,L=U+G;M===!0?f.push(L,L+1,k):f.push(L+1,L,k),x+=3}c.addGroup(h,x,M===!0?1:2),h+=x}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new n(e.radiusTop,e.radiusBottom,e.height,e.radialSegments,e.heightSegments,e.openEnded,e.thetaStart,e.thetaLength)}};var Rs=class n extends dr{constructor(e=1,t=1,i=32,r=1,o=!1,s=0,a=Math.PI*2){super(0,e,t,i,r,o,s,a),this.type="ConeGeometry",this.parameters={radius:e,height:t,radialSegments:i,heightSegments:r,openEnded:o,thetaStart:s,thetaLength:a}}static fromJSON(e){return new n(e.radius,e.height,e.radialSegments,e.heightSegments,e.openEnded,e.thetaStart,e.thetaLength)}};var Cs=new P,Ps=new P,La=new P,Ls=new Ci,pr=class extends ft{constructor(e=null,t=1){if(super(),this.type="EdgesGeometry",this.parameters={geometry:e,thresholdAngle:t},e!==null){let r=Math.pow(10,4),o=Math.cos(ji*t),s=e.getIndex(),a=e.getAttribute("position"),l=s?s.count:a.count,c=[0,0,0],f=["a","b","c"],m=new Array(3),u={},p=[];for(let _=0;_<l;_+=3){s?(c[0]=s.getX(_),c[1]=s.getX(_+1),c[2]=s.getX(_+2)):(c[0]=_,c[1]=_+1,c[2]=_+2);let{a:S,b:d,c:h}=Ls;if(S.fromBufferAttribute(a,c[0]),d.fromBufferAttribute(a,c[1]),h.fromBufferAttribute(a,c[2]),Ls.getNormal(La),m[0]=`${Math.round(S.x*r)},${Math.round(S.y*r)},${Math.round(S.z*r)}`,m[1]=`${Math.round(d.x*r)},${Math.round(d.y*r)},${Math.round(d.z*r)}`,m[2]=`${Math.round(h.x*r)},${Math.round(h.y*r)},${Math.round(h.z*r)}`,!(m[0]===m[1]||m[1]===m[2]||m[2]===m[0]))for(let A=0;A<3;A++){let I=(A+1)%3,M=m[A],y=m[I],b=Ls[f[A]],C=Ls[f[I]],x=`${M}_${y}`,E=`${y}_${M}`;E in u&&u[E]?(La.dot(u[E].normal)<=o&&(p.push(b.x,b.y,b.z),p.push(C.x,C.y,C.z)),u[E]=null):x in u||(u[x]={index0:c[A],index1:c[I],normal:La.clone()})}}for(let _ in u)if(u[_]){let{index0:S,index1:d}=u[_];Cs.fromBufferAttribute(a,S),Ps.fromBufferAttribute(a,d),p.push(Cs.x,Cs.y,Cs.z),p.push(Ps.x,Ps.y,Ps.z)}this.setAttribute("position",new nt(p,3))}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}};var mr=class n extends ft{constructor(e=1,t=1,i=1,r=1){super(),this.type="PlaneGeometry",this.parameters={width:e,height:t,widthSegments:i,heightSegments:r};let o=e/2,s=t/2,a=Math.floor(i),l=Math.floor(r),c=a+1,f=l+1,m=e/a,u=t/l,p=[],_=[],S=[],d=[];for(let h=0;h<f;h++){let A=h*u-s;for(let I=0;I<c;I++){let M=I*m-o;_.push(M,-A,0),S.push(0,0,1),d.push(I/a),d.push(1-h/l)}}for(let h=0;h<l;h++)for(let A=0;A<a;A++){let I=A+c*h,M=A+c*(h+1),y=A+1+c*(h+1),b=A+1+c*h;p.push(I,M,b),p.push(M,y,b)}this.setIndex(p),this.setAttribute("position",new nt(_,3)),this.setAttribute("normal",new nt(S,3)),this.setAttribute("uv",new nt(d,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new n(e.width,e.height,e.widthSegments,e.heightSegments)}};var Ds=class n extends ft{constructor(e=.5,t=1,i=32,r=1,o=0,s=Math.PI*2){super(),this.type="RingGeometry",this.parameters={innerRadius:e,outerRadius:t,thetaSegments:i,phiSegments:r,thetaStart:o,thetaLength:s},i=Math.max(3,i),r=Math.max(1,r);let a=[],l=[],c=[],f=[],m=e,u=(t-e)/r,p=new P,_=new _e;for(let S=0;S<=r;S++){for(let d=0;d<=i;d++){let h=o+d/i*s;p.x=m*Math.cos(h),p.y=m*Math.sin(h),l.push(p.x,p.y,p.z),c.push(0,0,1),_.x=(p.x/t+1)/2,_.y=(p.y/t+1)/2,f.push(_.x,_.y)}m+=u}for(let S=0;S<r;S++){let d=S*(i+1);for(let h=0;h<i;h++){let A=h+d,I=A,M=A+i+1,y=A+i+2,b=A+1;a.push(I,M,b),a.push(M,y,b)}}this.setIndex(a),this.setAttribute("position",new nt(l,3)),this.setAttribute("normal",new nt(c,3)),this.setAttribute("uv",new nt(f,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new n(e.innerRadius,e.outerRadius,e.thetaSegments,e.phiSegments,e.thetaStart,e.thetaLength)}};function Wi(n){let e={};for(let t in n){e[t]={};for(let i in n[t]){let r=n[t][i];if(_c(r))r.isRenderTargetTexture?(xe("UniformsUtils: Textures of render targets cannot be cloned via cloneUniforms() or mergeUniforms()."),e[t][i]=null):e[t][i]=r.clone();else if(Array.isArray(r))if(_c(r[0])){let o=[];for(let s=0,a=r.length;s<a;s++)o[s]=r[s].clone();e[t][i]=o}else e[t][i]=r.slice();else e[t][i]=r}}return e}function Wt(n){let e={};for(let t=0;t<n.length;t++){let i=Wi(n[t]);for(let r in i)e[r]=i[r]}return e}function _c(n){return n&&(n.isColor||n.isMatrix3||n.isMatrix4||n.isVector2||n.isVector3||n.isVector4||n.isTexture||n.isQuaternion)}function xc(n){let e=[];for(let t=0;t<n.length;t++)e.push(n[t].clone());return e}function Is(n){let e=n.getRenderTarget();return e===null?n.outputColorSpace:e.isXRRenderTarget===!0?e.texture.colorSpace:Ue.workingColorSpace}var vc={clone:Wi,merge:Wt};var Sc=`
void main() {
	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}
`;var Mc=`
void main() {
	gl_FragColor = vec4( 1.0, 0.0, 0.0, 1.0 );
}
`;var Ut=class extends Qt{constructor(e){super(),this.isShaderMaterial=!0,this.type="ShaderMaterial",this.defines={},this.uniforms={},this.uniformsGroups=[],this.vertexShader=Sc,this.fragmentShader=Mc,this.linewidth=1,this.wireframe=!1,this.wireframeLinewidth=1,this.fog=!1,this.lights=!1,this.clipping=!1,this.forceSinglePass=!0,this.extensions={clipCullDistance:!1,multiDraw:!1},this.defaultAttributeValues={color:[1,1,1],uv:[0,0],uv1:[0,0]},this.index0AttributeName=void 0,this.uniformsNeedUpdate=!1,this.glslVersion=null,e!==void 0&&this.setValues(e)}copy(e){return super.copy(e),this.fragmentShader=e.fragmentShader,this.vertexShader=e.vertexShader,this.uniforms=Wi(e.uniforms),this.uniformsGroups=xc(e.uniformsGroups),this.defines=Object.assign({},e.defines),this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.fog=e.fog,this.lights=e.lights,this.clipping=e.clipping,this.extensions=Object.assign({},e.extensions),this.glslVersion=e.glslVersion,this.defaultAttributeValues=Object.assign({},e.defaultAttributeValues),this.index0AttributeName=e.index0AttributeName,this.uniformsNeedUpdate=e.uniformsNeedUpdate,this}toJSON(e){let t=super.toJSON(e);t.glslVersion=this.glslVersion,t.uniforms={};for(let r in this.uniforms){let s=this.uniforms[r].value;s&&s.isTexture?t.uniforms[r]={type:"t",value:s.toJSON(e).uuid}:s&&s.isColor?t.uniforms[r]={type:"c",value:s.getHex()}:s&&s.isVector2?t.uniforms[r]={type:"v2",value:s.toArray()}:s&&s.isVector3?t.uniforms[r]={type:"v3",value:s.toArray()}:s&&s.isVector4?t.uniforms[r]={type:"v4",value:s.toArray()}:s&&s.isMatrix3?t.uniforms[r]={type:"m3",value:s.toArray()}:s&&s.isMatrix4?t.uniforms[r]={type:"m4",value:s.toArray()}:t.uniforms[r]={value:s}}Object.keys(this.defines).length>0&&(t.defines=this.defines),t.vertexShader=this.vertexShader,t.fragmentShader=this.fragmentShader,t.lights=this.lights,t.clipping=this.clipping;let i={};for(let r in this.extensions)this.extensions[r]===!0&&(i[r]=!0);return Object.keys(i).length>0&&(t.extensions=i),t}fromJSON(e,t){if(super.fromJSON(e,t),e.uniforms!==void 0)for(let i in e.uniforms){let r=e.uniforms[i];switch(this.uniforms[i]={},r.type){case"t":this.uniforms[i].value=t[r.value]||null;break;case"c":this.uniforms[i].value=new be().setHex(r.value);break;case"v2":this.uniforms[i].value=new _e().fromArray(r.value);break;case"v3":this.uniforms[i].value=new P().fromArray(r.value);break;case"v4":this.uniforms[i].value=new $e().fromArray(r.value);break;case"m3":this.uniforms[i].value=new Le().fromArray(r.value);break;case"m4":this.uniforms[i].value=new Oe().fromArray(r.value);break;default:this.uniforms[i].value=r.value}}if(e.defines!==void 0&&(this.defines=e.defines),e.vertexShader!==void 0&&(this.vertexShader=e.vertexShader),e.fragmentShader!==void 0&&(this.fragmentShader=e.fragmentShader),e.glslVersion!==void 0&&(this.glslVersion=e.glslVersion),e.extensions!==void 0)for(let i in e.extensions)this.extensions[i]=e.extensions[i];return e.lights!==void 0&&(this.lights=e.lights),e.clipping!==void 0&&(this.clipping=e.clipping),this}};var Ns=class extends Ut{constructor(e){super(e),this.isRawShaderMaterial=!0,this.type="RawShaderMaterial"}};var gr=class extends Qt{constructor(e){super(),this.isMeshStandardMaterial=!0,this.type="MeshStandardMaterial",this.defines={STANDARD:""},this.color=new be(16777215),this.roughness=1,this.metalness=0,this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.emissive=new be(0),this.emissiveIntensity=1,this.emissiveMap=null,this.bumpMap=null,this.bumpScale=1,this.normalMap=null,this.normalMapType=po,this.normalScale=new _e(1,1),this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.roughnessMap=null,this.metalnessMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new hi,this.envMapIntensity=1,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.flatShading=!1,this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.defines={STANDARD:""},this.color.copy(e.color),this.roughness=e.roughness,this.metalness=e.metalness,this.map=e.map,this.lightMap=e.lightMap,this.lightMapIntensity=e.lightMapIntensity,this.aoMap=e.aoMap,this.aoMapIntensity=e.aoMapIntensity,this.emissive.copy(e.emissive),this.emissiveMap=e.emissiveMap,this.emissiveIntensity=e.emissiveIntensity,this.bumpMap=e.bumpMap,this.bumpScale=e.bumpScale,this.normalMap=e.normalMap,this.normalMapType=e.normalMapType,this.normalScale.copy(e.normalScale),this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this.roughnessMap=e.roughnessMap,this.metalnessMap=e.metalnessMap,this.alphaMap=e.alphaMap,this.envMap=e.envMap,this.envMapRotation.copy(e.envMapRotation),this.envMapIntensity=e.envMapIntensity,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.wireframeLinecap=e.wireframeLinecap,this.wireframeLinejoin=e.wireframeLinejoin,this.flatShading=e.flatShading,this.fog=e.fog,this}};var Us=class extends Qt{constructor(e){super(),this.isMeshDepthMaterial=!0,this.type="MeshDepthMaterial",this.depthPacking=Ul,this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.wireframe=!1,this.wireframeLinewidth=1,this.setValues(e)}copy(e){return super.copy(e),this.depthPacking=e.depthPacking,this.map=e.map,this.alphaMap=e.alphaMap,this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this}};var Fs=class extends Qt{constructor(e){super(),this.isMeshDistanceMaterial=!0,this.type="MeshDistanceMaterial",this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.setValues(e)}copy(e){return super.copy(e),this.map=e.map,this.alphaMap=e.alphaMap,this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this}};var Cn=class extends Ei{constructor(e){super(),this.isLineDashedMaterial=!0,this.type="LineDashedMaterial",this.scale=1,this.dashSize=3,this.gapSize=1,this.setValues(e)}copy(e){return super.copy(e),this.scale=e.scale,this.dashSize=e.dashSize,this.gapSize=e.gapSize,this}};var _r=class extends it{constructor(e,t=1){super(),this.isLight=!0,this.type="Light",this.color=new be(e),this.intensity=t}copy(e,t){return super.copy(e,t),this.color.copy(e.color),this.intensity=e.intensity,this}toJSON(e){let t=super.toJSON(e);return t.object.color=this.color.getHex(),t.object.intensity=this.intensity,t}};var Mo=class extends _r{constructor(e,t,i){super(e,i),this.isHemisphereLight=!0,this.type="HemisphereLight",this.position.copy(it.DEFAULT_UP),this.updateMatrix(),this.groundColor=new be(t)}copy(e,t){return super.copy(e,t),this.groundColor.copy(e.groundColor),this}toJSON(e){let t=super.toJSON(e);return t.object.groundColor=this.groundColor.getHex(),t}};var Da=new Oe,yc=new P,bc=new P,Os=class{constructor(e){this.camera=e,this.intensity=1,this.bias=0,this.biasNode=null,this.normalBias=0,this.radius=1,this.blurSamples=8,this.mapSize=new _e(512,512),this.mapType=vt,this.map=null,this.mapPass=null,this.matrix=new Oe,this.autoUpdate=!0,this.needsUpdate=!1,this._frustum=new an,this._frameExtents=new _e(1,1),this._viewportCount=1,this._viewports=[new $e(0,0,1,1)]}getViewportCount(){return this._viewportCount}getCamera(){return this.camera}getFrustum(){return this._frustum}updateMatrices(e){let t=this.camera;yc.setFromMatrixPosition(e.matrixWorld),t.position.copy(yc),bc.setFromMatrixPosition(e.target.matrixWorld),t.lookAt(bc),t.updateMatrixWorld(),this._updateMatrix(t,this.matrix,this._frustum)}_updateMatrix(e,t,i,r){Da.multiplyMatrices(e.projectionMatrix,e.matrixWorldInverse),i.setFromProjectionMatrix(Da,e.coordinateSystem,e.reversedDepth);let o=this._frameExtents,s=r?r.z/o.x:1,a=r?r.w/o.y:1,l=r?r.x/o.x:0,c=r?r.y/o.y:0;e.coordinateSystem===Oi||e.reversedDepth?t.set(.5*s,0,0,.5*s+l,0,.5*a,0,.5*a+c,0,0,1,0,0,0,0,1):t.set(.5*s,0,0,.5*s+l,0,.5*a,0,.5*a+c,0,0,.5,.5,0,0,0,1),t.multiply(Da)}getViewport(e){return this._viewports[e]}getFrameExtents(){return this._frameExtents}dispose(){this.map&&this.map.dispose(),this.mapPass&&this.mapPass.dispose()}copy(e){return this.camera=e.camera.clone(),this.intensity=e.intensity,this.bias=e.bias,this.radius=e.radius,this.autoUpdate=e.autoUpdate,this.needsUpdate=e.needsUpdate,this.normalBias=e.normalBias,this.blurSamples=e.blurSamples,this.mapSize.copy(e.mapSize),this.biasNode=e.biasNode,this}clone(){return new this.constructor().copy(this)}toJSON(){let e={};return e.intensity=this.intensity,e.bias=this.bias,e.normalBias=this.normalBias,e.radius=this.radius,e.blurSamples=this.blurSamples,e.mapSize=this.mapSize.toArray(),e.camera=this.camera.toJSON(!1).object,delete e.camera.matrix,e}};var Bs=new P,Gs=new kt,Li=new P,xr=class extends it{constructor(){super(),this.isCamera=!0,this.type="Camera",this.matrixWorldInverse=new Oe,this.projectionMatrix=new Oe,this.projectionMatrixInverse=new Oe,this.coordinateSystem=Zt,this._reversedDepth=!1}get reversedDepth(){return this._reversedDepth}copy(e,t){return super.copy(e,t),this.matrixWorldInverse.copy(e.matrixWorldInverse),this.projectionMatrix.copy(e.projectionMatrix),this.projectionMatrixInverse.copy(e.projectionMatrixInverse),this.coordinateSystem=e.coordinateSystem,this}getWorldDirection(e){return super.getWorldDirection(e).negate()}updateMatrixWorld(e){super.updateMatrixWorld(e),this.matrixWorld.decompose(Bs,Gs,Li),Li.x===1&&Li.y===1&&Li.z===1?this.matrixWorldInverse.copy(this.matrixWorld).invert():this.matrixWorldInverse.compose(Bs,Gs,Li.set(1,1,1)).invert()}updateWorldMatrix(e,t,i=!1){super.updateWorldMatrix(e,t,i),this.matrixWorld.decompose(Bs,Gs,Li),Li.x===1&&Li.y===1&&Li.z===1?this.matrixWorldInverse.copy(this.matrixWorld).invert():this.matrixWorldInverse.compose(Bs,Gs,Li.set(1,1,1)).invert()}clone(){return new this.constructor().copy(this)}};var ln=new P,Ec=new _e,Tc=new _e,Et=class extends xr{constructor(e=50,t=1,i=.1,r=2e3){super(),this.isPerspectiveCamera=!0,this.type="PerspectiveCamera",this.fov=e,this.zoom=1,this.near=i,this.far=r,this.focus=10,this.aspect=t,this.view=null,this.filmGauge=35,this.filmOffset=0,this.updateProjectionMatrix()}copy(e,t){return super.copy(e,t),this.fov=e.fov,this.zoom=e.zoom,this.near=e.near,this.far=e.far,this.focus=e.focus,this.aspect=e.aspect,this.view=e.view===null?null:Object.assign({},e.view),this.filmGauge=e.filmGauge,this.filmOffset=e.filmOffset,this}setFocalLength(e){let t=.5*this.getFilmHeight()/e;this.fov=Sn*2*Math.atan(t),this.updateProjectionMatrix()}getFocalLength(){let e=Math.tan(ji*.5*this.fov);return .5*this.getFilmHeight()/e}getEffectiveFOV(){return Sn*2*Math.atan(Math.tan(ji*.5*this.fov)/this.zoom)}getFilmWidth(){return this.filmGauge*Math.min(this.aspect,1)}getFilmHeight(){return this.filmGauge/Math.max(this.aspect,1)}getViewBounds(e,t,i){ln.set(-1,-1,.5).applyMatrix4(this.projectionMatrixInverse),t.set(ln.x,ln.y).multiplyScalar(-e/ln.z),ln.set(1,1,.5).applyMatrix4(this.projectionMatrixInverse),i.set(ln.x,ln.y).multiplyScalar(-e/ln.z)}getViewSize(e,t){return this.getViewBounds(e,Ec,Tc),t.subVectors(Tc,Ec)}setViewOffset(e,t,i,r,o,s){this.aspect=e/t,this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=e,this.view.fullHeight=t,this.view.offsetX=i,this.view.offsetY=r,this.view.width=o,this.view.height=s,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){let e=this.near,t=e*Math.tan(ji*.5*this.fov)/this.zoom,i=2*t,r=this.aspect*i,o=-.5*r,s=this.view;if(this.view!==null&&this.view.enabled){let l=s.fullWidth,c=s.fullHeight;o+=s.offsetX*r/l,t-=s.offsetY*i/c,r*=s.width/l,i*=s.height/c}let a=this.filmOffset;a!==0&&(o+=e*a/this.getFilmWidth()),this.projectionMatrix.makePerspective(o,o+r,t,t-i,e,this.far,this.coordinateSystem,this.reversedDepth),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(e){let t=super.toJSON(e);return t.object.fov=this.fov,t.object.zoom=this.zoom,t.object.near=this.near,t.object.far=this.far,t.object.focus=this.focus,t.object.aspect=this.aspect,this.view!==null&&(t.object.view=Object.assign({},this.view)),t.object.filmGauge=this.filmGauge,t.object.filmOffset=this.filmOffset,t}};var cn=class extends xr{constructor(e=-1,t=1,i=1,r=-1,o=.1,s=2e3){super(),this.isOrthographicCamera=!0,this.type="OrthographicCamera",this.zoom=1,this.view=null,this.left=e,this.right=t,this.top=i,this.bottom=r,this.near=o,this.far=s,this.updateProjectionMatrix()}copy(e,t){return super.copy(e,t),this.left=e.left,this.right=e.right,this.top=e.top,this.bottom=e.bottom,this.near=e.near,this.far=e.far,this.zoom=e.zoom,this.view=e.view===null?null:Object.assign({},e.view),this}setViewOffset(e,t,i,r,o,s){this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=e,this.view.fullHeight=t,this.view.offsetX=i,this.view.offsetY=r,this.view.width=o,this.view.height=s,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){let e=(this.right-this.left)/(2*this.zoom),t=(this.top-this.bottom)/(2*this.zoom),i=(this.right+this.left)/2,r=(this.top+this.bottom)/2,o=i-e,s=i+e,a=r+t,l=r-t;if(this.view!==null&&this.view.enabled){let c=(this.right-this.left)/this.view.fullWidth/this.zoom,f=(this.top-this.bottom)/this.view.fullHeight/this.zoom;o+=c*this.view.offsetX,s=o+c*this.view.width,a-=f*this.view.offsetY,l=a-f*this.view.height}this.projectionMatrix.makeOrthographic(o,s,a,l,this.near,this.far,this.coordinateSystem,this.reversedDepth),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(e){let t=super.toJSON(e);return t.object.zoom=this.zoom,t.object.left=this.left,t.object.right=this.right,t.object.top=this.top,t.object.bottom=this.bottom,t.object.near=this.near,t.object.far=this.far,this.view!==null&&(t.object.view=Object.assign({},this.view)),t}};var zs=class extends Os{constructor(){super(new cn(-5,5,5,-5,.5,500)),this.isDirectionalLightShadow=!0}};var yo=class extends _r{constructor(e,t){super(e,t),this.isDirectionalLight=!0,this.type="DirectionalLight",this.position.copy(it.DEFAULT_UP),this.updateMatrix(),this.target=new it,this.shadow=new zs}dispose(){super.dispose(),this.shadow.dispose()}copy(e){return super.copy(e),this.target=e.target.clone(),this.shadow=e.shadow.clone(),this}toJSON(e){let t=super.toJSON(e);return t.object.shadow=this.shadow.toJSON(),t.object.target=this.target.uuid,t}};var vr=-90,Sr=1,ks=class extends it{constructor(e,t,i){super(),this.type="CubeCamera",this.renderTarget=i,this.coordinateSystem=null,this.activeMipmapLevel=0;let r=new Et(vr,Sr,e,t);r.layers=this.layers,this.add(r);let o=new Et(vr,Sr,e,t);o.layers=this.layers,this.add(o);let s=new Et(vr,Sr,e,t);s.layers=this.layers,this.add(s);let a=new Et(vr,Sr,e,t);a.layers=this.layers,this.add(a);let l=new Et(vr,Sr,e,t);l.layers=this.layers,this.add(l);let c=new Et(vr,Sr,e,t);c.layers=this.layers,this.add(c)}updateCoordinateSystem(){let e=this.coordinateSystem,t=this.children.concat(),[i,r,o,s,a,l]=t;for(let c of t)this.remove(c);if(e===Zt)i.up.set(0,1,0),i.lookAt(1,0,0),r.up.set(0,1,0),r.lookAt(-1,0,0),o.up.set(0,0,-1),o.lookAt(0,1,0),s.up.set(0,0,1),s.lookAt(0,-1,0),a.up.set(0,1,0),a.lookAt(0,0,1),l.up.set(0,1,0),l.lookAt(0,0,-1);else if(e===Oi)i.up.set(0,-1,0),i.lookAt(-1,0,0),r.up.set(0,-1,0),r.lookAt(1,0,0),o.up.set(0,0,1),o.lookAt(0,1,0),s.up.set(0,0,-1),s.lookAt(0,-1,0),a.up.set(0,-1,0),a.lookAt(0,0,1),l.up.set(0,-1,0),l.lookAt(0,0,-1);else throw new Error("THREE.CubeCamera.updateCoordinateSystem(): Invalid coordinate system: "+e);for(let c of t)this.add(c),c.updateMatrixWorld()}update(e,t){this.parent===null&&this.updateMatrixWorld();let{renderTarget:i,activeMipmapLevel:r}=this;this.coordinateSystem!==e.coordinateSystem&&(this.coordinateSystem=e.coordinateSystem,this.updateCoordinateSystem());let[o,s,a,l,c,f]=this.children,m=e.getRenderTarget(),u=e.getActiveCubeFace(),p=e.getActiveMipmapLevel(),_=e.xr.enabled;e.xr.enabled=!1;let S=i.texture.generateMipmaps;i.texture.generateMipmaps=!1;let d=!1;e.isWebGLRenderer===!0?d=e.state.buffers.depth.getReversed():d=e.reversedDepthBuffer,e.setRenderTarget(i,0,r),d&&e.autoClear===!1&&e.clearDepth(),e.render(t,o),e.setRenderTarget(i,1,r),d&&e.autoClear===!1&&e.clearDepth(),e.render(t,s),e.setRenderTarget(i,2,r),d&&e.autoClear===!1&&e.clearDepth(),e.render(t,a),e.setRenderTarget(i,3,r),d&&e.autoClear===!1&&e.clearDepth(),e.render(t,l),e.setRenderTarget(i,4,r),d&&e.autoClear===!1&&e.clearDepth(),e.render(t,c),i.texture.generateMipmaps=S,e.setRenderTarget(i,5,r),d&&e.autoClear===!1&&e.clearDepth(),e.render(t,f),e.setRenderTarget(m,u,p),e.xr.enabled=_,i.texture.needsPMREMUpdate=!0}};var Hs=class extends Et{constructor(e=[]){super(),this.isArrayCamera=!0,this.isMultiViewCamera=!1,this.cameras=e}};var Ac=new Oe,bo=class{constructor(e,t,i=0,r=1/0){this.ray=new yi(e,t),this.near=i,this.far=r,this.camera=null,this.layers=new nn,this.params={Mesh:{},Line:{threshold:1},LOD:{},Points:{threshold:1},Sprite:{}}}set(e,t){this.ray.set(e,t)}setFromCamera(e,t){t.isPerspectiveCamera?(this.ray.origin.setFromMatrixPosition(t.matrixWorld),this.ray.direction.set(e.x,e.y,.5).unproject(t).sub(this.ray.origin).normalize(),this.camera=t):t.isOrthographicCamera?(this.ray.origin.set(e.x,e.y,t.projectionMatrix.elements[14]).unproject(t),this.ray.direction.set(0,0,-1).transformDirection(t.matrixWorld),this.camera=t):Fe("Raycaster: Unsupported camera type: "+t.type)}setFromXRController(e){return Ac.identity().extractRotation(e.matrixWorld),this.ray.origin.setFromMatrixPosition(e.matrixWorld),this.ray.direction.set(0,0,-1).applyMatrix4(Ac),this}intersectObject(e,t=!0,i=[]){return Ia(e,this,i,t),i.sort(wc),i}intersectObjects(e,t=!0,i=[]){for(let r=0,o=e.length;r<o;r++)Ia(e[r],this,i,t);return i.sort(wc),i}};function wc(n,e){return n.distance-e.distance}function Ia(n,e,t,i){let r=!0;if(n.layers.test(e.layers)&&n.raycast(e,t)===!1&&(r=!1),r===!0&&i===!0){let o=n.children;for(let s=0,a=o.length;s<a;s++)Ia(o[s],e,t,!0)}}var Mr=class{constructor(e=1,t=0,i=0){this.radius=e,this.phi=t,this.theta=i}set(e,t,i){return this.radius=e,this.phi=t,this.theta=i,this}copy(e){return this.radius=e.radius,this.phi=e.phi,this.theta=e.theta,this}makeSafe(){return this.phi=Ne(this.phi,1e-6,Math.PI-1e-6),this}setFromVector3(e){return this.setFromCartesianCoords(e.x,e.y,e.z)}setFromCartesianCoords(e,t,i){return this.radius=Math.sqrt(e*e+t*t+i*i),this.radius===0?(this.theta=0,this.phi=0):(this.theta=Math.atan2(e,i),this.phi=Math.acos(Ne(t/this.radius,-1,1))),this}clone(){return new this.constructor().copy(this)}};var Eo=class extends It{constructor(e,t=null){super(),this.object=e,this.domElement=t,this.enabled=!0,this.state=-1,this.keys={},this.mouseButtons={LEFT:null,MIDDLE:null,RIGHT:null},this.touches={ONE:null,TWO:null}}connect(e){this.domElement!==null&&this.disconnect(),this.domElement=e}disconnect(){}dispose(){}update(){}};function Na(n,e,t,i){let r=wp(i);switch(t){case $o:return n*e;case jo:return n*e/r.components*r.byteLength;case Gn:return n*e/r.components*r.byteLength;case ii:return n*e*2/r.components*r.byteLength;case zn:return n*e*2/r.components*r.byteLength;case Qo:return n*e*3/r.components*r.byteLength;case Dt:return n*e*4/r.components*r.byteLength;case kn:return n*e*4/r.components*r.byteLength;case Hn:case Vn:return Math.floor((n+3)/4)*Math.floor((e+3)/4)*8;case Wn:case Xn:return Math.floor((n+3)/4)*Math.floor((e+3)/4)*16;case Br:case zr:return Math.max(n,16)*Math.max(e,8)/4;case Or:case Gr:return Math.max(n,8)*Math.max(e,8)/2;case kr:case Hr:case Wr:case Xr:return Math.floor((n+3)/4)*Math.floor((e+3)/4)*8;case Vr:case gn:case qr:return Math.floor((n+3)/4)*Math.floor((e+3)/4)*16;case Yr:return Math.floor((n+3)/4)*Math.floor((e+3)/4)*16;case Kr:return Math.floor((n+4)/5)*Math.floor((e+3)/4)*16;case Zr:return Math.floor((n+4)/5)*Math.floor((e+4)/5)*16;case Jr:return Math.floor((n+5)/6)*Math.floor((e+4)/5)*16;case $r:return Math.floor((n+5)/6)*Math.floor((e+5)/6)*16;case Qr:return Math.floor((n+7)/8)*Math.floor((e+4)/5)*16;case jr:return Math.floor((n+7)/8)*Math.floor((e+5)/6)*16;case eo:return Math.floor((n+7)/8)*Math.floor((e+7)/8)*16;case to:return Math.floor((n+9)/10)*Math.floor((e+4)/5)*16;case io:return Math.floor((n+9)/10)*Math.floor((e+5)/6)*16;case no:return Math.floor((n+9)/10)*Math.floor((e+7)/8)*16;case ro:return Math.floor((n+9)/10)*Math.floor((e+9)/10)*16;case oo:return Math.floor((n+11)/12)*Math.floor((e+9)/10)*16;case so:return Math.floor((n+11)/12)*Math.floor((e+11)/12)*16;case ao:case lo:case co:return Math.ceil(n/4)*Math.ceil(e/4)*16;case uo:case ho:return Math.ceil(n/4)*Math.ceil(e/4)*8;case _n:case fo:return Math.ceil(n/4)*Math.ceil(e/4)*16}throw new Error(`Unable to determine texture byte length for ${t} format.`)}function wp(n){switch(n){case vt:case Yo:return{byteLength:1,components:1};case Ui:case Ko:case Lt:return{byteLength:2,components:1};case On:case Bn:return{byteLength:2,components:4};case Pt:case Fn:case Ot:return{byteLength:4,components:1};case Zo:case Jo:return{byteLength:4,components:3}}throw new Error(`THREE.TextureUtils: Unknown texture type ${n}.`)}typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("register",{detail:{revision:"186"}}));typeof window<"u"&&(window.__THREE__?xe("WARNING: Multiple instances of Three.js being imported."):window.__THREE__="186");function Vs(){let n=null,e=!1,t=null,i=null;function r(o,s){i=n.requestAnimationFrame(r),t(o,s)}return{start:function(){e!==!0&&t!==null&&n!==null&&(i=n.requestAnimationFrame(r),e=!0)},stop:function(){n!==null&&n.cancelAnimationFrame(i),e=!1},setAnimationLoop:function(o){t=o},setContext:function(o){n=o}}}function Rc(n){let e=new WeakMap;function t(a,l){let c=a.array,f=a.usage,m=c.byteLength,u=n.createBuffer();n.bindBuffer(l,u),n.bufferData(l,c,f),a.onUploadCallback();let p;if(c instanceof Float32Array)p=n.FLOAT;else if(typeof Float16Array<"u"&&c instanceof Float16Array)p=n.HALF_FLOAT;else if(c instanceof Uint16Array)a.isFloat16BufferAttribute?p=n.HALF_FLOAT:p=n.UNSIGNED_SHORT;else if(c instanceof Int16Array)p=n.SHORT;else if(c instanceof Uint32Array)p=n.UNSIGNED_INT;else if(c instanceof Int32Array)p=n.INT;else if(c instanceof Int8Array)p=n.BYTE;else if(c instanceof Uint8Array)p=n.UNSIGNED_BYTE;else if(c instanceof Uint8ClampedArray)p=n.UNSIGNED_BYTE;else throw new Error("THREE.WebGLAttributes: Unsupported buffer data format: "+c);return{buffer:u,type:p,bytesPerElement:c.BYTES_PER_ELEMENT,version:a.version,size:m}}function i(a,l,c){let f=l.array,m=l.updateRanges;if(n.bindBuffer(c,a),m.length===0)n.bufferSubData(c,0,f);else{m.sort((p,_)=>p.start-_.start);let u=0;for(let p=1;p<m.length;p++){let _=m[u],S=m[p];S.start<=_.start+_.count+1?_.count=Math.max(_.count,S.start+S.count-_.start):(++u,m[u]=S)}m.length=u+1;for(let p=0,_=m.length;p<_;p++){let S=m[p];n.bufferSubData(c,S.start*f.BYTES_PER_ELEMENT,f,S.start,S.count)}l.clearUpdateRanges()}l.onUploadCallback()}function r(a){return a.isInterleavedBufferAttribute&&(a=a.data),e.get(a)}function o(a){a.isInterleavedBufferAttribute&&(a=a.data);let l=e.get(a);l&&(n.deleteBuffer(l.buffer),e.delete(a))}function s(a,l){if(a.isInterleavedBufferAttribute&&(a=a.data),a.isGLBufferAttribute){let f=e.get(a);(!f||f.version<a.version)&&e.set(a,{buffer:a.buffer,type:a.type,bytesPerElement:a.elementSize,version:a.version});return}let c=e.get(a);if(c===void 0)e.set(a,t(a,l));else if(c.version<a.version){if(c.size!==a.array.byteLength)throw new Error("THREE.WebGLAttributes: The size of the buffer attribute's array buffer does not match the original size. Resizing buffer attributes is not supported.");i(c.buffer,a,l),c.version=a.version}}return{get:r,remove:o,update:s}}var Cc=`
#ifdef USE_ALPHAHASH

	if ( diffuseColor.a < getAlphaHashThreshold( vPosition ) ) discard;

#endif
`;var Pc=`
#ifdef USE_ALPHAHASH

	/**
	 * See: https://casual-effects.com/research/Wyman2017Hashed/index.html
	 */

	const float ALPHA_HASH_SCALE = 0.05; // Derived from trials only, and may be changed.

	float hash2D( vec2 value ) {

		return fract( 1.0e4 * sin( 17.0 * value.x + 0.1 * value.y ) * ( 0.1 + abs( sin( 13.0 * value.y + value.x ) ) ) );

	}

	float hash3D( vec3 value ) {

		return hash2D( vec2( hash2D( value.xy ), value.z ) );

	}

	float getAlphaHashThreshold( vec3 position ) {

		// Find the discretized derivatives of our coordinates
		float maxDeriv = max(
			length( dFdx( position.xyz ) ),
			length( dFdy( position.xyz ) )
		);
		float pixScale = 1.0 / ( ALPHA_HASH_SCALE * maxDeriv );

		// Find two nearest log-discretized noise scales
		vec2 pixScales = vec2(
			exp2( floor( log2( pixScale ) ) ),
			exp2( ceil( log2( pixScale ) ) )
		);

		// Compute alpha thresholds at our two noise scales
		vec2 alpha = vec2(
			hash3D( floor( pixScales.x * position.xyz ) ),
			hash3D( floor( pixScales.y * position.xyz ) )
		);

		// Factor to interpolate lerp with
		float lerpFactor = fract( log2( pixScale ) );

		// Interpolate alpha threshold from noise at two scales
		float x = ( 1.0 - lerpFactor ) * alpha.x + lerpFactor * alpha.y;

		// Pass into CDF to compute uniformly distrib threshold
		float a = min( lerpFactor, 1.0 - lerpFactor );
		vec3 cases = vec3(
			x * x / ( 2.0 * a * ( 1.0 - a ) ),
			( x - 0.5 * a ) / ( 1.0 - a ),
			1.0 - ( ( 1.0 - x ) * ( 1.0 - x ) / ( 2.0 * a * ( 1.0 - a ) ) )
		);

		// Find our final, uniformly distributed alpha threshold (\u03B1\u03C4)
		float threshold = ( x < ( 1.0 - a ) )
			? ( ( x < a ) ? cases.x : cases.y )
			: cases.z;

		// Avoids \u03B1\u03C4 == 0. Could also do \u03B1\u03C4 =1-\u03B1\u03C4
		return clamp( threshold , 1.0e-6, 1.0 );

	}

#endif
`;var Lc=`
#ifdef USE_ALPHAMAP

	diffuseColor.a *= texture2D( alphaMap, vAlphaMapUv ).g;

#endif
`;var Dc=`
#ifdef USE_ALPHAMAP

	uniform sampler2D alphaMap;

#endif
`;var Ic=`
#ifdef USE_ALPHATEST

	#ifdef ALPHA_TO_COVERAGE

	diffuseColor.a = smoothstep( alphaTest, alphaTest + fwidth( diffuseColor.a ), diffuseColor.a );
	if ( diffuseColor.a == 0.0 ) discard;

	#else

	if ( diffuseColor.a < alphaTest ) discard;

	#endif

#endif
`;var Nc=`
#ifdef USE_ALPHATEST
	uniform float alphaTest;
#endif
`;var Uc=`
#ifdef USE_AOMAP

	// reads channel R, compatible with a combined OcclusionRoughnessMetallic (RGB) texture
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
`;var Fc=`
#ifdef USE_AOMAP

	uniform sampler2D aoMap;
	uniform float aoMapIntensity;

#endif
`;var Oc=`
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
`;var Bc=`
#ifdef USE_BATCHING
	mat4 batchingMatrix = getBatchingMatrix( getIndirectIndex( gl_DrawID ) );
#endif
`;var Gc=`
vec3 transformed = vec3( position );

#ifdef USE_ALPHAHASH

	vPosition = vec3( position );

#endif
`;var zc=`
vec3 objectNormal = vec3( normal );

#ifdef USE_TANGENT

	vec3 objectTangent = vec3( tangent.xyz );

#endif
`;var kc=`

float G_BlinnPhong_Implicit( /* const in float dotNL, const in float dotNV */ ) {

	// geometry term is (n dot l)(n dot v) / 4(n dot l)(n dot v)
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

	float G = G_BlinnPhong_Implicit( /* dotNL, dotNV */ );

	float D = D_BlinnPhong( shininess, dotNH );

	return F * ( G * D );

} // validated

`;var Hc=`

#ifdef USE_IRIDESCENCE

	// XYZ to linear-sRGB color space
	const mat3 XYZ_TO_REC709 = mat3(
		 3.2404542, -0.9692660,  0.0556434,
		-1.5371385,  1.8760108, -0.2040259,
		-0.4985314,  0.0415560,  1.0572252
	);

	// Assume air interface for top
	// Note: We don't handle the case fresnel0 == 1
	vec3 Fresnel0ToIor( vec3 fresnel0 ) {

		vec3 sqrtF0 = sqrt( fresnel0 );
		return ( vec3( 1.0 ) + sqrtF0 ) / ( vec3( 1.0 ) - sqrtF0 );

	}

	// Conversion FO/IOR
	vec3 IorToFresnel0( vec3 transmittedIor, float incidentIor ) {

		return pow2( ( transmittedIor - vec3( incidentIor ) ) / ( transmittedIor + vec3( incidentIor ) ) );

	}

	// ior is a value between 1.0 and 3.0. 1.0 is air interface
	float IorToFresnel0( float transmittedIor, float incidentIor ) {

		return pow2( ( transmittedIor - incidentIor ) / ( transmittedIor + incidentIor ));

	}

	// Fresnel equations for dielectric/dielectric interfaces.
	// Ref: https://belcour.github.io/blog/research/2017/05/01/brdf-thin-film.html
	// Evaluation XYZ sensitivity curves in Fourier space
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

		// Force iridescenceIOR -> outsideIOR when thinFilmThickness -> 0.0
		float iridescenceIOR = mix( outsideIOR, eta2, smoothstep( 0.0, 0.03, thinFilmThickness ) );
		// Evaluate the cosTheta on the base layer (Snell law)
		float sinTheta2Sq = pow2( outsideIOR / iridescenceIOR ) * ( 1.0 - pow2( cosTheta1 ) );

		// Handle TIR:
		float cosTheta2Sq = 1.0 - sinTheta2Sq;
		if ( cosTheta2Sq < 0.0 ) {

			return vec3( 1.0 );

		}

		float cosTheta2 = sqrt( cosTheta2Sq );

		// First interface
		float R0 = IorToFresnel0( iridescenceIOR, outsideIOR );
		float R12 = F_Schlick( R0, 1.0, cosTheta1 );
		float T121 = 1.0 - R12;
		float phi12 = 0.0;
		if ( iridescenceIOR < outsideIOR ) phi12 = PI;
		float phi21 = PI - phi12;

		// Second interface
		vec3 baseIOR = Fresnel0ToIor( clamp( baseF0, 0.0, 0.9999 ) ); // guard against 1.0
		vec3 R1 = IorToFresnel0( baseIOR, iridescenceIOR );
		vec3 R23 = F_Schlick( R1, 1.0, cosTheta2 );
		vec3 phi23 = vec3( 0.0 );
		if ( baseIOR[ 0 ] < iridescenceIOR ) phi23[ 0 ] = PI;
		if ( baseIOR[ 1 ] < iridescenceIOR ) phi23[ 1 ] = PI;
		if ( baseIOR[ 2 ] < iridescenceIOR ) phi23[ 2 ] = PI;

		// Phase shift
		float OPD = 2.0 * iridescenceIOR * thinFilmThickness * cosTheta2;
		vec3 phi = vec3( phi21 ) + phi23;

		// Compound terms
		vec3 R123 = clamp( R12 * R23, 1e-5, 0.9999 );
		vec3 r123 = sqrt( R123 );
		vec3 Rs = pow2( T121 ) * R23 / ( vec3( 1.0 ) - R123 );

		// Reflectance term for m = 0 (DC term amplitude)
		vec3 C0 = R12 + Rs;
		I = C0;

		// Reflectance term for m > 0 (pairs of diracs)
		vec3 Cm = Rs - T121;
		for ( int m = 1; m <= 2; ++ m ) {

			Cm *= r123;
			vec3 Sm = 2.0 * evalSensitivity( float( m ) * OPD, float( m ) * phi );
			I += Cm * Sm;

		}

		// Since out of gamut colors might be produced, negative color values are clamped to 0.
		return max( I, vec3( 0.0 ) );

	}

#endif

`;var Vc=`
#ifdef USE_BUMPMAP

	uniform sampler2D bumpMap;
	uniform float bumpScale;

	// Bump Mapping Unparametrized Surfaces on the GPU by Morten S. Mikkelsen
	// https://mmikk.github.io/papers3d/mm_sfgrad_bump.pdf

	// Evaluate the derivative of the height w.r.t. screen-space using forward differencing (listing 2)

	vec2 dHdxy_fwd() {

		vec2 dSTdx = dFdx( vBumpMapUv );
		vec2 dSTdy = dFdy( vBumpMapUv );

		float Hll = bumpScale * texture2D( bumpMap, vBumpMapUv ).x;
		float dBx = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdx ).x - Hll;
		float dBy = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdy ).x - Hll;

		return vec2( dBx, dBy );

	}

	vec3 perturbNormalArb( vec3 surf_pos, vec3 surf_norm, vec2 dHdxy, float faceDirection ) {

		// normalize is done to ensure that the bump map looks the same regardless of the texture's scale
		vec3 vSigmaX = normalize( dFdx( surf_pos.xyz ) );
		vec3 vSigmaY = normalize( dFdy( surf_pos.xyz ) );
		vec3 vN = surf_norm; // normalized

		vec3 R1 = cross( vSigmaY, vN );
		vec3 R2 = cross( vN, vSigmaX );

		float fDet = dot( vSigmaX, R1 ) * faceDirection;

		vec3 vGrad = sign( fDet ) * ( dHdxy.x * R1 + dHdxy.y * R2 );
		return normalize( abs( fDet ) * surf_norm - vGrad );

	}

#endif
`;var Wc=`
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
`;var Xc=`
#if NUM_CLIPPING_PLANES > 0

	varying vec3 vClipPosition;

	uniform vec4 clippingPlanes[ NUM_CLIPPING_PLANES ];

#endif
`;var qc=`
#if NUM_CLIPPING_PLANES > 0

	varying vec3 vClipPosition;

#endif
`;var Yc=`
#if NUM_CLIPPING_PLANES > 0

	vClipPosition = - mvPosition.xyz;

#endif
`;var Kc=`
#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA )

	diffuseColor *= vColor;

#endif
`;var Zc=`
#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA )

	varying vec4 vColor;

#endif
`;var Jc=`
#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )

	varying vec4 vColor;

#endif
`;var $c=`
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
`;var Qc=`
#define PI 3.141592653589793
#define PI2 6.283185307179586
#define PI_HALF 1.5707963267948966
#define RECIPROCAL_PI 0.3183098861837907
#define RECIPROCAL_PI2 0.15915494309189535
#define EPSILON 1e-6

#ifndef saturate
// <tonemapping_pars_fragment> may have defined saturate() already
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
#define whiteComplement( a ) ( 1.0 - saturate( a ) )

float pow2( const in float x ) { return x*x; }
vec3 pow2( const in vec3 x ) { return x*x; }
float pow3( const in float x ) { return x*x*x; }
float pow4( const in float x ) { float x2 = x*x; return x2*x2; }
float max3( const in vec3 v ) { return max( max( v.x, v.y ), v.z ); }
float average( const in vec3 v ) { return dot( v, vec3( 0.3333333 ) ); }

// expects values in the range of [0,1]x[0,1], returns values in the [0,1] range.
// do not collapse into a single function per: http://byteblacksmith.com/improvements-to-the-canonical-one-liner-glsl-rand-for-opengl-es-2-0/
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

#define inverseTransformDirection transformDirectionByInverseViewMatrix // @deprecated r185

vec3 transformNormalByInverseViewMatrix( in vec3 normal, in mat4 viewMatrix ) {

	// upper-left 3x3 of view matrix is assumed to be orthogonal

	return normalize( ( vec4( normal, 0.0 ) * viewMatrix ).xyz );

}

vec3 transformDirectionByInverseViewMatrix( in vec3 dir, in mat4 viewMatrix ) {

	// upper-left 3x3 of view matrix is assumed to be orthogonal

	return normalize( ( vec4( dir, 0.0 ) * viewMatrix ).xyz );

}

bool isPerspectiveMatrix( mat4 m ) {

	return m[ 2 ][ 3 ] == - 1.0;

}

vec2 equirectUv( in vec3 dir ) {

	// dir is assumed to be unit length

	float u = atan( dir.z, dir.x ) * RECIPROCAL_PI2 + 0.5;

	float v = asin( clamp( dir.y, - 1.0, 1.0 ) ) * RECIPROCAL_PI + 0.5;

	return vec2( u, v );

}

vec3 BRDF_Lambert( const in vec3 diffuseColor ) {

	return RECIPROCAL_PI * diffuseColor;

} // validated

vec3 F_Schlick( const in vec3 f0, const in float f90, const in float dotVH ) {

	// Original approximation by Christophe Schlick '94
	// float fresnel = pow( 1.0 - dotVH, 5.0 );

	// Optimized variant (presented by Epic at SIGGRAPH '13)
	// https://cdn2.unrealengine.com/Resources/files/2013SiggraphPresentationsNotes-26915738.pdf
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );

	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );

} // validated

float F_Schlick( const in float f0, const in float f90, const in float dotVH ) {

	// Original approximation by Christophe Schlick '94
	// float fresnel = pow( 1.0 - dotVH, 5.0 );

	// Optimized variant (presented by Epic at SIGGRAPH '13)
	// https://cdn2.unrealengine.com/Resources/files/2013SiggraphPresentationsNotes-26915738.pdf
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );

	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );

} // validated
`;var jc=`
#ifdef ENVMAP_TYPE_CUBE_UV

	#define cubeUV_minMipLevel 4.0
	#define cubeUV_minTileSize 16.0

	// These shader functions convert between the UV coordinates of a single face of
	// a cubemap, the 0-5 integer index of a cube face, and the direction vector for
	// sampling a textureCube (not generally normalized ).

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

	// RH coordinate system; PMREM face-indexing convention
	vec2 getUV( vec3 direction, float face ) {

		vec2 uv;

		if ( face == 0.0 ) {

			uv = vec2( direction.z, direction.y ) / abs( direction.x ); // pos x

		} else if ( face == 1.0 ) {

			uv = vec2( - direction.x, - direction.z ) / abs( direction.y ); // pos y

		} else if ( face == 2.0 ) {

			uv = vec2( - direction.x, direction.y ) / abs( direction.z ); // pos z

		} else if ( face == 3.0 ) {

			uv = vec2( - direction.z, direction.y ) / abs( direction.x ); // neg x

		} else if ( face == 4.0 ) {

			uv = vec2( - direction.x, direction.z ) / abs( direction.y ); // neg y

		} else {

			uv = vec2( direction.x, direction.y ) / abs( direction.z ); // neg z

		}

		return 0.5 * ( uv + 1.0 );

	}

	vec3 bilinearCubeUV( sampler2D envMap, vec3 direction, float mipInt ) {

		float face = getFace( direction );

		float filterInt = max( cubeUV_minMipLevel - mipInt, 0.0 );

		mipInt = max( mipInt, cubeUV_minMipLevel );

		float faceSize = exp2( mipInt );

		highp vec2 uv = getUV( direction, face ) * ( faceSize - 2.0 ) + 1.0; // #25071

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

			return texture2DGradEXT( envMap, uv, vec2( 0.0 ), vec2( 0.0 ) ).rgb; // disable anisotropic filtering

		#else

			return texture2D( envMap, uv ).rgb;

		#endif

	}

	// These defines must match with PMREMGenerator

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

			mip = - 2.0 * log2( 1.16 * roughness ); // 1.16 = 1.79^0.25
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
`;var eu=`

vec3 transformedNormal = objectNormal;
#ifdef USE_TANGENT

	vec3 transformedTangent = objectTangent;

#endif

#ifdef USE_BATCHING

	// this is in lieu of a per-instance normal-matrix
	// non-uniform scaling in the instance matrix is supported
	// shear transforms are not supported

	mat3 bm = mat3( batchingMatrix );
	transformedNormal /= vec3( dot( bm[ 0 ], bm[ 0 ] ), dot( bm[ 1 ], bm[ 1 ] ), dot( bm[ 2 ], bm[ 2 ] ) );
	transformedNormal = bm * transformedNormal;

	#ifdef USE_TANGENT

		transformedTangent = bm * transformedTangent;

	#endif

#endif

#ifdef USE_INSTANCING

	// this is in lieu of a per-instance normal-matrix
	// non-uniform scaling in the instance matrix is supported
	// shear transforms are not supported

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
`;var tu=`
#ifdef USE_DISPLACEMENTMAP

	uniform sampler2D displacementMap;
	uniform float displacementScale;
	uniform float displacementBias;

#endif
`;var iu=`
#ifdef USE_DISPLACEMENTMAP

	transformed += normalize( objectNormal ) * ( texture2D( displacementMap, vDisplacementMapUv ).x * displacementScale + displacementBias );

#endif
`;var nu=`
#ifdef USE_EMISSIVEMAP

	vec4 emissiveColor = texture2D( emissiveMap, vEmissiveMapUv );

	#ifdef DECODE_VIDEO_TEXTURE_EMISSIVE

		// use inline sRGB decode until browsers properly support SRGB8_ALPHA8 with video textures (#26516)

		emissiveColor = sRGBTransferEOTF( emissiveColor );

	#endif

	totalEmissiveRadiance *= emissiveColor.rgb;

#endif
`;var ru=`
#ifdef USE_EMISSIVEMAP

	uniform sampler2D emissiveMap;

#endif
`;var ou=`
gl_FragColor = linearToOutputTexel( gl_FragColor );
`;var su=`

vec4 LinearTransferOETF( in vec4 value ) {
	return value;
}

vec4 sRGBTransferEOTF( in vec4 value ) {
	return vec4( mix( pow( value.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), value.rgb * 0.0773993808, vec3( lessThanEqual( value.rgb, vec3( 0.04045 ) ) ) ), value.a );
}

vec4 sRGBTransferOETF( in vec4 value ) {
	return vec4( mix( pow( value.rgb, vec3( 0.41666 ) ) * 1.055 - vec3( 0.055 ), value.rgb * 12.92, vec3( lessThanEqual( value.rgb, vec3( 0.0031308 ) ) ) ), value.a );
}

`;var au=`
#ifdef USE_ENVMAP

	#ifdef ENV_WORLDPOS

		vec3 cameraToFrag;

		if ( isOrthographic ) {

			cameraToFrag = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );

		} else {

			cameraToFrag = normalize( vWorldPosition - cameraPosition );

		}

		// Transforming Normal Vectors with the Inverse Transformation
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
`;var lu=`
#ifdef USE_ENVMAP

	uniform float envMapIntensity;
	uniform mat3 envMapRotation;

	#ifdef ENVMAP_TYPE_CUBE
		uniform samplerCube envMap;
	#else
		uniform sampler2D envMap;
	#endif

#endif
`;var cu=`
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
`;var uu=`
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
`;var hu=`
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
`;var fu=`
#ifdef USE_FOG

	vFogDepth = - mvPosition.z;

#endif
`;var du=`
#ifdef USE_FOG

	varying float vFogDepth;

#endif
`;var pu=`
#ifdef USE_FOG

	#ifdef FOG_EXP2

		float fogFactor = 1.0 - exp( - fogDensity * fogDensity * vFogDepth * vFogDepth );

	#else

		float fogFactor = smoothstep( fogNear, fogFar, vFogDepth );

	#endif

	gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );

#endif
`;var mu=`
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
`;var gu=`

#ifdef USE_GRADIENTMAP

	uniform sampler2D gradientMap;

#endif

vec3 getGradientIrradiance( vec3 normal, vec3 lightDirection ) {

	// dotNL will be from -1.0 to 1.0
	float dotNL = dot( normal, lightDirection );
	vec2 coord = vec2( dotNL * 0.5 + 0.5, 0.0 );

	#ifdef USE_GRADIENTMAP

		return vec3( texture2D( gradientMap, coord ).r );

	#else

		vec2 fw = fwidth( coord ) * 0.5;
		return mix( vec3( 0.7 ), vec3( 1.0 ), smoothstep( 0.7 - fw.x, 0.7 + fw.x, coord.x ) );

	#endif

}
`;var _u=`
#ifdef USE_LIGHTMAP

	uniform sampler2D lightMap;
	uniform float lightMapIntensity;

#endif
`;var xu=`
LambertMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularStrength = specularStrength;
`;var vu=`
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

#define RE_Direct				RE_Direct_Lambert
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Lambert
`;var Su=`
uniform bool receiveShadow;
uniform vec3 ambientLightColor;

#if defined( USE_LIGHT_PROBES )

	uniform vec3 lightProbe[ 9 ];

#endif

// get the irradiance (radiance convolved with cosine lobe) at the point 'normal' on the unit sphere
// source: https://graphics.stanford.edu/papers/envmap/envmap.pdf
vec3 shGetIrradianceAt( in vec3 normal, in vec3 shCoefficients[ 9 ] ) {

	// normal is assumed to have unit length

	float x = normal.x, y = normal.y, z = normal.z;

	// band 0
	vec3 result = shCoefficients[ 0 ] * 0.886227;

	// band 1
	result += shCoefficients[ 1 ] * 2.0 * 0.511664 * y;
	result += shCoefficients[ 2 ] * 2.0 * 0.511664 * z;
	result += shCoefficients[ 3 ] * 2.0 * 0.511664 * x;

	// band 2
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

	// based upon Frostbite 3 Moving to Physically-based Rendering
	// page 32, equation 26: E[window1]
	// https://seblagarde.files.wordpress.com/2015/07/course_notes_moving_frostbite_to_pbr_v32.pdf
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

	// light is an out parameter as having it as a return value caused compiler errors on some devices
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

	// light is an out parameter as having it as a return value caused compiler errors on some devices
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

	// Pre-computed values of LinearTransformedCosine approximation of BRDF
	// BRDF approximation Texture is 64x64
	uniform sampler2D ltc_1; // RGBA Float
	uniform sampler2D ltc_2; // RGBA Float

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
`;var Mu=`
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

			// Mixing the reflection with the normal is more accurate and keeps rough objects from gathering light from behind their tangent plane.
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

				// The retroreflective lobe returns light toward its source, so the environment is sampled along the view direction
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

			  // https://google.github.io/filament/Filament.md.html#lighting/imagebasedlights/anisotropy
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

				  // https://google.github.io/filament/Filament.md.html#lighting/imagebasedlights/anisotropy
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
`;var yu=`
ToonMaterial material;
material.diffuseColor = diffuseColor.rgb;
`;var bu=`
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

#define RE_Direct				RE_Direct_Toon
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Toon
`;var Eu=`
BlinnPhongMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularColor = specular;
material.specularShininess = shininess;
material.specularStrength = specularStrength;
`;var Tu=`
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

#define RE_Direct				RE_Direct_BlinnPhong
#define RE_IndirectDiffuse		RE_IndirectDiffuse_BlinnPhong
`;var Au=`
PhysicalMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.diffuseContribution = diffuseColor.rgb * ( 1.0 - metalnessFactor );
material.metalness = metalnessFactor;

vec3 dxy = max( abs( dFdx( nonPerturbedNormal ) ), abs( dFdy( nonPerturbedNormal ) ) );
float geometryRoughness = max( max( dxy.x, dxy.y ), dxy.z );

material.roughness = max( roughnessFactor, 0.0525 );// 0.0525 corresponds to the base mip of a 256 cubemap.
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

	material.clearcoat = saturate( material.clearcoat ); // Burley clearcoat model
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

	// Roughness along the anisotropy bitangent is the material roughness, while the tangent roughness increases with anisotropy.
	material.alphaT = mix( pow2( material.roughness ), 1.0, pow2( material.anisotropy ) );

	material.anisotropyT = tbn[ 0 ] * anisotropyV.x + tbn[ 1 ] * anisotropyV.y;
	material.anisotropyB = tbn[ 1 ] * anisotropyV.x - tbn[ 0 ] * anisotropyV.y;

#endif
`;var wu=`

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

// temporary
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

// Moving Frostbite to Physically Based Rendering 3.0 - page 12, listing 2
// https://seblagarde.files.wordpress.com/2015/07/course_notes_moving_frostbite_to_pbr_v32.pdf
float V_GGX_SmithCorrelated( const in float alpha, const in float dotNL, const in float dotNV ) {

	float a2 = pow2( alpha );
	float gv = dotNL * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNV ) );
	float gl = dotNV * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNL ) );

	return 0.5 / max( gv + gl, EPSILON );

}

// Microfacet Models for Refraction through Rough Surfaces - equation (33)
// http://graphicrants.blogspot.com/2013/08/specular-brdf-reference.html
// alpha is "roughness squared" in Disney\u2019s reparameterization
float D_GGX( const in float alpha, const in float dotNH ) {

	float a2 = pow2( alpha );

	float denom = pow2( dotNH ) * ( a2 - 1.0 ) + 1.0; // avoid alpha = 0 with dotNH = 1

	return RECIPROCAL_PI * a2 / pow2( denom );

}

// https://google.github.io/filament/Filament.md.html#materialsystem/anisotropicmodel/anisotropicspecularbrdf
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

	// GGX Distribution, Schlick Fresnel, GGX_SmithCorrelated Visibility
	vec3 BRDF_GGX_Clearcoat( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material) {

		vec3 f0 = material.clearcoatF0;
		float f90 = material.clearcoatF90;
		float roughness = material.clearcoatRoughness;

		float alpha = pow2( roughness ); // UE4's roughness

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

	float alpha = pow2( roughness ); // UE4's roughness

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

// Rect Area Light

// Real-Time Polygonal-Light Shading with Linearly Transformed Cosines
// by Eric Heitz, Jonathan Dupuy, Stephen Hill and David Neubelt
// code: https://github.com/selfshadow/ltc_code/

vec2 LTC_Uv( const in vec3 N, const in vec3 V, const in float roughness ) {

	const float LUT_SIZE = 64.0;
	const float LUT_SCALE = ( LUT_SIZE - 1.0 ) / LUT_SIZE;
	const float LUT_BIAS = 0.5 / LUT_SIZE;

	float dotNV = saturate( dot( N, V ) );

	// texture parameterized by sqrt( GGX alpha ) and sqrt( 1 - cos( theta ) )
	vec2 uv = vec2( roughness, sqrt( 1.0 - dotNV ) );

	uv = uv * LUT_SCALE + LUT_BIAS;

	return uv;

}

float LTC_ClippedSphereFormFactor( const in vec3 f ) {

	// Real-Time Area Lighting: a Journey from Research to Production (p.102)
	// An approximation of the form factor of a horizon-clipped rectangle.

	float l = length( f );

	return max( ( l * l + f.z ) / ( l + 1.0 ), 0.0 );

}

vec3 LTC_EdgeVectorFormFactor( const in vec3 v1, const in vec3 v2 ) {

	float x = dot( v1, v2 );

	float y = abs( x );

	// rational polynomial approximation to theta / sin( theta ) / 2PI
	float a = 0.8543985 + ( 0.4965155 + 0.0145206 * y ) * y;
	float b = 3.4175940 + ( 4.1616724 + y ) * y;
	float v = a / b;

	float theta_sintheta = ( x > 0.0 ) ? v : 0.5 * inversesqrt( max( 1.0 - x * x, 1e-7 ) ) - v;

	return cross( v1, v2 ) * theta_sintheta;

}

vec3 LTC_Evaluate( const in vec3 N, const in vec3 V, const in vec3 P, const in mat3 mInv, const in vec3 rectCoords[ 4 ] ) {

	// bail if point is on back side of plane of light
	// assumes ccw winding order of light vertices
	vec3 v1 = rectCoords[ 1 ] - rectCoords[ 0 ];
	vec3 v2 = rectCoords[ 3 ] - rectCoords[ 0 ];
	vec3 lightNormal = cross( v1, v2 );

	if( dot( lightNormal, P - rectCoords[ 0 ] ) < 0.0 ) return vec3( 0.0 );

	// construct orthonormal basis around N
	vec3 T1, T2;
	T1 = normalize( V - N * dot( V, N ) );
	T2 = - cross( N, T1 ); // negated from paper; possibly due to a different handedness of world coordinate system

	// compute transform
	mat3 mat = mInv * transpose( mat3( T1, T2, N ) );

	// transform rect
	vec3 coords[ 4 ];
	coords[ 0 ] = mat * ( rectCoords[ 0 ] - P );
	coords[ 1 ] = mat * ( rectCoords[ 1 ] - P );
	coords[ 2 ] = mat * ( rectCoords[ 2 ] - P );
	coords[ 3 ] = mat * ( rectCoords[ 3 ] - P );

	// project rect onto sphere
	coords[ 0 ] = normalize( coords[ 0 ] );
	coords[ 1 ] = normalize( coords[ 1 ] );
	coords[ 2 ] = normalize( coords[ 2 ] );
	coords[ 3 ] = normalize( coords[ 3 ] );

	// calculate vector form factor
	vec3 vectorFormFactor = vec3( 0.0 );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 0 ], coords[ 1 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 1 ], coords[ 2 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 2 ], coords[ 3 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 3 ], coords[ 0 ] );

	// adjust for horizon clipping
	float result = LTC_ClippedSphereFormFactor( vectorFormFactor );

/*
	// alternate method of adjusting for horizon clipping (see reference)
	// refactoring required
	float len = length( vectorFormFactor );
	float z = vectorFormFactor.z / len;

	const float LUT_SIZE = 64.0;
	const float LUT_SCALE = ( LUT_SIZE - 1.0 ) / LUT_SIZE;
	const float LUT_BIAS = 0.5 / LUT_SIZE;

	// tabulated horizon-clipped sphere, apparently...
	vec2 uv = vec2( z * 0.5 + 0.5, len );
	uv = uv * LUT_SCALE + LUT_BIAS;

	float scale = texture2D( ltc_2, uv ).w;

	float result = len * scale;
*/

	return vec3( result );

}

// End Rect Area Light

#if defined( USE_SHEEN )

// https://github.com/google/filament/blob/master/shaders/src/brdf.fs
float D_Charlie( float roughness, float dotNH ) {

	float alpha = pow2( roughness );

	// Estevez and Kulla 2017, "Production Friendly Microfacet Sheen BRDF"
	float invAlpha = 1.0 / alpha;
	float cos2h = dotNH * dotNH;
	float sin2h = max( 1.0 - cos2h, 0.0078125 ); // 2^(-14/2), so sin2h^2 > 0 in fp16

	return ( 2.0 + invAlpha ) * pow( sin2h, invAlpha * 0.5 ) / ( 2.0 * PI );

}

// https://github.com/google/filament/blob/master/shaders/src/brdf.fs
float V_Neubelt( float dotNV, float dotNL ) {

	// Neubelt and Pettineo 2013, "Crafting a Next-gen Material Pipeline for The Order: 1886"
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

// This is a curve-fit approximation to the "Charlie sheen" BRDF integrated over the hemisphere from
// Estevez and Kulla 2017, "Production Friendly Microfacet Sheen BRDF".
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

// Fdez-Ag\xFCera's "Multiple-Scattering Microfacet Model for Real-Time Image Based Lighting"
// Approximates multiscattering in order to preserve energy.
// http://www.jcgt.org/published/0008/01/03/
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

	vec3 Favg = Fr + ( 1.0 - Fr ) * 0.047619; // 1/21
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
		rectCoords[ 0 ] = lightPos + halfWidth - halfHeight; // counterclockwise; light shines in local neg z direction
		rectCoords[ 1 ] = lightPos - halfWidth - halfHeight;
		rectCoords[ 2 ] = lightPos - halfWidth + halfHeight;
		rectCoords[ 3 ] = lightPos + halfWidth + halfHeight;

		vec2 uv = LTC_Uv( normal, viewDir, roughness );

		vec4 t1 = texture2D( ltc_1, uv );
		vec4 t2 = texture2D( ltc_2, uv );

		mat3 mInv = mat3(
			vec3( t1.x, 0, t1.y ),
			vec3(    0, 1,    0 ),
			vec3( t1.z, 0, t1.w )
		);

		// LTC Fresnel Approximation by Stephen Hill
		// http://blog.selfshadow.com/publications/s2016-advances/s2016_ltc_fresnel.pdf
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
				vec3(             0, 1,             0 ),
				vec3( t1Clearcoat.z, 0, t1Clearcoat.w )
			);

			// LTC Fresnel Approximation for clearcoat
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

		// Minimal Retroreflective Microfacet Model:
		// https://jcgt.org/published/0015/01/04/
		vec3 retroViewDir = reflect( - geometryViewDir, geometryNormal );
		vec3 retroSpecularBRDF = BRDF_GGX( directLight.direction, retroViewDir, geometryNormal, material );

		specularBRDF = mix( specularBRDF, retroSpecularBRDF, saturate( material.retroreflectivity ) );

	#endif

	reflectedLight.directSpecular += irradiance * specularBRDF * material.multiScatteringCompensation;

	// Light reflected by the specular interface is not available to the diffuse layer ( glTF fresnel_mix )
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

	// Energy reflected by the specular lobe is not available to the diffuse layer
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

	// Both indirect specular and indirect diffuse light accumulate here
	// Compute multiscattering separately for dielectric and metallic, then mix

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

	// Mix based on metalness
	vec3 singleScattering = mix( singleScatteringDielectric, singleScatteringMetallic, material.metalness );
	vec3 multiScattering = mix( multiScatteringDielectric, multiScatteringMetallic, material.metalness );

	// Diffuse energy conservation uses dielectric path
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

#define RE_Direct				RE_Direct_Physical
#define RE_Direct_RectArea		RE_Direct_RectArea_Physical
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Physical
#define RE_IndirectSpecular		RE_IndirectSpecular_Physical

// ref: https://seblagarde.files.wordpress.com/2015/07/course_notes_moving_frostbite_to_pbr_v32.pdf
float computeSpecularOcclusion( const in float dotNV, const in float ambientOcclusion, const in float roughness ) {

	return saturate( pow( dotNV + ambientOcclusion, exp2( - 16.0 * roughness - 1.0 ) ) - 1.0 + ambientOcclusion );

}
`;var Ru=`
/**
 * This is a template that can be used to light a material, it uses pluggable
 * RenderEquations (RE)for specific lighting scenarios.
 *
 * Instructions for use:
 * - Ensure that both RE_Direct, RE_IndirectDiffuse and RE_IndirectSpecular are defined
 * - Create a material parameter that is to be passed as the third parameter to your lighting functions.
 *
 * TODO:
 * - Add area light support.
 * - Add sphere light support.
 * - Add diffuse light probe (irradiance cubemap) support.
 */

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

		// Iridescence F0 approximation
		material.iridescenceF0Dielectric = Schlick_to_F0( iridescenceFresnelDielectric, 1.0, dotNVi );
		material.iridescenceF0Metallic = Schlick_to_F0( iridescenceFresnelMetallic, 1.0, dotNVi );

	}

#endif

#ifdef STANDARD

	float dotNVms = saturate( dot( geometryNormal, geometryViewDir ) );

	material.dfg = texture2D( dfgLUT, vec2( material.roughness, dotNVms ) ).rg;

	#if ( NUM_SUN_LIGHTS > 0 || NUM_DIR_LIGHTS > 0 || NUM_POINT_LIGHTS > 0 || NUM_SPOT_LIGHTS > 0 )

		// Multi-scattering energy compensation for direct lighting
		// Based on "Practical Multiple Scattering Compensation for Microfacet Models"
		// https://blog.selfshadow.com/publications/turquin/ms_comp_final.pdf

		// Energy of the single-scattering lobe in a white furnace ( F0 = F90 = 1 )
		float EssMs = material.dfg.x + material.dfg.y;

		// Compensate for the energy lost to multiple scattering, tinting the added term by F0 ( equation 16 )
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

		// spot lights are ordered [shadows with maps, shadows without maps, maps without shadows, none]
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
`;var Cu=`
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
`;var Pu=`
#if defined( RE_IndirectDiffuse )

	#if defined( LAMBERT ) || defined( PHONG )

		irradiance += iblIrradiance;

	#endif

	RE_IndirectDiffuse( irradiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );

#endif

#if defined( RE_IndirectSpecular )

	RE_IndirectSpecular( radiance, iblIrradiance, clearcoatRadiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );

#endif
`;var Lu=`
#ifdef USE_LIGHT_PROBES_GRID

// Single atlas 3D texture that stores all 7 SH sub-volumes stacked along Z.
// Atlas depth = 7 * ( nz + 2 ) where nz = probesResolution.z.
// Each sub-volume occupies ( nz + 2 ) slices: 1 padding + nz data + 1 padding.
// Padding is a copy of the first / last data slice and prevents color bleeding
// when the hardware linear filter reads across a sub-volume boundary.
uniform highp sampler3D probesSH;

uniform vec3 probesMin;
uniform vec3 probesMax;
uniform vec3 probesResolution;

vec3 getLightProbeGridIrradiance( vec3 worldPos, vec3 worldNormal ) {

	vec3 res = probesResolution;
	vec3 gridRange = probesMax - probesMin;
	vec3 resMinusOne = res - 1.0;
	vec3 probeSpacing = gridRange / resMinusOne;

	// Offset sample position along normal by half a probe spacing
	vec3 samplePos = worldPos + worldNormal * probeSpacing * 0.5;
	vec3 uvw = clamp( ( samplePos - probesMin ) / gridRange, 0.0, 1.0 );

	// Remap to texel centers of the probe grid (XY and Z)
	uvw = uvw * resMinusOne / res + 0.5 / res;

	// Atlas UV mapping along Z:
	//   paddedSlices = nz + 2  (1 padding texel at each end of every sub-volume)
	//   atlasDepth   = 7 * paddedSlices
	//   For sub-volume t the first DATA texel sits at atlas slice t*paddedSlices + 1.
	//   Given probe-grid texel-centre UVZ = ( iz + 0.5 ) / nz the atlas UV is:
	//     atlasUvZ = ( uvw.z * nz + t * paddedSlices + 1 ) / atlasDepth
	//
	// uvZBase encodes the nz-scaled Z plus the intra-volume offset (+ 1 for padding),
	// so adding t*paddedSlices steps to each successive sub-volume.
	float nz          = res.z;
	float paddedSlices = nz + 2.0;
	float atlasDepth  = 7.0 * paddedSlices;
	float uvZBase     = uvw.z * nz + 1.0;

	vec4 s0 = texture( probesSH, vec3( uvw.xy, ( uvZBase                       ) / atlasDepth ) );
	vec4 s1 = texture( probesSH, vec3( uvw.xy, ( uvZBase +       paddedSlices   ) / atlasDepth ) );
	vec4 s2 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 2.0 * paddedSlices   ) / atlasDepth ) );
	vec4 s3 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 3.0 * paddedSlices   ) / atlasDepth ) );
	vec4 s4 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 4.0 * paddedSlices   ) / atlasDepth ) );
	vec4 s5 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 5.0 * paddedSlices   ) / atlasDepth ) );
	vec4 s6 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 6.0 * paddedSlices   ) / atlasDepth ) );

	// Unpack 9 vec3 SH L2 coefficients
	vec3 c0 = s0.xyz;
	vec3 c1 = vec3( s0.w, s1.xy );
	vec3 c2 = vec3( s1.zw, s2.x );
	vec3 c3 = s2.yzw;
	vec3 c4 = s3.xyz;
	vec3 c5 = vec3( s3.w, s4.xy );
	vec3 c6 = vec3( s4.zw, s5.x );
	vec3 c7 = s5.yzw;
	vec3 c8 = s6.xyz;

	// Evaluate L2 irradiance
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
`;var Du=`
#if defined( USE_LOGARITHMIC_DEPTH_BUFFER )

	// Doing a strict comparison with == 1.0 can cause noise artifacts
	// on some platforms. See issue #17623.
	gl_FragDepth = vIsPerspective == 0.0 ? gl_FragCoord.z : log2( vFragDepth ) * logDepthBufFC * 0.5;

#endif
`;var Iu=`
#if defined( USE_LOGARITHMIC_DEPTH_BUFFER )

	uniform float logDepthBufFC;
	varying float vFragDepth;
	varying float vIsPerspective;

#endif
`;var Nu=`
#ifdef USE_LOGARITHMIC_DEPTH_BUFFER

	varying float vFragDepth;
	varying float vIsPerspective;

#endif
`;var Uu=`
#ifdef USE_LOGARITHMIC_DEPTH_BUFFER

	vFragDepth = 1.0 + gl_Position.w;
	vIsPerspective = float( isPerspectiveMatrix( projectionMatrix ) );

#endif
`;var Fu=`
#ifdef USE_MAP

	vec4 sampledDiffuseColor = texture2D( map, vMapUv );

	#ifdef DECODE_VIDEO_TEXTURE

		// use inline sRGB decode until browsers properly support SRGB8_ALPHA8 with video textures (#26516)

		sampledDiffuseColor = sRGBTransferEOTF( sampledDiffuseColor );

	#endif

	diffuseColor *= sampledDiffuseColor;

#endif
`;var Ou=`
#ifdef USE_MAP

	uniform sampler2D map;

#endif
`;var Bu=`
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
`;var Gu=`
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
`;var zu=`
float metalnessFactor = metalness;

#ifdef USE_METALNESSMAP

	vec4 texelMetalness = texture2D( metalnessMap, vMetalnessMapUv );

	// reads channel B, compatible with a combined OcclusionRoughnessMetallic (RGB) texture
	metalnessFactor *= texelMetalness.b;

#endif
`;var ku=`
#ifdef USE_METALNESSMAP

	uniform sampler2D metalnessMap;

#endif
`;var Hu=`
#ifdef USE_INSTANCING_MORPH

	float morphTargetInfluences[ MORPHTARGETS_COUNT ];

	float morphTargetBaseInfluence = texelFetch( morphTexture, ivec2( 0, gl_InstanceID ), 0 ).r;

	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {

		morphTargetInfluences[i] =  texelFetch( morphTexture, ivec2( i + 1, gl_InstanceID ), 0 ).r;

	}
#endif
`;var Vu=`
#if defined( USE_MORPHCOLORS )

	// morphTargetBaseInfluence is set based on BufferGeometry.morphTargetsRelative value:
	// When morphTargetsRelative is false, this is set to 1 - sum(influences); this results in normal = sum((target - base) * influence)
	// When morphTargetsRelative is true, this is set to 1; as a result, all morph targets are simply added to the base after weighting
	vColor *= morphTargetBaseInfluence;

	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {

		#if defined( USE_COLOR_ALPHA )

			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ) * morphTargetInfluences[ i ];

		#elif defined( USE_COLOR )

			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ).rgb * morphTargetInfluences[ i ];

		#endif

	}

#endif
`;var Wu=`
#ifdef USE_MORPHNORMALS

	// morphTargetBaseInfluence is set based on BufferGeometry.morphTargetsRelative value:
	// When morphTargetsRelative is false, this is set to 1 - sum(influences); this results in normal = sum((target - base) * influence)
	// When morphTargetsRelative is true, this is set to 1; as a result, all morph targets are simply added to the base after weighting
	objectNormal *= morphTargetBaseInfluence;

	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {

		if ( morphTargetInfluences[ i ] != 0.0 ) objectNormal += getMorph( gl_VertexID, i, 1 ).xyz * morphTargetInfluences[ i ];

	}

#endif
`;var Xu=`
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
`;var qu=`
#ifdef USE_MORPHTARGETS

	// morphTargetBaseInfluence is set based on BufferGeometry.morphTargetsRelative value:
	// When morphTargetsRelative is false, this is set to 1 - sum(influences); this results in position = sum((target - base) * influence)
	// When morphTargetsRelative is true, this is set to 1; as a result, all morph targets are simply added to the base after weighting
	transformed *= morphTargetBaseInfluence;

	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {

		if ( morphTargetInfluences[ i ] != 0.0 ) transformed += getMorph( gl_VertexID, i, 0 ).xyz * morphTargetInfluences[ i ];

	}

#endif
`;var Yu=`
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

// non perturbed normal for clearcoat among others

vec3 nonPerturbedNormal = normal;

`;var Ku=`

#ifdef USE_NORMALMAP_OBJECTSPACE

	normal = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0; // overrides both flatShading and attribute normals

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
`;var Zu=`
#ifndef FLAT_SHADED

	varying vec3 vNormal;

	#ifdef USE_TANGENT

		varying vec3 vTangent;
		varying vec3 vBitangent;

	#endif

#endif
`;var Ju=`
#ifndef FLAT_SHADED

	varying vec3 vNormal;

	#ifdef USE_TANGENT

		varying vec3 vTangent;
		varying vec3 vBitangent;

	#endif

#endif
`;var $u=`
#ifndef FLAT_SHADED // normal is computed with derivatives when FLAT_SHADED

	vNormal = normalize( transformedNormal );

	#ifdef USE_TANGENT

		vTangent = normalize( transformedTangent );
		vBitangent = normalize( cross( vNormal, vTangent ) * tangent.w );

		#ifdef FLIP_SIDED

			vBitangent = - vBitangent;

		#endif

	#endif

#endif
`;var Qu=`
#ifdef USE_NORMALMAP

	uniform sampler2D normalMap;
	uniform vec2 normalScale;

#endif

#ifdef USE_NORMALMAP_OBJECTSPACE

	uniform mat3 normalMatrix;

#endif

#if ! defined ( USE_TANGENT ) && ( defined ( USE_NORMALMAP_TANGENTSPACE ) || defined ( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY ) )

	// Normal Mapping Without Precomputed Tangents
	// http://www.thetenthplanet.de/archives/1180

	mat3 getTangentFrame( vec3 eye_pos, vec3 surf_norm, vec2 uv ) {

		vec3 q0 = dFdx( eye_pos.xyz );
		vec3 q1 = dFdy( eye_pos.xyz );
		vec2 st0 = dFdx( uv.st );
		vec2 st1 = dFdy( uv.st );

		vec3 N = surf_norm; // normalized

		vec3 q1perp = cross( q1, N );
		vec3 q0perp = cross( N, q0 );

		vec3 T = q1perp * st0.x + q0perp * st1.x;
		vec3 B = q1perp * st0.y + q0perp * st1.y;

		float det = max( dot( T, T ), dot( B, B ) );
		float scale = ( det == 0.0 ) ? 0.0 : inversesqrt( det );

		return mat3( T * scale, B * scale, N );

	}

#endif
`;var ju=`
#ifdef USE_CLEARCOAT

	vec3 clearcoatNormal = nonPerturbedNormal;

#endif
`;var eh=`
#ifdef USE_CLEARCOAT_NORMALMAP

	vec3 clearcoatMapN = texture2D( clearcoatNormalMap, vClearcoatNormalMapUv ).xyz * 2.0 - 1.0;
	clearcoatMapN.xy *= clearcoatNormalScale;

	clearcoatNormal = normalize( tbn2 * clearcoatMapN );

#endif
`;var th=`

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
`;var ih=`

#ifdef USE_IRIDESCENCEMAP

	uniform sampler2D iridescenceMap;

#endif

#ifdef USE_IRIDESCENCE_THICKNESSMAP

	uniform sampler2D iridescenceThicknessMap;

#endif
`;var nh=`
#ifdef OPAQUE
diffuseColor.a = 1.0;
#endif

#ifdef USE_TRANSMISSION
diffuseColor.a *= material.transmissionAlpha;
#endif

gl_FragColor = vec4( outgoingLight, diffuseColor.a );
`;var rh=`
vec3 packNormalToRGB( const in vec3 normal ) {
	return normalize( normal ) * 0.5 + 0.5;
}

vec3 unpackRGBToNormal( const in vec3 rgb ) {
	return 2.0 * rgb.xyz - 1.0;
}

const float PackUpscale = 256. / 255.; // fraction -> 0..1 (including 1)
const float UnpackDownscale = 255. / 256.; // 0..1 -> fraction (excluding 1)
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
	// the 0.9999 tweak is unimportant, very tiny empirical improvement
	// return vec3( vuf * Inv255, gf * PackUpscale, bf * 0.9999 );
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

// NOTE: viewZ, the z-coordinate in camera space, is negative for points in front of the camera

float viewZToOrthographicDepth( const in float viewZ, const in float near, const in float far ) {
	// -near maps to 0; -far maps to 1
	return ( viewZ + near ) / ( near - far );
}

float orthographicDepthToViewZ( const in float depth, const in float near, const in float far ) {

	#ifdef USE_REVERSED_DEPTH_BUFFER

		return depth * ( far - near ) - far;

	#else

		return depth * ( near - far ) - near;

	#endif
}

// NOTE: https://twitter.com/gonnavis/status/1377183786949959682

float viewZToPerspectiveDepth( const in float viewZ, const in float near, const in float far ) {
	// -near maps to 0; -far maps to 1
	return ( ( near + viewZ ) * far ) / ( ( far - near ) * viewZ );
}

float perspectiveDepthToViewZ( const in float depth, const in float near, const in float far ) {

	#ifdef USE_REVERSED_DEPTH_BUFFER

		return ( near * far ) / ( ( near - far ) * depth - near );

	#else

		return ( near * far ) / ( ( far - near ) * depth - far );

	#endif
}
`;var oh=`
#ifdef PREMULTIPLIED_ALPHA

	gl_FragColor.rgb *= gl_FragColor.a;

#endif
`;var sh=`
vec4 mvPosition = vec4( transformed, 1.0 );

#ifdef USE_BATCHING

	mvPosition = batchingMatrix * mvPosition;

#endif

#ifdef USE_INSTANCING

	mvPosition = instanceMatrix * mvPosition;

#endif

mvPosition = modelViewMatrix * mvPosition;

gl_Position = projectionMatrix * mvPosition;
`;var ah=`
#ifdef DITHERING

	gl_FragColor.rgb = dithering( gl_FragColor.rgb );

#endif
`;var lh=`
#ifdef DITHERING

	// based on https://www.shadertoy.com/view/MslGR8
	vec3 dithering( vec3 color ) {
		//Calculate grid position
		float grid_position = rand( gl_FragCoord.xy );

		//Shift the individual colors differently, thus making it even harder to see the dithering pattern
		vec3 dither_shift_RGB = vec3( 0.25 / 255.0, -0.25 / 255.0, 0.25 / 255.0 );

		//modify shift according to grid position.
		dither_shift_RGB = mix( 2.0 * dither_shift_RGB, -2.0 * dither_shift_RGB, grid_position );

		//shift the color by dither_shift
		return color + dither_shift_RGB;
	}

#endif
`;var ch=`
float roughnessFactor = roughness;

#ifdef USE_ROUGHNESSMAP

	vec4 texelRoughness = texture2D( roughnessMap, vRoughnessMapUv );

	// reads channel G, compatible with a combined OcclusionRoughnessMetallic (RGB) texture
	roughnessFactor *= texelRoughness.g;

#endif
`;var uh=`
#ifdef USE_ROUGHNESSMAP

	uniform sampler2D roughnessMap;

#endif
`;var hh=`
#if NUM_SPOT_LIGHT_COORDS > 0

	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];

#endif

#if NUM_SPOT_LIGHT_MAPS > 0

	uniform sampler2D spotLightMap[ NUM_SPOT_LIGHT_MAPS ];

#endif

#ifdef USE_SHADOWMAP

	#if NUM_SUN_LIGHT_SHADOWS > 0

		// must match the cascade count in SunLightShadow

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

		// Interleaved Gradient Noise for randomizing sampling patterns
		float interleavedGradientNoise( vec2 position ) {

			return fract( 52.9829189 * fract( dot( position, vec2( 0.06711056, 0.00583715 ) ) ) );

		}

		// Vogel disk sampling for uniform circular distribution
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

				// Hardware PCF with LinearFilter gives us 4-tap filtering per sample
				// 5 samples using Vogel disk + IGN = effectively 20 filtered taps with better distribution
				vec2 texelSize = vec2( 1.0 ) / shadowMapSize;
				float radius = shadowRadius * texelSize.x;

				// Use IGN to rotate sampling pattern per pixel
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

				// Early return if fully lit
				if ( hard_shadow == 1.0 ) {

					shadow = 1.0;

				} else {

					// Variance must be non-zero to avoid division by zero
					variance = max( variance, 0.0000001 );

					// Distance from mean
					float d = shadowCoord.z - mean;

					// Chebyshev's inequality for upper bound on probability
					float p_max = variance / ( variance + d * d );

					// Reduce light bleeding by remapping [amount, 1] to [0, 1]
					p_max = clamp( ( p_max - 0.3 ) / 0.65, 0.0, 1.0 );

					shadow = max( hard_shadow, p_max );

				}

			}

			return mix( 1.0, shadow, shadowIntensity );

		}

	#else // SHADOWMAP_TYPE_BASIC

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

			// walk the cascades back to front so each fade band can blend with the shadow behind it

			for ( int i = SUN_LIGHT_CASCADES - 1; i >= 0; i -- ) {

				// ( begin, end, fade start ) view depths of the cascade

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

		// for point lights, the uniform @vShadowCoord is re-purposed to hold
		// the vector from the light to the world-space position of the fragment.
		vec3 lightToPosition = shadowCoord.xyz;

		// Direction from light to fragment
		vec3 bd3D = normalize( lightToPosition );

		// For cube shadow maps, depth is stored as distance along each face's view axis, not radial distance
		// The view-space depth is the maximum component of the direction vector (which face is sampled)
		vec3 absVec = abs( lightToPosition );
		float viewSpaceZ = max( max( absVec.x, absVec.y ), absVec.z );

		if ( viewSpaceZ - shadowCameraFar <= 0.0 && viewSpaceZ - shadowCameraNear >= 0.0 ) {

			// viewZ to perspective depth

			#ifdef USE_REVERSED_DEPTH_BUFFER

				float dp = ( shadowCameraNear * ( shadowCameraFar - viewSpaceZ ) ) / ( viewSpaceZ * ( shadowCameraFar - shadowCameraNear ) );
				dp -= shadowBias;

			#else

				float dp = ( shadowCameraFar * ( viewSpaceZ - shadowCameraNear ) ) / ( viewSpaceZ * ( shadowCameraFar - shadowCameraNear ) );
				dp += shadowBias;

			#endif

			// Hardware PCF with LinearFilter gives us 4-tap filtering per sample
			// Use Vogel disk + IGN sampling for better quality
			float texelSize = shadowRadius / shadowMapSize.x;

			// Build a tangent-space coordinate system for applying offsets
			vec3 absDir = abs( bd3D );
			vec3 tangent = absDir.x > absDir.z ? vec3( 0.0, 1.0, 0.0 ) : vec3( 1.0, 0.0, 0.0 );
			tangent = normalize( cross( bd3D, tangent ) );
			vec3 bitangent = cross( bd3D, tangent );

			// Use IGN to rotate sampling pattern per pixel
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

		// for point lights, the uniform @vShadowCoord is re-purposed to hold
		// the vector from the light to the world-space position of the fragment.
		vec3 lightToPosition = shadowCoord.xyz;

		// For cube shadow maps, depth is stored as distance along each face's view axis, not radial distance
		// The view-space depth is the maximum component of the direction vector (which face is sampled)
		vec3 absVec = abs( lightToPosition );
		float viewSpaceZ = max( max( absVec.x, absVec.y ), absVec.z );

		if ( viewSpaceZ - shadowCameraFar <= 0.0 && viewSpaceZ - shadowCameraNear >= 0.0 ) {

			// viewZ to perspective depth

			float dp = ( shadowCameraFar * ( viewSpaceZ - shadowCameraNear ) ) / ( viewSpaceZ * ( shadowCameraFar - shadowCameraNear ) );
			dp += shadowBias;

			// Direction from light to fragment
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
`;var fh=`

#if NUM_SPOT_LIGHT_COORDS > 0

	uniform mat4 spotLightMatrix[ NUM_SPOT_LIGHT_COORDS ];
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];

#endif

#ifdef USE_SHADOWMAP

	#if NUM_SUN_LIGHT_SHADOWS > 0

		// cascade selection and shadow coordinates are computed per fragment

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

	/*
	#if NUM_RECT_AREA_LIGHTS > 0

		// TODO (abelnation): uniforms for area light shadows

	#endif
	*/

#endif
`;var dh=`

#if ( defined( USE_SHADOWMAP ) && ( NUM_DIR_LIGHT_SHADOWS > 0 || NUM_SUN_LIGHT_SHADOWS > 0 || NUM_POINT_LIGHT_SHADOWS > 0 ) ) || ( NUM_SPOT_LIGHT_COORDS > 0 )

	#ifdef HAS_NORMAL

		// Offsetting the position used for querying occlusion along the world normal can be used to reduce shadow acne.

		vec3 shadowWorldNormal = transformNormalByInverseViewMatrix( transformedNormal, viewMatrix );

	#else

		vec3 shadowWorldNormal = vec3( 0.0 ); // fallback, see #21483

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

	/*
	#if NUM_RECT_AREA_LIGHTS > 0

		// TODO (abelnation): update vAreaShadowCoord with area light info

	#endif
	*/

#endif

// spot lights can be evaluated without active shadow mapping (when SpotLight.map is used)

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


`;var ph=`
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

	/*
	#if NUM_RECT_AREA_LIGHTS > 0

		// TODO (abelnation): update shadow for Area light

	#endif
	*/

	#endif

	return shadow;

}
`;var mh=`
#ifdef USE_SKINNING

	mat4 boneMatX = getBoneMatrix( skinIndex.x );
	mat4 boneMatY = getBoneMatrix( skinIndex.y );
	mat4 boneMatZ = getBoneMatrix( skinIndex.z );
	mat4 boneMatW = getBoneMatrix( skinIndex.w );

#endif
`;var gh=`
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
`;var _h=`
#ifdef USE_SKINNING

	vec4 skinVertex = bindMatrix * vec4( transformed, 1.0 );

	vec4 skinned = vec4( 0.0 );
	skinned += boneMatX * skinVertex * skinWeight.x;
	skinned += boneMatY * skinVertex * skinWeight.y;
	skinned += boneMatZ * skinVertex * skinWeight.z;
	skinned += boneMatW * skinVertex * skinWeight.w;

	transformed = ( bindMatrixInverse * skinned ).xyz;

#endif
`;var xh=`
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
`;var vh=`
float specularStrength;

#ifdef USE_SPECULARMAP

	vec4 texelSpecular = texture2D( specularMap, vSpecularMapUv );
	specularStrength = texelSpecular.r;

#else

	specularStrength = 1.0;

#endif
`;var Sh=`
#ifdef USE_SPECULARMAP

	uniform sampler2D specularMap;

#endif
`;var Mh=`
#if defined( TONE_MAPPING )

	gl_FragColor.rgb = toneMapping( gl_FragColor.rgb );

#endif
`;var yh=`
#ifndef saturate
// <common> may have defined saturate() already
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif

uniform float toneMappingExposure;

// exposure only
vec3 LinearToneMapping( vec3 color ) {

	return saturate( toneMappingExposure * color );

}

// source: https://www.cs.utah.edu/docs/techreports/2002/pdf/UUCS-02-001.pdf
vec3 ReinhardToneMapping( vec3 color ) {

	color *= toneMappingExposure;
	return saturate( color / ( vec3( 1.0 ) + color ) );

}

// source: http://filmicworlds.com/blog/filmic-tonemapping-operators/
vec3 CineonToneMapping( vec3 color ) {

	// filmic operator by Jim Hejl and Richard Burgess-Dawson
	color *= toneMappingExposure;
	color = max( vec3( 0.0 ), color - 0.004 );
	return pow( ( color * ( 6.2 * color + 0.5 ) ) / ( color * ( 6.2 * color + 1.7 ) + 0.06 ), vec3( 2.2 ) );

}

// source: https://github.com/selfshadow/ltc_code/blob/master/webgl/shaders/ltc/ltc_blit.fs
vec3 RRTAndODTFit( vec3 v ) {

	vec3 a = v * ( v + 0.0245786 ) - 0.000090537;
	vec3 b = v * ( 0.983729 * v + 0.4329510 ) + 0.238081;
	return a / b;

}

// this implementation of ACES is modified to accommodate a brighter viewing environment.
// the scale factor of 1/0.6 is subjective. see discussion in #19621.

vec3 ACESFilmicToneMapping( vec3 color ) {

	// sRGB => XYZ => D65_2_D60 => AP1 => RRT_SAT
	const mat3 ACESInputMat = mat3(
		vec3( 0.59719, 0.07600, 0.02840 ), // transposed from source
		vec3( 0.35458, 0.90834, 0.13383 ),
		vec3( 0.04823, 0.01566, 0.83777 )
	);

	// ODT_SAT => XYZ => D60_2_D65 => sRGB
	const mat3 ACESOutputMat = mat3(
		vec3(  1.60475, -0.10208, -0.00327 ), // transposed from source
		vec3( -0.53108,  1.10813, -0.07276 ),
		vec3( -0.07367, -0.00605,  1.07602 )
	);

	color *= toneMappingExposure / 0.6;

	color = ACESInputMat * color;

	// Apply RRT and ODT
	color = RRTAndODTFit( color );

	color = ACESOutputMat * color;

	// Clamp to [0, 1]
	return saturate( color );

}

// Matrices for rec 2020 <> rec 709 color space conversion
// matrix provided in row-major order so it has been transposed
// https://www.itu.int/pub/R-REP-BT.2407-2017
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

// https://iolite-engine.com/blog_posts/minimal_agx_implementation
// Mean error^2: 3.6705141e-06
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

// AgX Tone Mapping implementation based on Filament, which in turn is based
// on Blender's implementation using rec 2020 primaries
// https://github.com/google/filament/pull/7236
// Inputs and outputs are encoded as Linear-sRGB.

vec3 AgXToneMapping( vec3 color ) {

	// AgX constants
	const mat3 AgXInsetMatrix = mat3(
		vec3( 0.856627153315983, 0.137318972929847, 0.11189821299995 ),
		vec3( 0.0951212405381588, 0.761241990602591, 0.0767994186031903 ),
		vec3( 0.0482516061458583, 0.101439036467562, 0.811302368396859 )
	);

	// explicit AgXOutsetMatrix generated from Filaments AgXOutsetMatrixInv
	const mat3 AgXOutsetMatrix = mat3(
		vec3( 1.1271005818144368, - 0.1413297634984383, - 0.14132976349843826 ),
		vec3( - 0.11060664309660323, 1.157823702216272, - 0.11060664309660294 ),
		vec3( - 0.016493938717834573, - 0.016493938717834257, 1.2519364065950405 )
	);

	// LOG2_MIN      = -10.0
	// LOG2_MAX      =  +6.5
	// MIDDLE_GRAY   =  0.18
	const float AgxMinEv = - 12.47393;  // log2( pow( 2, LOG2_MIN ) * MIDDLE_GRAY )
	const float AgxMaxEv = 4.026069;    // log2( pow( 2, LOG2_MAX ) * MIDDLE_GRAY )

	color *= toneMappingExposure;

	color = LINEAR_SRGB_TO_LINEAR_REC2020 * color;

	color = AgXInsetMatrix * color;

	// Log2 encoding
	color = max( color, 1e-10 ); // avoid 0 or negative numbers for log2
	color = log2( color );
	color = ( color - AgxMinEv ) / ( AgxMaxEv - AgxMinEv );

	color = clamp( color, 0.0, 1.0 );

	// Apply sigmoid
	color = agxDefaultContrastApprox( color );

	// Apply AgX look
	// v = agxLook(v, look);

	color = AgXOutsetMatrix * color;

	// Linearize
	color = pow( max( vec3( 0.0 ), color ), vec3( 2.2 ) );

	color = LINEAR_REC2020_TO_LINEAR_SRGB * color;

	// Gamut mapping. Simple clamp for now.
	color = clamp( color, 0.0, 1.0 );

	return color;

}

// https://modelviewer.dev/examples/tone-mapping

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
`;var bh=`
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
`;var Eh=`
#ifdef USE_TRANSMISSION

	// Transmission code is based on glTF-Sampler-Viewer
	// https://github.com/KhronosGroup/glTF-Sample-Viewer

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

	// Mipped Bicubic Texture Filtering by N8
	// https://www.shadertoy.com/view/Dl2SDW

	float w0( float a ) {

		return ( 1.0 / 6.0 ) * ( a * ( a * ( - a + 3.0 ) - 3.0 ) + 1.0 );

	}

	float w1( float a ) {

		return ( 1.0 / 6.0 ) * ( a *  a * ( 3.0 * a - 6.0 ) + 4.0 );

	}

	float w2( float a ){

		return ( 1.0 / 6.0 ) * ( a * ( a * ( - 3.0 * a + 3.0 ) + 3.0 ) + 1.0 );

	}

	float w3( float a ) {

		return ( 1.0 / 6.0 ) * ( a * a * a );

	}

	// g0 and g1 are the two amplitude functions
	float g0( float a ) {

		return w0( a ) + w1( a );

	}

	float g1( float a ) {

		return w2( a ) + w3( a );

	}

	// h0 and h1 are the two offset functions
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

		// Direction of refracted light.
		vec3 refractionVector = refract( - v, normalize( n ), 1.0 / ior );

		// Compute rotation-independent scaling of the model matrix.
		vec3 modelScale;
		modelScale.x = length( vec3( modelMatrix[ 0 ].xyz ) );
		modelScale.y = length( vec3( modelMatrix[ 1 ].xyz ) );
		modelScale.z = length( vec3( modelMatrix[ 2 ].xyz ) );

		// The thickness is specified in local space.
		return normalize( refractionVector ) * thickness * modelScale;

	}

	float applyIorToRoughness( const in float roughness, const in float ior ) {

		// Scale roughness with IOR so that an IOR of 1.0 results in no microfacet refraction and
		// an IOR of 1.5 results in the default amount of microfacet refraction.
		return roughness * clamp( ior * 2.0 - 2.0, 0.0, 1.0 );

	}

	vec4 getTransmissionSample( const in vec2 fragCoord, const in float roughness, const in float ior ) {

		float lod = log2( transmissionSamplerSize.x ) * applyIorToRoughness( roughness, ior );
		return textureBicubic( transmissionSamplerMap, fragCoord.xy, lod );

	}

	vec3 volumeAttenuation( const in float transmissionDistance, const in vec3 attenuationColor, const in float attenuationDistance ) {

		if ( isinf( attenuationDistance ) ) {

			// Attenuation distance is +\u221E, i.e. the transmitted color is not attenuated at all.
			return vec3( 1.0 );

		} else {

			// Compute light attenuation using Beer's law.
			vec3 attenuationCoefficient = -log( attenuationColor ) / attenuationDistance;
			vec3 transmittance = exp( - attenuationCoefficient * transmissionDistance ); // Beer's law
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

				// Project refracted vector on the framebuffer, while mapping to normalized device coordinates.
				vec4 ndcPos = projMatrix * viewMatrix * vec4( refractedRayExit, 1.0 );
				vec2 refractionCoords = ndcPos.xy / ndcPos.w;
				refractionCoords += 1.0;
				refractionCoords /= 2.0;

				// Sample framebuffer to get pixel the refracted ray hits.
				vec4 transmissionSample = getTransmissionSample( refractionCoords, roughness, iors[ i ] );
				transmittedLight[ i ] = transmissionSample[ i ];
				transmittedLight.a += transmissionSample.a;

				transmittance[ i ] = diffuseColor[ i ] * volumeAttenuation( length( transmissionRay ), attenuationColor, attenuationDistance )[ i ];

			}

			transmittedLight.a /= 3.0;

		#else

			vec3 transmissionRay = getVolumeTransmissionRay( n, v, thickness, ior, modelMatrix );
			vec3 refractedRayExit = position + transmissionRay;

			// Project refracted vector on the framebuffer, while mapping to normalized device coordinates.
			vec4 ndcPos = projMatrix * viewMatrix * vec4( refractedRayExit, 1.0 );
			vec2 refractionCoords = ndcPos.xy / ndcPos.w;
			refractionCoords += 1.0;
			refractionCoords /= 2.0;

			// Sample framebuffer to get pixel the refracted ray hits.
			transmittedLight = getTransmissionSample( refractionCoords, roughness, ior );
			transmittance = diffuseColor * volumeAttenuation( length( transmissionRay ), attenuationColor, attenuationDistance );

		#endif

		vec3 attenuatedColor = transmittance * transmittedLight.rgb;

		// Get the specular component.
		vec3 F = EnvironmentBRDF( n, v, specularColor, specularF90, roughness );

		// As less light is transmitted, the opacity should be increased. This simple approximation does a decent job
		// of modulating a CSS background, and has no effect when the buffer is opaque, due to a solid object or clear color.
		float transmittanceFactor = ( transmittance.r + transmittance.g + transmittance.b ) / 3.0;

		return vec4( ( 1.0 - F ) * attenuatedColor, 1.0 - ( 1.0 - transmittedLight.a ) * transmittanceFactor );

	}
#endif
`;var Th=`
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
`;var Ah=`
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
`;var wh=`
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
`;var Rh=`
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
`;var Ch=`
varying vec2 vUv;
uniform mat3 uvTransform;

void main() {

	vUv = ( uvTransform * vec3( uv, 1 ) ).xy;

	gl_Position = vec4( position.xy, 1.0, 1.0 );

}
`,Ph=`
uniform sampler2D t2D;
uniform float backgroundIntensity;

varying vec2 vUv;

void main() {

	vec4 texColor = texture2D( t2D, vUv );

	#ifdef DECODE_VIDEO_TEXTURE

		// use inline sRGB decode until browsers properly support SRGB8_ALPHA8 with video textures

		texColor = vec4( mix( pow( texColor.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), texColor.rgb * 0.0773993808, vec3( lessThanEqual( texColor.rgb, vec3( 0.04045 ) ) ) ), texColor.w );

	#endif

	texColor.rgb *= backgroundIntensity;

	gl_FragColor = texColor;

	#include <tonemapping_fragment>
	#include <colorspace_fragment>

}
`;var Lh=`
varying vec3 vWorldDirection;

#include <common>

void main() {

	vWorldDirection = transformDirection( position, modelMatrix );

	#include <begin_vertex>
	#include <project_vertex>

	gl_Position.z = gl_Position.w; // set z to camera.far

}
`,Dh=`

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
`;var Ih=`
varying vec3 vWorldDirection;

#include <common>

void main() {

	vWorldDirection = transformDirection( position, modelMatrix );

	#include <begin_vertex>
	#include <project_vertex>

	gl_Position.z = gl_Position.w; // set z to camera.far

}
`,Nh=`
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
`;var Uh=`
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>

// This is used for computing an equivalent of gl_FragCoord.z that is as high precision as possible.
// Some platforms compute gl_FragCoord at a lower precision which makes the manually computed value better for
// depth-based postprocessing effects. Reproduced on iPad with A10 processor / iPadOS 13.3.1.
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
`,Fh=`
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

	// Higher precision equivalent of gl_FragCoord.z

	#ifdef USE_REVERSED_DEPTH_BUFFER

		float fragCoordZ = vHighPrecisionZW[ 0 ] / vHighPrecisionZW[ 1 ];

	#else

		float fragCoordZ = 0.5 * vHighPrecisionZW[ 0 ] / vHighPrecisionZW[ 1 ] + 0.5;

	#endif

	#if DEPTH_PACKING == 3200

		gl_FragColor = vec4( vec3( 1.0 - fragCoordZ ), opacity );

	#elif DEPTH_PACKING == 3201

		// TODO Deprecate
		gl_FragColor = packDepthToRGBA( fragCoordZ );

	#elif DEPTH_PACKING == 3202

		// TODO Deprecate
		gl_FragColor = vec4( packDepthToRGB( fragCoordZ ), 1.0 );

	#elif DEPTH_PACKING == 3203

		// TODO Deprecate
		gl_FragColor = vec4( packDepthToRG( fragCoordZ ), 0.0, 1.0 );

	#endif

}
`;var Oh=`
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
`,Bh=`
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
	dist = saturate( dist ); // clamp to [ 0, 1 ]

	gl_FragColor = vec4( dist, 0.0, 0.0, 1.0 );

}
`;var Gh=`
varying vec3 vWorldDirection;

#include <common>

void main() {

	vWorldDirection = transformDirection( position, modelMatrix );

	#include <begin_vertex>
	#include <project_vertex>

}
`,zh=`
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
`;var kh=`
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
`,Hh=`
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

	outgoingLight = diffuseColor.rgb; // simple shader

	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>

}
`;var Vh=`
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
`,Wh=`
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

	// accumulation (baked indirect lighting only)
	#ifdef USE_LIGHTMAP

		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		reflectedLight.indirectDiffuse += lightMapTexel.rgb * lightMapIntensity * RECIPROCAL_PI;

	#else

		reflectedLight.indirectDiffuse += vec3( 1.0 );

	#endif

	// modulation
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
`;var Xh=`
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
`,qh=`
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

	// accumulation
	#include <lights_lambert_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>

	// modulation
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
`;var Yh=`
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
`,Kh=`
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
	vec2 uv = vec2( dot( x, normal ), dot( y, normal ) ) * 0.495 + 0.5; // 0.495 to remove artifacts caused by undersized matcap disks

	#ifdef USE_MATCAP

		vec4 matcapColor = texture2D( matcap, uv );

	#else

		vec4 matcapColor = vec4( vec3( mix( 0.2, 0.8, uv.y ) ), 1.0 ); // default if matcap is missing

	#endif

	vec3 outgoingLight = diffuseColor.rgb * matcapColor.rgb;

	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>

}
`;var Zh=`
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
`,Jh=`
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
`;var $h=`
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
`,Qh=`
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

	// accumulation
	#include <lights_phong_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>

	// modulation
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
`;var jh=`
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
`,ef=`
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

	// accumulation
	#include <lights_physical_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>

	// modulation
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
`;var tf=`
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
`,nf=`
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

	// accumulation
	#include <lights_toon_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>

	// modulation
	#include <aomap_fragment>

	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;

	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>

}
`;var rf=`
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
`,of=`
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
`;var sf=`
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
`,af=`
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
`;var lf=`
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
`,cf=`
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
`;var Be={alphahash_fragment:Cc,alphahash_pars_fragment:Pc,alphamap_fragment:Lc,alphamap_pars_fragment:Dc,alphatest_fragment:Ic,alphatest_pars_fragment:Nc,aomap_fragment:Uc,aomap_pars_fragment:Fc,batching_pars_vertex:Oc,batching_vertex:Bc,begin_vertex:Gc,beginnormal_vertex:zc,bsdfs:kc,iridescence_fragment:Hc,bumpmap_pars_fragment:Vc,clipping_planes_fragment:Wc,clipping_planes_pars_fragment:Xc,clipping_planes_pars_vertex:qc,clipping_planes_vertex:Yc,color_fragment:Kc,color_pars_fragment:Zc,color_pars_vertex:Jc,color_vertex:$c,common:Qc,cube_uv_reflection_fragment:jc,defaultnormal_vertex:eu,displacementmap_pars_vertex:tu,displacementmap_vertex:iu,emissivemap_fragment:nu,emissivemap_pars_fragment:ru,colorspace_fragment:ou,colorspace_pars_fragment:su,envmap_fragment:au,envmap_common_pars_fragment:lu,envmap_pars_fragment:cu,envmap_pars_vertex:uu,envmap_physical_pars_fragment:Mu,envmap_vertex:hu,fog_vertex:fu,fog_pars_vertex:du,fog_fragment:pu,fog_pars_fragment:mu,gradientmap_pars_fragment:gu,lightmap_pars_fragment:_u,lights_lambert_fragment:xu,lights_lambert_pars_fragment:vu,lights_pars_begin:Su,lights_toon_fragment:yu,lights_toon_pars_fragment:bu,lights_phong_fragment:Eu,lights_phong_pars_fragment:Tu,lights_physical_fragment:Au,lights_physical_pars_fragment:wu,lights_fragment_begin:Ru,lights_fragment_maps:Cu,lights_fragment_end:Pu,lightprobes_pars_fragment:Lu,logdepthbuf_fragment:Du,logdepthbuf_pars_fragment:Iu,logdepthbuf_pars_vertex:Nu,logdepthbuf_vertex:Uu,map_fragment:Fu,map_pars_fragment:Ou,map_particle_fragment:Bu,map_particle_pars_fragment:Gu,metalnessmap_fragment:zu,metalnessmap_pars_fragment:ku,morphinstance_vertex:Hu,morphcolor_vertex:Vu,morphnormal_vertex:Wu,morphtarget_pars_vertex:Xu,morphtarget_vertex:qu,normal_fragment_begin:Yu,normal_fragment_maps:Ku,normal_pars_fragment:Zu,normal_pars_vertex:Ju,normal_vertex:$u,normalmap_pars_fragment:Qu,clearcoat_normal_fragment_begin:ju,clearcoat_normal_fragment_maps:eh,clearcoat_pars_fragment:th,iridescence_pars_fragment:ih,opaque_fragment:nh,packing:rh,premultiplied_alpha_fragment:oh,project_vertex:sh,dithering_fragment:ah,dithering_pars_fragment:lh,roughnessmap_fragment:ch,roughnessmap_pars_fragment:uh,shadowmap_pars_fragment:hh,shadowmap_pars_vertex:fh,shadowmap_vertex:dh,shadowmask_pars_fragment:ph,skinbase_vertex:mh,skinning_pars_vertex:gh,skinning_vertex:_h,skinnormal_vertex:xh,specularmap_fragment:vh,specularmap_pars_fragment:Sh,tonemapping_fragment:Mh,tonemapping_pars_fragment:yh,transmission_fragment:bh,transmission_pars_fragment:Eh,uv_pars_fragment:Th,uv_pars_vertex:Ah,uv_vertex:wh,worldpos_vertex:Rh,background_vert:Ch,background_frag:Ph,backgroundCube_vert:Lh,backgroundCube_frag:Dh,cube_vert:Ih,cube_frag:Nh,depth_vert:Uh,depth_frag:Fh,distance_vert:Oh,distance_frag:Bh,equirect_vert:Gh,equirect_frag:zh,linedashed_vert:kh,linedashed_frag:Hh,meshbasic_vert:Vh,meshbasic_frag:Wh,meshlambert_vert:Xh,meshlambert_frag:qh,meshmatcap_vert:Yh,meshmatcap_frag:Kh,meshnormal_vert:Zh,meshnormal_frag:Jh,meshphong_vert:$h,meshphong_frag:Qh,meshphysical_vert:jh,meshphysical_frag:ef,meshtoon_vert:tf,meshtoon_frag:nf,points_vert:rf,points_frag:of,shadow_vert:sf,shadow_frag:af,sprite_vert:lf,sprite_frag:cf};var de={common:{diffuse:{value:new be(16777215)},opacity:{value:1},map:{value:null},mapTransform:{value:new Le},alphaMap:{value:null},alphaMapTransform:{value:new Le},alphaTest:{value:0}},specularmap:{specularMap:{value:null},specularMapTransform:{value:new Le}},envmap:{envMap:{value:null},envMapRotation:{value:new Le},reflectivity:{value:1},ior:{value:1.5},refractionRatio:{value:.98},dfgLUT:{value:null}},aomap:{aoMap:{value:null},aoMapIntensity:{value:1},aoMapTransform:{value:new Le}},lightmap:{lightMap:{value:null},lightMapIntensity:{value:1},lightMapTransform:{value:new Le}},bumpmap:{bumpMap:{value:null},bumpMapTransform:{value:new Le},bumpScale:{value:1}},normalmap:{normalMap:{value:null},normalMapTransform:{value:new Le},normalScale:{value:new _e(1,1)}},displacementmap:{displacementMap:{value:null},displacementMapTransform:{value:new Le},displacementScale:{value:1},displacementBias:{value:0}},emissivemap:{emissiveMap:{value:null},emissiveMapTransform:{value:new Le}},metalnessmap:{metalnessMap:{value:null},metalnessMapTransform:{value:new Le}},roughnessmap:{roughnessMap:{value:null},roughnessMapTransform:{value:new Le}},gradientmap:{gradientMap:{value:null}},fog:{fogDensity:{value:25e-5},fogNear:{value:1},fogFar:{value:2e3},fogColor:{value:new be(16777215)}},lights:{ambientLightColor:{value:[]},lightProbe:{value:[]},sunLights:{value:[],properties:{direction:{},color:{}}},sunLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},sunShadowMatrix:{value:[]},sunShadowCascade:{value:[]},directionalLights:{value:[],properties:{direction:{},color:{}}},directionalLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},directionalShadowMatrix:{value:[]},spotLights:{value:[],properties:{color:{},position:{},direction:{},distance:{},coneCos:{},penumbraCos:{},decay:{}}},spotLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},spotLightMap:{value:[]},spotLightMatrix:{value:[]},pointLights:{value:[],properties:{color:{},position:{},decay:{},distance:{}}},pointLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{},shadowCameraNear:{},shadowCameraFar:{}}},pointShadowMatrix:{value:[]},hemisphereLights:{value:[],properties:{direction:{},skyColor:{},groundColor:{}}},rectAreaLights:{value:[],properties:{color:{},position:{},width:{},height:{}}},ltc_1:{value:null},ltc_2:{value:null},probesSH:{value:null},probesMin:{value:new P},probesMax:{value:new P},probesResolution:{value:new P}},points:{diffuse:{value:new be(16777215)},opacity:{value:1},size:{value:1},scale:{value:1},map:{value:null},alphaMap:{value:null},alphaMapTransform:{value:new Le},alphaTest:{value:0},uvTransform:{value:new Le}},sprite:{diffuse:{value:new be(16777215)},opacity:{value:1},center:{value:new _e(.5,.5)},rotation:{value:0},map:{value:null},mapTransform:{value:new Le},alphaMap:{value:null},alphaMapTransform:{value:new Le},alphaTest:{value:0}}};var di={basic:{uniforms:Wt([de.common,de.specularmap,de.envmap,de.aomap,de.lightmap,de.fog]),vertexShader:Be.meshbasic_vert,fragmentShader:Be.meshbasic_frag},lambert:{uniforms:Wt([de.common,de.specularmap,de.envmap,de.aomap,de.lightmap,de.emissivemap,de.bumpmap,de.normalmap,de.displacementmap,de.fog,de.lights,{emissive:{value:new be(0)},envMapIntensity:{value:1}}]),vertexShader:Be.meshlambert_vert,fragmentShader:Be.meshlambert_frag},phong:{uniforms:Wt([de.common,de.specularmap,de.envmap,de.aomap,de.lightmap,de.emissivemap,de.bumpmap,de.normalmap,de.displacementmap,de.fog,de.lights,{emissive:{value:new be(0)},specular:{value:new be(1118481)},shininess:{value:30},envMapIntensity:{value:1}}]),vertexShader:Be.meshphong_vert,fragmentShader:Be.meshphong_frag},standard:{uniforms:Wt([de.common,de.envmap,de.aomap,de.lightmap,de.emissivemap,de.bumpmap,de.normalmap,de.displacementmap,de.roughnessmap,de.metalnessmap,de.fog,de.lights,{emissive:{value:new be(0)},roughness:{value:1},metalness:{value:0},envMapIntensity:{value:1}}]),vertexShader:Be.meshphysical_vert,fragmentShader:Be.meshphysical_frag},toon:{uniforms:Wt([de.common,de.aomap,de.lightmap,de.emissivemap,de.bumpmap,de.normalmap,de.displacementmap,de.gradientmap,de.fog,de.lights,{emissive:{value:new be(0)}}]),vertexShader:Be.meshtoon_vert,fragmentShader:Be.meshtoon_frag},matcap:{uniforms:Wt([de.common,de.bumpmap,de.normalmap,de.displacementmap,de.fog,{matcap:{value:null}}]),vertexShader:Be.meshmatcap_vert,fragmentShader:Be.meshmatcap_frag},points:{uniforms:Wt([de.points,de.fog]),vertexShader:Be.points_vert,fragmentShader:Be.points_frag},dashed:{uniforms:Wt([de.common,de.fog,{scale:{value:1},dashSize:{value:1},totalSize:{value:2}}]),vertexShader:Be.linedashed_vert,fragmentShader:Be.linedashed_frag},depth:{uniforms:Wt([de.common,de.displacementmap]),vertexShader:Be.depth_vert,fragmentShader:Be.depth_frag},normal:{uniforms:Wt([de.common,de.bumpmap,de.normalmap,de.displacementmap,{opacity:{value:1}}]),vertexShader:Be.meshnormal_vert,fragmentShader:Be.meshnormal_frag},sprite:{uniforms:Wt([de.sprite,de.fog]),vertexShader:Be.sprite_vert,fragmentShader:Be.sprite_frag},background:{uniforms:{uvTransform:{value:new Le},t2D:{value:null},backgroundIntensity:{value:1}},vertexShader:Be.background_vert,fragmentShader:Be.background_frag},backgroundCube:{uniforms:{envMap:{value:null},backgroundBlurriness:{value:0},backgroundIntensity:{value:1},backgroundRotation:{value:new Le}},vertexShader:Be.backgroundCube_vert,fragmentShader:Be.backgroundCube_frag},cube:{uniforms:{tCube:{value:null},tFlip:{value:-1},opacity:{value:1}},vertexShader:Be.cube_vert,fragmentShader:Be.cube_frag},equirect:{uniforms:{tEquirect:{value:null}},vertexShader:Be.equirect_vert,fragmentShader:Be.equirect_frag},distance:{uniforms:Wt([de.common,de.displacementmap,{referencePosition:{value:new P},nearDistance:{value:1},farDistance:{value:1e3}}]),vertexShader:Be.distance_vert,fragmentShader:Be.distance_frag},shadow:{uniforms:Wt([de.lights,de.fog,{color:{value:new be(0)},opacity:{value:1}}]),vertexShader:Be.shadow_vert,fragmentShader:Be.shadow_frag}};di.physical={uniforms:Wt([di.standard.uniforms,{clearcoat:{value:0},clearcoatMap:{value:null},clearcoatMapTransform:{value:new Le},clearcoatNormalMap:{value:null},clearcoatNormalMapTransform:{value:new Le},clearcoatNormalScale:{value:new _e(1,1)},clearcoatRoughness:{value:0},clearcoatRoughnessMap:{value:null},clearcoatRoughnessMapTransform:{value:new Le},dispersion:{value:0},retroreflectivity:{value:0},iridescence:{value:0},iridescenceMap:{value:null},iridescenceMapTransform:{value:new Le},iridescenceIOR:{value:1.3},iridescenceThicknessMinimum:{value:100},iridescenceThicknessMaximum:{value:400},iridescenceThicknessMap:{value:null},iridescenceThicknessMapTransform:{value:new Le},sheen:{value:0},sheenColor:{value:new be(0)},sheenColorMap:{value:null},sheenColorMapTransform:{value:new Le},sheenRoughness:{value:1},sheenRoughnessMap:{value:null},sheenRoughnessMapTransform:{value:new Le},transmission:{value:0},transmissionMap:{value:null},transmissionMapTransform:{value:new Le},transmissionSamplerSize:{value:new _e},transmissionSamplerMap:{value:null},thickness:{value:0},thicknessMap:{value:null},thicknessMapTransform:{value:new Le},attenuationDistance:{value:0},attenuationColor:{value:new be(0)},specularColor:{value:new be(1,1,1)},specularColorMap:{value:null},specularColorMapTransform:{value:new Le},specularIntensity:{value:1},specularIntensityMap:{value:null},specularIntensityMapTransform:{value:new Le},anisotropyVector:{value:new _e},anisotropyMap:{value:null},anisotropyMapTransform:{value:new Le}}]),vertexShader:Be.meshphysical_vert,fragmentShader:Be.meshphysical_frag};var Ws={r:0,b:0,g:0},Xp=new Oe,uf=new Le;uf.set(-1,0,0,0,1,0,0,0,1);function hf(n,e,t,i,r,o){let s=new be(0),a=r===!0?0:1,l,c,f=null,m=0,u=null;function p(A){let I=A.isScene===!0?A.background:null;if(I&&I.isTexture){let M=A.backgroundBlurriness>0;I=e.get(I,M)}return I}function _(A){let I=!1,M=p(A);M===null?d(s,a):M&&M.isColor&&(d(M,1),I=!0);let y=n.xr.getEnvironmentBlendMode();y==="additive"?t.buffers.color.setClear(0,0,0,1,o):y==="alpha-blend"&&t.buffers.color.setClear(0,0,0,0,o),(n.autoClear||I)&&(t.buffers.depth.setTest(!0),t.buffers.depth.setMask(!0),t.buffers.color.setMask(!0),n.clear(n.autoClearColor,n.autoClearDepth,n.autoClearStencil))}function S(A,I){let M=p(I);M&&(M.isCubeTexture||M.mapping===Qi)?(c===void 0&&(c=new mt(new si(1,1,1),new Ut({name:"BackgroundCubeMaterial",uniforms:Wi(di.backgroundCube.uniforms),vertexShader:di.backgroundCube.vertexShader,fragmentShader:di.backgroundCube.fragmentShader,side:gt,depthTest:!1,depthWrite:!1,fog:!1,allowOverride:!1})),c.geometry.deleteAttribute("normal"),c.geometry.deleteAttribute("uv"),c.onBeforeRender=function(y,b,C){this.matrixWorld.copyPosition(C.matrixWorld)},Object.defineProperty(c.material,"envMap",{get:function(){return this.uniforms.envMap.value}}),i.update(c)),c.material.uniforms.envMap.value=M,c.material.uniforms.backgroundBlurriness.value=I.backgroundBlurriness,c.material.uniforms.backgroundIntensity.value=I.backgroundIntensity,c.material.uniforms.backgroundRotation.value.setFromMatrix4(Xp.makeRotationFromEuler(I.backgroundRotation)).transpose(),M.isCubeTexture&&M.isRenderTargetTexture===!1&&c.material.uniforms.backgroundRotation.value.premultiply(uf),c.material.toneMapped=Ue.getTransfer(M.colorSpace)!==qe,(f!==M||m!==M.version||u!==n.toneMapping)&&(c.material.needsUpdate=!0,f=M,m=M.version,u=n.toneMapping),c.layers.enableAll(),A.unshift(c,c.geometry,c.material,0,0,null)):M&&M.isTexture&&(l===void 0&&(l=new mt(new mr(2,2),new Ut({name:"BackgroundMaterial",uniforms:Wi(di.background.uniforms),vertexShader:di.background.vertexShader,fragmentShader:di.background.fragmentShader,side:li,depthTest:!1,depthWrite:!1,fog:!1,allowOverride:!1})),l.geometry.deleteAttribute("normal"),Object.defineProperty(l.material,"map",{get:function(){return this.uniforms.t2D.value}}),i.update(l)),l.material.uniforms.t2D.value=M,l.material.uniforms.backgroundIntensity.value=I.backgroundIntensity,l.material.toneMapped=Ue.getTransfer(M.colorSpace)!==qe,M.matrixAutoUpdate===!0&&M.updateMatrix(),l.material.uniforms.uvTransform.value.copy(M.matrix),(f!==M||m!==M.version||u!==n.toneMapping)&&(l.material.needsUpdate=!0,f=M,m=M.version,u=n.toneMapping),l.layers.enableAll(),A.unshift(l,l.geometry,l.material,0,0,null))}function d(A,I){A.getRGB(Ws,Is(n)),t.buffers.color.setClear(Ws.r,Ws.g,Ws.b,I,o)}function h(){c!==void 0&&(c.geometry.dispose(),c.material.dispose(),c=void 0),l!==void 0&&(l.geometry.dispose(),l.material.dispose(),l=void 0)}return{getClearColor:function(){return s},setClearColor:function(A,I=1){s.set(A),a=I,d(s,a)},getClearAlpha:function(){return a},setClearAlpha:function(A){a=A,d(s,a)},render:_,addToRenderList:S,dispose:h}}function ff(n,e){let t=n.getParameter(n.MAX_VERTEX_ATTRIBS),i={},r=u(null),o=r,s=!1;function a(U,G,k,L,H){let K=!1,$=m(U,L,k,G);o!==$&&(o=$,c(o.object)),K=p(U,L,k,H),K&&_(U,L,k,H),H!==null&&e.update(H,n.ELEMENT_ARRAY_BUFFER),(K||s)&&(s=!1,M(U,G,k,L),H!==null&&n.bindBuffer(n.ELEMENT_ARRAY_BUFFER,e.get(H).buffer))}function l(){return n.createVertexArray()}function c(U){return n.bindVertexArray(U)}function f(U){return n.deleteVertexArray(U)}function m(U,G,k,L){let H=L.wireframe===!0,K=i[G.id];K===void 0&&(K={},i[G.id]=K);let $=U.isInstancedMesh===!0?U.id:0,oe=K[$];oe===void 0&&(oe={},K[$]=oe);let Q=oe[k.id];Q===void 0&&(Q={},oe[k.id]=Q);let re=Q[H];return re===void 0&&(re=u(l()),Q[H]=re),re}function u(U){let G=[],k=[],L=[];for(let H=0;H<t;H++)G[H]=0,k[H]=0,L[H]=0;return{geometry:null,program:null,wireframe:!1,newAttributes:G,enabledAttributes:k,attributeDivisors:L,object:U,attributes:{},index:null}}function p(U,G,k,L){let H=o.attributes,K=G.attributes,$=0,oe=k.getAttributes();for(let Q in oe)if(oe[Q].location>=0){let se=H[Q],Pe=K[Q];if(Pe===void 0&&(Q==="instanceMatrix"&&U.instanceMatrix&&(Pe=U.instanceMatrix),Q==="instanceColor"&&U.instanceColor&&(Pe=U.instanceColor)),se===void 0||se.attribute!==Pe||Pe&&se.data!==Pe.data)return!0;$++}return o.attributesNum!==$||o.index!==L}function _(U,G,k,L){let H={},K=G.attributes,$=0,oe=k.getAttributes();for(let Q in oe)if(oe[Q].location>=0){let se=K[Q];se===void 0&&(Q==="instanceMatrix"&&U.instanceMatrix&&(se=U.instanceMatrix),Q==="instanceColor"&&U.instanceColor&&(se=U.instanceColor));let Pe={};Pe.attribute=se,se&&se.data&&(Pe.data=se.data),H[Q]=Pe,$++}o.attributes=H,o.attributesNum=$,o.index=L}function S(){let U=o.newAttributes;for(let G=0,k=U.length;G<k;G++)U[G]=0}function d(U){h(U,0)}function h(U,G){let k=o.newAttributes,L=o.enabledAttributes,H=o.attributeDivisors;k[U]=1,L[U]===0&&(n.enableVertexAttribArray(U),L[U]=1),H[U]!==G&&(n.vertexAttribDivisor(U,G),H[U]=G)}function A(){let U=o.newAttributes,G=o.enabledAttributes;for(let k=0,L=G.length;k<L;k++)G[k]!==U[k]&&(n.disableVertexAttribArray(k),G[k]=0)}function I(U,G,k,L,H,K,$){$===!0?n.vertexAttribIPointer(U,G,k,H,K):n.vertexAttribPointer(U,G,k,L,H,K)}function M(U,G,k,L){S();let H=L.attributes,K=k.getAttributes(),$=G.defaultAttributeValues;for(let oe in K){let Q=K[oe];if(Q.location>=0){let re=H[oe];if(re===void 0&&(oe==="instanceMatrix"&&U.instanceMatrix&&(re=U.instanceMatrix),oe==="instanceColor"&&U.instanceColor&&(re=U.instanceColor)),re!==void 0){let se=re.normalized,Pe=re.itemSize,Ce=e.get(re);if(Ce===void 0)continue;let ot=Ce.buffer,Ve=Ce.type,Ye=Ce.bytesPerElement,j=Ve===n.INT||Ve===n.UNSIGNED_INT||re.gpuType===Fn;if(re.isInterleavedBufferAttribute){let ne=re.data,Se=ne.stride,Ie=re.offset;if(ne.isInstancedInterleavedBuffer){for(let ve=0;ve<Q.locationSize;ve++)h(Q.location+ve,ne.meshPerAttribute);U.isInstancedMesh!==!0&&L._maxInstanceCount===void 0&&(L._maxInstanceCount=ne.meshPerAttribute*ne.count)}else for(let ve=0;ve<Q.locationSize;ve++)d(Q.location+ve);n.bindBuffer(n.ARRAY_BUFFER,ot);for(let ve=0;ve<Q.locationSize;ve++)I(Q.location+ve,Pe/Q.locationSize,Ve,se,Se*Ye,(Ie+Pe/Q.locationSize*ve)*Ye,j)}else{if(re.isInstancedBufferAttribute){for(let ne=0;ne<Q.locationSize;ne++)h(Q.location+ne,re.meshPerAttribute);U.isInstancedMesh!==!0&&L._maxInstanceCount===void 0&&(L._maxInstanceCount=re.meshPerAttribute*re.count)}else for(let ne=0;ne<Q.locationSize;ne++)d(Q.location+ne);n.bindBuffer(n.ARRAY_BUFFER,ot);for(let ne=0;ne<Q.locationSize;ne++)I(Q.location+ne,Pe/Q.locationSize,Ve,se,Pe*Ye,Pe/Q.locationSize*ne*Ye,j)}}else if($!==void 0){let se=$[oe];if(se!==void 0)switch(se.length){case 2:n.vertexAttrib2fv(Q.location,se);break;case 3:n.vertexAttrib3fv(Q.location,se);break;case 4:n.vertexAttrib4fv(Q.location,se);break;default:n.vertexAttrib1fv(Q.location,se)}}}}A()}function y(){E();for(let U in i){let G=i[U];for(let k in G){let L=G[k];for(let H in L){let K=L[H];for(let $ in K)f(K[$].object),delete K[$];delete L[H]}}delete i[U]}}function b(U){if(i[U.id]===void 0)return;let G=i[U.id];for(let k in G){let L=G[k];for(let H in L){let K=L[H];for(let $ in K)f(K[$].object),delete K[$];delete L[H]}}delete i[U.id]}function C(U){for(let G in i){let k=i[G];for(let L in k){let H=k[L];if(H[U.id]===void 0)continue;let K=H[U.id];for(let $ in K)f(K[$].object),delete K[$];delete H[U.id]}}}function x(U){for(let G in i){let k=i[G],L=U.isInstancedMesh===!0?U.id:0,H=k[L];if(H!==void 0){for(let K in H){let $=H[K];for(let oe in $)f($[oe].object),delete $[oe];delete H[K]}delete k[L],Object.keys(k).length===0&&delete i[G]}}}function E(){D(),s=!0,o!==r&&(o=r,c(o.object))}function D(){r.geometry=null,r.program=null,r.wireframe=!1}return{setup:a,reset:E,resetDefaultState:D,dispose:y,releaseStatesOfGeometry:b,releaseStatesOfObject:x,releaseStatesOfProgram:C,initAttributes:S,enableAttribute:d,disableUnusedAttributes:A}}function df(n,e,t){let i;function r(l){i=l}function o(l,c){n.drawArrays(i,l,c),t.update(c,i,1)}function s(l,c,f){f!==0&&(n.drawArraysInstanced(i,l,c,f),t.update(c,i,f))}function a(l,c,f){if(f===0)return;e.get("WEBGL_multi_draw").multiDrawArraysWEBGL(i,l,0,c,0,f);let u=0;for(let p=0;p<f;p++)u+=c[p];t.update(u,i,1)}this.setMode=r,this.render=o,this.renderInstances=s,this.renderMultiDraw=a}function pf(n,e,t,i){let r;function o(){if(r!==void 0)return r;if(e.has("EXT_texture_filter_anisotropic")===!0){let C=e.get("EXT_texture_filter_anisotropic");r=n.getParameter(C.MAX_TEXTURE_MAX_ANISOTROPY_EXT)}else r=0;return r}function s(C){return!(C!==Dt&&i.convert(C)!==n.getParameter(n.IMPLEMENTATION_COLOR_READ_FORMAT))}function a(C){let x=C===Lt&&(e.has("EXT_color_buffer_half_float")||e.has("EXT_color_buffer_float"));return!(C!==vt&&C!==Ot&&!x&&i.convert(C)!==n.getParameter(n.IMPLEMENTATION_COLOR_READ_TYPE))}function l(C){if(C==="highp"){if(n.getShaderPrecisionFormat(n.VERTEX_SHADER,n.HIGH_FLOAT).precision>0&&n.getShaderPrecisionFormat(n.FRAGMENT_SHADER,n.HIGH_FLOAT).precision>0)return"highp";C="mediump"}return C==="mediump"&&n.getShaderPrecisionFormat(n.VERTEX_SHADER,n.MEDIUM_FLOAT).precision>0&&n.getShaderPrecisionFormat(n.FRAGMENT_SHADER,n.MEDIUM_FLOAT).precision>0?"mediump":"lowp"}let c=t.precision!==void 0?t.precision:"highp",f=l(c);f!==c&&(xe("WebGLRenderer:",c,"not supported, using",f,"instead."),c=f);let m=t.logarithmicDepthBuffer===!0,u=t.reversedDepthBuffer===!0&&e.has("EXT_clip_control");t.reversedDepthBuffer===!0&&u===!1&&xe("WebGLRenderer: Unable to use reversed depth buffer due to missing EXT_clip_control extension. Fallback to default depth buffer.");let p=n.getParameter(n.MAX_TEXTURE_IMAGE_UNITS),_=n.getParameter(n.MAX_VERTEX_TEXTURE_IMAGE_UNITS),S=n.getParameter(n.MAX_TEXTURE_SIZE),d=n.getParameter(n.MAX_CUBE_MAP_TEXTURE_SIZE),h=n.getParameter(n.MAX_VERTEX_ATTRIBS),A=n.getParameter(n.MAX_VERTEX_UNIFORM_VECTORS),I=n.getParameter(n.MAX_VARYING_VECTORS),M=n.getParameter(n.MAX_FRAGMENT_UNIFORM_VECTORS),y=n.getParameter(n.MAX_SAMPLES),b=n.getParameter(n.SAMPLES);return{isWebGL2:!0,getMaxAnisotropy:o,getMaxPrecision:l,textureFormatReadable:s,textureTypeReadable:a,precision:c,logarithmicDepthBuffer:m,reversedDepthBuffer:u,maxTextures:p,maxVertexTextures:_,maxTextureSize:S,maxCubemapSize:d,maxAttributes:h,maxVertexUniforms:A,maxVaryings:I,maxFragmentUniforms:M,maxSamples:y,samples:b}}function mf(n){let e=this,t=null,i=0,r=!1,o=!1,s=new Vt,a=new Le,l={value:null,needsUpdate:!1};this.uniform=l,this.numPlanes=0,this.numIntersection=0,this.init=function(m,u){let p=m.length!==0||u||i!==0||r;return r=u,i=m.length,p},this.beginShadows=function(){o=!0,f(null)},this.endShadows=function(){o=!1},this.setGlobalState=function(m,u){t=f(m,u,0)},this.setState=function(m,u,p){let _=m.clippingPlanes,S=m.clipIntersection,d=m.clipShadows,h=n.get(m);if(!r||_===null||_.length===0||o&&!d)o?f(null):c();else{let A=o?0:i,I=A*4,M=h.clippingState||null;l.value=M,M=f(_,u,I,p);for(let y=0;y!==I;++y)M[y]=t[y];h.clippingState=M,this.numIntersection=S?this.numPlanes:0,this.numPlanes+=A}};function c(){l.value!==t&&(l.value=t,l.needsUpdate=i>0),e.numPlanes=i,e.numIntersection=0}function f(m,u,p,_){let S=m!==null?m.length:0,d=null;if(S!==0){if(d=l.value,_!==!0||d===null){let h=p+S*4,A=u.matrixWorldInverse;a.getNormalMatrix(A),(d===null||d.length<h)&&(d=new Float32Array(h));for(let I=0,M=p;I!==S;++I,M+=4)s.copy(m[I]).applyMatrix4(A,a),s.normal.toArray(d,M),d[M+3]=s.constant}l.value=d,l.needsUpdate=!0}return e.numPlanes=S,e.numIntersection=0,d}}var br=4,qp=6,Yp=20,Kp=256,To=new cn,gf=new be,Fa=null,Oa=0,Ba=0,Ga=!1,Zp=new P,Pn=new P,Ao=class{constructor(e){this._renderer=e,this._pingPongRenderTarget=null,this._lodMax=0,this._cubeSize=0,this._sizeLods=[],this._lodMeshes=[],this._backgroundBox=null,this._cubemapMaterial=null,this._equirectMaterial=null,this._blurMaterial=null,this._ggxMaterial=null}fromScene(e,t=0,i=.1,r=100,o={}){let{size:s=256,position:a=Zp}=o;Fa=this._renderer.getRenderTarget(),Oa=this._renderer.getActiveCubeFace(),Ba=this._renderer.getActiveMipmapLevel(),Ga=this._renderer.xr.enabled,this._renderer.xr.enabled=!1,this._setSize(s);let l=this._allocateTargets();return l.depthBuffer=!0,this._sceneToCubeUV(e,i,r,l,a),t>0&&this._blur(l,0,0,t),this._applyPMREM(l),this._cleanup(l),l}fromEquirectangular(e,t=null){return this._fromTexture(e,t)}fromCubemap(e,t=null){return this._fromTexture(e,t)}compileCubemapShader(){this._cubemapMaterial===null&&(this._cubemapMaterial=vf(),this._compileMaterial(this._cubemapMaterial))}compileEquirectangularShader(){this._equirectMaterial===null&&(this._equirectMaterial=xf(),this._compileMaterial(this._equirectMaterial))}dispose(){this._dispose(),this._cubemapMaterial!==null&&this._cubemapMaterial.dispose(),this._equirectMaterial!==null&&this._equirectMaterial.dispose(),this._backgroundBox!==null&&(this._backgroundBox.geometry.dispose(),this._backgroundBox.material.dispose())}_setSize(e){this._lodMax=Math.floor(Math.log2(e)),this._cubeSize=Math.pow(2,this._lodMax)}_dispose(){this._blurMaterial!==null&&this._blurMaterial.dispose(),this._ggxMaterial!==null&&this._ggxMaterial.dispose(),this._pingPongRenderTarget!==null&&this._pingPongRenderTarget.dispose();for(let e=0;e<this._lodMeshes.length;e++)this._lodMeshes[e].geometry.dispose()}_cleanup(e){this._renderer.setRenderTarget(Fa,Oa,Ba),this._renderer.xr.enabled=Ga,e.scissorTest=!1,yr(e,0,0,e.width,e.height)}_fromTexture(e,t){e.mapping===ci||e.mapping===Ni?this._setSize(e.image.length===0?16:e.image[0].width||e.image[0].image.width):this._setSize(e.image.width/4),Fa=this._renderer.getRenderTarget(),Oa=this._renderer.getActiveCubeFace(),Ba=this._renderer.getActiveMipmapLevel(),Ga=this._renderer.xr.enabled,this._renderer.xr.enabled=!1;let i=t||this._allocateTargets();return this._textureToCubeUV(e,i),this._applyPMREM(i),this._cleanup(i),i}_allocateTargets(){let e=3*Math.max(this._cubeSize,112),t=4*this._cubeSize,i={magFilter:_t,minFilter:_t,generateMipmaps:!1,type:Lt,format:Dt,colorSpace:xn,depthBuffer:!1},r=_f(e,t,i);if(this._pingPongRenderTarget===null||this._pingPongRenderTarget.width!==e||this._pingPongRenderTarget.height!==t){this._pingPongRenderTarget!==null&&this._dispose(),this._pingPongRenderTarget=_f(e,t,i);let{_lodMax:o}=this;({lodMeshes:this._lodMeshes,sizeLods:this._sizeLods}=Jp(o)),this._blurMaterial=Qp(o,e,t),this._ggxMaterial=$p(o,e,t)}return r}_compileMaterial(e){let t=new mt(new ft,e);this._renderer.compile(t,To)}_sceneToCubeUV(e,t,i,r,o){let l=new Et(90,1,t,i),c=[1,-1,1,1,1,1],f=[1,1,1,-1,-1,-1],m=this._renderer,u=m.autoClear,p=m.toneMapping;m.getClearColor(gf),m.toneMapping=qt,m.autoClear=!1,m.state.buffers.depth.getReversed()&&(m.setRenderTarget(r),m.clearDepth(),m.setRenderTarget(null)),this._backgroundBox===null&&(this._backgroundBox=new mt(new si,new bi({name:"PMREM.Background",side:gt,depthWrite:!1,depthTest:!1})));let S=this._backgroundBox,d=S.material,h=!1,A=e.background;A?A.isColor&&(d.color.copy(A),e.background=null,h=!0):(d.color.copy(gf),h=!0);for(let I=0;I<6;I++){let M=I%3;M===0?(l.up.set(0,c[I],0),l.position.set(o.x,o.y,o.z),l.lookAt(o.x+f[I],o.y,o.z)):M===1?(l.up.set(0,0,c[I]),l.position.set(o.x,o.y,o.z),l.lookAt(o.x,o.y+f[I],o.z)):(l.up.set(0,c[I],0),l.position.set(o.x,o.y,o.z),l.lookAt(o.x,o.y,o.z+f[I]));let y=this._cubeSize;yr(r,M*y,I>2?y:0,y,y),m.setRenderTarget(r),h&&m.render(S,l),m.render(e,l)}m.toneMapping=p,m.autoClear=u,e.background=A}_textureToCubeUV(e,t){let i=this._renderer,r=e.mapping===ci||e.mapping===Ni;r?(this._cubemapMaterial===null&&(this._cubemapMaterial=vf()),this._cubemapMaterial.uniforms.flipEnvMap.value=e.isRenderTargetTexture===!1?-1:1):this._equirectMaterial===null&&(this._equirectMaterial=xf());let o=r?this._cubemapMaterial:this._equirectMaterial,s=this._lodMeshes[0];s.material=o;let a=o.uniforms;a.envMap.value=e;let l=this._cubeSize;yr(t,0,0,3*l,2*l),i.setRenderTarget(t),i.render(s,To)}_applyPMREM(e){let t=this._renderer,i=t.autoClear;t.autoClear=!1;let r=this._lodMeshes.length;for(let o=1;o<r;o++)this._applyGGXFilter(e,o-1,o);t.autoClear=i}_applyGGXFilter(e,t,i){let r=this._renderer,o=this._pingPongRenderTarget,s=this._ggxMaterial,a=this._lodMeshes[i];a.material=s;let l=s.uniforms,c=i/(this._lodMeshes.length-1),f=t/(this._lodMeshes.length-1),m=Math.sqrt(c*c-f*f),u=c*1.25,p=m*u,{_lodMax:_}=this,S=this._sizeLods[i],d=3*S*(i>_-br?i-_+br:0),h=4*(this._cubeSize-S);l.envMap.value=e.texture,l.roughness.value=p,l.mipInt.value=_-t,yr(o,d,h,3*S,2*S),r.setRenderTarget(o),r.render(a,To),l.envMap.value=o.texture,l.roughness.value=0,l.mipInt.value=_-i,yr(e,d,h,3*S,2*S),r.setRenderTarget(e),r.render(a,To)}_blur(e,t,i,r){let o=this._pingPongRenderTarget,s=Math.min(r,Math.PI)/Math.SQRT2;this._blurPass(e,o,t,i,s),this._blurPass(o,e,i,i,s)}_blurPass(e,t,i,r,o){let s=this._renderer,a=this._blurMaterial,l=this._lodMeshes[r];l.material=a;let c=a.uniforms;c.envMap.value=e.texture,c.sigma.value=o,c.mipInt.value=this._lodMax-i;let f=this._sizeLods[r],m=3*f*(r>this._lodMax-br?r-this._lodMax+br:0),u=4*(this._cubeSize-f);yr(t,m,u,3*f,2*f),s.setRenderTarget(t),s.render(l,To)}};function Jp(n){let e=[],t=[],i=n,r=n-br+1+qp;for(let o=0;o<r;o++){let s=Math.pow(2,i);e.push(s);let a=1/(s-2),l=-a,c=1+a,f=[l,l,c,l,c,c,l,l,c,c,l,c],m=6,u=6,p=3,_=new Float32Array(p*u*m),S=new Float32Array(p*u*m);for(let h=0;h<m;h++){let A=h%3*2/3-1,I=h>2?0:-1,M=[A,I,0,A+2/3,I,0,A+2/3,I+1,0,A,I,0,A+2/3,I+1,0,A,I+1,0];_.set(M,p*u*h);for(let y=0;y<u;y++){let b=f[y*2]*2-1,C=f[y*2+1]*2-1;h===0?Pn.set(1,C,b):h===1?Pn.set(-b,1,-C):h===2?Pn.set(-b,C,1):h===3?Pn.set(-1,C,-b):h===4?Pn.set(-b,-1,C):Pn.set(b,C,-1),Pn.toArray(S,(h*u+y)*p)}}let d=new ft;d.setAttribute("position",new $t(_,p)),d.setAttribute("outputDirection",new $t(S,p)),t.push(new mt(d,null)),i>br&&i--}return{lodMeshes:t,sizeLods:e}}function _f(n,e,t){let i=new At(n,e,t);return i.texture.mapping=Qi,i.texture.name="PMREM.cubeUv",i.scissorTest=!0,i}function yr(n,e,t,i,r){n.viewport.set(e,t,i,r),n.scissor.set(e,t,i,r)}function $p(n,e,t){return new Ut({name:"PMREMGGXConvolution",defines:{GGX_SAMPLES:Kp,CUBEUV_TEXEL_WIDTH:1/e,CUBEUV_TEXEL_HEIGHT:1/t,CUBEUV_MAX_MIP:`${n}.0`},uniforms:{envMap:{value:null},roughness:{value:0},mipInt:{value:0}},vertexShader:Xs(),fragmentShader:`

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
		`,blending:ti,depthTest:!1,depthWrite:!1})}function Qp(n,e,t){return new Ut({name:"SphericalGaussianBlur",defines:{SAMPLES:Yp,CUBEUV_TEXEL_WIDTH:1/e,CUBEUV_TEXEL_HEIGHT:1/t,CUBEUV_MAX_MIP:`${n}.0`},uniforms:{envMap:{value:null},sigma:{value:0},mipInt:{value:0}},vertexShader:Xs(),fragmentShader:`

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
		`,blending:ti,depthTest:!1,depthWrite:!1})}function xf(){return new Ut({name:"EquirectangularToCubeUV",uniforms:{envMap:{value:null}},vertexShader:Xs(),fragmentShader:`

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
		`,blending:ti,depthTest:!1,depthWrite:!1})}function vf(){return new Ut({name:"CubemapToCubeUV",uniforms:{envMap:{value:null},flipEnvMap:{value:-1}},vertexShader:Xs(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			uniform float flipEnvMap;

			varying vec3 vOutputDirection;

			uniform samplerCube envMap;

			void main() {

				gl_FragColor = textureCube( envMap, vec3( flipEnvMap * vOutputDirection.x, vOutputDirection.yz ) );

			}
		`,blending:ti,depthTest:!1,depthWrite:!1})}function Xs(){return`

		precision mediump float;
		precision mediump int;

		attribute vec3 outputDirection;

		varying vec3 vOutputDirection;

		void main() {

			vOutputDirection = outputDirection;
			gl_Position = vec4( position, 1.0 );

		}
	`}var Er=class extends At{constructor(e=1,t={}){super(e,e,t),this.isWebGLCubeRenderTarget=!0;let i={width:e,height:e,depth:1},r=[i,i,i,i,i,i];this.texture=new hr(r),this._setTextureOptions(t),this.texture.isRenderTargetTexture=!0}fromEquirectangularTexture(e,t){this.texture.type=t.type,this.texture.colorSpace=t.colorSpace,this.texture.generateMipmaps=t.generateMipmaps,this.texture.minFilter=t.minFilter,this.texture.magFilter=t.magFilter;let i={uniforms:{tEquirect:{value:null}},vertexShader:`

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
			`},r=new si(5,5,5),o=new Ut({name:"CubemapFromEquirect",uniforms:Wi(i.uniforms),vertexShader:i.vertexShader,fragmentShader:i.fragmentShader,side:gt,blending:ti});o.uniforms.tEquirect.value=t;let s=new mt(r,o),a=t.minFilter;return t.minFilter===mi&&(t.minFilter=_t),new ks(1,10,this).update(e,s),t.minFilter=a,s.geometry.dispose(),s.material.dispose(),this}clear(e,t=!0,i=!0,r=!0){let o=e.getRenderTarget();for(let s=0;s<6;s++)e.setRenderTarget(this,s),e.clear(t,i,r);e.setRenderTarget(o)}};function Sf(n){let e=new WeakMap,t=new WeakMap,i=null;function r(u,p=!1){return u==null?null:p?s(u):o(u)}function o(u){if(u&&u.isTexture){let p=u.mapping;if(p===Wo||p===Xo)if(e.has(u)){let _=e.get(u).texture;return a(_,u.mapping)}else{let _=u.image;if(_&&_.height>0){let S=new Er(_.height);return S.fromEquirectangularTexture(n,u),e.set(u,S),u.addEventListener("dispose",c),a(S.texture,u.mapping)}else return null}}return u}function s(u){if(u&&u.isTexture){let p=u.mapping,_=p===Wo||p===Xo,S=p===ci||p===Ni;if(_||S){let d=t.get(u),h=d!==void 0?d.texture.pmremVersion:0;if(u.isRenderTargetTexture&&u.pmremVersion!==h)return i===null&&(i=new Ao(n)),d=_?i.fromEquirectangular(u,d):i.fromCubemap(u,d),d.texture.pmremVersion=u.pmremVersion,t.set(u,d),d.texture;if(d!==void 0)return d.texture;{let A=u.image;return _&&A&&A.height>0||S&&A&&l(A)?(i===null&&(i=new Ao(n)),d=_?i.fromEquirectangular(u):i.fromCubemap(u),d.texture.pmremVersion=u.pmremVersion,t.set(u,d),u.addEventListener("dispose",f),d.texture):null}}}return u}function a(u,p){return p===Wo?u.mapping=ci:p===Xo&&(u.mapping=Ni),u}function l(u){let p=0,_=6;for(let S=0;S<_;S++)u[S]!==void 0&&p++;return p===_}function c(u){let p=u.target;p.removeEventListener("dispose",c);let _=e.get(p);_!==void 0&&(e.delete(p),_.dispose())}function f(u){let p=u.target;p.removeEventListener("dispose",f);let _=t.get(p);_!==void 0&&(t.delete(p),_.dispose())}function m(){e=new WeakMap,t=new WeakMap,i!==null&&(i.dispose(),i=null)}return{get:r,dispose:m}}function Mf(n){let e={};function t(i){if(e[i]!==void 0)return e[i];let r=n.getExtension(i);return e[i]=r,r}return{has:function(i){return t(i)!==null},init:function(){t("EXT_color_buffer_float"),t("WEBGL_clip_cull_distance"),t("OES_texture_float_linear"),t("EXT_color_buffer_half_float"),t("WEBGL_multisampled_render_to_texture"),t("WEBGL_render_shared_exponent")},get:function(i){let r=t(i);return r===null&&Ri("WebGLRenderer: "+i+" extension not supported."),r}}}function yf(n,e,t,i){let r={},o=new WeakMap;function s(m){let u=m.target;u.index!==null&&e.remove(u.index);for(let _ in u.attributes)e.remove(u.attributes[_]);u.removeEventListener("dispose",s),delete r[u.id];let p=o.get(u);p&&(e.remove(p),o.delete(u)),i.releaseStatesOfGeometry(u),u.isInstancedBufferGeometry===!0&&delete u._maxInstanceCount,t.memory.geometries--}function a(m,u){return r[u.id]===!0||(u.addEventListener("dispose",s),r[u.id]=!0,t.memory.geometries++),u}function l(m){let u=m.attributes;for(let p in u)e.update(u[p],n.ARRAY_BUFFER)}function c(m){let u=[],p=m.index,_=m.attributes.position,S=0;if(_===void 0)return;if(p!==null){let A=p.array;S=p.version;for(let I=0,M=A.length;I<M;I+=3){let y=A[I+0],b=A[I+1],C=A[I+2];u.push(y,b,b,C,C,y)}}else{let A=_.array;S=_.version;for(let I=0,M=A.length/3-1;I<M;I+=3){let y=I+0,b=I+1,C=I+2;u.push(y,b,b,C,C,y)}}let d=new(_.count>=65535?cr:lr)(u,1);d.version=S;let h=o.get(m);h&&e.remove(h),o.set(m,d)}function f(m){let u=o.get(m);if(u){let p=m.index;p!==null&&u.version<p.version&&c(m)}else c(m);return o.get(m)}return{get:a,update:l,getWireframeAttribute:f}}function bf(n,e,t){let i;function r(m){i=m}let o,s;function a(m){o=m.type,s=m.bytesPerElement}function l(m,u){n.drawElements(i,u,o,m*s),t.update(u,i,1)}function c(m,u,p){p!==0&&(n.drawElementsInstanced(i,u,o,m*s,p),t.update(u,i,p))}function f(m,u,p){if(p===0)return;e.get("WEBGL_multi_draw").multiDrawElementsWEBGL(i,u,0,o,m,0,p);let S=0;for(let d=0;d<p;d++)S+=u[d];t.update(S,i,1)}this.setMode=r,this.setIndex=a,this.render=l,this.renderInstances=c,this.renderMultiDraw=f}function Ef(n){let e={geometries:0,textures:0},t={frame:0,calls:0,triangles:0,points:0,lines:0};function i(o,s,a){switch(t.calls++,s){case n.TRIANGLES:t.triangles+=a*(o/3);break;case n.LINES:t.lines+=a*(o/2);break;case n.LINE_STRIP:t.lines+=a*(o-1);break;case n.LINE_LOOP:t.lines+=a*o;break;case n.POINTS:t.points+=a*o;break;default:Fe("WebGLInfo: Unknown draw mode:",s);break}}function r(){t.calls=0,t.triangles=0,t.points=0,t.lines=0}return{memory:e,render:t,programs:null,autoReset:!0,reset:r,update:i}}function Tf(n,e,t){let i=new WeakMap,r=new $e;function o(s,a,l){let c=s.morphTargetInfluences,f=a.morphAttributes.position||a.morphAttributes.normal||a.morphAttributes.color,m=f!==void 0?f.length:0,u=i.get(a);if(u===void 0||u.count!==m){let E=function(){C.dispose(),i.delete(a),a.removeEventListener("dispose",E)};u!==void 0&&u.texture.dispose();let p=a.morphAttributes.position!==void 0,_=a.morphAttributes.normal!==void 0,S=a.morphAttributes.color!==void 0,d=a.morphAttributes.position||[],h=a.morphAttributes.normal||[],A=a.morphAttributes.color||[],I=0;p===!0&&(I=1),_===!0&&(I=2),S===!0&&(I=3);let M=a.attributes.position.count*I,y=1;M>e.maxTextureSize&&(y=Math.ceil(M/e.maxTextureSize),M=e.maxTextureSize);let b=new Float32Array(M*y*4*m),C=new Qn(b,M,y,m);C.type=Ot,C.needsUpdate=!0;let x=I*4;for(let D=0;D<m;D++){let U=d[D],G=h[D],k=A[D],L=M*y*4*D;for(let H=0;H<U.count;H++){let K=H*x;p===!0&&(r.fromBufferAttribute(U,H),b[L+K+0]=r.x,b[L+K+1]=r.y,b[L+K+2]=r.z,b[L+K+3]=0),_===!0&&(r.fromBufferAttribute(G,H),b[L+K+4]=r.x,b[L+K+5]=r.y,b[L+K+6]=r.z,b[L+K+7]=0),S===!0&&(r.fromBufferAttribute(k,H),b[L+K+8]=r.x,b[L+K+9]=r.y,b[L+K+10]=r.z,b[L+K+11]=k.itemSize===4?r.w:1)}}u={count:m,texture:C,size:new _e(M,y)},i.set(a,u),a.addEventListener("dispose",E)}if(s.isInstancedMesh===!0&&s.morphTexture!==null)l.getUniforms().setValue(n,"morphTexture",s.morphTexture,t);else{let p=0;for(let S=0;S<c.length;S++)p+=c[S];let _=a.morphTargetsRelative?1:1-p;l.getUniforms().setValue(n,"morphTargetBaseInfluence",_),l.getUniforms().setValue(n,"morphTargetInfluences",c)}l.getUniforms().setValue(n,"morphTargetsTexture",u.texture,t),l.getUniforms().setValue(n,"morphTargetsTextureSize",u.size)}return{update:o}}function Af(n,e,t,i,r){let o=new WeakMap;function s(c){let f=r.render.frame,m=c.geometry,u=e.get(c,m);if(o.get(u)!==f&&(e.update(u),o.set(u,f)),c.isInstancedMesh&&(c.hasEventListener("dispose",l)===!1&&c.addEventListener("dispose",l),o.get(c)!==f&&(t.update(c.instanceMatrix,n.ARRAY_BUFFER),c.instanceColor!==null&&t.update(c.instanceColor,n.ARRAY_BUFFER),o.set(c,f))),c.isSkinnedMesh){let p=c.skeleton;o.get(p)!==f&&(p.update(),o.set(p,f))}return u}function a(){o=new WeakMap}function l(c){let f=c.target;f.removeEventListener("dispose",l),i.releaseStatesOfObject(f),t.remove(f.instanceMatrix),f.instanceColor!==null&&t.remove(f.instanceColor)}return{update:s,dispose:a}}var jp={[Oo]:"LINEAR_TONE_MAPPING",[Bo]:"REINHARD_TONE_MAPPING",[Go]:"CINEON_TONE_MAPPING",[zo]:"ACES_FILMIC_TONE_MAPPING",[Ho]:"AGX_TONE_MAPPING",[Vo]:"NEUTRAL_TONE_MAPPING",[ko]:"CUSTOM_TONE_MAPPING"};function wf(n,e,t,i,r,o){let s=new At(e,t,{type:n,depthBuffer:r,stencilBuffer:o,samples:i?4:0,storeMultisampledDepthBuffer:!1,storeMultisampledStencilBuffer:!1,resolveDepthBuffer:!1,resolveStencilBuffer:!1}),a=null,l=null,c=new ft;c.setAttribute("position",new nt([-1,3,0,-1,-1,0,3,-1,0],3)),c.setAttribute("uv",new nt([0,2,0,0,2,0],2));let f=new Ns({uniforms:{tDiffuse:{value:null}},vertexShader:`
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
			}`,depthTest:!1,depthWrite:!1}),m=new mt(c,f),u=new cn(-1,1,1,-1,0,1),p=null,_=null,S=!1,d,h=null,A=[],I=!1;this.setSize=function(M,y){s.setSize(M,y),a!==null&&a.setSize(M,y),l!==null&&l.setSize(M,y);for(let b=0;b<A.length;b++){let C=A[b];C.setSize&&C.setSize(M,y)}},this.setEffects=function(M){A=M,I=A.length>0&&A[0].isRenderPass===!0;let y=s.width,b=s.height;A.length>0&&a===null&&(a=new At(y,b,{type:Lt,depthBuffer:!1,stencilBuffer:!1}),l=new At(y,b,{type:Lt,depthBuffer:!1,stencilBuffer:!1}));for(let C=0;C<A.length;C++){let x=A[C];x.setSize&&x.setSize(y,b)}},this.begin=function(M,y){if(S||M.toneMapping===qt&&A.length===0)return!1;if(h=y,y!==null){let b=y.width,C=y.height;(s.width!==b||s.height!==C)&&this.setSize(b,C)}return I===!1&&M.setRenderTarget(s),d=M.toneMapping,M.toneMapping=qt,!0},this.hasRenderPass=function(){return I},this.end=function(M,y){M.toneMapping=d,S=!0;let b=s,C=a;for(let x=0;x<A.length;x++){let E=A[x];E.enabled!==!1&&(E.render(M,C,b,y),E.needsSwap!==!1&&(b=C,C=C===a?l:a))}if(p!==M.outputColorSpace||_!==M.toneMapping){p=M.outputColorSpace,_=M.toneMapping,f.defines={},Ue.getTransfer(p)===qe&&(f.defines.SRGB_TRANSFER="");let x=jp[_];x&&(f.defines[x]=""),f.needsUpdate=!0}f.uniforms.tDiffuse.value=b.texture,M.setRenderTarget(h),M.render(m,u),h=null,S=!1},this.isCompositing=function(){return S},this.dispose=function(){s.dispose(),a!==null&&a.dispose(),l!==null&&l.dispose(),c.dispose(),f.dispose()}}var Nf=new St,ka=new Ti(1,1),Uf=new Qn,Ff=new rs,Of=new hr,Rf=[],Cf=[],Pf=new Float32Array(16),Lf=new Float32Array(9),Df=new Float32Array(4);function Tr(n,e,t){let i=n[0];if(i<=0||i>0)return n;let r=e*t,o=Rf[r];if(o===void 0&&(o=new Float32Array(r),Rf[r]=o),e!==0){i.toArray(o,0);for(let s=1,a=0;s!==e;++s)a+=t,n[s].toArray(o,a)}return o}function wt(n,e){if(n.length!==e.length)return!1;for(let t=0,i=n.length;t<i;t++)if(n[t]!==e[t])return!1;return!0}function Rt(n,e){for(let t=0,i=e.length;t<i;t++)n[t]=e[t]}function qs(n,e){let t=Cf[e];t===void 0&&(t=new Int32Array(e),Cf[e]=t);for(let i=0;i!==e;++i)t[i]=n.allocateTextureUnit();return t}function em(n,e){let t=this.cache;t[0]!==e&&(n.uniform1f(this.addr,e),t[0]=e)}function tm(n,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y)&&(n.uniform2f(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if(wt(t,e))return;n.uniform2fv(this.addr,e),Rt(t,e)}}function im(n,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z)&&(n.uniform3f(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else if(e.r!==void 0)(t[0]!==e.r||t[1]!==e.g||t[2]!==e.b)&&(n.uniform3f(this.addr,e.r,e.g,e.b),t[0]=e.r,t[1]=e.g,t[2]=e.b);else{if(wt(t,e))return;n.uniform3fv(this.addr,e),Rt(t,e)}}function nm(n,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z||t[3]!==e.w)&&(n.uniform4f(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if(wt(t,e))return;n.uniform4fv(this.addr,e),Rt(t,e)}}function rm(n,e){let t=this.cache,i=e.elements;if(i===void 0){if(wt(t,e))return;n.uniformMatrix2fv(this.addr,!1,e),Rt(t,e)}else{if(wt(t,i))return;Df.set(i),n.uniformMatrix2fv(this.addr,!1,Df),Rt(t,i)}}function om(n,e){let t=this.cache,i=e.elements;if(i===void 0){if(wt(t,e))return;n.uniformMatrix3fv(this.addr,!1,e),Rt(t,e)}else{if(wt(t,i))return;Lf.set(i),n.uniformMatrix3fv(this.addr,!1,Lf),Rt(t,i)}}function sm(n,e){let t=this.cache,i=e.elements;if(i===void 0){if(wt(t,e))return;n.uniformMatrix4fv(this.addr,!1,e),Rt(t,e)}else{if(wt(t,i))return;Pf.set(i),n.uniformMatrix4fv(this.addr,!1,Pf),Rt(t,i)}}function am(n,e){let t=this.cache;t[0]!==e&&(n.uniform1i(this.addr,e),t[0]=e)}function lm(n,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y)&&(n.uniform2i(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if(wt(t,e))return;n.uniform2iv(this.addr,e),Rt(t,e)}}function cm(n,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z)&&(n.uniform3i(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else{if(wt(t,e))return;n.uniform3iv(this.addr,e),Rt(t,e)}}function um(n,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z||t[3]!==e.w)&&(n.uniform4i(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if(wt(t,e))return;n.uniform4iv(this.addr,e),Rt(t,e)}}function hm(n,e){let t=this.cache;t[0]!==e&&(n.uniform1ui(this.addr,e),t[0]=e)}function fm(n,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y)&&(n.uniform2ui(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if(wt(t,e))return;n.uniform2uiv(this.addr,e),Rt(t,e)}}function dm(n,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z)&&(n.uniform3ui(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else{if(wt(t,e))return;n.uniform3uiv(this.addr,e),Rt(t,e)}}function pm(n,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z||t[3]!==e.w)&&(n.uniform4ui(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if(wt(t,e))return;n.uniform4uiv(this.addr,e),Rt(t,e)}}function mm(n,e,t){let i=this.cache,r=t.allocateTextureUnit();i[0]!==r&&(n.uniform1i(this.addr,r),i[0]=r);let o;this.type===n.SAMPLER_2D_SHADOW?(ka.compareFunction=t.isReversedDepthBuffer()?Yn:qn,o=ka):o=Nf,t.setTexture2D(e||o,r)}function gm(n,e,t){let i=this.cache,r=t.allocateTextureUnit();i[0]!==r&&(n.uniform1i(this.addr,r),i[0]=r),t.setTexture3D(e||Ff,r)}function _m(n,e,t){let i=this.cache,r=t.allocateTextureUnit();i[0]!==r&&(n.uniform1i(this.addr,r),i[0]=r),t.setTextureCube(e||Of,r)}function xm(n,e,t){let i=this.cache,r=t.allocateTextureUnit();i[0]!==r&&(n.uniform1i(this.addr,r),i[0]=r),t.setTexture2DArray(e||Uf,r)}function vm(n){switch(n){case 5126:return em;case 35664:return tm;case 35665:return im;case 35666:return nm;case 35674:return rm;case 35675:return om;case 35676:return sm;case 5124:case 35670:return am;case 35667:case 35671:return lm;case 35668:case 35672:return cm;case 35669:case 35673:return um;case 5125:return hm;case 36294:return fm;case 36295:return dm;case 36296:return pm;case 35678:case 36198:case 36298:case 36306:case 35682:return mm;case 35679:case 36299:case 36307:return gm;case 35680:case 36300:case 36308:case 36293:return _m;case 36289:case 36303:case 36311:case 36292:return xm}}function Sm(n,e){n.uniform1fv(this.addr,e)}function Mm(n,e){let t=Tr(e,this.size,2);n.uniform2fv(this.addr,t)}function ym(n,e){let t=Tr(e,this.size,3);n.uniform3fv(this.addr,t)}function bm(n,e){let t=Tr(e,this.size,4);n.uniform4fv(this.addr,t)}function Em(n,e){let t=Tr(e,this.size,4);n.uniformMatrix2fv(this.addr,!1,t)}function Tm(n,e){let t=Tr(e,this.size,9);n.uniformMatrix3fv(this.addr,!1,t)}function Am(n,e){let t=Tr(e,this.size,16);n.uniformMatrix4fv(this.addr,!1,t)}function wm(n,e){n.uniform1iv(this.addr,e)}function Rm(n,e){n.uniform2iv(this.addr,e)}function Cm(n,e){n.uniform3iv(this.addr,e)}function Pm(n,e){n.uniform4iv(this.addr,e)}function Lm(n,e){n.uniform1uiv(this.addr,e)}function Dm(n,e){n.uniform2uiv(this.addr,e)}function Im(n,e){n.uniform3uiv(this.addr,e)}function Nm(n,e){n.uniform4uiv(this.addr,e)}function Um(n,e,t){let i=this.cache,r=e.length,o=qs(t,r);wt(i,o)||(n.uniform1iv(this.addr,o),Rt(i,o));let s;this.type===n.SAMPLER_2D_SHADOW?s=ka:s=Nf;for(let a=0;a!==r;++a)t.setTexture2D(e[a]||s,o[a])}function Fm(n,e,t){let i=this.cache,r=e.length,o=qs(t,r);wt(i,o)||(n.uniform1iv(this.addr,o),Rt(i,o));for(let s=0;s!==r;++s)t.setTexture3D(e[s]||Ff,o[s])}function Om(n,e,t){let i=this.cache,r=e.length,o=qs(t,r);wt(i,o)||(n.uniform1iv(this.addr,o),Rt(i,o));for(let s=0;s!==r;++s)t.setTextureCube(e[s]||Of,o[s])}function Bm(n,e,t){let i=this.cache,r=e.length,o=qs(t,r);wt(i,o)||(n.uniform1iv(this.addr,o),Rt(i,o));for(let s=0;s!==r;++s)t.setTexture2DArray(e[s]||Uf,o[s])}function Gm(n){switch(n){case 5126:return Sm;case 35664:return Mm;case 35665:return ym;case 35666:return bm;case 35674:return Em;case 35675:return Tm;case 35676:return Am;case 5124:case 35670:return wm;case 35667:case 35671:return Rm;case 35668:case 35672:return Cm;case 35669:case 35673:return Pm;case 5125:return Lm;case 36294:return Dm;case 36295:return Im;case 36296:return Nm;case 35678:case 36198:case 36298:case 36306:case 35682:return Um;case 35679:case 36299:case 36307:return Fm;case 35680:case 36300:case 36308:case 36293:return Om;case 36289:case 36303:case 36311:case 36292:return Bm}}var Ha=class{constructor(e,t,i){this.id=e,this.addr=i,this.cache=[],this.type=t.type,this.setValue=vm(t.type)}},Va=class{constructor(e,t,i){this.id=e,this.addr=i,this.cache=[],this.type=t.type,this.size=t.size,this.setValue=Gm(t.type)}},Wa=class{constructor(e){this.id=e,this.seq=[],this.map={}}setValue(e,t,i){let r=this.seq;for(let o=0,s=r.length;o!==s;++o){let a=r[o];a.setValue(e,t[a.id],i)}}},za=/(\w+)(\])?(\[|\.)?/g;function If(n,e){n.seq.push(e),n.map[e.id]=e}function zm(n,e,t){let i=n.name,r=i.length;for(za.lastIndex=0;;){let o=za.exec(i),s=za.lastIndex,a=o[1],l=o[2]==="]",c=o[3];if(l&&(a=a|0),c===void 0||c==="["&&s+2===r){If(t,c===void 0?new Ha(a,n,e):new Va(a,n,e));break}else{let m=t.map[a];m===void 0&&(m=new Wa(a),If(t,m)),t=m}}}var un=class{constructor(e,t){this.seq=[],this.map={};let i=e.getProgramParameter(t,e.ACTIVE_UNIFORMS);for(let s=0;s<i;++s){let a=e.getActiveUniform(t,s),l=e.getUniformLocation(t,a.name);zm(a,l,this)}let r=[],o=[];for(let s of this.seq)s.type===e.SAMPLER_2D_SHADOW||s.type===e.SAMPLER_CUBE_SHADOW||s.type===e.SAMPLER_2D_ARRAY_SHADOW?r.push(s):o.push(s);r.length>0&&(this.seq=r.concat(o))}setValue(e,t,i,r){let o=this.map[t];o!==void 0&&o.setValue(e,i,r)}setOptional(e,t,i){let r=t[i];r!==void 0&&this.setValue(e,i,r)}static upload(e,t,i,r){for(let o=0,s=t.length;o!==s;++o){let a=t[o],l=i[a.id];l.needsUpdate!==!1&&a.setValue(e,l.value,r)}}static seqWithValue(e,t){let i=[];for(let r=0,o=e.length;r!==o;++r){let s=e[r];s.id in t&&i.push(s)}return i}};function Xa(n,e,t){let i=n.createShader(e);return n.shaderSource(i,t),n.compileShader(i),i}var km=37297,Hm=0;function Vm(n,e){let t=n.split(`
`),i=[],r=Math.max(e-6,0),o=Math.min(e+6,t.length);for(let s=r;s<o;s++){let a=s+1;i.push(`${a===e?">":" "} ${a}: ${t[s]}`)}return i.join(`
`)}var Bf=new Le;function Wm(n){Ue._getMatrix(Bf,Ue.workingColorSpace,n);let e=`mat3( ${Bf.elements.map(t=>t.toFixed(4))} )`;switch(Ue.getTransfer(n)){case vn:return[e,"LinearTransferOETF"];case qe:return[e,"sRGBTransferOETF"];default:return xe("WebGLProgram: Unsupported color space: ",n),[e,"LinearTransferOETF"]}}function Gf(n,e,t){let i=n.getShaderParameter(e,n.COMPILE_STATUS),o=(n.getShaderInfoLog(e)||"").trim();if(i&&o==="")return"";let s=/ERROR: 0:(\d+)/.exec(o);if(s){let a=parseInt(s[1]);return t.toUpperCase()+`

`+o+`

`+Vm(n.getShaderSource(e),a)}else return o}function Xm(n,e){let t=Wm(e);return[`vec4 ${n}( vec4 value ) {`,`	return ${t[1]}( vec4( value.rgb * ${t[0]}, value.a ) );`,"}"].join(`
`)}var qm={[Oo]:"Linear",[Bo]:"Reinhard",[Go]:"Cineon",[zo]:"ACESFilmic",[Ho]:"AgX",[Vo]:"Neutral",[ko]:"Custom"};function Ym(n,e){let t=qm[e];return t===void 0?(xe("WebGLProgram: Unsupported toneMapping:",e),"vec3 "+n+"( vec3 color ) { return LinearToneMapping( color ); }"):"vec3 "+n+"( vec3 color ) { return "+t+"ToneMapping( color ); }"}var Ys=new P;function Km(){Ue.getLuminanceCoefficients(Ys);let n=Ys.x.toFixed(4),e=Ys.y.toFixed(4),t=Ys.z.toFixed(4);return["float luminance( const in vec3 rgb ) {",`	const vec3 weights = vec3( ${n}, ${e}, ${t} );`,"	return dot( weights, rgb );","}"].join(`
`)}function Zm(n){return[n.extensionClipCullDistance?"#extension GL_ANGLE_clip_cull_distance : require":"",n.extensionMultiDraw?"#extension GL_ANGLE_multi_draw : require":""].filter(wo).join(`
`)}function Jm(n){let e=[];for(let t in n){let i=n[t];i!==!1&&e.push("#define "+t+" "+i)}return e.join(`
`)}function $m(n,e){let t={},i=n.getProgramParameter(e,n.ACTIVE_ATTRIBUTES);for(let r=0;r<i;r++){let o=n.getActiveAttrib(e,r),s=o.name,a=1;o.type===n.FLOAT_MAT2&&(a=2),o.type===n.FLOAT_MAT3&&(a=3),o.type===n.FLOAT_MAT4&&(a=4),t[s]={type:o.type,location:n.getAttribLocation(e,s),locationSize:a}}return t}function wo(n){return n!==""}function zf(n,e){let t=e.numSpotLightShadows+e.numSpotLightMaps-e.numSpotLightShadowsWithMaps;return n.replace(/NUM_SUN_LIGHTS/g,e.numSunLights).replace(/NUM_DIR_LIGHTS/g,e.numDirLights).replace(/NUM_SPOT_LIGHTS/g,e.numSpotLights).replace(/NUM_SPOT_LIGHT_MAPS/g,e.numSpotLightMaps).replace(/NUM_SPOT_LIGHT_COORDS/g,t).replace(/NUM_RECT_AREA_LIGHTS/g,e.numRectAreaLights).replace(/NUM_POINT_LIGHTS/g,e.numPointLights).replace(/NUM_HEMI_LIGHTS/g,e.numHemiLights).replace(/NUM_SUN_LIGHT_SHADOWS/g,e.numSunLightShadows).replace(/NUM_DIR_LIGHT_SHADOWS/g,e.numDirLightShadows).replace(/NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS/g,e.numSpotLightShadowsWithMaps).replace(/NUM_SPOT_LIGHT_SHADOWS/g,e.numSpotLightShadows).replace(/NUM_POINT_LIGHT_SHADOWS/g,e.numPointLightShadows)}function kf(n,e){return n.replace(/NUM_CLIPPING_PLANES/g,e.numClippingPlanes).replace(/UNION_CLIPPING_PLANES/g,e.numClippingPlanes-e.numClipIntersection)}var Qm=/^[ \t]*#include +<([\w\d./]+)>/gm;function qa(n){return n.replace(Qm,eg)}var jm=new Map;function eg(n,e){let t=Be[e];if(t===void 0){let i=jm.get(e);if(i!==void 0)t=Be[i],xe('WebGLRenderer: Shader chunk "%s" has been deprecated. Use "%s" instead.',e,i);else throw new Error("THREE.WebGLProgram: Can not resolve #include <"+e+">")}return qa(t)}var tg=/#pragma unroll_loop_start\s+for\s*\(\s*int\s+i\s*=\s*(\d+)\s*;\s*i\s*<\s*(\d+)\s*;\s*i\s*\+\+\s*\)\s*{([\s\S]+?)}\s+#pragma unroll_loop_end/g;function Hf(n){return n.replace(tg,ig)}function ig(n,e,t,i){let r="";for(let o=parseInt(e);o<parseInt(t);o++)r+=i.replace(/\[\s*i\s*\]/g,"[ "+o+" ]").replace(/UNROLLED_LOOP_INDEX/g,o);return r}function Vf(n){let e=`precision ${n.precision} float;
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
#define LOW_PRECISION`),e}var ng={[Un]:"SHADOWMAP_TYPE_PCF",[mn]:"SHADOWMAP_TYPE_VSM"};function rg(n){return ng[n.shadowMapType]||"SHADOWMAP_TYPE_BASIC"}var og={[ci]:"ENVMAP_TYPE_CUBE",[Ni]:"ENVMAP_TYPE_CUBE",[Qi]:"ENVMAP_TYPE_CUBE_UV"};function sg(n){return n.envMap===!1?"ENVMAP_TYPE_CUBE":og[n.envMapMode]||"ENVMAP_TYPE_CUBE"}var ag={[Ni]:"ENVMAP_MODE_REFRACTION"};function lg(n){return n.envMap===!1?"ENVMAP_MODE_REFLECTION":ag[n.envMapMode]||"ENVMAP_MODE_REFLECTION"}var cg={[Fo]:"ENVMAP_BLENDING_MULTIPLY",[Dl]:"ENVMAP_BLENDING_MIX",[Il]:"ENVMAP_BLENDING_ADD"};function ug(n){return n.envMap===!1?"ENVMAP_BLENDING_NONE":cg[n.combine]||"ENVMAP_BLENDING_NONE"}function hg(n){let e=n.envMapCubeUVHeight;if(e===null)return null;let t=Math.log2(e)-2,i=1/e;return{texelWidth:1/(3*Math.max(Math.pow(2,t),112)),texelHeight:i,maxMip:t}}function Wf(n,e,t,i){let r=n.getContext(),o=t.defines,s=t.vertexShader,a=t.fragmentShader,l=rg(t),c=sg(t),f=lg(t),m=ug(t),u=hg(t),p=Zm(t),_=Jm(o),S=r.createProgram(),d,h,A=t.glslVersion?"#version "+t.glslVersion+`
`:"";t.isRawShaderMaterial?(d=["#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,_].filter(wo).join(`
`),d.length>0&&(d+=`
`),h=["#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,_].filter(wo).join(`
`),h.length>0&&(h+=`
`)):(d=[Vf(t),"#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,_,t.extensionClipCullDistance?"#define USE_CLIP_DISTANCE":"",t.batching?"#define USE_BATCHING":"",t.batchingColor?"#define USE_BATCHING_COLOR":"",t.instancing?"#define USE_INSTANCING":"",t.instancingColor?"#define USE_INSTANCING_COLOR":"",t.instancingMorph?"#define USE_INSTANCING_MORPH":"",t.useFog&&t.fog?"#define USE_FOG":"",t.useFog&&t.fogExp2?"#define FOG_EXP2":"",t.map?"#define USE_MAP":"",t.envMap?"#define USE_ENVMAP":"",t.envMap?"#define "+f:"",t.lightMap?"#define USE_LIGHTMAP":"",t.aoMap?"#define USE_AOMAP":"",t.bumpMap?"#define USE_BUMPMAP":"",t.normalMap?"#define USE_NORMALMAP":"",t.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",t.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",t.displacementMap?"#define USE_DISPLACEMENTMAP":"",t.emissiveMap?"#define USE_EMISSIVEMAP":"",t.anisotropy?"#define USE_ANISOTROPY":"",t.anisotropyMap?"#define USE_ANISOTROPYMAP":"",t.clearcoatMap?"#define USE_CLEARCOATMAP":"",t.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",t.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",t.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",t.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",t.specularMap?"#define USE_SPECULARMAP":"",t.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",t.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",t.roughnessMap?"#define USE_ROUGHNESSMAP":"",t.metalnessMap?"#define USE_METALNESSMAP":"",t.alphaMap?"#define USE_ALPHAMAP":"",t.alphaHash?"#define USE_ALPHAHASH":"",t.transmission?"#define USE_TRANSMISSION":"",t.transmissionMap?"#define USE_TRANSMISSIONMAP":"",t.thicknessMap?"#define USE_THICKNESSMAP":"",t.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",t.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",t.mapUv?"#define MAP_UV "+t.mapUv:"",t.alphaMapUv?"#define ALPHAMAP_UV "+t.alphaMapUv:"",t.lightMapUv?"#define LIGHTMAP_UV "+t.lightMapUv:"",t.aoMapUv?"#define AOMAP_UV "+t.aoMapUv:"",t.emissiveMapUv?"#define EMISSIVEMAP_UV "+t.emissiveMapUv:"",t.bumpMapUv?"#define BUMPMAP_UV "+t.bumpMapUv:"",t.normalMapUv?"#define NORMALMAP_UV "+t.normalMapUv:"",t.displacementMapUv?"#define DISPLACEMENTMAP_UV "+t.displacementMapUv:"",t.metalnessMapUv?"#define METALNESSMAP_UV "+t.metalnessMapUv:"",t.roughnessMapUv?"#define ROUGHNESSMAP_UV "+t.roughnessMapUv:"",t.anisotropyMapUv?"#define ANISOTROPYMAP_UV "+t.anisotropyMapUv:"",t.clearcoatMapUv?"#define CLEARCOATMAP_UV "+t.clearcoatMapUv:"",t.clearcoatNormalMapUv?"#define CLEARCOAT_NORMALMAP_UV "+t.clearcoatNormalMapUv:"",t.clearcoatRoughnessMapUv?"#define CLEARCOAT_ROUGHNESSMAP_UV "+t.clearcoatRoughnessMapUv:"",t.iridescenceMapUv?"#define IRIDESCENCEMAP_UV "+t.iridescenceMapUv:"",t.iridescenceThicknessMapUv?"#define IRIDESCENCE_THICKNESSMAP_UV "+t.iridescenceThicknessMapUv:"",t.sheenColorMapUv?"#define SHEEN_COLORMAP_UV "+t.sheenColorMapUv:"",t.sheenRoughnessMapUv?"#define SHEEN_ROUGHNESSMAP_UV "+t.sheenRoughnessMapUv:"",t.specularMapUv?"#define SPECULARMAP_UV "+t.specularMapUv:"",t.specularColorMapUv?"#define SPECULAR_COLORMAP_UV "+t.specularColorMapUv:"",t.specularIntensityMapUv?"#define SPECULAR_INTENSITYMAP_UV "+t.specularIntensityMapUv:"",t.transmissionMapUv?"#define TRANSMISSIONMAP_UV "+t.transmissionMapUv:"",t.thicknessMapUv?"#define THICKNESSMAP_UV "+t.thicknessMapUv:"",t.vertexTangents&&t.flatShading===!1?"#define USE_TANGENT":"",t.vertexNormals?"#define HAS_NORMAL":"",t.vertexColors?"#define USE_COLOR":"",t.vertexAlphas?"#define USE_COLOR_ALPHA":"",t.vertexUv1s?"#define USE_UV1":"",t.vertexUv2s?"#define USE_UV2":"",t.vertexUv3s?"#define USE_UV3":"",t.pointsUvs?"#define USE_POINTS_UV":"",t.flatShading?"#define FLAT_SHADED":"",t.skinning?"#define USE_SKINNING":"",t.morphTargets?"#define USE_MORPHTARGETS":"",t.morphNormals&&t.flatShading===!1?"#define USE_MORPHNORMALS":"",t.morphColors?"#define USE_MORPHCOLORS":"",t.morphTargetsCount>0?"#define MORPHTARGETS_TEXTURE_STRIDE "+t.morphTextureStride:"",t.morphTargetsCount>0?"#define MORPHTARGETS_COUNT "+t.morphTargetsCount:"",t.doubleSided?"#define DOUBLE_SIDED":"",t.flipSided?"#define FLIP_SIDED":"",t.shadowMapEnabled?"#define USE_SHADOWMAP":"",t.shadowMapEnabled?"#define "+l:"",t.sizeAttenuation?"#define USE_SIZEATTENUATION":"",t.numLightProbes>0?"#define USE_LIGHT_PROBES":"",t.logarithmicDepthBuffer?"#define USE_LOGARITHMIC_DEPTH_BUFFER":"",t.reversedDepthBuffer?"#define USE_REVERSED_DEPTH_BUFFER":"","uniform mat4 modelMatrix;","uniform mat4 modelViewMatrix;","uniform mat4 projectionMatrix;","uniform mat4 viewMatrix;","uniform mat3 normalMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;","#ifdef USE_INSTANCING","	attribute mat4 instanceMatrix;","#endif","#ifdef USE_INSTANCING_COLOR","	attribute vec3 instanceColor;","#endif","#ifdef USE_INSTANCING_MORPH","	uniform sampler2D morphTexture;","#endif","attribute vec3 position;","attribute vec3 normal;","attribute vec2 uv;","#ifdef USE_UV1","	attribute vec2 uv1;","#endif","#ifdef USE_UV2","	attribute vec2 uv2;","#endif","#ifdef USE_UV3","	attribute vec2 uv3;","#endif","#ifdef USE_TANGENT","	attribute vec4 tangent;","#endif","#if defined( USE_COLOR_ALPHA )","	attribute vec4 color;","#elif defined( USE_COLOR )","	attribute vec3 color;","#endif","#ifdef USE_SKINNING","	attribute vec4 skinIndex;","	attribute vec4 skinWeight;","#endif",`
`].filter(wo).join(`
`),h=[Vf(t),"#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,_,t.useFog&&t.fog?"#define USE_FOG":"",t.useFog&&t.fogExp2?"#define FOG_EXP2":"",t.alphaToCoverage?"#define ALPHA_TO_COVERAGE":"",t.map?"#define USE_MAP":"",t.matcap?"#define USE_MATCAP":"",t.envMap?"#define USE_ENVMAP":"",t.envMap?"#define "+c:"",t.envMap?"#define "+f:"",t.envMap?"#define "+m:"",u?"#define CUBEUV_TEXEL_WIDTH "+u.texelWidth:"",u?"#define CUBEUV_TEXEL_HEIGHT "+u.texelHeight:"",u?"#define CUBEUV_MAX_MIP "+u.maxMip+".0":"",t.lightMap?"#define USE_LIGHTMAP":"",t.aoMap?"#define USE_AOMAP":"",t.bumpMap?"#define USE_BUMPMAP":"",t.normalMap?"#define USE_NORMALMAP":"",t.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",t.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",t.packedNormalMap?"#define USE_PACKED_NORMALMAP":"",t.emissiveMap?"#define USE_EMISSIVEMAP":"",t.anisotropy?"#define USE_ANISOTROPY":"",t.anisotropyMap?"#define USE_ANISOTROPYMAP":"",t.clearcoat?"#define USE_CLEARCOAT":"",t.clearcoatMap?"#define USE_CLEARCOATMAP":"",t.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",t.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",t.dispersion?"#define USE_DISPERSION":"",t.retroreflection?"#define USE_RETROREFLECTION":"",t.iridescence?"#define USE_IRIDESCENCE":"",t.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",t.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",t.specularMap?"#define USE_SPECULARMAP":"",t.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",t.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",t.roughnessMap?"#define USE_ROUGHNESSMAP":"",t.metalnessMap?"#define USE_METALNESSMAP":"",t.alphaMap?"#define USE_ALPHAMAP":"",t.alphaTest?"#define USE_ALPHATEST":"",t.alphaHash?"#define USE_ALPHAHASH":"",t.sheen?"#define USE_SHEEN":"",t.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",t.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",t.transmission?"#define USE_TRANSMISSION":"",t.transmissionMap?"#define USE_TRANSMISSIONMAP":"",t.thicknessMap?"#define USE_THICKNESSMAP":"",t.vertexTangents&&t.flatShading===!1?"#define USE_TANGENT":"",t.vertexColors||t.instancingColor?"#define USE_COLOR":"",t.vertexAlphas||t.batchingColor?"#define USE_COLOR_ALPHA":"",t.vertexUv1s?"#define USE_UV1":"",t.vertexUv2s?"#define USE_UV2":"",t.vertexUv3s?"#define USE_UV3":"",t.pointsUvs?"#define USE_POINTS_UV":"",t.gradientMap?"#define USE_GRADIENTMAP":"",t.flatShading?"#define FLAT_SHADED":"",t.doubleSided?"#define DOUBLE_SIDED":"",t.flipSided?"#define FLIP_SIDED":"",t.shadowMapEnabled?"#define USE_SHADOWMAP":"",t.shadowMapEnabled?"#define "+l:"",t.premultipliedAlpha?"#define PREMULTIPLIED_ALPHA":"",t.numLightProbes>0?"#define USE_LIGHT_PROBES":"",t.numLightProbeGrids>0?"#define USE_LIGHT_PROBES_GRID":"",t.decodeVideoTexture?"#define DECODE_VIDEO_TEXTURE":"",t.decodeVideoTextureEmissive?"#define DECODE_VIDEO_TEXTURE_EMISSIVE":"",t.logarithmicDepthBuffer?"#define USE_LOGARITHMIC_DEPTH_BUFFER":"",t.reversedDepthBuffer?"#define USE_REVERSED_DEPTH_BUFFER":"","uniform mat4 viewMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;",t.toneMapping!==qt?"#define TONE_MAPPING":"",t.toneMapping!==qt?Be.tonemapping_pars_fragment:"",t.toneMapping!==qt?Ym("toneMapping",t.toneMapping):"",t.dithering?"#define DITHERING":"",t.opaque?"#define OPAQUE":"",Be.colorspace_pars_fragment,Xm("linearToOutputTexel",t.outputColorSpace),Km(),t.useDepthPacking?"#define DEPTH_PACKING "+t.depthPacking:"",`
`].filter(wo).join(`
`)),s=qa(s),s=zf(s,t),s=kf(s,t),a=qa(a),a=zf(a,t),a=kf(a,t),s=Hf(s),a=Hf(a),t.isRawShaderMaterial!==!0&&(A=`#version 300 es
`,d=[p,"#define attribute in","#define varying out","#define texture2D texture"].join(`
`)+`
`+d,h=["#define varying in",t.glslVersion===la?"":"layout(location = 0) out highp vec4 pc_fragColor;",t.glslVersion===la?"":"#define gl_FragColor pc_fragColor","#define gl_FragDepthEXT gl_FragDepth","#define texture2D texture","#define textureCube texture","#define texture2DProj textureProj","#define texture2DLodEXT textureLod","#define texture2DProjLodEXT textureProjLod","#define textureCubeLodEXT textureLod","#define texture2DGradEXT textureGrad","#define texture2DProjGradEXT textureProjGrad","#define textureCubeGradEXT textureGrad"].join(`
`)+`
`+h);let I=A+d+s,M=A+h+a,y=Xa(r,r.VERTEX_SHADER,I),b=Xa(r,r.FRAGMENT_SHADER,M);r.attachShader(S,y),r.attachShader(S,b),t.index0AttributeName!==void 0?r.bindAttribLocation(S,0,t.index0AttributeName):t.hasPositionAttribute===!0&&r.bindAttribLocation(S,0,"position"),r.linkProgram(S);function C(U){if(n.debug.checkShaderErrors){let G=r.getProgramInfoLog(S)||"",k=r.getShaderInfoLog(y)||"",L=r.getShaderInfoLog(b)||"",H=G.trim(),K=k.trim(),$=L.trim(),oe=!0,Q=!0;if(r.getProgramParameter(S,r.LINK_STATUS)===!1)if(oe=!1,typeof n.debug.onShaderError=="function")n.debug.onShaderError(r,S,y,b);else{let re=Gf(r,y,"vertex"),se=Gf(r,b,"fragment");Fe("WebGLProgram: Shader Error "+r.getError()+" - VALIDATE_STATUS "+r.getProgramParameter(S,r.VALIDATE_STATUS)+`

Material Name: `+U.name+`
Material Type: `+U.type+`

Program Info Log: `+H+`
`+re+`
`+se)}else H!==""?xe("WebGLProgram: Program Info Log:",H):(K===""||$==="")&&(Q=!1);Q&&(U.diagnostics={runnable:oe,programLog:H,vertexShader:{log:K,prefix:d},fragmentShader:{log:$,prefix:h}})}r.deleteShader(y),r.deleteShader(b),x=new un(r,S),E=$m(r,S)}let x;this.getUniforms=function(){return x===void 0&&C(this),x};let E;this.getAttributes=function(){return E===void 0&&C(this),E};let D=t.rendererExtensionParallelShaderCompile===!1;return this.isReady=function(){return D===!1&&(D=r.getProgramParameter(S,km)),D},this.destroy=function(){i.releaseStatesOfProgram(this),r.deleteProgram(S),this.program=void 0},this.type=t.shaderType,this.name=t.shaderName,this.id=Hm++,this.cacheKey=e,this.usedTimes=1,this.program=S,this.vertexShader=y,this.fragmentShader=b,this}var fg=0,Ks=class{constructor(){this.shaderCache=new Map,this.materialCache=new Map}update(e,t,i){let r=this._getShaderCacheForMaterial(e);return r.has(t)===!1&&(r.add(t),t.usedTimes++),r.has(i)===!1&&(r.add(i),i.usedTimes++),this}remove(e){let t=this.materialCache.get(e);for(let i of t)i.usedTimes--,i.usedTimes===0&&this.shaderCache.delete(i.code);return this.materialCache.delete(e),this}getVertexShaderStage(e){return this._getShaderStage(e.vertexShader)}getFragmentShaderStage(e){return this._getShaderStage(e.fragmentShader)}dispose(){this.shaderCache.clear(),this.materialCache.clear()}_getShaderCacheForMaterial(e){let t=this.materialCache,i=t.get(e);return i===void 0&&(i=new Set,t.set(e,i)),i}_getShaderStage(e){let t=this.shaderCache,i=t.get(e);return i===void 0&&(i=new Ya(e),t.set(e,i)),i}},Ya=class{constructor(e){this.id=fg++,this.code=e,this.usedTimes=0}};function dg(n){return n===ii||n===gn||n===_n}function Xf(n,e,t,i,r,o){let s=new nn,a=new Ks,l=new Set,c=[],f=new Map,m=i.logarithmicDepthBuffer,u=i.precision,p={MeshDepthMaterial:"depth",MeshDistanceMaterial:"distance",MeshNormalMaterial:"normal",MeshBasicMaterial:"basic",MeshLambertMaterial:"lambert",MeshPhongMaterial:"phong",MeshToonMaterial:"toon",MeshStandardMaterial:"physical",MeshPhysicalMaterial:"physical",MeshMatcapMaterial:"matcap",LineBasicMaterial:"basic",LineDashedMaterial:"dashed",PointsMaterial:"points",ShadowMaterial:"shadow",SpriteMaterial:"sprite"};function _(x){return l.add(x),x===0?"uv":`uv${x}`}function S(x,E,D,U,G,k){let L=U.fog,H=G.geometry,K=x.isMeshStandardMaterial||x.isMeshLambertMaterial||x.isMeshPhongMaterial?U.environment:null,$=x.isMeshStandardMaterial||x.isMeshLambertMaterial&&!x.envMap||x.isMeshPhongMaterial&&!x.envMap,oe=e.get(x.envMap||K,$),Q=oe&&oe.mapping===Qi?oe.image.height:null,re=p[x.type];x.precision!==null&&(u=i.getMaxPrecision(x.precision),u!==x.precision&&xe("WebGLProgram.getParameters:",x.precision,"not supported, using",u,"instead."));let se=H.morphAttributes.position||H.morphAttributes.normal||H.morphAttributes.color,Pe=se!==void 0?se.length:0,Ce=0;H.morphAttributes.position!==void 0&&(Ce=1),H.morphAttributes.normal!==void 0&&(Ce=2),H.morphAttributes.color!==void 0&&(Ce=3);let ot,Ve,Ye,j;if(re){let Qe=di[re];ot=Qe.vertexShader,Ve=Qe.fragmentShader}else{ot=x.vertexShader,Ve=x.fragmentShader;let Qe=a.getVertexShaderStage(x),je=a.getFragmentShaderStage(x);a.update(x,Qe,je),Ye=Qe.id,j=je.id}let ne=n.getRenderTarget(),Se=n.state.buffers.depth.getReversed(),Ie=G.isInstancedMesh===!0,ve=G.isBatchedMesh===!0,ze=!!x.map,Ke=!!x.matcap,Ge=!!oe,We=!!x.aoMap,tt=!!x.lightMap,He=!!x.bumpMap&&x.wireframe===!1,ct=!!x.normalMap,Mt=!!x.displacementMap,Ft=!!x.emissiveMap,ut=!!x.metalnessMap,at=!!x.roughnessMap,B=x.anisotropy>0,Tt=x.clearcoat>0,Je=x.dispersion>0,T=x.retroreflectivity>0,g=x.iridescence>0,z=x.sheen>0,X=x.transmission>0,Z=B&&!!x.anisotropyMap,he=Tt&&!!x.clearcoatMap,w=Tt&&!!x.clearcoatNormalMap,R=Tt&&!!x.clearcoatRoughnessMap,F=g&&!!x.iridescenceMap,q=g&&!!x.iridescenceThicknessMap,ce=z&&!!x.sheenColorMap,ie=z&&!!x.sheenRoughnessMap,ue=!!x.specularMap,fe=!!x.specularColorMap,ge=!!x.specularIntensityMap,De=X&&!!x.transmissionMap,N=X&&!!x.thicknessMap,le=!!x.gradientMap,ee=!!x.alphaMap,J=x.alphaTest>0,ae=!!x.alphaHash,te=!!x.extensions,we=qt;x.toneMapped&&(ne===null||ne.isXRRenderTarget===!0)&&(we=n.toneMapping);let Ee={shaderID:re,shaderType:x.type,shaderName:x.name,vertexShader:ot,fragmentShader:Ve,defines:x.defines,customVertexShaderID:Ye,customFragmentShaderID:j,isRawShaderMaterial:x.isRawShaderMaterial===!0,glslVersion:x.glslVersion,precision:u,batching:ve,batchingColor:ve&&G._colorsTexture!==null,instancing:Ie,instancingColor:Ie&&G.instanceColor!==null,instancingMorph:Ie&&G.morphTexture!==null,outputColorSpace:ne===null?n.outputColorSpace:ne.isXRRenderTarget===!0?ne.texture.colorSpace:Ue.workingColorSpace,alphaToCoverage:!!x.alphaToCoverage,map:ze,matcap:Ke,envMap:Ge,envMapMode:Ge&&oe.mapping,envMapCubeUVHeight:Q,aoMap:We,lightMap:tt,bumpMap:He,normalMap:ct,displacementMap:Mt,emissiveMap:Ft,normalMapObjectSpace:ct&&x.normalMapType===Fl,normalMapTangentSpace:ct&&x.normalMapType===po,packedNormalMap:ct&&x.normalMapType===po&&dg(x.normalMap.format),metalnessMap:ut,roughnessMap:at,anisotropy:B,anisotropyMap:Z,clearcoat:Tt,clearcoatMap:he,clearcoatNormalMap:w,clearcoatRoughnessMap:R,dispersion:Je,retroreflection:T,iridescence:g,iridescenceMap:F,iridescenceThicknessMap:q,sheen:z,sheenColorMap:ce,sheenRoughnessMap:ie,specularMap:ue,specularColorMap:fe,specularIntensityMap:ge,transmission:X,transmissionMap:De,thicknessMap:N,gradientMap:le,opaque:x.transparent===!1&&x.blending===Zi&&x.alphaToCoverage===!1,alphaMap:ee,alphaTest:J,alphaHash:ae,combine:x.combine,mapUv:ze&&_(x.map.channel),aoMapUv:We&&_(x.aoMap.channel),lightMapUv:tt&&_(x.lightMap.channel),bumpMapUv:He&&_(x.bumpMap.channel),normalMapUv:ct&&_(x.normalMap.channel),displacementMapUv:Mt&&_(x.displacementMap.channel),emissiveMapUv:Ft&&_(x.emissiveMap.channel),metalnessMapUv:ut&&_(x.metalnessMap.channel),roughnessMapUv:at&&_(x.roughnessMap.channel),anisotropyMapUv:Z&&_(x.anisotropyMap.channel),clearcoatMapUv:he&&_(x.clearcoatMap.channel),clearcoatNormalMapUv:w&&_(x.clearcoatNormalMap.channel),clearcoatRoughnessMapUv:R&&_(x.clearcoatRoughnessMap.channel),iridescenceMapUv:F&&_(x.iridescenceMap.channel),iridescenceThicknessMapUv:q&&_(x.iridescenceThicknessMap.channel),sheenColorMapUv:ce&&_(x.sheenColorMap.channel),sheenRoughnessMapUv:ie&&_(x.sheenRoughnessMap.channel),specularMapUv:ue&&_(x.specularMap.channel),specularColorMapUv:fe&&_(x.specularColorMap.channel),specularIntensityMapUv:ge&&_(x.specularIntensityMap.channel),transmissionMapUv:De&&_(x.transmissionMap.channel),thicknessMapUv:N&&_(x.thicknessMap.channel),alphaMapUv:ee&&_(x.alphaMap.channel),vertexTangents:!!H.attributes.tangent&&(ct||B),vertexNormals:!!H.attributes.normal,vertexColors:x.vertexColors,vertexAlphas:x.vertexColors===!0&&!!H.attributes.color&&H.attributes.color.itemSize===4,pointsUvs:G.isPoints===!0&&!!H.attributes.uv&&(ze||ee),fog:!!L,useFog:x.fog===!0,fogExp2:!!L&&L.isFogExp2,flatShading:x.wireframe===!1&&(x.flatShading===!0||H.attributes.normal===void 0&&ct===!1&&(x.isMeshLambertMaterial||x.isMeshPhongMaterial||x.isMeshStandardMaterial||x.isMeshPhysicalMaterial)),sizeAttenuation:x.sizeAttenuation===!0,logarithmicDepthBuffer:m,reversedDepthBuffer:Se,skinning:G.isSkinnedMesh===!0,hasPositionAttribute:H.attributes.position!==void 0,morphTargets:H.morphAttributes.position!==void 0,morphNormals:H.morphAttributes.normal!==void 0,morphColors:H.morphAttributes.color!==void 0,morphTargetsCount:Pe,morphTextureStride:Ce,numSunLights:E.sun.length,numDirLights:E.directional.length,numPointLights:E.point.length,numSpotLights:E.spot.length,numSpotLightMaps:E.spotLightMap.length,numRectAreaLights:E.rectArea.length,numHemiLights:E.hemi.length,numSunLightShadows:E.sunShadowMap.length,numDirLightShadows:E.directionalShadowMap.length,numPointLightShadows:E.pointShadowMap.length,numSpotLightShadows:E.spotShadowMap.length,numSpotLightShadowsWithMaps:E.numSpotLightShadowsWithMaps,numLightProbes:E.numLightProbes,numLightProbeGrids:k.length,numClippingPlanes:o.numPlanes,numClipIntersection:o.numIntersection,dithering:x.dithering,shadowMapEnabled:n.shadowMap.enabled&&D.length>0,shadowMapType:n.shadowMap.type,toneMapping:we,decodeVideoTexture:ze&&x.map.isVideoTexture===!0&&Ue.getTransfer(x.map.colorSpace)===qe,decodeVideoTextureEmissive:Ft&&x.emissiveMap.isVideoTexture===!0&&Ue.getTransfer(x.emissiveMap.colorSpace)===qe,premultipliedAlpha:x.premultipliedAlpha,doubleSided:x.side===ei,flipSided:x.side===gt,useDepthPacking:x.depthPacking>=0,depthPacking:x.depthPacking||0,index0AttributeName:x.index0AttributeName,extensionClipCullDistance:te&&x.extensions.clipCullDistance===!0&&t.has("WEBGL_clip_cull_distance"),extensionMultiDraw:(te&&x.extensions.multiDraw===!0||ve)&&t.has("WEBGL_multi_draw"),rendererExtensionParallelShaderCompile:t.has("KHR_parallel_shader_compile"),customProgramCacheKey:x.customProgramCacheKey()};return Ee.vertexUv1s=l.has(1),Ee.vertexUv2s=l.has(2),Ee.vertexUv3s=l.has(3),l.clear(),Ee}function d(x){let E=[];if(x.shaderID?E.push(x.shaderID):(E.push(x.customVertexShaderID),E.push(x.customFragmentShaderID)),x.defines!==void 0)for(let D in x.defines)E.push(D),E.push(x.defines[D]);return x.isRawShaderMaterial===!1&&(h(E,x),A(E,x),E.push(n.outputColorSpace)),E.push(x.customProgramCacheKey),E.join()}function h(x,E){x.push(E.precision),x.push(E.outputColorSpace),x.push(E.envMapMode),x.push(E.envMapCubeUVHeight),x.push(E.mapUv),x.push(E.alphaMapUv),x.push(E.lightMapUv),x.push(E.aoMapUv),x.push(E.bumpMapUv),x.push(E.normalMapUv),x.push(E.displacementMapUv),x.push(E.emissiveMapUv),x.push(E.metalnessMapUv),x.push(E.roughnessMapUv),x.push(E.anisotropyMapUv),x.push(E.clearcoatMapUv),x.push(E.clearcoatNormalMapUv),x.push(E.clearcoatRoughnessMapUv),x.push(E.iridescenceMapUv),x.push(E.iridescenceThicknessMapUv),x.push(E.sheenColorMapUv),x.push(E.sheenRoughnessMapUv),x.push(E.specularMapUv),x.push(E.specularColorMapUv),x.push(E.specularIntensityMapUv),x.push(E.transmissionMapUv),x.push(E.thicknessMapUv),x.push(E.combine),x.push(E.fogExp2),x.push(E.sizeAttenuation),x.push(E.morphTargetsCount),x.push(E.morphAttributeCount),x.push(E.numSunLights),x.push(E.numDirLights),x.push(E.numPointLights),x.push(E.numSpotLights),x.push(E.numSpotLightMaps),x.push(E.numHemiLights),x.push(E.numRectAreaLights),x.push(E.numSunLightShadows),x.push(E.numDirLightShadows),x.push(E.numPointLightShadows),x.push(E.numSpotLightShadows),x.push(E.numSpotLightShadowsWithMaps),x.push(E.numLightProbes),x.push(E.shadowMapType),x.push(E.toneMapping),x.push(E.numClippingPlanes),x.push(E.numClipIntersection),x.push(E.depthPacking)}function A(x,E){s.disableAll(),E.instancing&&s.enable(0),E.instancingColor&&s.enable(1),E.instancingMorph&&s.enable(2),E.matcap&&s.enable(3),E.envMap&&s.enable(4),E.normalMapObjectSpace&&s.enable(5),E.normalMapTangentSpace&&s.enable(6),E.clearcoat&&s.enable(7),E.iridescence&&s.enable(8),E.alphaTest&&s.enable(9),E.vertexColors&&s.enable(10),E.vertexAlphas&&s.enable(11),E.vertexUv1s&&s.enable(12),E.vertexUv2s&&s.enable(13),E.vertexUv3s&&s.enable(14),E.vertexTangents&&s.enable(15),E.anisotropy&&s.enable(16),E.alphaHash&&s.enable(17),E.batching&&s.enable(18),E.dispersion&&s.enable(19),E.retroreflection&&s.enable(24),E.batchingColor&&s.enable(20),E.gradientMap&&s.enable(21),E.packedNormalMap&&s.enable(22),E.vertexNormals&&s.enable(23),x.push(s.mask),s.disableAll(),E.fog&&s.enable(0),E.useFog&&s.enable(1),E.flatShading&&s.enable(2),E.logarithmicDepthBuffer&&s.enable(3),E.reversedDepthBuffer&&s.enable(4),E.skinning&&s.enable(5),E.morphTargets&&s.enable(6),E.morphNormals&&s.enable(7),E.morphColors&&s.enable(8),E.premultipliedAlpha&&s.enable(9),E.shadowMapEnabled&&s.enable(10),E.doubleSided&&s.enable(11),E.flipSided&&s.enable(12),E.useDepthPacking&&s.enable(13),E.dithering&&s.enable(14),E.transmission&&s.enable(15),E.sheen&&s.enable(16),E.opaque&&s.enable(17),E.pointsUvs&&s.enable(18),E.decodeVideoTexture&&s.enable(19),E.decodeVideoTextureEmissive&&s.enable(20),E.alphaToCoverage&&s.enable(21),E.numLightProbeGrids>0&&s.enable(22),E.hasPositionAttribute&&s.enable(23),x.push(s.mask)}function I(x){let E=p[x.type],D;if(E){let U=di[E];D=vc.clone(U.uniforms)}else D=x.uniforms;return D}function M(x,E){let D=f.get(E);return D!==void 0?++D.usedTimes:(D=new Wf(n,E,x,r),c.push(D),f.set(E,D)),D}function y(x){if(--x.usedTimes===0){let E=c.indexOf(x);c[E]=c[c.length-1],c.pop(),f.delete(x.cacheKey),x.destroy()}}function b(x){a.remove(x)}function C(){a.dispose()}return{getParameters:S,getProgramCacheKey:d,getUniforms:I,acquireProgram:M,releaseProgram:y,releaseShaderCache:b,programs:c,dispose:C}}function qf(){let n=new WeakMap;function e(s){return n.has(s)}function t(s){let a=n.get(s);return a===void 0&&(a={},n.set(s,a)),a}function i(s){n.delete(s)}function r(s,a,l){n.get(s)[a]=l}function o(){n=new WeakMap}return{has:e,get:t,remove:i,update:r,dispose:o}}function pg(n,e){return n.groupOrder!==e.groupOrder?n.groupOrder-e.groupOrder:n.renderOrder!==e.renderOrder?n.renderOrder-e.renderOrder:n.material.id!==e.material.id?n.material.id-e.material.id:n.materialVariant!==e.materialVariant?n.materialVariant-e.materialVariant:n.z!==e.z?n.z-e.z:n.id-e.id}function Yf(n,e){return n.groupOrder!==e.groupOrder?n.groupOrder-e.groupOrder:n.renderOrder!==e.renderOrder?n.renderOrder-e.renderOrder:n.z!==e.z?e.z-n.z:n.id-e.id}function Kf(){let n=[],e=0,t=[],i=[],r=[];function o(){e=0,t.length=0,i.length=0,r.length=0}function s(u){let p=0;return u.isInstancedMesh&&(p+=2),u.isSkinnedMesh&&(p+=1),p}function a(u,p,_,S,d,h){let A=n[e];return A===void 0?(A={id:u.id,object:u,geometry:p,material:_,materialVariant:s(u),groupOrder:S,renderOrder:u.renderOrder,z:d,group:h},n[e]=A):(A.id=u.id,A.object=u,A.geometry=p,A.material=_,A.materialVariant=s(u),A.groupOrder=S,A.renderOrder=u.renderOrder,A.z=d,A.group=h),e++,A}function l(u,p,_,S,d,h,A){A.reversedDepth===!0&&(d=-d);let I=a(u,p,_,S,d,h);_.transmission>0?i.push(I):_.transparent===!0?r.push(I):t.push(I)}function c(u,p,_,S,d,h){let A=a(u,p,_,S,d,h);_.transmission>0?i.unshift(A):_.transparent===!0?r.unshift(A):t.unshift(A)}function f(u,p){t.length>1&&t.sort(u||pg),i.length>1&&i.sort(p||Yf),r.length>1&&r.sort(p||Yf)}function m(){for(let u=e,p=n.length;u<p;u++){let _=n[u];if(_.id===null)break;_.id=null,_.object=null,_.geometry=null,_.material=null,_.group=null}}return{opaque:t,transmissive:i,transparent:r,init:o,push:l,unshift:c,finish:m,sort:f}}function Zf(){let n=new WeakMap;function e(i,r){let o=n.get(i),s;return o===void 0?(s=new Kf,n.set(i,[s])):r>=o.length?(s=new Kf,o.push(s)):s=o[r],s}function t(){n=new WeakMap}return{get:e,dispose:t}}function mg(){let n={};return{get:function(e){if(n[e.id]!==void 0)return n[e.id];let t;switch(e.type){case"SunLight":case"DirectionalLight":t={direction:new P,color:new be};break;case"SpotLight":t={position:new P,direction:new P,color:new be,distance:0,coneCos:0,penumbraCos:0,decay:0};break;case"PointLight":t={position:new P,color:new be,distance:0,decay:0};break;case"HemisphereLight":t={direction:new P,skyColor:new be,groundColor:new be};break;case"RectAreaLight":t={color:new be,position:new P,halfWidth:new P,halfHeight:new P};break}return n[e.id]=t,t}}}function gg(){let n={};return{get:function(e){if(n[e.id]!==void 0)return n[e.id];let t;switch(e.type){case"SunLight":case"DirectionalLight":t={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new _e};break;case"SpotLight":t={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new _e};break;case"PointLight":t={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new _e,shadowCameraNear:1,shadowCameraFar:1e3};break}return n[e.id]=t,t}}}var _g=0;function xg(n,e){return(e.castShadow?2:0)-(n.castShadow?2:0)+(e.map?1:0)-(n.map?1:0)}function Jf(n){let e=new mg,t=gg(),i={version:0,hash:{sunLength:-1,directionalLength:-1,pointLength:-1,spotLength:-1,rectAreaLength:-1,hemiLength:-1,numSunShadows:-1,numDirectionalShadows:-1,numPointShadows:-1,numSpotShadows:-1,numSpotMaps:-1,numLightProbes:-1},ambient:[0,0,0],probe:[],sun:[],sunShadow:[],sunShadowMap:[],sunShadowMatrix:[],sunShadowCascade:[],directional:[],directionalShadow:[],directionalShadowMap:[],directionalShadowMatrix:[],spot:[],spotLightMap:[],spotShadow:[],spotShadowMap:[],spotLightMatrix:[],rectArea:[],rectAreaLTC1:null,rectAreaLTC2:null,point:[],pointShadow:[],pointShadowMap:[],pointShadowMatrix:[],hemi:[],numSpotLightShadowsWithMaps:0,numLightProbes:0};for(let c=0;c<9;c++)i.probe.push(new P);let r=new P,o=new Oe,s=new Oe;function a(c){let f=0,m=0,u=0;for(let G=0;G<9;G++)i.probe[G].set(0,0,0);let p=0,_=0,S=0,d=0,h=0,A=0,I=0,M=0,y=0,b=0,C=0,x=0,E=0,D=0;c.sort(xg);for(let G=0,k=c.length;G<k;G++){let L=c[G],H=L.color,K=L.intensity,$=L.distance,oe=null;if(L.shadow&&L.shadow.map&&(L.shadow.map.texture.format===ii?oe=L.shadow.map.texture:oe=L.shadow.map.depthTexture||L.shadow.map.texture),L.isAmbientLight)f+=H.r*K,m+=H.g*K,u+=H.b*K;else if(L.isLightProbe){for(let Q=0;Q<9;Q++)i.probe[Q].addScaledVector(L.sh.coefficients[Q],K);D++}else if(L.isSunLight){let Q=e.get(L);if(Q.color.copy(L.color).multiplyScalar(L.intensity),L.castShadow){let re=L.shadow,se=t.get(L);se.shadowIntensity=re.intensity,se.shadowBias=re.bias,se.shadowNormalBias=re.normalBias,se.shadowRadius=re.radius,se.shadowMapSize.copy(re.mapSize).multiply(re.getFrameExtents()),i.sunShadow[_]=se,i.sunShadowMap[_]=oe;let Pe=re.getViewportCount();for(let Ce=0;Ce<Pe;Ce++)i.sunShadowMatrix[S+Ce]=re.getMatrix(Ce),i.sunShadowCascade[S+Ce]=re._cascadeData[Ce];S+=Pe,_++}i.sun[p]=Q,p++}else if(L.isDirectionalLight){let Q=e.get(L);if(Q.color.copy(L.color).multiplyScalar(L.intensity),L.castShadow){let re=L.shadow,se=t.get(L);se.shadowIntensity=re.intensity,se.shadowBias=re.bias,se.shadowNormalBias=re.normalBias,se.shadowRadius=re.radius,se.shadowMapSize=re.mapSize,i.directionalShadow[d]=se,i.directionalShadowMap[d]=oe,i.directionalShadowMatrix[d]=L.shadow.matrix,y++}i.directional[d]=Q,d++}else if(L.isSpotLight){let Q=e.get(L);Q.position.setFromMatrixPosition(L.matrixWorld),Q.color.copy(H).multiplyScalar(K),Q.distance=$,Q.coneCos=Math.cos(L.angle),Q.penumbraCos=Math.cos(L.angle*(1-L.penumbra)),Q.decay=L.decay,i.spot[A]=Q;let re=L.shadow;if(L.map&&(i.spotLightMap[x]=L.map,x++,re.updateMatrices(L),L.castShadow&&E++),i.spotLightMatrix[A]=re.matrix,L.castShadow){let se=t.get(L);se.shadowIntensity=re.intensity,se.shadowBias=re.bias,se.shadowNormalBias=re.normalBias,se.shadowRadius=re.radius,se.shadowMapSize=re.mapSize,i.spotShadow[A]=se,i.spotShadowMap[A]=oe,C++}A++}else if(L.isRectAreaLight){let Q=e.get(L);Q.color.copy(H).multiplyScalar(K),Q.halfWidth.set(L.width*.5,0,0),Q.halfHeight.set(0,L.height*.5,0),i.rectArea[I]=Q,I++}else if(L.isPointLight){let Q=e.get(L);if(Q.color.copy(L.color).multiplyScalar(L.intensity),Q.distance=L.distance,Q.decay=L.decay,L.castShadow){let re=L.shadow,se=t.get(L);se.shadowIntensity=re.intensity,se.shadowBias=re.bias,se.shadowNormalBias=re.normalBias,se.shadowRadius=re.radius,se.shadowMapSize=re.mapSize,se.shadowCameraNear=re.camera.near,se.shadowCameraFar=re.camera.far,i.pointShadow[h]=se,i.pointShadowMap[h]=oe,i.pointShadowMatrix[h]=L.shadow.matrix,b++}i.point[h]=Q,h++}else if(L.isHemisphereLight){let Q=e.get(L);Q.skyColor.copy(L.color).multiplyScalar(K),Q.groundColor.copy(L.groundColor).multiplyScalar(K),i.hemi[M]=Q,M++}}I>0&&(n.has("OES_texture_float_linear")===!0?(i.rectAreaLTC1=de.LTC_FLOAT_1,i.rectAreaLTC2=de.LTC_FLOAT_2):(i.rectAreaLTC1=de.LTC_HALF_1,i.rectAreaLTC2=de.LTC_HALF_2)),i.ambient[0]=f,i.ambient[1]=m,i.ambient[2]=u;let U=i.hash;(U.sunLength!==p||U.directionalLength!==d||U.pointLength!==h||U.spotLength!==A||U.rectAreaLength!==I||U.hemiLength!==M||U.numSunShadows!==_||U.numDirectionalShadows!==y||U.numPointShadows!==b||U.numSpotShadows!==C||U.numSpotMaps!==x||U.numLightProbes!==D)&&(i.sun.length=p,i.directional.length=d,i.spot.length=A,i.rectArea.length=I,i.point.length=h,i.hemi.length=M,i.sunShadow.length=_,i.sunShadowMap.length=_,i.sunShadowMatrix.length=S,i.sunShadowCascade.length=S,i.directionalShadow.length=y,i.directionalShadowMap.length=y,i.directionalShadowMatrix.length=y,i.pointShadow.length=b,i.pointShadowMap.length=b,i.pointShadowMatrix.length=b,i.spotShadow.length=C,i.spotShadowMap.length=C,i.spotLightMatrix.length=C+x-E,i.spotLightMap.length=x,i.numSpotLightShadowsWithMaps=E,i.numLightProbes=D,U.sunLength=p,U.directionalLength=d,U.pointLength=h,U.spotLength=A,U.rectAreaLength=I,U.hemiLength=M,U.numSunShadows=_,U.numDirectionalShadows=y,U.numPointShadows=b,U.numSpotShadows=C,U.numSpotMaps=x,U.numLightProbes=D,i.version=_g++)}function l(c,f){let m=0,u=0,p=0,_=0,S=0,d=0,h=f.matrixWorldInverse;for(let A=0,I=c.length;A<I;A++){let M=c[A];if(M.isSunLight){let y=i.sun[m];y.direction.setFromMatrixPosition(M.matrixWorld),y.direction.transformDirection(h),m++}else if(M.isDirectionalLight){let y=i.directional[u];y.direction.setFromMatrixPosition(M.matrixWorld),r.setFromMatrixPosition(M.target.matrixWorld),y.direction.sub(r),y.direction.transformDirection(h),u++}else if(M.isSpotLight){let y=i.spot[_];y.position.setFromMatrixPosition(M.matrixWorld),y.position.applyMatrix4(h),y.direction.setFromMatrixPosition(M.matrixWorld),r.setFromMatrixPosition(M.target.matrixWorld),y.direction.sub(r),y.direction.transformDirection(h),_++}else if(M.isRectAreaLight){let y=i.rectArea[S];y.position.setFromMatrixPosition(M.matrixWorld),y.position.applyMatrix4(h),s.identity(),o.copy(M.matrixWorld),o.premultiply(h),s.extractRotation(o),y.halfWidth.set(M.width*.5,0,0),y.halfHeight.set(0,M.height*.5,0),y.halfWidth.applyMatrix4(s),y.halfHeight.applyMatrix4(s),S++}else if(M.isPointLight){let y=i.point[p];y.position.setFromMatrixPosition(M.matrixWorld),y.position.applyMatrix4(h),p++}else if(M.isHemisphereLight){let y=i.hemi[d];y.direction.setFromMatrixPosition(M.matrixWorld),y.direction.transformDirection(h),d++}}}return{setup:a,setupView:l,state:i}}function $f(n){let e=new Jf(n),t=[],i=[],r=[];function o(u){m.camera=u,t.length=0,i.length=0,r.length=0}function s(u){t.push(u)}function a(u){i.push(u)}function l(u){r.push(u)}function c(){e.setup(t)}function f(u){e.setupView(t,u)}let m={lightsArray:t,shadowsArray:i,lightProbeGridArray:r,camera:null,lights:e,transmissionRenderTarget:{},textureUnits:0};return{init:o,state:m,setupLights:c,setupLightsView:f,pushLight:s,pushShadow:a,pushLightProbeGrid:l}}function Qf(n){let e=new WeakMap;function t(r,o=0){let s=e.get(r),a;return s===void 0?(a=new $f(n),e.set(r,[a])):o>=s.length?(a=new $f(n),s.push(a)):a=s[o],a}function i(){e=new WeakMap}return{get:t,dispose:i}}var jf=`
void main() {

	gl_Position = vec4( position, 1.0 );

}
`,ed=`
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
`;var Sg=[new P(1,0,0),new P(-1,0,0),new P(0,1,0),new P(0,-1,0),new P(0,0,1),new P(0,0,-1)],Mg=[new P(0,-1,0),new P(0,-1,0),new P(0,0,1),new P(0,0,-1),new P(0,-1,0),new P(0,-1,0)],td=new Oe,Ro=new P,Ka=new P;function id(n,e,t){let i=new an,r=new _e,o=new _e,s=new $e,a=new Us,l=new Fs,c={},f=t.maxTextureSize,m={[li]:gt,[gt]:li,[ei]:ei},u=new Ut({defines:{VSM_SAMPLES:8},uniforms:{shadow_pass:{value:null},resolution:{value:new _e},radius:{value:4}},vertexShader:jf,fragmentShader:ed}),p=u.clone();p.defines.HORIZONTAL_PASS=1;let _=new ft;_.setAttribute("position",new $t(new Float32Array([-1,-1,.5,3,-1,.5,-1,3,.5]),3));let S=new mt(_,u),d=this;this.enabled=!1,this.autoUpdate=!0,this.needsUpdate=!1,this.type=Un;let h=this.type;this.render=function(b,C,x){if(d.enabled===!1||d.autoUpdate===!1&&d.needsUpdate===!1||b.length===0)return;this.type===dl&&(xe("WebGLShadowMap: PCFSoftShadowMap has been removed. Using PCFShadowMap instead."),this.type=Un);let E=n.getRenderTarget(),D=n.getActiveCubeFace(),U=n.getActiveMipmapLevel(),G=n.state;G.setBlending(ti),G.buffers.depth.getReversed()===!0?G.buffers.color.setClear(0,0,0,0):G.buffers.color.setClear(1,1,1,1),G.buffers.depth.setTest(!0),G.setScissorTest(!1);let k=h!==this.type;k&&C.traverse(function(L){L.material&&(Array.isArray(L.material)?L.material.forEach(H=>H.needsUpdate=!0):L.material.needsUpdate=!0)});for(let L=0,H=b.length;L<H;L++){let K=b[L],$=K.shadow;if($===void 0){xe("WebGLShadowMap:",K,"has no shadow.");continue}if($.autoUpdate===!1&&$.needsUpdate===!1)continue;r.copy($.mapSize);let oe=$.getFrameExtents();r.multiply(oe),o.copy($.mapSize),(r.x>f||r.y>f)&&(r.x>f&&(o.x=Math.floor(f/oe.x),r.x=o.x*oe.x,$.mapSize.x=o.x),r.y>f&&(o.y=Math.floor(f/oe.y),r.y=o.y*oe.y,$.mapSize.y=o.y));let Q=n.state.buffers.depth.getReversed();if($.camera._reversedDepth=Q,$.map===null||k===!0){if($.map!==null&&($.map.depthTexture!==null&&($.map.depthTexture.dispose(),$.map.depthTexture=null),$.map.dispose()),this.type===mn){if(K.isPointLight){xe("WebGLShadowMap: VSM shadow maps are not supported for PointLights. Use PCF or BasicShadowMap instead.");continue}$.map=new At(r.x,r.y,{format:ii,type:Lt,minFilter:_t,magFilter:_t,generateMipmaps:!1}),$.map.texture.name=K.name+".shadowMap",$.map.depthTexture=new Ti(r.x,r.y,Ot),$.map.depthTexture.name=K.name+".shadowMapDepth",$.map.depthTexture.format=Yt,$.map.depthTexture.compareFunction=null,$.map.depthTexture.minFilter=pt,$.map.depthTexture.magFilter=pt}else K.isPointLight?($.map=new Er(r.x),$.map.depthTexture=new ws(r.x,Pt)):($.map=new At(r.x,r.y),$.map.depthTexture=new Ti(r.x,r.y,Pt)),$.map.depthTexture.name=K.name+".shadowMap",$.map.depthTexture.format=Yt,this.type===Un?($.map.depthTexture.compareFunction=Q?Yn:qn,$.map.depthTexture.minFilter=_t,$.map.depthTexture.magFilter=_t):($.map.depthTexture.compareFunction=null,$.map.depthTexture.minFilter=pt,$.map.depthTexture.magFilter=pt);$.camera.updateProjectionMatrix()}$.map.isWebGLCubeRenderTarget!==!0&&($.map.width!==r.x||$.map.height!==r.y)&&$.map.setSize(r.x,r.y);let re=$.map.isWebGLCubeRenderTarget?6:$.getViewportCount();K.isPointLight!==!0&&$.updateMatrices(K,x);for(let se=0;se<re;se++){let Pe=$.getCamera(se);if(K.isPointLight){let Ce=$.camera,ot=$.matrix,Ve=K.distance||Ce.far;Ve!==Ce.far&&(Ce.far=Ve,Ce.updateProjectionMatrix()),Ro.setFromMatrixPosition(K.matrixWorld),Ce.position.copy(Ro),Ka.copy(Ce.position),Ka.add(Sg[se]),Ce.up.copy(Mg[se]),Ce.lookAt(Ka),Ce.updateMatrixWorld(),ot.makeTranslation(-Ro.x,-Ro.y,-Ro.z),td.multiplyMatrices(Ce.projectionMatrix,Ce.matrixWorldInverse),$._frustum.setFromProjectionMatrix(td,Ce.coordinateSystem,Ce.reversedDepth)}if($.map.isWebGLCubeRenderTarget)n.setRenderTarget($.map,se),n.clear();else{se===0&&(n.setRenderTarget($.map),n.clear());let Ce=$.getViewport(se);s.set(o.x*Ce.x,o.y*Ce.y,o.x*Ce.z,o.y*Ce.w),G.viewport(s)}i=$.getFrustum(se),M(C,x,Pe,K,this.type)}$.isPointLightShadow!==!0&&this.type===mn&&A($,x),$.needsUpdate=!1}h=this.type,d.needsUpdate=!1,n.setRenderTarget(E,D,U)};function A(b,C){let x=e.update(S);u.defines.VSM_SAMPLES!==b.blurSamples&&(u.defines.VSM_SAMPLES=b.blurSamples,p.defines.VSM_SAMPLES=b.blurSamples,u.needsUpdate=!0,p.needsUpdate=!0),b.mapPass===null?b.mapPass=new At(r.x,r.y,{format:ii,type:Lt}):(b.mapPass.width!==b.map.width||b.mapPass.height!==b.map.height)&&b.mapPass.setSize(b.map.width,b.map.height),u.uniforms.shadow_pass.value=b.map.depthTexture,u.uniforms.resolution.value.set(b.map.width,b.map.height),u.uniforms.radius.value=b.radius,n.setRenderTarget(b.mapPass),n.clear(),n.renderBufferDirect(C,null,x,u,S,null),p.uniforms.shadow_pass.value=b.mapPass.texture,p.uniforms.resolution.value.set(b.map.width,b.map.height),p.uniforms.radius.value=b.radius,n.setRenderTarget(b.map),n.clear(),n.renderBufferDirect(C,null,x,p,S,null)}function I(b,C,x,E){let D=null,U=x.isPointLight===!0?b.customDistanceMaterial:b.customDepthMaterial;if(U!==void 0)D=U;else if(D=x.isPointLight===!0?l:a,n.localClippingEnabled&&C.clipShadows===!0&&Array.isArray(C.clippingPlanes)&&C.clippingPlanes.length!==0||C.displacementMap&&C.displacementScale!==0||C.alphaMap&&C.alphaTest>0||C.map&&C.alphaTest>0||C.alphaToCoverage===!0){let G=D.uuid,k=C.uuid,L=c[G];L===void 0&&(L={},c[G]=L);let H=L[k];H===void 0&&(H=D.clone(),L[k]=H,C.addEventListener("dispose",y)),D=H}if(D.visible=C.visible,D.wireframe=C.wireframe,E===mn?D.side=C.shadowSide!==null?C.shadowSide:C.side:D.side=C.shadowSide!==null?C.shadowSide:m[C.side],D.alphaMap=C.alphaMap,D.alphaTest=C.alphaToCoverage===!0?.5:C.alphaTest,D.map=C.map,D.clipShadows=C.clipShadows,D.clippingPlanes=C.clippingPlanes,D.clipIntersection=C.clipIntersection,D.displacementMap=C.displacementMap,D.displacementScale=C.displacementScale,D.displacementBias=C.displacementBias,D.wireframeLinewidth=C.wireframeLinewidth,D.linewidth=C.linewidth,x.isPointLight===!0&&D.isMeshDistanceMaterial===!0){let G=n.properties.get(D);G.light=x}return D}function M(b,C,x,E,D){if(b.visible===!1)return;if(b.layers.test(C.layers)&&(b.isMesh||b.isLine||b.isPoints)&&(b.castShadow||b.receiveShadow&&D===mn)&&(!b.frustumCulled||b.intersectsFrustum(i))){b.modelViewMatrix.multiplyMatrices(x.matrixWorldInverse,b.matrixWorld);let k=e.update(b),L=b.material;if(Array.isArray(L)){let H=k.groups;for(let K=0,$=H.length;K<$;K++){let oe=H[K],Q=L[oe.materialIndex];if(Q&&Q.visible){let re=I(b,Q,E,D);b.onBeforeShadow(n,b,C,x,k,re,oe),n.renderBufferDirect(x,null,k,re,b,oe),b.onAfterShadow(n,b,C,x,k,re,oe)}}}else if(L.visible){let H=I(b,L,E,D);b.onBeforeShadow(n,b,C,x,k,H,null),n.renderBufferDirect(x,null,k,H,b,null),b.onAfterShadow(n,b,C,x,k,H,null)}}let G=b.children;for(let k=0,L=G.length;k<L;k++)M(G[k],C,x,E,D)}function y(b){b.target.removeEventListener("dispose",y);for(let x in c){let E=c[x],D=b.target.uuid;D in E&&(E[D].dispose(),delete E[D])}}}function nd(n,e){function t(){let N=!1,le=new $e,ee=null,J=new $e(0,0,0,0);return{setMask:function(ae){ee!==ae&&!N&&(n.colorMask(ae,ae,ae,ae),ee=ae)},setLocked:function(ae){N=ae},setClear:function(ae,te,we,Ee,Qe){Qe===!0&&(ae*=Ee,te*=Ee,we*=Ee),le.set(ae,te,we,Ee),J.equals(le)===!1&&(n.clearColor(ae,te,we,Ee),J.copy(le))},reset:function(){N=!1,ee=null,J.set(-1,0,0,0)}}}function i(){let N=!1,le=!1,ee=null,J=null,ae=null;return{setReversed:function(te){if(le!==te){let we=e.get("EXT_clip_control");te?we.clipControlEXT(we.LOWER_LEFT_EXT,we.ZERO_TO_ONE_EXT):we.clipControlEXT(we.LOWER_LEFT_EXT,we.NEGATIVE_ONE_TO_ONE_EXT),le=te;let Ee=ae;ae=null,this.setClear(Ee)}},getReversed:function(){return le},setTest:function(te){te?ne(n.DEPTH_TEST):Se(n.DEPTH_TEST)},setMask:function(te){ee!==te&&!N&&(n.depthMask(te),ee=te)},setFunc:function(te){if(le&&(te=Jl[te]),J!==te){switch(te){case wr:n.depthFunc(n.NEVER);break;case Rr:n.depthFunc(n.ALWAYS);break;case Cr:n.depthFunc(n.LESS);break;case $i:n.depthFunc(n.LEQUAL);break;case Pr:n.depthFunc(n.EQUAL);break;case Lr:n.depthFunc(n.GEQUAL);break;case Dr:n.depthFunc(n.GREATER);break;case Ir:n.depthFunc(n.NOTEQUAL);break;default:n.depthFunc(n.LEQUAL)}J=te}},setLocked:function(te){N=te},setClear:function(te){ae!==te&&(ae=te,le&&(te=1-te),n.clearDepth(te))},reset:function(){N=!1,ee=null,J=null,ae=null,le=!1}}}function r(){let N=!1,le=null,ee=null,J=null,ae=null,te=null,we=null,Ee=null,Qe=null;return{setTest:function(je){N||(je?ne(n.STENCIL_TEST):Se(n.STENCIL_TEST))},setMask:function(je){le!==je&&!N&&(n.stencilMask(je),le=je)},setFunc:function(je,pi,Ai){(ee!==je||J!==pi||ae!==Ai)&&(n.stencilFunc(je,pi,Ai),ee=je,J=pi,ae=Ai)},setOp:function(je,pi,Ai){(te!==je||we!==pi||Ee!==Ai)&&(n.stencilOp(je,pi,Ai),te=je,we=pi,Ee=Ai)},setLocked:function(je){N=je},setClear:function(je){Qe!==je&&(n.clearStencil(je),Qe=je)},reset:function(){N=!1,le=null,ee=null,J=null,ae=null,te=null,we=null,Ee=null,Qe=null}}}let o=new t,s=new i,a=new r,l=new WeakMap,c=new WeakMap,f={},m={},u={},p=new WeakMap,_=[],S=null,d=!1,h=null,A=null,I=null,M=null,y=null,b=null,C=null,x=new be(0,0,0),E=0,D=!1,U=null,G=null,k=null,L=null,H=null,K=n.getParameter(n.MAX_COMBINED_TEXTURE_IMAGE_UNITS),$=!1,oe=0,Q=n.getParameter(n.VERSION);Q.indexOf("WebGL")!==-1?(oe=parseFloat(/^WebGL (\d)/.exec(Q)[1]),$=oe>=1):Q.indexOf("OpenGL ES")!==-1&&(oe=parseFloat(/^OpenGL ES (\d)/.exec(Q)[1]),$=oe>=2);let re=null,se={},Pe=n.getParameter(n.SCISSOR_BOX),Ce=n.getParameter(n.VIEWPORT),ot=new $e().fromArray(Pe),Ve=new $e().fromArray(Ce);function Ye(N,le,ee,J){let ae=new Uint8Array(4),te=n.createTexture();n.bindTexture(N,te),n.texParameteri(N,n.TEXTURE_MIN_FILTER,n.NEAREST),n.texParameteri(N,n.TEXTURE_MAG_FILTER,n.NEAREST);for(let we=0;we<ee;we++)N===n.TEXTURE_3D||N===n.TEXTURE_2D_ARRAY?n.texImage3D(le,0,n.RGBA,1,1,J,0,n.RGBA,n.UNSIGNED_BYTE,ae):n.texImage2D(le+we,0,n.RGBA,1,1,0,n.RGBA,n.UNSIGNED_BYTE,ae);return te}let j={};j[n.TEXTURE_2D]=Ye(n.TEXTURE_2D,n.TEXTURE_2D,1),j[n.TEXTURE_CUBE_MAP]=Ye(n.TEXTURE_CUBE_MAP,n.TEXTURE_CUBE_MAP_POSITIVE_X,6),j[n.TEXTURE_2D_ARRAY]=Ye(n.TEXTURE_2D_ARRAY,n.TEXTURE_2D_ARRAY,1,1),j[n.TEXTURE_3D]=Ye(n.TEXTURE_3D,n.TEXTURE_3D,1,1),o.setClear(0,0,0,1),s.setClear(1),a.setClear(0),ne(n.DEPTH_TEST),s.setFunc($i),He(!1),ct(na),ne(n.CULL_FACE),We(ti);function ne(N){f[N]!==!0&&(n.enable(N),f[N]=!0)}function Se(N){f[N]!==!1&&(n.disable(N),f[N]=!1)}function Ie(N,le){return u[N]!==le?(n.bindFramebuffer(N,le),u[N]=le,N===n.DRAW_FRAMEBUFFER&&(u[n.FRAMEBUFFER]=le),N===n.FRAMEBUFFER&&(u[n.DRAW_FRAMEBUFFER]=le),!0):!1}function ve(N,le){let ee=_,J=!1;if(N){ee=p.get(le),ee===void 0&&(ee=[],p.set(le,ee));let ae=N.textures;if(ee.length!==ae.length||ee[0]!==n.COLOR_ATTACHMENT0){for(let te=0,we=ae.length;te<we;te++)ee[te]=n.COLOR_ATTACHMENT0+te;ee.length=ae.length,J=!0}}else ee[0]!==n.BACK&&(ee[0]=n.BACK,J=!0);J&&n.drawBuffers(ee)}function ze(N){return S!==N?(n.useProgram(N),S=N,!0):!1}let Ke={[Ji]:n.FUNC_ADD,[ml]:n.FUNC_SUBTRACT,[gl]:n.FUNC_REVERSE_SUBTRACT};Ke[_l]=n.MIN,Ke[xl]=n.MAX;let Ge={[vl]:n.ZERO,[Sl]:n.ONE,[Ml]:n.SRC_COLOR,[No]:n.SRC_ALPHA,[wl]:n.SRC_ALPHA_SATURATE,[Tl]:n.DST_COLOR,[bl]:n.DST_ALPHA,[yl]:n.ONE_MINUS_SRC_COLOR,[Uo]:n.ONE_MINUS_SRC_ALPHA,[Al]:n.ONE_MINUS_DST_COLOR,[El]:n.ONE_MINUS_DST_ALPHA,[Rl]:n.CONSTANT_COLOR,[Cl]:n.ONE_MINUS_CONSTANT_COLOR,[Pl]:n.CONSTANT_ALPHA,[Ll]:n.ONE_MINUS_CONSTANT_ALPHA};function We(N,le,ee,J,ae,te,we,Ee,Qe,je){if(N===ti){d===!0&&(Se(n.BLEND),d=!1);return}if(d===!1&&(ne(n.BLEND),d=!0),N!==pl){if(N!==h||je!==D){if((A!==Ji||y!==Ji)&&(n.blendEquation(n.FUNC_ADD),A=Ji,y=Ji),je)switch(N){case Zi:n.blendFuncSeparate(n.ONE,n.ONE_MINUS_SRC_ALPHA,n.ONE,n.ONE_MINUS_SRC_ALPHA);break;case ra:n.blendFunc(n.ONE,n.ONE);break;case oa:n.blendFuncSeparate(n.ZERO,n.ONE_MINUS_SRC_COLOR,n.ZERO,n.ONE);break;case sa:n.blendFuncSeparate(n.DST_COLOR,n.ONE_MINUS_SRC_ALPHA,n.ZERO,n.ONE);break;default:Fe("WebGLState: Invalid blending: ",N);break}else switch(N){case Zi:n.blendFuncSeparate(n.SRC_ALPHA,n.ONE_MINUS_SRC_ALPHA,n.ONE,n.ONE_MINUS_SRC_ALPHA);break;case ra:n.blendFuncSeparate(n.SRC_ALPHA,n.ONE,n.ONE,n.ONE);break;case oa:Fe("WebGLState: SubtractiveBlending requires material.premultipliedAlpha = true");break;case sa:Fe("WebGLState: MultiplyBlending requires material.premultipliedAlpha = true");break;default:Fe("WebGLState: Invalid blending: ",N);break}I=null,M=null,b=null,C=null,x.set(0,0,0),E=0,h=N,D=je}return}ae=ae||le,te=te||ee,we=we||J,(le!==A||ae!==y)&&(n.blendEquationSeparate(Ke[le],Ke[ae]),A=le,y=ae),(ee!==I||J!==M||te!==b||we!==C)&&(n.blendFuncSeparate(Ge[ee],Ge[J],Ge[te],Ge[we]),I=ee,M=J,b=te,C=we),(Ee.equals(x)===!1||Qe!==E)&&(n.blendColor(Ee.r,Ee.g,Ee.b,Qe),x.copy(Ee),E=Qe),h=N,D=!1}function tt(N,le){N.side===ei?Se(n.CULL_FACE):ne(n.CULL_FACE);let ee=N.side===gt;le&&(ee=!ee),He(ee),N.blending===Zi&&N.transparent===!1?We(ti):We(N.blending,N.blendEquation,N.blendSrc,N.blendDst,N.blendEquationAlpha,N.blendSrcAlpha,N.blendDstAlpha,N.blendColor,N.blendAlpha,N.premultipliedAlpha),s.setFunc(N.depthFunc),s.setTest(N.depthTest),s.setMask(N.depthWrite),o.setMask(N.colorWrite);let J=N.stencilWrite;a.setTest(J),J&&(a.setMask(N.stencilWriteMask),a.setFunc(N.stencilFunc,N.stencilRef,N.stencilFuncMask),a.setOp(N.stencilFail,N.stencilZFail,N.stencilZPass)),Ft(N.polygonOffset,N.polygonOffsetFactor,N.polygonOffsetUnits),N.alphaToCoverage===!0?ne(n.SAMPLE_ALPHA_TO_COVERAGE):Se(n.SAMPLE_ALPHA_TO_COVERAGE)}function He(N){U!==N&&(N?n.frontFace(n.CW):n.frontFace(n.CCW),U=N)}function ct(N){N!==hl?(ne(n.CULL_FACE),N!==G&&(N===na?n.cullFace(n.BACK):N===fl?n.cullFace(n.FRONT):n.cullFace(n.FRONT_AND_BACK))):Se(n.CULL_FACE),G=N}function Mt(N){N!==k&&($&&n.lineWidth(N),k=N)}function Ft(N,le,ee){N?(ne(n.POLYGON_OFFSET_FILL),(L!==le||H!==ee)&&(L=le,H=ee,s.getReversed()&&(le=-le),n.polygonOffset(le,ee))):Se(n.POLYGON_OFFSET_FILL)}function ut(N){N?ne(n.SCISSOR_TEST):Se(n.SCISSOR_TEST)}function at(N){N===void 0&&(N=n.TEXTURE0+K-1),re!==N&&(n.activeTexture(N),re=N)}function B(N,le,ee){ee===void 0&&(re===null?ee=n.TEXTURE0+K-1:ee=re);let J=se[ee];J===void 0&&(J={type:void 0,texture:void 0},se[ee]=J),(J.type!==N||J.texture!==le)&&(re!==ee&&(n.activeTexture(ee),re=ee),n.bindTexture(N,le||j[N]),J.type=N,J.texture=le)}function Tt(){let N=se[re];N!==void 0&&N.type!==void 0&&(n.bindTexture(N.type,null),N.type=void 0,N.texture=void 0)}function Je(){try{n.compressedTexImage2D(...arguments)}catch(N){Fe("WebGLState:",N)}}function T(){try{n.compressedTexImage3D(...arguments)}catch(N){Fe("WebGLState:",N)}}function g(){try{n.texSubImage2D(...arguments)}catch(N){Fe("WebGLState:",N)}}function z(){try{n.texSubImage3D(...arguments)}catch(N){Fe("WebGLState:",N)}}function X(){try{n.compressedTexSubImage2D(...arguments)}catch(N){Fe("WebGLState:",N)}}function Z(){try{n.compressedTexSubImage3D(...arguments)}catch(N){Fe("WebGLState:",N)}}function he(){try{n.texStorage2D(...arguments)}catch(N){Fe("WebGLState:",N)}}function w(){try{n.texStorage3D(...arguments)}catch(N){Fe("WebGLState:",N)}}function R(){try{n.texImage2D(...arguments)}catch(N){Fe("WebGLState:",N)}}function F(){try{n.texImage3D(...arguments)}catch(N){Fe("WebGLState:",N)}}function q(N){return m[N]!==void 0?m[N]:n.getParameter(N)}function ce(N,le){m[N]!==le&&(n.pixelStorei(N,le),m[N]=le)}function ie(N){ot.equals(N)===!1&&(n.scissor(N.x,N.y,N.z,N.w),ot.copy(N))}function ue(N){Ve.equals(N)===!1&&(n.viewport(N.x,N.y,N.z,N.w),Ve.copy(N))}function fe(N,le){let ee=c.get(le);ee===void 0&&(ee=new WeakMap,c.set(le,ee));let J=ee.get(N);J===void 0&&(J=n.getUniformBlockIndex(le,N.name),ee.set(N,J))}function ge(N,le){let J=c.get(le).get(N);l.get(le)!==J&&(n.uniformBlockBinding(le,J,N.__bindingPointIndex),l.set(le,J))}function De(){n.disable(n.BLEND),n.disable(n.CULL_FACE),n.disable(n.DEPTH_TEST),n.disable(n.POLYGON_OFFSET_FILL),n.disable(n.SCISSOR_TEST),n.disable(n.STENCIL_TEST),n.disable(n.SAMPLE_ALPHA_TO_COVERAGE),n.blendEquation(n.FUNC_ADD),n.blendFunc(n.ONE,n.ZERO),n.blendFuncSeparate(n.ONE,n.ZERO,n.ONE,n.ZERO),n.blendColor(0,0,0,0),n.colorMask(!0,!0,!0,!0),n.clearColor(0,0,0,0),n.depthMask(!0),n.depthFunc(n.LESS),s.setReversed(!1),n.clearDepth(1),n.stencilMask(4294967295),n.stencilFunc(n.ALWAYS,0,4294967295),n.stencilOp(n.KEEP,n.KEEP,n.KEEP),n.clearStencil(0),n.cullFace(n.BACK),n.frontFace(n.CCW),n.polygonOffset(0,0),n.activeTexture(n.TEXTURE0),n.bindFramebuffer(n.FRAMEBUFFER,null),n.bindFramebuffer(n.DRAW_FRAMEBUFFER,null),n.bindFramebuffer(n.READ_FRAMEBUFFER,null),n.useProgram(null),n.lineWidth(1),n.scissor(0,0,n.canvas.width,n.canvas.height),n.viewport(0,0,n.canvas.width,n.canvas.height),n.pixelStorei(n.PACK_ALIGNMENT,4),n.pixelStorei(n.UNPACK_ALIGNMENT,4),n.pixelStorei(n.UNPACK_FLIP_Y_WEBGL,!1),n.pixelStorei(n.UNPACK_PREMULTIPLY_ALPHA_WEBGL,!1),n.pixelStorei(n.UNPACK_COLORSPACE_CONVERSION_WEBGL,n.BROWSER_DEFAULT_WEBGL),n.pixelStorei(n.PACK_ROW_LENGTH,0),n.pixelStorei(n.PACK_SKIP_PIXELS,0),n.pixelStorei(n.PACK_SKIP_ROWS,0),n.pixelStorei(n.UNPACK_ROW_LENGTH,0),n.pixelStorei(n.UNPACK_IMAGE_HEIGHT,0),n.pixelStorei(n.UNPACK_SKIP_PIXELS,0),n.pixelStorei(n.UNPACK_SKIP_ROWS,0),n.pixelStorei(n.UNPACK_SKIP_IMAGES,0),f={},m={},re=null,se={},u={},p=new WeakMap,_=[],S=null,d=!1,h=null,A=null,I=null,M=null,y=null,b=null,C=null,x=new be(0,0,0),E=0,D=!1,U=null,G=null,k=null,L=null,H=null,ot.set(0,0,n.canvas.width,n.canvas.height),Ve.set(0,0,n.canvas.width,n.canvas.height),o.reset(),s.reset(),a.reset()}return{buffers:{color:o,depth:s,stencil:a},enable:ne,disable:Se,bindFramebuffer:Ie,drawBuffers:ve,useProgram:ze,setBlending:We,setMaterial:tt,setFlipSided:He,setCullFace:ct,setLineWidth:Mt,setPolygonOffset:Ft,setScissorTest:ut,activeTexture:at,bindTexture:B,unbindTexture:Tt,compressedTexImage2D:Je,compressedTexImage3D:T,texImage2D:R,texImage3D:F,pixelStorei:ce,getParameter:q,updateUBOMapping:fe,uniformBlockBinding:ge,texStorage2D:he,texStorage3D:w,texSubImage2D:g,texSubImage3D:z,compressedTexSubImage2D:X,compressedTexSubImage3D:Z,scissor:ie,viewport:ue,reset:De}}function rd(n,e,t,i,r,o,s){let a=e.has("WEBGL_multisampled_render_to_texture")?e.get("WEBGL_multisampled_render_to_texture"):null,l=typeof navigator>"u"?!1:/OculusBrowser/g.test(navigator.userAgent),c=new _e,f=new WeakMap,m=new Set,u,p=new WeakMap,_=!1;try{_=typeof OffscreenCanvas<"u"&&new OffscreenCanvas(1,1).getContext("2d")!==null}catch{}function S(T,g){return _?new OffscreenCanvas(T,g):Zn("canvas")}function d(T,g,z){let X=1,Z=Je(T);if((Z.width>z||Z.height>z)&&(X=z/Math.max(Z.width,Z.height)),X<1)if(typeof HTMLImageElement<"u"&&T instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&T instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&T instanceof ImageBitmap||typeof VideoFrame<"u"&&T instanceof VideoFrame){let he=Math.floor(X*Z.width),w=Math.floor(X*Z.height);u===void 0&&(u=S(he,w));let R=g?S(he,w):u;return R.width=he,R.height=w,R.getContext("2d").drawImage(T,0,0,he,w),xe("WebGLRenderer: Texture has been resized from ("+Z.width+"x"+Z.height+") to ("+he+"x"+w+")."),R}else return"data"in T&&xe("WebGLRenderer: Image in DataTexture is too big ("+Z.width+"x"+Z.height+")."),T;return T}function h(T){return T.generateMipmaps}function A(T){n.generateMipmap(T)}function I(T){return T.isWebGLCubeRenderTarget?n.TEXTURE_CUBE_MAP:T.isWebGL3DRenderTarget?n.TEXTURE_3D:T.isWebGLArrayRenderTarget||T.isCompressedArrayTexture?n.TEXTURE_2D_ARRAY:n.TEXTURE_2D}function M(T,g,z,X,Z,he=!1){if(T!==null){if(n[T]!==void 0)return n[T];xe("WebGLRenderer: Attempt to use non-existing WebGL internal format '"+T+"'")}let w;X&&(w=e.get("EXT_texture_norm16"),w||xe("WebGLRenderer: Unable to use normalized textures without EXT_texture_norm16 extension"));let R=g;if(g===n.RED&&(z===n.FLOAT&&(R=n.R32F),z===n.HALF_FLOAT&&(R=n.R16F),z===n.UNSIGNED_BYTE&&(R=n.R8),z===n.UNSIGNED_SHORT&&w&&(R=w.R16_EXT),z===n.SHORT&&w&&(R=w.R16_SNORM_EXT)),g===n.RED_INTEGER&&(z===n.UNSIGNED_BYTE&&(R=n.R8UI),z===n.UNSIGNED_SHORT&&(R=n.R16UI),z===n.UNSIGNED_INT&&(R=n.R32UI),z===n.BYTE&&(R=n.R8I),z===n.SHORT&&(R=n.R16I),z===n.INT&&(R=n.R32I)),g===n.RG&&(z===n.FLOAT&&(R=n.RG32F),z===n.HALF_FLOAT&&(R=n.RG16F),z===n.UNSIGNED_BYTE&&(R=n.RG8),z===n.UNSIGNED_SHORT&&w&&(R=w.RG16_EXT),z===n.SHORT&&w&&(R=w.RG16_SNORM_EXT)),g===n.RG_INTEGER&&(z===n.UNSIGNED_BYTE&&(R=n.RG8UI),z===n.UNSIGNED_SHORT&&(R=n.RG16UI),z===n.UNSIGNED_INT&&(R=n.RG32UI),z===n.BYTE&&(R=n.RG8I),z===n.SHORT&&(R=n.RG16I),z===n.INT&&(R=n.RG32I)),g===n.RGB_INTEGER&&(z===n.UNSIGNED_BYTE&&(R=n.RGB8UI),z===n.UNSIGNED_SHORT&&(R=n.RGB16UI),z===n.UNSIGNED_INT&&(R=n.RGB32UI),z===n.BYTE&&(R=n.RGB8I),z===n.SHORT&&(R=n.RGB16I),z===n.INT&&(R=n.RGB32I)),g===n.RGBA_INTEGER&&(z===n.UNSIGNED_BYTE&&(R=n.RGBA8UI),z===n.UNSIGNED_SHORT&&(R=n.RGBA16UI),z===n.UNSIGNED_INT&&(R=n.RGBA32UI),z===n.BYTE&&(R=n.RGBA8I),z===n.SHORT&&(R=n.RGBA16I),z===n.INT&&(R=n.RGBA32I)),g===n.RGB&&(z===n.UNSIGNED_SHORT&&w&&(R=w.RGB16_EXT),z===n.SHORT&&w&&(R=w.RGB16_SNORM_EXT),z===n.UNSIGNED_INT_5_9_9_9_REV&&(R=n.RGB9_E5),z===n.UNSIGNED_INT_10F_11F_11F_REV&&(R=n.R11F_G11F_B10F)),g===n.RGBA){let F=he?vn:Ue.getTransfer(Z);z===n.FLOAT&&(R=n.RGBA32F),z===n.HALF_FLOAT&&(R=n.RGBA16F),z===n.UNSIGNED_BYTE&&(R=F===qe?n.SRGB8_ALPHA8:n.RGBA8),z===n.UNSIGNED_SHORT&&w&&(R=w.RGBA16_EXT),z===n.SHORT&&w&&(R=w.RGBA16_SNORM_EXT),z===n.UNSIGNED_SHORT_4_4_4_4&&(R=n.RGBA4),z===n.UNSIGNED_SHORT_5_5_5_1&&(R=n.RGB5_A1)}return(R===n.R16F||R===n.R32F||R===n.RG16F||R===n.RG32F||R===n.RGBA16F||R===n.RGBA32F)&&e.get("EXT_color_buffer_float"),R}function y(T,g){let z;return T?g===null||g===Pt||g===Fi?z=n.DEPTH24_STENCIL8:g===Ot?z=n.DEPTH32F_STENCIL8:g===Ui&&(z=n.DEPTH24_STENCIL8,xe("DepthTexture: 16 bit depth attachment is not supported with stencil. Using 24-bit attachment.")):g===null||g===Pt||g===Fi?z=n.DEPTH_COMPONENT24:g===Ot?z=n.DEPTH_COMPONENT32F:g===Ui&&(z=n.DEPTH_COMPONENT16),z}function b(T,g){return h(T)===!0||T.isFramebufferTexture&&T.minFilter!==pt&&T.minFilter!==_t?Math.log2(Math.max(g.width,g.height))+1:T.mipmaps!==void 0&&T.mipmaps.length>0?T.mipmaps.length:T.isCompressedTexture&&Array.isArray(T.image)?g.mipmaps.length:1}function C(T){let g=T.target;g.removeEventListener("dispose",C),E(g),g.isVideoTexture&&f.delete(g),g.isHTMLTexture&&m.delete(g)}function x(T){let g=T.target;g.removeEventListener("dispose",x),U(g)}function E(T){let g=i.get(T);if(g.__webglInit===void 0)return;let z=T.source,X=p.get(z);if(X){let Z=X[g.__cacheKey];Z.usedTimes--,Z.usedTimes===0&&D(T),Object.keys(X).length===0&&p.delete(z)}i.remove(T)}function D(T){let g=i.get(T);n.deleteTexture(g.__webglTexture);let z=T.source,X=p.get(z);delete X[g.__cacheKey],s.memory.textures--}function U(T){let g=i.get(T);if(T.depthTexture&&(T.depthTexture.dispose(),i.remove(T.depthTexture)),T.isWebGLCubeRenderTarget)for(let X=0;X<6;X++){if(Array.isArray(g.__webglFramebuffer[X]))for(let Z=0;Z<g.__webglFramebuffer[X].length;Z++)n.deleteFramebuffer(g.__webglFramebuffer[X][Z]);else n.deleteFramebuffer(g.__webglFramebuffer[X]);g.__webglDepthbuffer&&n.deleteRenderbuffer(g.__webglDepthbuffer[X])}else{if(Array.isArray(g.__webglFramebuffer))for(let X=0;X<g.__webglFramebuffer.length;X++)n.deleteFramebuffer(g.__webglFramebuffer[X]);else n.deleteFramebuffer(g.__webglFramebuffer);if(g.__webglDepthbuffer&&n.deleteRenderbuffer(g.__webglDepthbuffer),g.__webglMultisampledFramebuffer&&n.deleteFramebuffer(g.__webglMultisampledFramebuffer),g.__webglColorRenderbuffer)for(let X=0;X<g.__webglColorRenderbuffer.length;X++)g.__webglColorRenderbuffer[X]&&n.deleteRenderbuffer(g.__webglColorRenderbuffer[X]);g.__webglDepthRenderbuffer&&n.deleteRenderbuffer(g.__webglDepthRenderbuffer)}let z=T.textures;for(let X=0,Z=z.length;X<Z;X++){let he=i.get(z[X]);he.__webglTexture&&(n.deleteTexture(he.__webglTexture),s.memory.textures--),i.remove(z[X])}i.remove(T)}let G=0;function k(){G=0}function L(){return G}function H(T){G=T}function K(){let T=G;return T>=r.maxTextures&&xe("WebGLTextures: Trying to use "+(T+1)+" texture units while this GPU supports only "+r.maxTextures),G+=1,T}function $(T){let g=[];return g.push(T.wrapS),g.push(T.wrapT),g.push(T.wrapR||0),g.push(T.magFilter),g.push(T.minFilter),g.push(T.anisotropy),g.push(T.internalFormat),g.push(T.format),g.push(T.type),g.push(T.generateMipmaps),g.push(T.premultiplyAlpha),g.push(T.flipY),g.push(T.unpackAlignment),g.push(T.colorSpace),g.join()}function oe(T,g){let z=i.get(T);if(T.isVideoTexture&&B(T),T.isRenderTargetTexture===!1&&T.isExternalTexture!==!0&&T.version>0&&z.__version!==T.version){let X=T.image;if(X===null)xe("WebGLRenderer: Texture marked for update but no image data found.");else if(X.complete===!1)xe("WebGLRenderer: Texture marked for update but image is incomplete");else{Se(z,T,g);return}}else T.isExternalTexture&&(z.__webglTexture=T.sourceTexture?T.sourceTexture:null);t.bindTexture(n.TEXTURE_2D,z.__webglTexture,n.TEXTURE0+g)}function Q(T,g){let z=i.get(T);if(T.isRenderTargetTexture===!1&&T.version>0&&z.__version!==T.version){Se(z,T,g);return}else T.isExternalTexture&&(z.__webglTexture=T.sourceTexture?T.sourceTexture:null);t.bindTexture(n.TEXTURE_2D_ARRAY,z.__webglTexture,n.TEXTURE0+g)}function re(T,g){let z=i.get(T);if(T.isRenderTargetTexture===!1&&T.version>0&&z.__version!==T.version){Se(z,T,g);return}t.bindTexture(n.TEXTURE_3D,z.__webglTexture,n.TEXTURE0+g)}function se(T,g){let z=i.get(T);if(T.isCubeDepthTexture!==!0&&T.version>0&&z.__version!==T.version){Ie(z,T,g);return}t.bindTexture(n.TEXTURE_CUBE_MAP,z.__webglTexture,n.TEXTURE0+g)}let Pe={[Nr]:n.REPEAT,[Jt]:n.CLAMP_TO_EDGE,[Ur]:n.MIRRORED_REPEAT},Ce={[pt]:n.NEAREST,[Nl]:n.NEAREST_MIPMAP_NEAREST,[Fr]:n.NEAREST_MIPMAP_LINEAR,[_t]:n.LINEAR,[qo]:n.LINEAR_MIPMAP_NEAREST,[mi]:n.LINEAR_MIPMAP_LINEAR},ot={[Bl]:n.NEVER,[Vl]:n.ALWAYS,[Gl]:n.LESS,[qn]:n.LEQUAL,[zl]:n.EQUAL,[Yn]:n.GEQUAL,[kl]:n.GREATER,[Hl]:n.NOTEQUAL};function Ve(T,g){if(g.type===Ot&&e.has("OES_texture_float_linear")===!1&&(g.magFilter===_t||g.magFilter===qo||g.magFilter===Fr||g.magFilter===mi||g.minFilter===_t||g.minFilter===qo||g.minFilter===Fr||g.minFilter===mi)&&xe("WebGLRenderer: Unable to use linear filtering with floating point textures. OES_texture_float_linear not supported on this device."),n.texParameteri(T,n.TEXTURE_WRAP_S,Pe[g.wrapS]),n.texParameteri(T,n.TEXTURE_WRAP_T,Pe[g.wrapT]),(T===n.TEXTURE_3D||T===n.TEXTURE_2D_ARRAY)&&n.texParameteri(T,n.TEXTURE_WRAP_R,Pe[g.wrapR]),n.texParameteri(T,n.TEXTURE_MAG_FILTER,Ce[g.magFilter]),n.texParameteri(T,n.TEXTURE_MIN_FILTER,Ce[g.minFilter]),g.compareFunction&&(n.texParameteri(T,n.TEXTURE_COMPARE_MODE,n.COMPARE_REF_TO_TEXTURE),n.texParameteri(T,n.TEXTURE_COMPARE_FUNC,ot[g.compareFunction])),e.has("EXT_texture_filter_anisotropic")===!0){if(g.magFilter===pt||g.minFilter!==Fr&&g.minFilter!==mi||g.type===Ot&&e.has("OES_texture_float_linear")===!1)return;if(g.anisotropy>1||i.get(g).__currentAnisotropy){let z=e.get("EXT_texture_filter_anisotropic");n.texParameterf(T,z.TEXTURE_MAX_ANISOTROPY_EXT,Math.min(g.anisotropy,r.getMaxAnisotropy())),i.get(g).__currentAnisotropy=g.anisotropy}}}function Ye(T,g){let z=!1;T.__webglInit===void 0&&(T.__webglInit=!0,g.addEventListener("dispose",C));let X=g.source,Z=p.get(X);Z===void 0&&(Z={},p.set(X,Z));let he=$(g);if(he!==T.__cacheKey){Z[he]===void 0&&(Z[he]={texture:n.createTexture(),usedTimes:0},s.memory.textures++,z=!0),Z[he].usedTimes++;let w=Z[T.__cacheKey];w!==void 0&&(Z[T.__cacheKey].usedTimes--,w.usedTimes===0&&D(g)),T.__cacheKey=he,T.__webglTexture=Z[he].texture}return z}function j(T,g,z){return Math.floor(Math.floor(T/z)/g)}function ne(T,g,z,X){let he=T.updateRanges;if(he.length===0)t.texSubImage2D(n.TEXTURE_2D,0,0,0,g.width,g.height,z,X,g.data);else{he.sort((ce,ie)=>ce.start-ie.start);let w=0;for(let ce=1;ce<he.length;ce++){let ie=he[w],ue=he[ce],fe=ie.start+ie.count,ge=j(ue.start,g.width,4),De=j(ie.start,g.width,4);ue.start<=fe+1&&ge===De&&j(ue.start+ue.count-1,g.width,4)===ge?ie.count=Math.max(ie.count,ue.start+ue.count-ie.start):(++w,he[w]=ue)}he.length=w+1;let R=t.getParameter(n.UNPACK_ROW_LENGTH),F=t.getParameter(n.UNPACK_SKIP_PIXELS),q=t.getParameter(n.UNPACK_SKIP_ROWS);t.pixelStorei(n.UNPACK_ROW_LENGTH,g.width);for(let ce=0,ie=he.length;ce<ie;ce++){let ue=he[ce],fe=Math.floor(ue.start/4),ge=Math.ceil(ue.count/4),De=fe%g.width,N=Math.floor(fe/g.width),le=ge,ee=1;t.pixelStorei(n.UNPACK_SKIP_PIXELS,De),t.pixelStorei(n.UNPACK_SKIP_ROWS,N),t.texSubImage2D(n.TEXTURE_2D,0,De,N,le,ee,z,X,g.data)}T.clearUpdateRanges(),t.pixelStorei(n.UNPACK_ROW_LENGTH,R),t.pixelStorei(n.UNPACK_SKIP_PIXELS,F),t.pixelStorei(n.UNPACK_SKIP_ROWS,q)}}function Se(T,g,z){let X=n.TEXTURE_2D;(g.isDataArrayTexture||g.isCompressedArrayTexture)&&(X=n.TEXTURE_2D_ARRAY),g.isData3DTexture&&(X=n.TEXTURE_3D);let Z=Ye(T,g),he=g.source;t.bindTexture(X,T.__webglTexture,n.TEXTURE0+z);let w=i.get(he);if(he.version!==w.__version||Z===!0){if(t.activeTexture(n.TEXTURE0+z),(typeof ImageBitmap<"u"&&g.image instanceof ImageBitmap)===!1){let ee=Ue.getPrimaries(Ue.workingColorSpace),J=g.colorSpace===ui?null:Ue.getPrimaries(g.colorSpace),ae=g.colorSpace===ui||ee===J?n.NONE:n.BROWSER_DEFAULT_WEBGL;t.pixelStorei(n.UNPACK_FLIP_Y_WEBGL,g.flipY),t.pixelStorei(n.UNPACK_PREMULTIPLY_ALPHA_WEBGL,g.premultiplyAlpha),t.pixelStorei(n.UNPACK_COLORSPACE_CONVERSION_WEBGL,ae)}t.pixelStorei(n.UNPACK_ALIGNMENT,g.unpackAlignment);let F=d(g.image,!1,r.maxTextureSize);F=Tt(g,F);let q=o.convert(g.format,g.colorSpace),ce=o.convert(g.type),ie=M(g.internalFormat,q,ce,g.normalized,g.colorSpace,g.isVideoTexture);Ve(X,g);let ue,fe=g.mipmaps,ge=g.isVideoTexture!==!0,De=w.__version===void 0||Z===!0,N=he.dataReady,le=b(g,F);if(g.isDepthTexture)ie=y(g.format===gi,g.type),De&&(ge?t.texStorage2D(n.TEXTURE_2D,1,ie,F.width,F.height):t.texImage2D(n.TEXTURE_2D,0,ie,F.width,F.height,0,q,ce,null));else if(g.isDataTexture)if(fe.length>0){ge&&De&&t.texStorage2D(n.TEXTURE_2D,le,ie,fe[0].width,fe[0].height);for(let ee=0,J=fe.length;ee<J;ee++)ue=fe[ee],ge?N&&t.texSubImage2D(n.TEXTURE_2D,ee,0,0,ue.width,ue.height,q,ce,ue.data):t.texImage2D(n.TEXTURE_2D,ee,ie,ue.width,ue.height,0,q,ce,ue.data);g.generateMipmaps=!1}else ge?(De&&t.texStorage2D(n.TEXTURE_2D,le,ie,F.width,F.height),N&&ne(g,F,q,ce)):t.texImage2D(n.TEXTURE_2D,0,ie,F.width,F.height,0,q,ce,F.data);else if(g.isCompressedTexture)if(g.isCompressedArrayTexture){ge&&De&&t.texStorage3D(n.TEXTURE_2D_ARRAY,le,ie,fe[0].width,fe[0].height,F.depth);for(let ee=0,J=fe.length;ee<J;ee++)if(ue=fe[ee],g.format!==Dt)if(q!==null)if(ge){if(N)if(g.layerUpdates.size>0){let ae=Na(ue.width,ue.height,g.format,g.type);for(let te of g.layerUpdates){let we=ue.data.subarray(te*ae/ue.data.BYTES_PER_ELEMENT,(te+1)*ae/ue.data.BYTES_PER_ELEMENT);t.compressedTexSubImage3D(n.TEXTURE_2D_ARRAY,ee,0,0,te,ue.width,ue.height,1,q,we)}}else t.compressedTexSubImage3D(n.TEXTURE_2D_ARRAY,ee,0,0,0,ue.width,ue.height,F.depth,q,ue.data)}else t.compressedTexImage3D(n.TEXTURE_2D_ARRAY,ee,ie,ue.width,ue.height,F.depth,0,ue.data,0,0);else xe("WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()");else ge?N&&t.texSubImage3D(n.TEXTURE_2D_ARRAY,ee,0,0,0,ue.width,ue.height,F.depth,q,ce,ue.data):t.texImage3D(n.TEXTURE_2D_ARRAY,ee,ie,ue.width,ue.height,F.depth,0,q,ce,ue.data);g.layerUpdates.size>0&&g.clearLayerUpdates()}else{ge&&De&&t.texStorage2D(n.TEXTURE_2D,le,ie,fe[0].width,fe[0].height);for(let ee=0,J=fe.length;ee<J;ee++)ue=fe[ee],g.format!==Dt?q!==null?ge?N&&t.compressedTexSubImage2D(n.TEXTURE_2D,ee,0,0,ue.width,ue.height,q,ue.data):t.compressedTexImage2D(n.TEXTURE_2D,ee,ie,ue.width,ue.height,0,ue.data):xe("WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()"):ge?N&&t.texSubImage2D(n.TEXTURE_2D,ee,0,0,ue.width,ue.height,q,ce,ue.data):t.texImage2D(n.TEXTURE_2D,ee,ie,ue.width,ue.height,0,q,ce,ue.data)}else if(g.isDataArrayTexture)if(ge){if(De&&t.texStorage3D(n.TEXTURE_2D_ARRAY,le,ie,F.width,F.height,F.depth),N)if(g.layerUpdates.size>0){let ee=Na(F.width,F.height,g.format,g.type);for(let J of g.layerUpdates){let ae=F.data.subarray(J*ee/F.data.BYTES_PER_ELEMENT,(J+1)*ee/F.data.BYTES_PER_ELEMENT);t.texSubImage3D(n.TEXTURE_2D_ARRAY,0,0,0,J,F.width,F.height,1,q,ce,ae)}g.clearLayerUpdates()}else t.texSubImage3D(n.TEXTURE_2D_ARRAY,0,0,0,0,F.width,F.height,F.depth,q,ce,F.data)}else t.texImage3D(n.TEXTURE_2D_ARRAY,0,ie,F.width,F.height,F.depth,0,q,ce,F.data);else if(g.isData3DTexture)ge?(De&&t.texStorage3D(n.TEXTURE_3D,le,ie,F.width,F.height,F.depth),N&&t.texSubImage3D(n.TEXTURE_3D,0,0,0,0,F.width,F.height,F.depth,q,ce,F.data)):t.texImage3D(n.TEXTURE_3D,0,ie,F.width,F.height,F.depth,0,q,ce,F.data);else if(g.isFramebufferTexture){if(De)if(ge)t.texStorage2D(n.TEXTURE_2D,le,ie,F.width,F.height);else{let ee=F.width,J=F.height;for(let ae=0;ae<le;ae++)t.texImage2D(n.TEXTURE_2D,ae,ie,ee,J,0,q,ce,null),ee>>=1,J>>=1}}else if(g.isHTMLTexture){if("texElementImage2D"in n){let ee=n.canvas;if(ee.hasAttribute("layoutsubtree")||ee.setAttribute("layoutsubtree","true"),F.parentNode!==ee){ee.appendChild(F),m.add(g),ee.onpaint=J=>{let ae=J.changedElements;for(let te of m)ae.includes(te.image)&&(te.needsUpdate=!0)},ee.requestPaint();return}if(n.texElementImage2D.length===3)n.texElementImage2D(n.TEXTURE_2D,n.RGBA8,F);else{let ae=n.RGBA,te=n.RGBA,we=n.UNSIGNED_BYTE;n.texElementImage2D(n.TEXTURE_2D,0,ae,te,we,F)}n.texParameteri(n.TEXTURE_2D,n.TEXTURE_MIN_FILTER,n.LINEAR),n.texParameteri(n.TEXTURE_2D,n.TEXTURE_WRAP_S,n.CLAMP_TO_EDGE),n.texParameteri(n.TEXTURE_2D,n.TEXTURE_WRAP_T,n.CLAMP_TO_EDGE)}}else if(fe.length>0){if(ge&&De){let ee=Je(fe[0]);t.texStorage2D(n.TEXTURE_2D,le,ie,ee.width,ee.height)}for(let ee=0,J=fe.length;ee<J;ee++)ue=fe[ee],ge?N&&t.texSubImage2D(n.TEXTURE_2D,ee,0,0,q,ce,ue):t.texImage2D(n.TEXTURE_2D,ee,ie,q,ce,ue);g.generateMipmaps=!1}else if(ge){if(De){let ee=Je(F);t.texStorage2D(n.TEXTURE_2D,le,ie,ee.width,ee.height)}N&&t.texSubImage2D(n.TEXTURE_2D,0,0,0,q,ce,F)}else t.texImage2D(n.TEXTURE_2D,0,ie,q,ce,F);h(g)&&A(X),w.__version=he.version,g.onUpdate&&g.onUpdate(g)}T.__version=g.version}function Ie(T,g,z){if(g.image.length!==6)return;let X=Ye(T,g),Z=g.source;t.bindTexture(n.TEXTURE_CUBE_MAP,T.__webglTexture,n.TEXTURE0+z);let he=i.get(Z);if(Z.version!==he.__version||X===!0){t.activeTexture(n.TEXTURE0+z);let w=Ue.getPrimaries(Ue.workingColorSpace),R=g.colorSpace===ui?null:Ue.getPrimaries(g.colorSpace),F=g.colorSpace===ui||w===R?n.NONE:n.BROWSER_DEFAULT_WEBGL;t.pixelStorei(n.UNPACK_FLIP_Y_WEBGL,g.flipY),t.pixelStorei(n.UNPACK_PREMULTIPLY_ALPHA_WEBGL,g.premultiplyAlpha),t.pixelStorei(n.UNPACK_ALIGNMENT,g.unpackAlignment),t.pixelStorei(n.UNPACK_COLORSPACE_CONVERSION_WEBGL,F);let q=g.isCompressedTexture||g.image[0].isCompressedTexture,ce=g.image[0]&&g.image[0].isDataTexture,ie=[];for(let te=0;te<6;te++)!q&&!ce?ie[te]=d(g.image[te],!0,r.maxCubemapSize):ie[te]=ce?g.image[te].image:g.image[te],ie[te]=Tt(g,ie[te]);let ue=ie[0],fe=o.convert(g.format,g.colorSpace),ge=o.convert(g.type),De=M(g.internalFormat,fe,ge,g.normalized,g.colorSpace),N=g.isVideoTexture!==!0,le=he.__version===void 0||X===!0,ee=Z.dataReady,J=b(g,ue);Ve(n.TEXTURE_CUBE_MAP,g);let ae;if(q){N&&le&&t.texStorage2D(n.TEXTURE_CUBE_MAP,J,De,ue.width,ue.height);for(let te=0;te<6;te++){ae=ie[te].mipmaps;for(let we=0;we<ae.length;we++){let Ee=ae[we];g.format!==Dt?fe!==null?N?ee&&t.compressedTexSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+te,we,0,0,Ee.width,Ee.height,fe,Ee.data):t.compressedTexImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+te,we,De,Ee.width,Ee.height,0,Ee.data):xe("WebGLRenderer: Attempt to load unsupported compressed texture format in .setTextureCube()"):N?ee&&t.texSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+te,we,0,0,Ee.width,Ee.height,fe,ge,Ee.data):t.texImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+te,we,De,Ee.width,Ee.height,0,fe,ge,Ee.data)}}}else{if(ae=g.mipmaps,N&&le){ae.length>0&&J++;let te=Je(ie[0]);t.texStorage2D(n.TEXTURE_CUBE_MAP,J,De,te.width,te.height)}for(let te=0;te<6;te++)if(ce){N?ee&&t.texSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+te,0,0,0,ie[te].width,ie[te].height,fe,ge,ie[te].data):t.texImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+te,0,De,ie[te].width,ie[te].height,0,fe,ge,ie[te].data);for(let we=0;we<ae.length;we++){let Qe=ae[we].image[te].image;N?ee&&t.texSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+te,we+1,0,0,Qe.width,Qe.height,fe,ge,Qe.data):t.texImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+te,we+1,De,Qe.width,Qe.height,0,fe,ge,Qe.data)}}else{N?ee&&t.texSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+te,0,0,0,fe,ge,ie[te]):t.texImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+te,0,De,fe,ge,ie[te]);for(let we=0;we<ae.length;we++){let Ee=ae[we];N?ee&&t.texSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+te,we+1,0,0,fe,ge,Ee.image[te]):t.texImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+te,we+1,De,fe,ge,Ee.image[te])}}}h(g)&&A(n.TEXTURE_CUBE_MAP),he.__version=Z.version,g.onUpdate&&g.onUpdate(g)}T.__version=g.version}function ve(T,g,z,X,Z,he){let w=o.convert(z.format,z.colorSpace),R=o.convert(z.type),F=M(z.internalFormat,w,R,z.normalized,z.colorSpace),q=i.get(g),ce=i.get(z);if(ce.__renderTarget=g,!q.__hasExternalTextures){let ie=Math.max(1,g.width>>he),ue=Math.max(1,g.height>>he);Z===n.TEXTURE_3D||Z===n.TEXTURE_2D_ARRAY?t.texImage3D(Z,he,F,ie,ue,g.depth,0,w,R,null):t.texImage2D(Z,he,F,ie,ue,0,w,R,null)}t.bindFramebuffer(n.FRAMEBUFFER,T),at(g)?a.framebufferTexture2DMultisampleEXT(n.FRAMEBUFFER,X,Z,ce.__webglTexture,0,ut(g)):(Z===n.TEXTURE_2D||Z>=n.TEXTURE_CUBE_MAP_POSITIVE_X&&Z<=n.TEXTURE_CUBE_MAP_NEGATIVE_Z)&&n.framebufferTexture2D(n.FRAMEBUFFER,X,Z,ce.__webglTexture,he),t.bindFramebuffer(n.FRAMEBUFFER,null)}function ze(T,g,z){if(n.bindRenderbuffer(n.RENDERBUFFER,T),g.depthBuffer){let X=g.depthTexture,Z=X&&X.isDepthTexture?X.type:null,he=y(g.stencilBuffer,Z),w=g.stencilBuffer?n.DEPTH_STENCIL_ATTACHMENT:n.DEPTH_ATTACHMENT;at(g)?a.renderbufferStorageMultisampleEXT(n.RENDERBUFFER,ut(g),he,g.width,g.height):z?n.renderbufferStorageMultisample(n.RENDERBUFFER,ut(g),he,g.width,g.height):n.renderbufferStorage(n.RENDERBUFFER,he,g.width,g.height),n.framebufferRenderbuffer(n.FRAMEBUFFER,w,n.RENDERBUFFER,T)}else{let X=g.textures;for(let Z=0;Z<X.length;Z++){let he=X[Z],w=o.convert(he.format,he.colorSpace),R=o.convert(he.type),F=M(he.internalFormat,w,R,he.normalized,he.colorSpace);at(g)?a.renderbufferStorageMultisampleEXT(n.RENDERBUFFER,ut(g),F,g.width,g.height):z?n.renderbufferStorageMultisample(n.RENDERBUFFER,ut(g),F,g.width,g.height):n.renderbufferStorage(n.RENDERBUFFER,F,g.width,g.height)}}n.bindRenderbuffer(n.RENDERBUFFER,null)}function Ke(T,g,z){let X=g.isWebGLCubeRenderTarget===!0;if(t.bindFramebuffer(n.FRAMEBUFFER,T),!(g.depthTexture&&g.depthTexture.isDepthTexture))throw new Error("THREE.WebGLTextures: renderTarget.depthTexture must be an instance of THREE.DepthTexture.");let Z=i.get(g.depthTexture);if(Z.__renderTarget=g,(!Z.__webglTexture||g.depthTexture.image.width!==g.width||g.depthTexture.image.height!==g.height)&&(g.depthTexture.image.width=g.width,g.depthTexture.image.height=g.height,g.depthTexture.needsUpdate=!0),X){if(Z.__webglInit===void 0&&(Z.__webglInit=!0,g.depthTexture.addEventListener("dispose",C)),Z.__webglTexture===void 0){Z.__webglTexture=n.createTexture(),t.bindTexture(n.TEXTURE_CUBE_MAP,Z.__webglTexture),Ve(n.TEXTURE_CUBE_MAP,g.depthTexture);let q=o.convert(g.depthTexture.format),ce=o.convert(g.depthTexture.type),ie;g.depthTexture.format===Yt?ie=n.DEPTH_COMPONENT24:g.depthTexture.format===gi&&(ie=n.DEPTH24_STENCIL8);for(let ue=0;ue<6;ue++)n.texImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+ue,0,ie,g.width,g.height,0,q,ce,null)}}else oe(g.depthTexture,0);let he=Z.__webglTexture,w=ut(g),R=X?n.TEXTURE_CUBE_MAP_POSITIVE_X+z:n.TEXTURE_2D,F=g.depthTexture.format===gi?n.DEPTH_STENCIL_ATTACHMENT:n.DEPTH_ATTACHMENT;if(g.depthTexture.format===Yt)at(g)?a.framebufferTexture2DMultisampleEXT(n.FRAMEBUFFER,F,R,he,0,w):n.framebufferTexture2D(n.FRAMEBUFFER,F,R,he,0);else if(g.depthTexture.format===gi)at(g)?a.framebufferTexture2DMultisampleEXT(n.FRAMEBUFFER,F,R,he,0,w):n.framebufferTexture2D(n.FRAMEBUFFER,F,R,he,0);else throw new Error("THREE.WebGLTextures: Unknown depthTexture format.")}function Ge(T){let g=i.get(T),z=T.isWebGLCubeRenderTarget===!0;if(g.__boundDepthTexture!==T.depthTexture){let X=T.depthTexture;if(g.__depthDisposeCallback&&g.__depthDisposeCallback(),X){let Z=()=>{delete g.__boundDepthTexture,delete g.__depthDisposeCallback,X.removeEventListener("dispose",Z)};X.addEventListener("dispose",Z),g.__depthDisposeCallback=Z}g.__boundDepthTexture=X}if(T.depthTexture&&!g.__autoAllocateDepthBuffer)if(z)for(let X=0;X<6;X++)Ke(g.__webglFramebuffer[X],T,X);else{let X=T.texture.mipmaps;X&&X.length>0?Ke(g.__webglFramebuffer[0],T,0):Ke(g.__webglFramebuffer,T,0)}else if(z){g.__webglDepthbuffer=[];for(let X=0;X<6;X++)if(t.bindFramebuffer(n.FRAMEBUFFER,g.__webglFramebuffer[X]),g.__webglDepthbuffer[X]===void 0)g.__webglDepthbuffer[X]=n.createRenderbuffer(),ze(g.__webglDepthbuffer[X],T,!1);else{let Z=T.stencilBuffer?n.DEPTH_STENCIL_ATTACHMENT:n.DEPTH_ATTACHMENT,he=g.__webglDepthbuffer[X];n.bindRenderbuffer(n.RENDERBUFFER,he),n.framebufferRenderbuffer(n.FRAMEBUFFER,Z,n.RENDERBUFFER,he)}}else{let X=T.texture.mipmaps;if(X&&X.length>0?t.bindFramebuffer(n.FRAMEBUFFER,g.__webglFramebuffer[0]):t.bindFramebuffer(n.FRAMEBUFFER,g.__webglFramebuffer),g.__webglDepthbuffer===void 0)g.__webglDepthbuffer=n.createRenderbuffer(),ze(g.__webglDepthbuffer,T,!1);else{let Z=T.stencilBuffer?n.DEPTH_STENCIL_ATTACHMENT:n.DEPTH_ATTACHMENT,he=g.__webglDepthbuffer;n.bindRenderbuffer(n.RENDERBUFFER,he),n.framebufferRenderbuffer(n.FRAMEBUFFER,Z,n.RENDERBUFFER,he)}}t.bindFramebuffer(n.FRAMEBUFFER,null)}function We(T,g,z){let X=i.get(T);g!==void 0&&ve(X.__webglFramebuffer,T,T.texture,n.COLOR_ATTACHMENT0,n.TEXTURE_2D,0),z!==void 0&&Ge(T)}function tt(T){let g=T.texture,z=i.get(T),X=i.get(g);T.addEventListener("dispose",x);let Z=T.textures,he=T.isWebGLCubeRenderTarget===!0,w=Z.length>1;if(w||(X.__webglTexture===void 0&&(X.__webglTexture=n.createTexture()),X.__version=g.version,s.memory.textures++),he){z.__webglFramebuffer=[];for(let R=0;R<6;R++)if(g.mipmaps&&g.mipmaps.length>0){z.__webglFramebuffer[R]=[];for(let F=0;F<g.mipmaps.length;F++)z.__webglFramebuffer[R][F]=n.createFramebuffer()}else z.__webglFramebuffer[R]=n.createFramebuffer()}else{if(g.mipmaps&&g.mipmaps.length>0){z.__webglFramebuffer=[];for(let R=0;R<g.mipmaps.length;R++)z.__webglFramebuffer[R]=n.createFramebuffer()}else z.__webglFramebuffer=n.createFramebuffer();if(w)for(let R=0,F=Z.length;R<F;R++){let q=i.get(Z[R]);q.__webglTexture===void 0&&(q.__webglTexture=n.createTexture(),s.memory.textures++)}if(T.samples>0&&at(T)===!1){z.__webglMultisampledFramebuffer=n.createFramebuffer(),z.__webglColorRenderbuffer=[],t.bindFramebuffer(n.FRAMEBUFFER,z.__webglMultisampledFramebuffer);for(let R=0;R<Z.length;R++){let F=Z[R];z.__webglColorRenderbuffer[R]=n.createRenderbuffer(),n.bindRenderbuffer(n.RENDERBUFFER,z.__webglColorRenderbuffer[R]);let q=o.convert(F.format,F.colorSpace),ce=o.convert(F.type),ie=M(F.internalFormat,q,ce,F.normalized,F.colorSpace,T.isXRRenderTarget===!0),ue=ut(T);n.renderbufferStorageMultisample(n.RENDERBUFFER,ue,ie,T.width,T.height),n.framebufferRenderbuffer(n.FRAMEBUFFER,n.COLOR_ATTACHMENT0+R,n.RENDERBUFFER,z.__webglColorRenderbuffer[R])}n.bindRenderbuffer(n.RENDERBUFFER,null),T.depthBuffer&&(z.__webglDepthRenderbuffer=n.createRenderbuffer(),ze(z.__webglDepthRenderbuffer,T,!0)),t.bindFramebuffer(n.FRAMEBUFFER,null)}}if(he){t.bindTexture(n.TEXTURE_CUBE_MAP,X.__webglTexture),Ve(n.TEXTURE_CUBE_MAP,g);for(let R=0;R<6;R++)if(g.mipmaps&&g.mipmaps.length>0)for(let F=0;F<g.mipmaps.length;F++)ve(z.__webglFramebuffer[R][F],T,g,n.COLOR_ATTACHMENT0,n.TEXTURE_CUBE_MAP_POSITIVE_X+R,F);else ve(z.__webglFramebuffer[R],T,g,n.COLOR_ATTACHMENT0,n.TEXTURE_CUBE_MAP_POSITIVE_X+R,0);h(g)&&A(n.TEXTURE_CUBE_MAP),t.unbindTexture()}else if(w){for(let R=0,F=Z.length;R<F;R++){let q=Z[R],ce=i.get(q),ie=n.TEXTURE_2D;(T.isWebGL3DRenderTarget||T.isWebGLArrayRenderTarget)&&(ie=T.isWebGL3DRenderTarget?n.TEXTURE_3D:n.TEXTURE_2D_ARRAY),t.bindTexture(ie,ce.__webglTexture),Ve(ie,q),ve(z.__webglFramebuffer,T,q,n.COLOR_ATTACHMENT0+R,ie,0),h(q)&&A(ie)}t.unbindTexture()}else{let R=n.TEXTURE_2D;if((T.isWebGL3DRenderTarget||T.isWebGLArrayRenderTarget)&&(R=T.isWebGL3DRenderTarget?n.TEXTURE_3D:n.TEXTURE_2D_ARRAY),t.bindTexture(R,X.__webglTexture),Ve(R,g),g.mipmaps&&g.mipmaps.length>0)for(let F=0;F<g.mipmaps.length;F++)ve(z.__webglFramebuffer[F],T,g,n.COLOR_ATTACHMENT0,R,F);else ve(z.__webglFramebuffer,T,g,n.COLOR_ATTACHMENT0,R,0);h(g)&&A(R),t.unbindTexture()}T.depthBuffer&&Ge(T)}function He(T){let g=T.textures;for(let z=0,X=g.length;z<X;z++){let Z=g[z];if(h(Z)){let he=I(T),w=i.get(Z).__webglTexture;t.bindTexture(he,w),A(he),t.unbindTexture()}}}let ct=[],Mt=[];function Ft(T){if(T.samples>0){if(at(T)===!1){let g=T.textures,z=T.width,X=T.height,Z=n.COLOR_BUFFER_BIT,he=T.stencilBuffer?n.DEPTH_STENCIL_ATTACHMENT:n.DEPTH_ATTACHMENT,w=i.get(T),R=g.length>1;if(R)for(let q=0;q<g.length;q++)t.bindFramebuffer(n.FRAMEBUFFER,w.__webglMultisampledFramebuffer),n.framebufferRenderbuffer(n.FRAMEBUFFER,n.COLOR_ATTACHMENT0+q,n.RENDERBUFFER,null),t.bindFramebuffer(n.FRAMEBUFFER,w.__webglFramebuffer),n.framebufferTexture2D(n.DRAW_FRAMEBUFFER,n.COLOR_ATTACHMENT0+q,n.TEXTURE_2D,null,0);t.bindFramebuffer(n.READ_FRAMEBUFFER,w.__webglMultisampledFramebuffer);let F=T.texture.mipmaps;F&&F.length>0?t.bindFramebuffer(n.DRAW_FRAMEBUFFER,w.__webglFramebuffer[0]):t.bindFramebuffer(n.DRAW_FRAMEBUFFER,w.__webglFramebuffer);for(let q=0;q<g.length;q++){if(T.resolveDepthBuffer&&(T.depthBuffer&&(Z|=n.DEPTH_BUFFER_BIT),T.stencilBuffer&&T.resolveStencilBuffer&&(Z|=n.STENCIL_BUFFER_BIT)),R){n.framebufferRenderbuffer(n.READ_FRAMEBUFFER,n.COLOR_ATTACHMENT0,n.RENDERBUFFER,w.__webglColorRenderbuffer[q]);let ce=i.get(g[q]).__webglTexture;n.framebufferTexture2D(n.DRAW_FRAMEBUFFER,n.COLOR_ATTACHMENT0,n.TEXTURE_2D,ce,0)}n.blitFramebuffer(0,0,z,X,0,0,z,X,Z,n.NEAREST),l===!0&&(ct.length=0,Mt.length=0,ct.push(n.COLOR_ATTACHMENT0+q),T.depthBuffer&&T.storeMultisampledDepthBuffer===!1&&(ct.push(he),Mt.push(he),n.invalidateFramebuffer(n.DRAW_FRAMEBUFFER,Mt)),n.invalidateFramebuffer(n.READ_FRAMEBUFFER,ct))}if(t.bindFramebuffer(n.READ_FRAMEBUFFER,null),t.bindFramebuffer(n.DRAW_FRAMEBUFFER,null),R)for(let q=0;q<g.length;q++){t.bindFramebuffer(n.FRAMEBUFFER,w.__webglMultisampledFramebuffer),n.framebufferRenderbuffer(n.FRAMEBUFFER,n.COLOR_ATTACHMENT0+q,n.RENDERBUFFER,w.__webglColorRenderbuffer[q]);let ce=i.get(g[q]).__webglTexture;t.bindFramebuffer(n.FRAMEBUFFER,w.__webglFramebuffer),n.framebufferTexture2D(n.DRAW_FRAMEBUFFER,n.COLOR_ATTACHMENT0+q,n.TEXTURE_2D,ce,0)}t.bindFramebuffer(n.DRAW_FRAMEBUFFER,w.__webglMultisampledFramebuffer)}else if(T.depthBuffer&&T.storeMultisampledDepthBuffer===!1&&l){let g=T.stencilBuffer?n.DEPTH_STENCIL_ATTACHMENT:n.DEPTH_ATTACHMENT;n.invalidateFramebuffer(n.DRAW_FRAMEBUFFER,[g])}}}function ut(T){return Math.min(r.maxSamples,T.samples)}function at(T){let g=i.get(T);return T.samples>0&&e.has("WEBGL_multisampled_render_to_texture")===!0&&g.__useRenderToTexture!==!1}function B(T){let g=s.render.frame;f.get(T)!==g&&(f.set(T,g),T.update())}function Tt(T,g){let z=T.colorSpace,X=T.format,Z=T.type;return T.isCompressedTexture===!0||T.isVideoTexture===!0||z!==xn&&z!==ui&&(Ue.getTransfer(z)===qe?(X!==Dt||Z!==vt)&&xe("WebGLTextures: sRGB encoded textures have to use RGBAFormat and UnsignedByteType."):Fe("WebGLTextures: Unsupported texture color space:",z)),g}function Je(T){return typeof HTMLImageElement<"u"&&T instanceof HTMLImageElement?(c.width=T.naturalWidth||T.width,c.height=T.naturalHeight||T.height):typeof VideoFrame<"u"&&T instanceof VideoFrame?(c.width=T.displayWidth,c.height=T.displayHeight):(c.width=T.width,c.height=T.height),c}this.allocateTextureUnit=K,this.resetTextureUnits=k,this.getTextureUnits=L,this.setTextureUnits=H,this.setTexture2D=oe,this.setTexture2DArray=Q,this.setTexture3D=re,this.setTextureCube=se,this.rebindTextures=We,this.setupRenderTarget=tt,this.updateRenderTargetMipmap=He,this.updateMultisampleRenderTarget=Ft,this.setupDepthRenderbuffer=Ge,this.setupFrameBufferTexture=ve,this.useMultisampledRTT=at,this.isReversedDepthBuffer=function(){return t.buffers.depth.getReversed()}}function od(n,e){function t(i,r=ui){let o,s=Ue.getTransfer(r);if(i===vt)return n.UNSIGNED_BYTE;if(i===On)return n.UNSIGNED_SHORT_4_4_4_4;if(i===Bn)return n.UNSIGNED_SHORT_5_5_5_1;if(i===Zo)return n.UNSIGNED_INT_5_9_9_9_REV;if(i===Jo)return n.UNSIGNED_INT_10F_11F_11F_REV;if(i===Yo)return n.BYTE;if(i===Ko)return n.SHORT;if(i===Ui)return n.UNSIGNED_SHORT;if(i===Fn)return n.INT;if(i===Pt)return n.UNSIGNED_INT;if(i===Ot)return n.FLOAT;if(i===Lt)return n.HALF_FLOAT;if(i===$o)return n.ALPHA;if(i===Qo)return n.RGB;if(i===Dt)return n.RGBA;if(i===Yt)return n.DEPTH_COMPONENT;if(i===gi)return n.DEPTH_STENCIL;if(i===jo)return n.RED;if(i===Gn)return n.RED_INTEGER;if(i===ii)return n.RG;if(i===zn)return n.RG_INTEGER;if(i===kn)return n.RGBA_INTEGER;if(i===Hn||i===Vn||i===Wn||i===Xn)if(s===qe)if(o=e.get("WEBGL_compressed_texture_s3tc_srgb"),o!==null){if(i===Hn)return o.COMPRESSED_SRGB_S3TC_DXT1_EXT;if(i===Vn)return o.COMPRESSED_SRGB_ALPHA_S3TC_DXT1_EXT;if(i===Wn)return o.COMPRESSED_SRGB_ALPHA_S3TC_DXT3_EXT;if(i===Xn)return o.COMPRESSED_SRGB_ALPHA_S3TC_DXT5_EXT}else return null;else if(o=e.get("WEBGL_compressed_texture_s3tc"),o!==null){if(i===Hn)return o.COMPRESSED_RGB_S3TC_DXT1_EXT;if(i===Vn)return o.COMPRESSED_RGBA_S3TC_DXT1_EXT;if(i===Wn)return o.COMPRESSED_RGBA_S3TC_DXT3_EXT;if(i===Xn)return o.COMPRESSED_RGBA_S3TC_DXT5_EXT}else return null;if(i===Or||i===Br||i===Gr||i===zr)if(o=e.get("WEBGL_compressed_texture_pvrtc"),o!==null){if(i===Or)return o.COMPRESSED_RGB_PVRTC_4BPPV1_IMG;if(i===Br)return o.COMPRESSED_RGB_PVRTC_2BPPV1_IMG;if(i===Gr)return o.COMPRESSED_RGBA_PVRTC_4BPPV1_IMG;if(i===zr)return o.COMPRESSED_RGBA_PVRTC_2BPPV1_IMG}else return null;if(i===kr||i===Hr||i===Vr||i===Wr||i===Xr||i===gn||i===qr)if(o=e.get("WEBGL_compressed_texture_etc"),o!==null){if(i===kr||i===Hr)return s===qe?o.COMPRESSED_SRGB8_ETC2:o.COMPRESSED_RGB8_ETC2;if(i===Vr)return s===qe?o.COMPRESSED_SRGB8_ALPHA8_ETC2_EAC:o.COMPRESSED_RGBA8_ETC2_EAC;if(i===Wr)return o.COMPRESSED_R11_EAC;if(i===Xr)return o.COMPRESSED_SIGNED_R11_EAC;if(i===gn)return o.COMPRESSED_RG11_EAC;if(i===qr)return o.COMPRESSED_SIGNED_RG11_EAC}else return null;if(i===Yr||i===Kr||i===Zr||i===Jr||i===$r||i===Qr||i===jr||i===eo||i===to||i===io||i===no||i===ro||i===oo||i===so)if(o=e.get("WEBGL_compressed_texture_astc"),o!==null){if(i===Yr)return s===qe?o.COMPRESSED_SRGB8_ALPHA8_ASTC_4x4_KHR:o.COMPRESSED_RGBA_ASTC_4x4_KHR;if(i===Kr)return s===qe?o.COMPRESSED_SRGB8_ALPHA8_ASTC_5x4_KHR:o.COMPRESSED_RGBA_ASTC_5x4_KHR;if(i===Zr)return s===qe?o.COMPRESSED_SRGB8_ALPHA8_ASTC_5x5_KHR:o.COMPRESSED_RGBA_ASTC_5x5_KHR;if(i===Jr)return s===qe?o.COMPRESSED_SRGB8_ALPHA8_ASTC_6x5_KHR:o.COMPRESSED_RGBA_ASTC_6x5_KHR;if(i===$r)return s===qe?o.COMPRESSED_SRGB8_ALPHA8_ASTC_6x6_KHR:o.COMPRESSED_RGBA_ASTC_6x6_KHR;if(i===Qr)return s===qe?o.COMPRESSED_SRGB8_ALPHA8_ASTC_8x5_KHR:o.COMPRESSED_RGBA_ASTC_8x5_KHR;if(i===jr)return s===qe?o.COMPRESSED_SRGB8_ALPHA8_ASTC_8x6_KHR:o.COMPRESSED_RGBA_ASTC_8x6_KHR;if(i===eo)return s===qe?o.COMPRESSED_SRGB8_ALPHA8_ASTC_8x8_KHR:o.COMPRESSED_RGBA_ASTC_8x8_KHR;if(i===to)return s===qe?o.COMPRESSED_SRGB8_ALPHA8_ASTC_10x5_KHR:o.COMPRESSED_RGBA_ASTC_10x5_KHR;if(i===io)return s===qe?o.COMPRESSED_SRGB8_ALPHA8_ASTC_10x6_KHR:o.COMPRESSED_RGBA_ASTC_10x6_KHR;if(i===no)return s===qe?o.COMPRESSED_SRGB8_ALPHA8_ASTC_10x8_KHR:o.COMPRESSED_RGBA_ASTC_10x8_KHR;if(i===ro)return s===qe?o.COMPRESSED_SRGB8_ALPHA8_ASTC_10x10_KHR:o.COMPRESSED_RGBA_ASTC_10x10_KHR;if(i===oo)return s===qe?o.COMPRESSED_SRGB8_ALPHA8_ASTC_12x10_KHR:o.COMPRESSED_RGBA_ASTC_12x10_KHR;if(i===so)return s===qe?o.COMPRESSED_SRGB8_ALPHA8_ASTC_12x12_KHR:o.COMPRESSED_RGBA_ASTC_12x12_KHR}else return null;if(i===ao||i===lo||i===co)if(o=e.get("EXT_texture_compression_bptc"),o!==null){if(i===ao)return s===qe?o.COMPRESSED_SRGB_ALPHA_BPTC_UNORM_EXT:o.COMPRESSED_RGBA_BPTC_UNORM_EXT;if(i===lo)return o.COMPRESSED_RGB_BPTC_SIGNED_FLOAT_EXT;if(i===co)return o.COMPRESSED_RGB_BPTC_UNSIGNED_FLOAT_EXT}else return null;if(i===uo||i===ho||i===_n||i===fo)if(o=e.get("EXT_texture_compression_rgtc"),o!==null){if(i===uo)return o.COMPRESSED_RED_RGTC1_EXT;if(i===ho)return o.COMPRESSED_SIGNED_RED_RGTC1_EXT;if(i===_n)return o.COMPRESSED_RED_GREEN_RGTC2_EXT;if(i===fo)return o.COMPRESSED_SIGNED_RED_GREEN_RGTC2_EXT}else return null;return i===Fi?n.UNSIGNED_INT_24_8:n[i]!==void 0?n[i]:null}return{convert:t}}var yg=`
void main() {

	gl_Position = vec4( position, 1.0 );

}`,bg=`
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

}`,Zs=class{constructor(){this.texture=null,this.mesh=null,this.depthNear=0,this.depthFar=0}init(e,t){if(this.texture===null){let i=new fr(e.texture);(e.depthNear!==t.depthNear||e.depthFar!==t.depthFar)&&(this.depthNear=e.depthNear,this.depthFar=e.depthFar),this.texture=i}}getMesh(e){if(this.texture!==null&&this.mesh===null){let t=e.cameras[0].viewport,i=new Ut({vertexShader:yg,fragmentShader:bg,uniforms:{depthColor:{value:this.texture},depthWidth:{value:t.z},depthHeight:{value:t.w}}});this.mesh=new mt(new mr(20,20),i)}return this.mesh}reset(){this.texture=null,this.mesh=null}getDepthTexture(){return this.texture}};var Js=class extends It{constructor(e,t){super();let i=this,r=null,o=1,s=null,a="local-floor",l=1,c=null,f=null,m=null,u=null,p=null,_=null,S=typeof XRWebGLBinding<"u",d=new Zs,h={},A=t.getContextAttributes(),I=null,M=null,y=[],b=[],C=new _e,x=null,E=null,D=new Et;D.viewport=new $e;let U=new Et;U.viewport=new $e;let G=[D,U],k=new Hs,L=null,H=null;this.cameraAutoUpdate=!0,this.enabled=!1,this.isPresenting=!1,this.getController=function(j){let ne=y[j];return ne===void 0&&(ne=new ir,y[j]=ne),ne.getTargetRaySpace()},this.getControllerGrip=function(j){let ne=y[j];return ne===void 0&&(ne=new ir,y[j]=ne),ne.getGripSpace()},this.getHand=function(j){let ne=y[j];return ne===void 0&&(ne=new ir,y[j]=ne),ne.getHandSpace()};function K(j){let ne=b.indexOf(j.inputSource);if(ne===-1)return;let Se=y[ne];Se!==void 0&&(Se.update(j.inputSource,j.frame,c||s),Se.dispatchEvent({type:j.type,data:j.inputSource}))}function $(){r.removeEventListener("select",K),r.removeEventListener("selectstart",K),r.removeEventListener("selectend",K),r.removeEventListener("squeeze",K),r.removeEventListener("squeezestart",K),r.removeEventListener("squeezeend",K),r.removeEventListener("end",$),r.removeEventListener("inputsourceschange",oe);for(let j=0;j<y.length;j++){let ne=b[j];ne!==null&&(b[j]=null,y[j].disconnect(ne))}L=null,H=null,d.reset();for(let j in h)delete h[j];if(e.setRenderTarget(I),p=null,u=null,m=null,r=null,M=null,Ye.stop(),i.isPresenting=!1,e.setPixelRatio(x),e.setSize(C.width,C.height,!1),E!==null){let j=E.camera;j.fov=E.fov,j.zoom=E.zoom,j.updateProjectionMatrix(),E=null}i.dispatchEvent({type:"sessionend"})}this.setFramebufferScaleFactor=function(j){o=j,i.isPresenting===!0&&xe("WebXRManager: Cannot change framebuffer scale while presenting.")},this.setReferenceSpaceType=function(j){a=j,i.isPresenting===!0&&xe("WebXRManager: Cannot change reference space type while presenting.")},this.getReferenceSpace=function(){return c||s},this.setReferenceSpace=function(j){c=j},this.getBaseLayer=function(){return u!==null?u:p},this.getBinding=function(){return m===null&&S&&(m=new XRWebGLBinding(r,t)),m},this.getFrame=function(){return _},this.getSession=function(){return r},this.setSession=async function(j){if(r=j,r!==null){if(I=e.getRenderTarget(),r.addEventListener("select",K),r.addEventListener("selectstart",K),r.addEventListener("selectend",K),r.addEventListener("squeeze",K),r.addEventListener("squeezestart",K),r.addEventListener("squeezeend",K),r.addEventListener("end",$),r.addEventListener("inputsourceschange",oe),A.xrCompatible!==!0&&await t.makeXRCompatible(),x=e.getPixelRatio(),e.getSize(C),S&&"createProjectionLayer"in XRWebGLBinding.prototype){let Se=null,Ie=null,ve=null;A.depth&&(ve=A.stencil?t.DEPTH24_STENCIL8:t.DEPTH_COMPONENT24,Se=A.stencil?gi:Yt,Ie=A.stencil?Fi:Pt);let ze={colorFormat:t.RGBA8,depthFormat:ve,scaleFactor:o};m=this.getBinding(),u=m.createProjectionLayer(ze),r.updateRenderState({layers:[u]}),e.setPixelRatio(1),e.setSize(u.textureWidth,u.textureHeight,!1),M=new At(u.textureWidth,u.textureHeight,{format:Dt,type:vt,depthTexture:new Ti(u.textureWidth,u.textureHeight,Ie,void 0,void 0,void 0,void 0,void 0,void 0,Se),stencilBuffer:A.stencil,colorSpace:e.outputColorSpace,samples:A.antialias?4:0,resolveDepthBuffer:u.ignoreDepthValues===!1,resolveStencilBuffer:u.ignoreDepthValues===!1,storeMultisampledDepthBuffer:u.ignoreDepthValues===!1,storeMultisampledStencilBuffer:u.ignoreDepthValues===!1})}else{let Se={antialias:A.antialias,alpha:!0,depth:A.depth,stencil:A.stencil,framebufferScaleFactor:o};p=new XRWebGLLayer(r,t,Se),r.updateRenderState({baseLayer:p}),e.setPixelRatio(1),e.setSize(p.framebufferWidth,p.framebufferHeight,!1),M=new At(p.framebufferWidth,p.framebufferHeight,{format:Dt,type:vt,colorSpace:e.outputColorSpace,stencilBuffer:A.stencil,resolveDepthBuffer:p.ignoreDepthValues===!1,resolveStencilBuffer:p.ignoreDepthValues===!1,storeMultisampledDepthBuffer:p.ignoreDepthValues===!1,storeMultisampledStencilBuffer:p.ignoreDepthValues===!1})}M.isXRRenderTarget=!0,this.setFoveation(l),c=null,s=await r.requestReferenceSpace(a),Ye.setContext(r),Ye.start(),i.isPresenting=!0,i.dispatchEvent({type:"sessionstart"})}},this.getEnvironmentBlendMode=function(){if(r!==null)return r.environmentBlendMode},this.getDepthTexture=function(){return d.getDepthTexture()};function oe(j){for(let ne=0;ne<j.removed.length;ne++){let Se=j.removed[ne],Ie=b.indexOf(Se);Ie>=0&&(b[Ie]=null,y[Ie].disconnect(Se))}for(let ne=0;ne<j.added.length;ne++){let Se=j.added[ne],Ie=b.indexOf(Se);if(Ie===-1){for(let ze=0;ze<y.length;ze++)if(ze>=b.length){b.push(Se),Ie=ze;break}else if(b[ze]===null){b[ze]=Se,Ie=ze;break}if(Ie===-1)break}let ve=y[Ie];ve&&ve.connect(Se)}}let Q=new P,re=new P;function se(j,ne,Se){Q.setFromMatrixPosition(ne.matrixWorld),re.setFromMatrixPosition(Se.matrixWorld);let Ie=Q.distanceTo(re),ve=ne.projectionMatrix.elements,ze=Se.projectionMatrix.elements,Ke=ve[14]/(ve[10]-1),Ge=ve[14]/(ve[10]+1),We=(ve[9]+1)/ve[5],tt=(ve[9]-1)/ve[5],He=(ve[8]-1)/ve[0],ct=(ze[8]+1)/ze[0],Mt=Ke*He,Ft=Ke*ct,ut=Ie/(-He+ct),at=ut*-He;if(ne.matrixWorld.decompose(j.position,j.quaternion,j.scale),j.translateX(at),j.translateZ(ut),j.matrixWorld.compose(j.position,j.quaternion,j.scale),j.matrixWorldInverse.copy(j.matrixWorld).invert(),ve[10]===-1)j.projectionMatrix.copy(ne.projectionMatrix),j.projectionMatrixInverse.copy(ne.projectionMatrixInverse);else{let B=Ke+ut,Tt=Ge+ut,Je=Mt-at,T=Ft+(Ie-at),g=We*Ge/Tt*B,z=tt*Ge/Tt*B;j.projectionMatrix.makePerspective(Je,T,g,z,B,Tt),j.projectionMatrixInverse.copy(j.projectionMatrix).invert()}}function Pe(j,ne){ne===null?j.matrixWorld.copy(j.matrix):j.matrixWorld.multiplyMatrices(ne.matrixWorld,j.matrix),j.matrixWorldInverse.copy(j.matrixWorld).invert()}this.updateCamera=function(j){if(r===null)return;let ne=j.near,Se=j.far;d.texture!==null&&(d.depthNear>0&&(ne=d.depthNear),d.depthFar>0&&(Se=d.depthFar)),k.near=U.near=D.near=ne,k.far=U.far=D.far=Se,(L!==k.near||H!==k.far)&&(r.updateRenderState({depthNear:k.near,depthFar:k.far}),L=k.near,H=k.far),k.layers.mask=j.layers.mask|6,D.layers.mask=k.layers.mask&-5,U.layers.mask=k.layers.mask&-3;let Ie=j.parent,ve=k.cameras;Pe(k,Ie);for(let ze=0;ze<ve.length;ze++)Pe(ve[ze],Ie);ve.length===2?se(k,D,U):k.projectionMatrix.copy(D.projectionMatrix),E===null&&j.isPerspectiveCamera&&(E={camera:j,fov:j.fov,zoom:j.zoom}),Ce(j,k,Ie)};function Ce(j,ne,Se){Se===null?j.matrix.copy(ne.matrixWorld):(j.matrix.copy(Se.matrixWorld),j.matrix.invert(),j.matrix.multiply(ne.matrixWorld)),j.matrix.decompose(j.position,j.quaternion,j.scale),j.updateMatrixWorld(!0),j.projectionMatrix.copy(ne.projectionMatrix),j.projectionMatrixInverse.copy(ne.projectionMatrixInverse),j.isPerspectiveCamera&&(j.fov=Sn*2*Math.atan(1/j.projectionMatrix.elements[5]),j.zoom=1)}this.getCamera=function(){return k},this.getFoveation=function(){if(!(u===null&&p===null))return l},this.setFoveation=function(j){l=j,u!==null&&(u.fixedFoveation=j),p!==null&&p.fixedFoveation!==void 0&&(p.fixedFoveation=j)},this.hasDepthSensing=function(){return d.texture!==null},this.getDepthSensingMesh=function(){return d.getMesh(k)},this.getCameraTexture=function(j){return h[j]};let ot=null;function Ve(j,ne){if(f=ne.getViewerPose(c||s),_=ne,f!==null){let Se=f.views;p!==null&&(e.setRenderTargetFramebuffer(M,p.framebuffer),e.setRenderTarget(M));let Ie=!1;Se.length!==k.cameras.length&&(k.cameras.length=0,Ie=!0);for(let Ge=0;Ge<Se.length;Ge++){let We=Se[Ge],tt=null;if(p!==null)tt=p.getViewport(We);else{let ct=m.getViewSubImage(u,We);tt=ct.viewport,Ge===0&&(e.setRenderTargetTextures(M,ct.colorTexture,ct.depthStencilTexture),e.setRenderTarget(M))}let He=G[Ge];He===void 0&&(He=new Et,He.layers.enable(Ge),He.viewport=new $e,G[Ge]=He),He.matrix.fromArray(We.transform.matrix),He.matrix.decompose(He.position,He.quaternion,He.scale),He.projectionMatrix.fromArray(We.projectionMatrix),He.projectionMatrixInverse.copy(He.projectionMatrix).invert(),He.viewport.set(tt.x,tt.y,tt.width,tt.height),Ge===0&&(k.matrix.copy(He.matrix),k.matrix.decompose(k.position,k.quaternion,k.scale)),Ie===!0&&k.cameras.push(He)}let ve=r.enabledFeatures;if(ve&&ve.includes("depth-sensing")&&r.depthUsage=="gpu-optimized"&&S){m=i.getBinding();let Ge=m.getDepthInformation(Se[0]);Ge&&Ge.isValid&&Ge.texture&&d.init(Ge,r.renderState)}if(ve&&ve.includes("camera-access")&&S){e.state.unbindTexture(),m=i.getBinding();for(let Ge=0;Ge<Se.length;Ge++){let We=Se[Ge].camera;if(We){let tt=h[We];tt||(tt=new fr,h[We]=tt);let He=m.getCameraImage(We);tt.sourceTexture=He}}}}for(let Se=0;Se<y.length;Se++){let Ie=b[Se],ve=y[Se];Ie!==null&&ve!==void 0&&ve.update(Ie,ne,c||s)}ot&&ot(j,ne),ne.detectedPlanes&&i.dispatchEvent({type:"planesdetected",data:ne}),_=null}let Ye=new Vs;Ye.setAnimationLoop(Ve),this.setAnimationLoop=function(j){ot=j},this.dispose=function(){}}};var Eg=new Oe,sd=new Le;sd.set(-1,0,0,0,1,0,0,0,1);function ad(n,e){function t(d,h){d.matrixAutoUpdate===!0&&d.updateMatrix(),h.value.copy(d.matrix)}function i(d,h){h.color.getRGB(d.fogColor.value,Is(n)),h.isFog?(d.fogNear.value=h.near,d.fogFar.value=h.far):h.isFogExp2&&(d.fogDensity.value=h.density)}function r(d,h,A,I,M){h.isNodeMaterial?h.uniformsNeedUpdate=!1:h.isMeshBasicMaterial?o(d,h):h.isMeshLambertMaterial?(o(d,h),h.envMap&&(d.envMapIntensity.value=h.envMapIntensity)):h.isMeshToonMaterial?(o(d,h),m(d,h)):h.isMeshPhongMaterial?(o(d,h),f(d,h),h.envMap&&(d.envMapIntensity.value=h.envMapIntensity)):h.isMeshStandardMaterial?(o(d,h),u(d,h),h.isMeshPhysicalMaterial&&p(d,h,M)):h.isMeshMatcapMaterial?(o(d,h),_(d,h)):h.isMeshDepthMaterial?o(d,h):h.isMeshDistanceMaterial?(o(d,h),S(d,h)):h.isMeshNormalMaterial?o(d,h):h.isLineBasicMaterial?(s(d,h),h.isLineDashedMaterial&&a(d,h)):h.isPointsMaterial?l(d,h,A,I):h.isSpriteMaterial?c(d,h):h.isShadowMaterial?(d.color.value.copy(h.color),d.opacity.value=h.opacity):h.isShaderMaterial&&(h.uniformsNeedUpdate=!1)}function o(d,h){d.opacity.value=h.opacity,h.color&&d.diffuse.value.copy(h.color),h.emissive&&d.emissive.value.copy(h.emissive).multiplyScalar(h.emissiveIntensity),h.map&&(d.map.value=h.map,t(h.map,d.mapTransform)),h.alphaMap&&(d.alphaMap.value=h.alphaMap,t(h.alphaMap,d.alphaMapTransform)),h.bumpMap&&(d.bumpMap.value=h.bumpMap,t(h.bumpMap,d.bumpMapTransform),d.bumpScale.value=h.bumpScale,h.side===gt&&(d.bumpScale.value*=-1)),h.normalMap&&(d.normalMap.value=h.normalMap,t(h.normalMap,d.normalMapTransform),d.normalScale.value.copy(h.normalScale),h.side===gt&&d.normalScale.value.negate()),h.displacementMap&&(d.displacementMap.value=h.displacementMap,t(h.displacementMap,d.displacementMapTransform),d.displacementScale.value=h.displacementScale,d.displacementBias.value=h.displacementBias),h.emissiveMap&&(d.emissiveMap.value=h.emissiveMap,t(h.emissiveMap,d.emissiveMapTransform)),h.specularMap&&(d.specularMap.value=h.specularMap,t(h.specularMap,d.specularMapTransform)),h.alphaTest>0&&(d.alphaTest.value=h.alphaTest);let A=e.get(h),I=A.envMap,M=A.envMapRotation;I&&(d.envMap.value=I,d.envMapRotation.value.setFromMatrix4(Eg.makeRotationFromEuler(M)).transpose(),I.isCubeTexture&&I.isRenderTargetTexture===!1&&d.envMapRotation.value.premultiply(sd),d.reflectivity.value=h.reflectivity,d.ior.value=h.ior,d.refractionRatio.value=h.refractionRatio),h.lightMap&&(d.lightMap.value=h.lightMap,d.lightMapIntensity.value=h.lightMapIntensity,t(h.lightMap,d.lightMapTransform)),h.aoMap&&(d.aoMap.value=h.aoMap,d.aoMapIntensity.value=h.aoMapIntensity,t(h.aoMap,d.aoMapTransform))}function s(d,h){d.diffuse.value.copy(h.color),d.opacity.value=h.opacity,h.map&&(d.map.value=h.map,t(h.map,d.mapTransform))}function a(d,h){d.dashSize.value=h.dashSize,d.totalSize.value=h.dashSize+h.gapSize,d.scale.value=h.scale}function l(d,h,A,I){d.diffuse.value.copy(h.color),d.opacity.value=h.opacity,d.size.value=h.size*A,d.scale.value=I*.5,h.map&&(d.map.value=h.map,t(h.map,d.uvTransform)),h.alphaMap&&(d.alphaMap.value=h.alphaMap,t(h.alphaMap,d.alphaMapTransform)),h.alphaTest>0&&(d.alphaTest.value=h.alphaTest)}function c(d,h){d.diffuse.value.copy(h.color),d.opacity.value=h.opacity,d.rotation.value=h.rotation,h.map&&(d.map.value=h.map,t(h.map,d.mapTransform)),h.alphaMap&&(d.alphaMap.value=h.alphaMap,t(h.alphaMap,d.alphaMapTransform)),h.alphaTest>0&&(d.alphaTest.value=h.alphaTest)}function f(d,h){d.specular.value.copy(h.specular),d.shininess.value=Math.max(h.shininess,1e-4)}function m(d,h){h.gradientMap&&(d.gradientMap.value=h.gradientMap)}function u(d,h){d.metalness.value=h.metalness,h.metalnessMap&&(d.metalnessMap.value=h.metalnessMap,t(h.metalnessMap,d.metalnessMapTransform)),d.roughness.value=h.roughness,h.roughnessMap&&(d.roughnessMap.value=h.roughnessMap,t(h.roughnessMap,d.roughnessMapTransform)),h.envMap&&(d.envMapIntensity.value=h.envMapIntensity)}function p(d,h,A){d.ior.value=h.ior,h.sheen>0&&(d.sheenColor.value.copy(h.sheenColor).multiplyScalar(h.sheen),d.sheenRoughness.value=h.sheenRoughness,h.sheenColorMap&&(d.sheenColorMap.value=h.sheenColorMap,t(h.sheenColorMap,d.sheenColorMapTransform)),h.sheenRoughnessMap&&(d.sheenRoughnessMap.value=h.sheenRoughnessMap,t(h.sheenRoughnessMap,d.sheenRoughnessMapTransform))),h.clearcoat>0&&(d.clearcoat.value=h.clearcoat,d.clearcoatRoughness.value=h.clearcoatRoughness,h.clearcoatMap&&(d.clearcoatMap.value=h.clearcoatMap,t(h.clearcoatMap,d.clearcoatMapTransform)),h.clearcoatRoughnessMap&&(d.clearcoatRoughnessMap.value=h.clearcoatRoughnessMap,t(h.clearcoatRoughnessMap,d.clearcoatRoughnessMapTransform)),h.clearcoatNormalMap&&(d.clearcoatNormalMap.value=h.clearcoatNormalMap,t(h.clearcoatNormalMap,d.clearcoatNormalMapTransform),d.clearcoatNormalScale.value.copy(h.clearcoatNormalScale),h.side===gt&&d.clearcoatNormalScale.value.negate())),h.dispersion>0&&(d.dispersion.value=h.dispersion),h.retroreflectivity>0&&(d.retroreflectivity.value=h.retroreflectivity),h.iridescence>0&&(d.iridescence.value=h.iridescence,d.iridescenceIOR.value=h.iridescenceIOR,d.iridescenceThicknessMinimum.value=h.iridescenceThicknessRange[0],d.iridescenceThicknessMaximum.value=h.iridescenceThicknessRange[1],h.iridescenceMap&&(d.iridescenceMap.value=h.iridescenceMap,t(h.iridescenceMap,d.iridescenceMapTransform)),h.iridescenceThicknessMap&&(d.iridescenceThicknessMap.value=h.iridescenceThicknessMap,t(h.iridescenceThicknessMap,d.iridescenceThicknessMapTransform))),h.transmission>0&&(d.transmission.value=h.transmission,d.transmissionSamplerMap.value=A.texture,d.transmissionSamplerSize.value.set(A.width,A.height),h.transmissionMap&&(d.transmissionMap.value=h.transmissionMap,t(h.transmissionMap,d.transmissionMapTransform)),d.thickness.value=h.thickness,h.thicknessMap&&(d.thicknessMap.value=h.thicknessMap,t(h.thicknessMap,d.thicknessMapTransform)),d.attenuationDistance.value=h.attenuationDistance,d.attenuationColor.value.copy(h.attenuationColor)),h.anisotropy>0&&(d.anisotropyVector.value.set(h.anisotropy*Math.cos(h.anisotropyRotation),h.anisotropy*Math.sin(h.anisotropyRotation)),h.anisotropyMap&&(d.anisotropyMap.value=h.anisotropyMap,t(h.anisotropyMap,d.anisotropyMapTransform))),d.specularIntensity.value=h.specularIntensity,d.specularColor.value.copy(h.specularColor),h.specularColorMap&&(d.specularColorMap.value=h.specularColorMap,t(h.specularColorMap,d.specularColorMapTransform)),h.specularIntensityMap&&(d.specularIntensityMap.value=h.specularIntensityMap,t(h.specularIntensityMap,d.specularIntensityMapTransform))}function _(d,h){h.matcap&&(d.matcap.value=h.matcap)}function S(d,h){let A=e.get(h).light;d.referencePosition.value.setFromMatrixPosition(A.matrixWorld),d.nearDistance.value=A.shadow.camera.near,d.farDistance.value=A.shadow.camera.far}return{refreshFogUniforms:i,refreshMaterialUniforms:r}}function ld(n,e,t,i){let r={},o={},s=[],a=n.getParameter(n.MAX_UNIFORM_BUFFER_BINDINGS);function l(M,y){let b=y.program;i.uniformBlockBinding(M,b)}function c(M,y){let b=r[M.id];b===void 0&&(d(M),b=f(M),r[M.id]=b,M.addEventListener("dispose",A));let C=y.program;i.updateUBOMapping(M,C);let x=e.render.frame;o[M.id]!==x&&(u(M),o[M.id]=x)}function f(M){let y=m();M.__bindingPointIndex=y;let b=n.createBuffer(),C=M.__size,x=M.usage;return n.bindBuffer(n.UNIFORM_BUFFER,b),n.bufferData(n.UNIFORM_BUFFER,C,x),n.bindBuffer(n.UNIFORM_BUFFER,null),n.bindBufferBase(n.UNIFORM_BUFFER,y,b),b}function m(){for(let M=0;M<a;M++)if(s.indexOf(M)===-1)return s.push(M),M;return Fe("WebGLRenderer: Maximum number of simultaneously usable uniforms groups reached."),0}function u(M){let y=r[M.id],b=M.uniforms,C=M.__cache;n.bindBuffer(n.UNIFORM_BUFFER,y);for(let x=0,E=b.length;x<E;x++){let D=b[x];if(Array.isArray(D))for(let U=0,G=D.length;U<G;U++)p(D[U],x,U,C);else p(D,x,0,C)}n.bindBuffer(n.UNIFORM_BUFFER,null)}function p(M,y,b,C){if(S(M,y,b,C)===!0){let x=M.__offset,E=M.value;if(Array.isArray(E)){let D=0;for(let U=0;U<E.length;U++){let G=E[U],k=h(G);_(G,M.__data,D),typeof G!="number"&&typeof G!="boolean"&&!G.isMatrix3&&!ArrayBuffer.isView(G)&&(D+=k.storage/Float32Array.BYTES_PER_ELEMENT)}}else _(E,M.__data,0);n.bufferSubData(n.UNIFORM_BUFFER,x,M.__data)}}function _(M,y,b){typeof M=="number"||typeof M=="boolean"?y[0]=M:M.isMatrix3?(y[0]=M.elements[0],y[1]=M.elements[1],y[2]=M.elements[2],y[3]=0,y[4]=M.elements[3],y[5]=M.elements[4],y[6]=M.elements[5],y[7]=0,y[8]=M.elements[6],y[9]=M.elements[7],y[10]=M.elements[8],y[11]=0):ArrayBuffer.isView(M)?y.set(new M.constructor(M.buffer,M.byteOffset,y.length)):M.toArray(y,b)}function S(M,y,b,C){let x=M.value,E=y+"_"+b;if(C[E]===void 0)return typeof x=="number"||typeof x=="boolean"?C[E]=x:ArrayBuffer.isView(x)?C[E]=x.slice():C[E]=x.clone(),!0;{let D=C[E];if(typeof x=="number"||typeof x=="boolean"){if(D!==x)return C[E]=x,!0}else{if(ArrayBuffer.isView(x))return!0;if(D.equals(x)===!1)return D.copy(x),!0}}return!1}function d(M){let y=M.uniforms,b=0,C=16;for(let E=0,D=y.length;E<D;E++){let U=Array.isArray(y[E])?y[E]:[y[E]];for(let G=0,k=U.length;G<k;G++){let L=U[G],H=Array.isArray(L.value)?L.value:[L.value];for(let K=0,$=H.length;K<$;K++){let oe=H[K],Q=h(oe),re=b%C,se=re%Q.boundary,Pe=re+se;b+=se,Pe!==0&&C-Pe<Q.storage&&(b+=C-Pe),L.__data=new Float32Array(Q.storage/Float32Array.BYTES_PER_ELEMENT),L.__offset=b,b+=Q.storage}}}let x=b%C;return x>0&&(b+=C-x),M.__size=b,M.__cache={},this}function h(M){let y={boundary:0,storage:0};return typeof M=="number"||typeof M=="boolean"?(y.boundary=4,y.storage=4):M.isVector2?(y.boundary=8,y.storage=8):M.isVector3||M.isColor?(y.boundary=16,y.storage=12):M.isVector4?(y.boundary=16,y.storage=16):M.isMatrix3?(y.boundary=48,y.storage=48):M.isMatrix4?(y.boundary=64,y.storage=64):M.isTexture?xe("WebGLRenderer: Texture samplers can not be part of an uniforms group."):ArrayBuffer.isView(M)?(y.boundary=16,y.storage=M.byteLength):xe("WebGLRenderer: Unsupported uniform value type.",M),y}function A(M){let y=M.target;y.removeEventListener("dispose",A);let b=s.indexOf(y.__bindingPointIndex);s.splice(b,1),n.deleteBuffer(r[y.id]),delete r[y.id],delete o[y.id]}function I(){for(let M in r)n.deleteBuffer(r[M]);s=[],r={},o={}}return{bind:l,update:c,dispose:I}}var Tg=new Uint16Array([12469,15057,12620,14925,13266,14620,13807,14376,14323,13990,14545,13625,14713,13328,14840,12882,14931,12528,14996,12233,15039,11829,15066,11525,15080,11295,15085,10976,15082,10705,15073,10495,13880,14564,13898,14542,13977,14430,14158,14124,14393,13732,14556,13410,14702,12996,14814,12596,14891,12291,14937,11834,14957,11489,14958,11194,14943,10803,14921,10506,14893,10278,14858,9960,14484,14039,14487,14025,14499,13941,14524,13740,14574,13468,14654,13106,14743,12678,14818,12344,14867,11893,14889,11509,14893,11180,14881,10751,14852,10428,14812,10128,14765,9754,14712,9466,14764,13480,14764,13475,14766,13440,14766,13347,14769,13070,14786,12713,14816,12387,14844,11957,14860,11549,14868,11215,14855,10751,14825,10403,14782,10044,14729,9651,14666,9352,14599,9029,14967,12835,14966,12831,14963,12804,14954,12723,14936,12564,14917,12347,14900,11958,14886,11569,14878,11247,14859,10765,14828,10401,14784,10011,14727,9600,14660,9289,14586,8893,14508,8533,15111,12234,15110,12234,15104,12216,15092,12156,15067,12010,15028,11776,14981,11500,14942,11205,14902,10752,14861,10393,14812,9991,14752,9570,14682,9252,14603,8808,14519,8445,14431,8145,15209,11449,15208,11451,15202,11451,15190,11438,15163,11384,15117,11274,15055,10979,14994,10648,14932,10343,14871,9936,14803,9532,14729,9218,14645,8742,14556,8381,14461,8020,14365,7603,15273,10603,15272,10607,15267,10619,15256,10631,15231,10614,15182,10535,15118,10389,15042,10167,14963,9787,14883,9447,14800,9115,14710,8665,14615,8318,14514,7911,14411,7507,14279,7198,15314,9675,15313,9683,15309,9712,15298,9759,15277,9797,15229,9773,15166,9668,15084,9487,14995,9274,14898,8910,14800,8539,14697,8234,14590,7790,14479,7409,14367,7067,14178,6621,15337,8619,15337,8631,15333,8677,15325,8769,15305,8871,15264,8940,15202,8909,15119,8775,15022,8565,14916,8328,14804,8009,14688,7614,14569,7287,14448,6888,14321,6483,14088,6171,15350,7402,15350,7419,15347,7480,15340,7613,15322,7804,15287,7973,15229,8057,15148,8012,15046,7846,14933,7611,14810,7357,14682,7069,14552,6656,14421,6316,14251,5948,14007,5528,15356,5942,15356,5977,15353,6119,15348,6294,15332,6551,15302,6824,15249,7044,15171,7122,15070,7050,14949,6861,14818,6611,14679,6349,14538,6067,14398,5651,14189,5311,13935,4958,15359,4123,15359,4153,15356,4296,15353,4646,15338,5160,15311,5508,15263,5829,15188,6042,15088,6094,14966,6001,14826,5796,14678,5543,14527,5287,14377,4985,14133,4586,13869,4257,15360,1563,15360,1642,15358,2076,15354,2636,15341,3350,15317,4019,15273,4429,15203,4732,15105,4911,14981,4932,14836,4818,14679,4621,14517,4386,14359,4156,14083,3795,13808,3437,15360,122,15360,137,15358,285,15355,636,15344,1274,15322,2177,15281,2765,15215,3223,15120,3451,14995,3569,14846,3567,14681,3466,14511,3305,14344,3121,14037,2800,13753,2467,15360,0,15360,1,15359,21,15355,89,15346,253,15325,479,15287,796,15225,1148,15133,1492,15008,1749,14856,1882,14685,1886,14506,1783,14324,1608,13996,1398,13702,1183]),Di=null;function cd(){return Di===null&&(Di=new Ms(Tg,16,16,ii,Lt),Di.name="DFG_LUT",Di.minFilter=_t,Di.magFilter=_t,Di.wrapS=Jt,Di.wrapT=Jt,Di.generateMipmaps=!1,Di.needsUpdate=!0),Di}var Co=class{constructor(e={}){let{canvas:t=Yl(),context:i=null,depth:r=!0,stencil:o=!1,alpha:s=!1,antialias:a=!1,premultipliedAlpha:l=!0,preserveDrawingBuffer:c=!1,powerPreference:f="default",failIfMajorPerformanceCaveat:m=!1,reversedDepthBuffer:u=!1,outputBufferType:p=vt}=e;this.isWebGLRenderer=!0;let _;if(i!==null){if(typeof WebGLRenderingContext<"u"&&i instanceof WebGLRenderingContext)throw new Error("THREE.WebGLRenderer: WebGL 1 is not supported since r163.");_=i.getContextAttributes().alpha}else _=s;let S=p,d=new Set([kn,zn,Gn]),h=new Set([vt,Pt,Ui,Fi,On,Bn]),A=new Uint32Array(4),I=new Int32Array(4),M=new P,y=null,b=null,C=[],x=[],E=null;this.domElement=t,this.debug={checkShaderErrors:!0,diagnostics:{keywords:!1},onShaderError:null},this.autoClear=!0,this.autoClearColor=!0,this.autoClearDepth=!0,this.autoClearStencil=!0,this.sortObjects=!0,this.clippingPlanes=[],this.localClippingEnabled=!1,this.toneMapping=qt,this.toneMappingExposure=1,this.transmissionResolutionScale=1;let D=this,U=!1,G=null,k=null,L=null,H=null;this._outputColorSpace=Kt;let K=0,$=0,oe=null,Q=-1,re=null,se=new $e,Pe=new $e,Ce=null,ot=new be(0),Ve=0,Ye=t.width,j=t.height,ne=1,Se=null,Ie=null,ve=new $e(0,0,Ye,j),ze=new $e(0,0,Ye,j),Ke=!1,Ge=new an,We=!1,tt=!1,He=new Oe,ct=new P,Mt=new $e,Ft={background:null,fog:null,environment:null,overrideMaterial:null,isScene:!0},ut=!1;function at(){return oe===null?ne:1}let B=i;function Tt(v,O){return t.getContext(v,O)}let Je,T,g,z,X,Z,he,w,R,F,q,ce,ie,ue,fe,ge,De,N,le,ee,J,ae,te;try{let v={alpha:!0,depth:r,stencil:o,antialias:a,premultipliedAlpha:l,preserveDrawingBuffer:c,powerPreference:f,failIfMajorPerformanceCaveat:m};if("setAttribute"in t&&t.setAttribute("data-engine",`three.js r${"186"}`),t.addEventListener("webglcontextlost",Qe,!1),t.addEventListener("webglcontextrestored",je,!1),t.addEventListener("webglcontextcreationerror",pi,!1),B===null){let O="webgl2";if(B=Tt(O,v),B===null)throw Tt(O)?new Error("THREE.WebGLRenderer: Error creating WebGL context with your selected attributes."):new Error("THREE.WebGLRenderer: Error creating WebGL context.")}we()}catch(v){throw t.removeEventListener("webglcontextlost",Qe,!1),t.removeEventListener("webglcontextrestored",je,!1),t.removeEventListener("webglcontextcreationerror",pi,!1),Fe("WebGLRenderer: "+v.message),v}function we(){Je=new Mf(B),Je.init(),J=new od(B,Je),T=new pf(B,Je,e,J),g=new nd(B,Je),T.reversedDepthBuffer&&u&&g.buffers.depth.setReversed(!0),k=B.createFramebuffer(),L=B.createFramebuffer(),H=B.createFramebuffer(),z=new Ef(B),X=new qf,Z=new rd(B,Je,g,X,T,J,z),he=new Sf(D),w=new Rc(B),ae=new ff(B,w),R=new yf(B,w,z,ae),F=new Af(B,R,w,ae,z),N=new Tf(B,T,Z),fe=new mf(X),q=new Xf(D,he,Je,T,ae,fe),ce=new ad(D,X),ie=new Zf,ue=new Qf(Je),De=new hf(D,he,g,F,_,l),ge=new id(D,F,T),te=new ld(B,z,T,g),le=new df(B,Je,z),ee=new bf(B,Je,z),z.programs=q.programs,D.capabilities=T,D.extensions=Je,D.properties=X,D.renderLists=ie,D.shadowMap=ge,D.state=g,D.info=z}S!==vt&&(E=new wf(S,t.width,t.height,a,r,o));let Ee=new Js(D,B);this.xr=Ee,this.getContext=function(){return B},this.getContextAttributes=function(){return B.getContextAttributes()},this.forceContextLoss=function(){let v=Je.get("WEBGL_lose_context");v&&v.loseContext()},this.forceContextRestore=function(){let v=Je.get("WEBGL_lose_context");v&&v.restoreContext()},this.getPixelRatio=function(){return ne},this.setPixelRatio=function(v){v!==void 0&&(ne=v,this.setSize(Ye,j,!1))},this.getSize=function(v){return v.set(Ye,j)},this.setSize=function(v,O,Y=!0){if(Ee.isPresenting){xe("WebGLRenderer: Can't change size while VR device is presenting.");return}Ye=v,j=O,t.width=Math.floor(v*ne),t.height=Math.floor(O*ne),Y===!0&&(t.style.width=v+"px",t.style.height=O+"px"),E!==null&&E.setSize(t.width,t.height),this.setViewport(0,0,v,O)},this.getDrawingBufferSize=function(v){return v.set(Ye*ne,j*ne).floor()},this.setDrawingBufferSize=function(v,O,Y){Ye=v,j=O,ne=Y,t.width=Math.floor(v*Y),t.height=Math.floor(O*Y),this.setViewport(0,0,v,O)},this.setEffects=function(v){if(S===vt){Fe("WebGLRenderer: setEffects() requires outputBufferType set to HalfFloatType or FloatType.");return}if(v){for(let O=0;O<v.length;O++)if(v[O].isOutputPass===!0){xe("WebGLRenderer: OutputPass is not needed in setEffects(). Tone mapping and color space conversion are applied automatically.");break}}E.setEffects(v||[])},this.getCurrentViewport=function(v){return v.copy(se)},this.getViewport=function(v){return v.copy(ve)},this.setViewport=function(v,O,Y,V){v.isVector4?ve.set(v.x,v.y,v.z,v.w):ve.set(v,O,Y,V),g.viewport(se.copy(ve).multiplyScalar(ne).round())},this.getScissor=function(v){return v.copy(ze)},this.setScissor=function(v,O,Y,V){v.isVector4?ze.set(v.x,v.y,v.z,v.w):ze.set(v,O,Y,V),g.scissor(Pe.copy(ze).multiplyScalar(ne).round())},this.getScissorTest=function(){return Ke},this.setScissorTest=function(v){g.setScissorTest(Ke=v)},this.setOpaqueSort=function(v){Se=v},this.setTransparentSort=function(v){Ie=v},this.getClearColor=function(v){return v.copy(De.getClearColor())},this.setClearColor=function(){De.setClearColor(...arguments)},this.getClearAlpha=function(){return De.getClearAlpha()},this.setClearAlpha=function(){De.setClearAlpha(...arguments)},this.clear=function(v=!0,O=!0,Y=!0){let V=0;if(v){let W=!1;if(oe!==null){let me=oe.texture.format;W=d.has(me)}if(W){let me=oe.texture.type,ye=h.has(me),pe=De.getClearColor(),Te=De.getClearAlpha(),Re=pe.r,ke=pe.g,Xe=pe.b;ye?(A[0]=Re,A[1]=ke,A[2]=Xe,A[3]=Te,B.clearBufferuiv(B.COLOR,0,A)):(I[0]=Re,I[1]=ke,I[2]=Xe,I[3]=Te,B.clearBufferiv(B.COLOR,0,I))}else V|=B.COLOR_BUFFER_BIT}O&&(V|=B.DEPTH_BUFFER_BIT,this.state.buffers.depth.setMask(!0)),Y&&(V|=B.STENCIL_BUFFER_BIT,this.state.buffers.stencil.setMask(4294967295)),V!==0&&B.clear(V)},this.clearColor=function(){this.clear(!0,!1,!1)},this.clearDepth=function(){this.clear(!1,!0,!1)},this.clearStencil=function(){this.clear(!1,!1,!0)},this.setNodesHandler=function(v){v.setRenderer(this),G=v},this.dispose=function(){t.removeEventListener("webglcontextlost",Qe,!1),t.removeEventListener("webglcontextrestored",je,!1),t.removeEventListener("webglcontextcreationerror",pi,!1),De.dispose(),ie.dispose(),ue.dispose(),X.dispose(),he.dispose(),F.dispose(),ae.dispose(),te.dispose(),q.dispose(),Ee.dispose(),Ee.removeEventListener("sessionstart",il),Ee.removeEventListener("sessionend",nl),fn.stop()};function Qe(v){v.preventDefault(),ca("WebGLRenderer: Context Lost."),U=!0}function je(){ca("WebGLRenderer: Context Restored."),U=!1;let v=z.autoReset,O=ge.enabled,Y=ge.autoUpdate,V=ge.needsUpdate,W=ge.type;we(),z.autoReset=v,ge.enabled=O,ge.autoUpdate=Y,ge.needsUpdate=V,ge.type=W}function pi(v){Fe("WebGLRenderer: A WebGL context could not be created. Reason: ",v.statusMessage)}function Ai(v){let O=v.target;O.removeEventListener("dispose",Ai),zd(O)}function zd(v){kd(v),X.remove(v)}function kd(v){let O=X.get(v).programs;O!==void 0&&(O.forEach(function(Y){q.releaseProgram(Y)}),v.isShaderMaterial&&q.releaseShaderCache(v))}this.renderBufferDirect=function(v,O,Y,V,W,me){O===null&&(O=Ft);let ye=W.isMesh&&W.matrixWorld.determinantAffine()<0,pe=Wd(v,O,Y,V,W);g.setMaterial(V,ye);let Te=Y.index,Re=1;if(V.wireframe===!0){if(Te=R.getWireframeAttribute(Y),Te===void 0)return;Re=2}let ke=Y.drawRange,Xe=Y.attributes.position,Ae=ke.start*Re,et=(ke.start+ke.count)*Re;me!==null&&(Ae=Math.max(Ae,me.start*Re),et=Math.min(et,(me.start+me.count)*Re)),Te!==null?(Ae=Math.max(Ae,0),et=Math.min(et,Te.count)):Xe!=null&&(Ae=Math.max(Ae,0),et=Math.min(et,Xe.count));let yt=et-Ae;if(yt<0||yt===1/0)return;ae.setup(W,V,pe,Y,Te);let dt,lt=le;if(Te!==null&&(dt=w.get(Te),lt=ee,lt.setIndex(dt)),W.isMesh)V.wireframe===!0?(g.setLineWidth(V.wireframeLinewidth*at()),lt.setMode(B.LINES)):lt.setMode(B.TRIANGLES);else if(W.isLine){let Bt=V.linewidth;Bt===void 0&&(Bt=1),g.setLineWidth(Bt*at()),W.isLineSegments?lt.setMode(B.LINES):W.isLineLoop?lt.setMode(B.LINE_LOOP):lt.setMode(B.LINE_STRIP)}else W.isPoints?lt.setMode(B.POINTS):W.isSprite&&lt.setMode(B.TRIANGLES);if(W.isBatchedMesh)if(Je.get("WEBGL_multi_draw"))lt.renderMultiDraw(W._multiDrawStarts,W._multiDrawCounts,W._multiDrawCount);else{let Bt=W._multiDrawStarts,Me=W._multiDrawCounts,Xt=W._multiDrawCount,Ze=Te?w.get(Te).bytesPerElement:1,ai=X.get(V).currentProgram.getUniforms();for(let wi=0;wi<Xt;wi++)ai.setValue(B,"_gl_DrawID",wi),lt.render(Bt[wi]/Ze,Me[wi])}else if(W.isInstancedMesh)lt.renderInstances(Ae,yt,W.count);else if(Y.isInstancedBufferGeometry){let Bt=Y._maxInstanceCount!==void 0?Y._maxInstanceCount:1/0,Me=Math.min(Y.instanceCount,Bt);lt.renderInstances(Ae,yt,Me)}else lt.render(Ae,yt)};function tl(v,O,Y,V){G!==null&&v.isNodeMaterial&&G.setObject(V,v),We===!0&&fe.setState(v,Y,!1),v.transparent===!0&&v.side===ei&&v.forceSinglePass===!1?(v.side=gt,v.needsUpdate=!0,Io(v,O,V),v.side=li,v.needsUpdate=!0,Io(v,O,V),v.side=ei):Io(v,O,V)}this.compile=function(v,O,Y=null){Y===null&&(Y=v),G!==null&&G.renderStart(v,O,Y),b=ue.get(Y),b.init(O),x.push(b),Y.traverseVisible(function(W){W.isLight&&W.layers.test(O.layers)&&(b.pushLight(W),W.castShadow&&b.pushShadow(W))}),v!==Y&&v.traverseVisible(function(W){W.isLight&&W.layers.test(O.layers)&&(b.pushLight(W),W.castShadow&&b.pushShadow(W))}),b.setupLights(),G!==null&&G.updateLights(b.state.lightsArray),tt=this.localClippingEnabled,We=fe.init(this.clippingPlanes,tt),We===!0&&fe.setGlobalState(this.clippingPlanes,O),G!==null&&ge.render(b.state.shadowsArray,Y,O);let V=new Set;return v.traverse(function(W){if(!(W.isMesh||W.isPoints||W.isLine||W.isSprite))return;let me=W.material;if(me)if(Array.isArray(me))for(let ye=0;ye<me.length;ye++){let pe=me[ye];tl(pe,Y,O,W),V.add(pe)}else tl(me,Y,O,W),V.add(me)}),b=x.pop(),G!==null&&G.renderEnd(),V},this.compileAsync=function(v,O,Y=null){let V=this.compile(v,O,Y);return new Promise(W=>{function me(){if(V.forEach(function(ye){let Te=X.get(ye).currentProgram;(Te===void 0||Te.isReady())&&V.delete(ye)}),V.size===0){W(v);return}setTimeout(me,10)}Je.get("KHR_parallel_shader_compile")!==null?me():setTimeout(me,10)})};let ta=null;function Hd(v){ta&&ta(v)}function il(){fn.stop()}function nl(){fn.start()}let fn=new Vs;fn.setAnimationLoop(Hd),typeof self<"u"&&fn.setContext(self),this.setAnimationLoop=function(v){ta=v,Ee.setAnimationLoop(v),v===null?fn.stop():fn.start()},Ee.addEventListener("sessionstart",il),Ee.addEventListener("sessionend",nl),this.render=function(v,O){if(O!==void 0&&O.isCamera!==!0){Fe("WebGLRenderer.render: camera is not an instance of THREE.Camera.");return}if(U===!0)return;G!==null&&G.renderStart(v,O);let Y=Ee.enabled===!0&&Ee.isPresenting===!0,V=E!==null&&(oe===null||Y)&&E.begin(D,oe);if(v.matrixWorldAutoUpdate===!0&&v.updateMatrixWorld(),O.parent===null&&O.matrixWorldAutoUpdate===!0&&O.updateMatrixWorld(),Ee.enabled===!0&&Ee.isPresenting===!0&&(E===null||E.isCompositing()===!1)&&(Ee.cameraAutoUpdate===!0&&Ee.updateCamera(O),O=Ee.getCamera()),v.isScene===!0&&v.onBeforeRender(D,v,O,oe),b=ue.get(v,x.length),b.init(O),b.state.textureUnits=Z.getTextureUnits(),x.push(b),He.multiplyMatrices(O.projectionMatrix,O.matrixWorldInverse),Ge.setFromProjectionMatrix(He,Zt,O.reversedDepth),tt=this.localClippingEnabled,We=fe.init(this.clippingPlanes,tt),y=ie.get(v,C.length),y.init(),C.push(y),Ee.enabled===!0&&Ee.isPresenting===!0){let ye=D.xr.getDepthSensingMesh();ye!==null&&ia(ye,O,-1/0,D.sortObjects)}ia(v,O,0,D.sortObjects),y.finish(),G!==null&&G.updateLights(b.state.lightsArray),D.sortObjects===!0&&y.sort(Se,Ie),ut=Ee.enabled===!1||Ee.isPresenting===!1||Ee.hasDepthSensing()===!1,ut&&De.addToRenderList(y,v),this.info.render.frame++,this.info.autoReset===!0&&this.info.reset(),We===!0&&fe.beginShadows();let W=b.state.shadowsArray;if(ge.render(W,v,O),We===!0&&fe.endShadows(),(V&&E.hasRenderPass())===!1){let ye=y.opaque,pe=y.transmissive;if(b.setupLights(),O.isArrayCamera){let Te=O.cameras;if(pe.length>0)for(let Re=0,ke=Te.length;Re<ke;Re++){let Xe=Te[Re];ol(ye,pe,v,Xe)}ut&&De.render(v);for(let Re=0,ke=Te.length;Re<ke;Re++){let Xe=Te[Re];rl(y,v,Xe,Xe.viewport)}}else pe.length>0&&ol(ye,pe,v,O),ut&&De.render(v),rl(y,v,O)}oe!==null&&$===0&&(Z.updateMultisampleRenderTarget(oe),Z.updateRenderTargetMipmap(oe)),V&&E.end(D),v.isScene===!0&&v.onAfterRender(D,v,O),ae.resetDefaultState(),Q=-1,re=null,x.pop(),x.length>0?(b=x[x.length-1],Z.setTextureUnits(b.state.textureUnits),We===!0&&fe.setGlobalState(D.clippingPlanes,b.state.camera)):b=null,C.pop(),C.length>0?y=C[C.length-1]:y=null,G!==null&&G.renderEnd()};function ia(v,O,Y,V){if(v.visible===!1)return;if(v.layers.test(O.layers)){if(v.isGroup)Y=v.renderOrder;else if(v.isLOD)v.autoUpdate===!0&&v.update(O);else if(v.isLightProbeGrid)b.pushLightProbeGrid(v);else if(v.isLight)b.pushLight(v),v.castShadow&&b.pushShadow(v);else if(v.isSprite){if(!v.frustumCulled||v.intersectsFrustum(Ge)){V&&Mt.setFromMatrixPosition(v.matrixWorld).applyMatrix4(He);let ye=F.update(v),pe=v.material;pe.visible&&y.push(v,ye,pe,Y,Mt.z,null,O)}}else if((v.isMesh||v.isLine||v.isPoints)&&(!v.frustumCulled||v.intersectsFrustum(Ge))){let ye=F.update(v),pe=v.material;if(V&&(v.boundingSphere!==void 0?(v.boundingSphere===null&&v.computeBoundingSphere(),Mt.copy(v.boundingSphere.center)):(ye.boundingSphere===null&&ye.computeBoundingSphere(),Mt.copy(ye.boundingSphere.center)),Mt.applyMatrix4(v.matrixWorld).applyMatrix4(He)),Array.isArray(pe)){let Te=ye.groups;for(let Re=0,ke=Te.length;Re<ke;Re++){let Xe=Te[Re],Ae=pe[Xe.materialIndex];Ae&&Ae.visible&&y.push(v,ye,Ae,Y,Mt.z,Xe,O)}}else pe.visible&&y.push(v,ye,pe,Y,Mt.z,null,O)}}let me=v.children;for(let ye=0,pe=me.length;ye<pe;ye++)ia(me[ye],O,Y,V)}function rl(v,O,Y,V){let{opaque:W,transmissive:me,transparent:ye}=v;b.setupLightsView(Y),We===!0&&fe.setGlobalState(D.clippingPlanes,Y),V&&g.viewport(se.copy(V)),W.length>0&&Do(W,O,Y),me.length>0&&Do(me,O,Y),ye.length>0&&Do(ye,O,Y),g.buffers.depth.setTest(!0),g.buffers.depth.setMask(!0),g.buffers.color.setMask(!0),g.setPolygonOffset(!1)}function ol(v,O,Y,V){if((Y.isScene===!0?Y.overrideMaterial:null)!==null)return;if(b.state.transmissionRenderTarget[V.id]===void 0){let Ae=Je.has("EXT_color_buffer_half_float")||Je.has("EXT_color_buffer_float");b.state.transmissionRenderTarget[V.id]=new At(1,1,{generateMipmaps:!0,type:Ae?Lt:vt,minFilter:mi,samples:Math.max(4,T.samples),stencilBuffer:o,resolveDepthBuffer:!1,resolveStencilBuffer:!1,storeMultisampledDepthBuffer:!1,storeMultisampledStencilBuffer:!1,colorSpace:Ue.workingColorSpace})}let me=b.state.transmissionRenderTarget[V.id],ye=V.viewport||se;me.setSize(ye.z*D.transmissionResolutionScale,ye.w*D.transmissionResolutionScale);let pe=D.getRenderTarget(),Te=D.getActiveCubeFace(),Re=D.getActiveMipmapLevel();D.setRenderTarget(me),D.getClearColor(ot),Ve=D.getClearAlpha(),Ve<1&&D.setClearColor(16777215,.5),D.clear(),ut&&De.render(Y);let ke=D.toneMapping;D.toneMapping=qt;let Xe=V.viewport;if(V.viewport!==void 0&&(V.viewport=void 0),b.setupLightsView(V),We===!0&&fe.setGlobalState(D.clippingPlanes,V),Do(v,Y,V),Z.updateMultisampleRenderTarget(me),Z.updateRenderTargetMipmap(me),Je.has("WEBGL_multisampled_render_to_texture")===!1){let Ae=!1;for(let et=0,yt=O.length;et<yt;et++){let dt=O[et],{object:lt,geometry:Bt,material:Me,group:Xt}=dt;if(Me.side===ei&&lt.layers.test(V.layers)){let Ze=Me.side;Me.side=gt,Me.needsUpdate=!0,sl(lt,Y,V,Bt,Me,Xt),Me.side=Ze,Me.needsUpdate=!0,Ae=!0}}Ae===!0&&(Z.updateMultisampleRenderTarget(me),Z.updateRenderTargetMipmap(me))}D.setRenderTarget(pe,Te,Re),D.setClearColor(ot,Ve),Xe!==void 0&&(V.viewport=Xe),D.toneMapping=ke}function Do(v,O,Y){let V=O.isScene===!0?O.overrideMaterial:null;for(let W=0,me=v.length;W<me;W++){let ye=v[W],{object:pe,geometry:Te,group:Re}=ye,ke=ye.material;ke.allowOverride===!0&&V!==null&&(ke=V),pe.layers.test(Y.layers)&&sl(pe,O,Y,Te,ke,Re)}}function sl(v,O,Y,V,W,me){G!==null&&W.isNodeMaterial&&G.setObject(v,W),v.onBeforeRender(D,O,Y,V,W,me),v.modelViewMatrix.multiplyMatrices(Y.matrixWorldInverse,v.matrixWorld),v.normalMatrix.getNormalMatrix(v.modelViewMatrix),W.onBeforeRender(D,O,Y,V,v,me),W.transparent===!0&&W.side===ei&&W.forceSinglePass===!1?(W.side=gt,W.needsUpdate=!0,D.renderBufferDirect(Y,O,V,W,v,me),W.side=li,W.needsUpdate=!0,D.renderBufferDirect(Y,O,V,W,v,me),W.side=ei):D.renderBufferDirect(Y,O,V,W,v,me),v.onAfterRender(D,O,Y,V,W,me)}function Io(v,O,Y){O.isScene!==!0&&(O=Ft);let V=X.get(v),W=b.state.lights,me=b.state.shadowsArray,ye=W.state.version,pe=q.getParameters(v,W.state,me,O,Y,b.state.lightProbeGridArray),Te=q.getProgramCacheKey(pe),Re=V.programs;V.environment=v.isMeshStandardMaterial||v.isMeshLambertMaterial||v.isMeshPhongMaterial?O.environment:null,V.fog=O.fog;let ke=v.isMeshStandardMaterial||v.isMeshLambertMaterial&&!v.envMap||v.isMeshPhongMaterial&&!v.envMap;V.envMap=he.get(v.envMap||V.environment,ke),V.envMapRotation=V.environment!==null&&v.envMap===null?O.environmentRotation:v.envMapRotation,Re===void 0&&(v.addEventListener("dispose",Ai),Re=new Map,V.programs=Re);let Xe=Re.get(Te);if(Xe!==void 0){if(V.currentProgram===Xe&&V.lightsStateVersion===ye)return ll(v,pe),Xe}else pe.uniforms=q.getUniforms(v),G!==null&&v.isNodeMaterial&&G.build(v,Y,pe),v.onBeforeCompile(pe,D),Xe=q.acquireProgram(pe,Te),Re.set(Te,Xe),V.uniforms=pe.uniforms;let Ae=V.uniforms;return(!v.isShaderMaterial&&!v.isRawShaderMaterial||v.clipping===!0)&&(Ae.clippingPlanes=fe.uniform),ll(v,pe),V.needsLights=qd(v),V.lightsStateVersion=ye,V.needsLights&&(Ae.ambientLightColor.value=W.state.ambient,Ae.lightProbe.value=W.state.probe,Ae.sunLights.value=W.state.sun,Ae.sunLightShadows.value=W.state.sunShadow,Ae.directionalLights.value=W.state.directional,Ae.directionalLightShadows.value=W.state.directionalShadow,Ae.spotLights.value=W.state.spot,Ae.spotLightShadows.value=W.state.spotShadow,Ae.rectAreaLights.value=W.state.rectArea,Ae.ltc_1.value=W.state.rectAreaLTC1,Ae.ltc_2.value=W.state.rectAreaLTC2,Ae.pointLights.value=W.state.point,Ae.pointLightShadows.value=W.state.pointShadow,Ae.hemisphereLights.value=W.state.hemi,Ae.sunShadowMatrix.value=W.state.sunShadowMatrix,Ae.sunShadowCascade.value=W.state.sunShadowCascade,Ae.directionalShadowMatrix.value=W.state.directionalShadowMatrix,Ae.spotLightMatrix.value=W.state.spotLightMatrix,Ae.spotLightMap.value=W.state.spotLightMap,Ae.pointShadowMatrix.value=W.state.pointShadowMatrix),V.lightProbeGrid=b.state.lightProbeGridArray.length>0,V.currentProgram=Xe,V.uniformsList=null,Xe}function al(v){if(v.uniformsList===null){let O=v.currentProgram.getUniforms();v.uniformsList=un.seqWithValue(O.seq,v.uniforms)}return v.uniformsList}function ll(v,O){let Y=X.get(v);Y.outputColorSpace=O.outputColorSpace,Y.batching=O.batching,Y.batchingColor=O.batchingColor,Y.instancing=O.instancing,Y.instancingColor=O.instancingColor,Y.instancingMorph=O.instancingMorph,Y.skinning=O.skinning,Y.morphTargets=O.morphTargets,Y.morphNormals=O.morphNormals,Y.morphColors=O.morphColors,Y.morphTargetsCount=O.morphTargetsCount,Y.numClippingPlanes=O.numClippingPlanes,Y.numIntersection=O.numClipIntersection,Y.vertexAlphas=O.vertexAlphas,Y.vertexTangents=O.vertexTangents,Y.toneMapping=O.toneMapping}function Vd(v,O){if(v.length===0)return null;if(v.length===1)return v[0].texture!==null?v[0]:null;M.setFromMatrixPosition(O.matrixWorld);for(let Y=0,V=v.length;Y<V;Y++){let W=v[Y];if(W.texture!==null&&W.boundingBox.containsPoint(M))return W}return null}function Wd(v,O,Y,V,W){O.isScene!==!0&&(O=Ft),Z.resetTextureUnits();let me=O.fog,ye=V.isMeshStandardMaterial||V.isMeshLambertMaterial||V.isMeshPhongMaterial?O.environment:null,pe=oe===null?D.outputColorSpace:oe.isXRRenderTarget===!0?oe.texture.colorSpace:Ue.workingColorSpace,Te=V.isMeshStandardMaterial||V.isMeshLambertMaterial&&!V.envMap||V.isMeshPhongMaterial&&!V.envMap,Re=he.get(V.envMap||ye,Te),ke=V.vertexColors===!0&&!!Y.attributes.color&&Y.attributes.color.itemSize===4,Xe=!!Y.attributes.tangent&&(!!V.normalMap||V.anisotropy>0),Ae=!!Y.morphAttributes.position,et=!!Y.morphAttributes.normal,yt=!!Y.morphAttributes.color,dt=qt;V.toneMapped&&(oe===null||oe.isXRRenderTarget===!0)&&(dt=D.toneMapping);let lt=Y.morphAttributes.position||Y.morphAttributes.normal||Y.morphAttributes.color,Bt=lt!==void 0?lt.length:0,Me=X.get(V),Xt=b.state.lights;if(We===!0&&(tt===!0||v!==re)){let ht=v===re&&V.id===Q;fe.setState(V,v,ht)}let Ze=!1;V.version===Me.__version?(Me.needsLights&&Me.lightsStateVersion!==Xt.state.version||Me.outputColorSpace!==pe||W.isBatchedMesh&&Me.batching===!1||!W.isBatchedMesh&&Me.batching===!0||W.isBatchedMesh&&Me.batchingColor===!0&&W._colorsTexture===null||W.isBatchedMesh&&Me.batchingColor===!1&&W._colorsTexture!==null||W.isInstancedMesh&&Me.instancing===!1||!W.isInstancedMesh&&Me.instancing===!0||W.isSkinnedMesh&&Me.skinning===!1||!W.isSkinnedMesh&&Me.skinning===!0||W.isInstancedMesh&&Me.instancingColor===!0&&W.instanceColor===null||W.isInstancedMesh&&Me.instancingColor===!1&&W.instanceColor!==null||W.isInstancedMesh&&Me.instancingMorph===!0&&W.morphTexture===null||W.isInstancedMesh&&Me.instancingMorph===!1&&W.morphTexture!==null||Me.envMap!==Re||V.fog===!0&&Me.fog!==me||Me.numClippingPlanes!==void 0&&(Me.numClippingPlanes!==fe.numPlanes||Me.numIntersection!==fe.numIntersection)||Me.vertexAlphas!==ke||Me.vertexTangents!==Xe||Me.morphTargets!==Ae||Me.morphNormals!==et||Me.morphColors!==yt||Me.toneMapping!==dt||Me.morphTargetsCount!==Bt||!!Me.lightProbeGrid!=b.state.lightProbeGridArray.length>0)&&(Ze=!0):(Ze=!0,Me.__version=V.version);let ai=Me.currentProgram;Ze===!0&&(ai=Io(V,O,W),G&&V.isNodeMaterial&&G.onUpdateProgram(V,ai,Me));let wi=!1,qi=!1,In=!1,st=ai.getUniforms(),xt=Me.uniforms;if(g.useProgram(ai.program)&&(wi=!0,qi=!0,In=!0),V.id!==Q&&(Q=V.id,qi=!0),Me.needsLights){let ht=Vd(b.state.lightProbeGridArray,W);Me.lightProbeGrid!==ht&&(Me.lightProbeGrid=ht,qi=!0)}if(wi||re!==v){g.buffers.depth.getReversed()&&v.reversedDepth!==!0&&(v._reversedDepth=!0,v.updateProjectionMatrix()),st.setValue(B,"projectionMatrix",v.projectionMatrix),st.setValue(B,"viewMatrix",v.matrixWorldInverse);let Ki=st.map.cameraPosition;Ki!==void 0&&Ki.setValue(B,ct.setFromMatrixPosition(v.matrixWorld)),T.logarithmicDepthBuffer&&st.setValue(B,"logDepthBufFC",2/(Math.log(v.far+1)/Math.LN2)),(V.isMeshPhongMaterial||V.isMeshToonMaterial||V.isMeshLambertMaterial||V.isMeshBasicMaterial||V.isMeshStandardMaterial||V.isShaderMaterial)&&st.setValue(B,"isOrthographic",v.isOrthographicCamera===!0),re!==v&&(re=v,qi=!0,In=!0)}if(Me.needsLights&&(Xt.state.sunShadowMap.length>0&&st.setValue(B,"sunShadowMap",Xt.state.sunShadowMap,Z),Xt.state.directionalShadowMap.length>0&&st.setValue(B,"directionalShadowMap",Xt.state.directionalShadowMap,Z),Xt.state.spotShadowMap.length>0&&st.setValue(B,"spotShadowMap",Xt.state.spotShadowMap,Z),Xt.state.pointShadowMap.length>0&&st.setValue(B,"pointShadowMap",Xt.state.pointShadowMap,Z)),W.isSkinnedMesh){st.setOptional(B,W,"bindMatrix"),st.setOptional(B,W,"bindMatrixInverse");let ht=W.skeleton;ht&&(ht.boneTexture===null&&ht.computeBoneTexture(),st.setValue(B,"boneTexture",ht.boneTexture,Z))}W.isBatchedMesh&&(st.setOptional(B,W,"batchingTexture"),st.setValue(B,"batchingTexture",W._matricesTexture,Z),st.setOptional(B,W,"batchingIdTexture"),st.setValue(B,"batchingIdTexture",W._indirectTexture,Z),st.setOptional(B,W,"batchingColorTexture"),W._colorsTexture!==null&&st.setValue(B,"batchingColorTexture",W._colorsTexture,Z));let Yi=Y.morphAttributes;if((Yi.position!==void 0||Yi.normal!==void 0||Yi.color!==void 0)&&N.update(W,Y,ai),(qi||Me.receiveShadow!==W.receiveShadow)&&(Me.receiveShadow=W.receiveShadow,st.setValue(B,"receiveShadow",W.receiveShadow)),(V.isMeshStandardMaterial||V.isMeshLambertMaterial||V.isMeshPhongMaterial)&&V.envMap===null&&O.environment!==null&&(xt.envMapIntensity.value=O.environmentIntensity),xt.dfgLUT!==void 0&&(xt.dfgLUT.value=cd()),qi){if(st.setValue(B,"toneMappingExposure",D.toneMappingExposure),Me.needsLights&&Xd(xt,In),me&&V.fog===!0&&ce.refreshFogUniforms(xt,me),ce.refreshMaterialUniforms(xt,V,ne,j,b.state.transmissionRenderTarget[v.id]),Me.needsLights&&Me.lightProbeGrid){let ht=Me.lightProbeGrid;xt.probesSH.value=ht.texture,xt.probesMin.value.copy(ht.boundingBox.min),xt.probesMax.value.copy(ht.boundingBox.max),xt.probesResolution.value.copy(ht.resolution)}un.upload(B,al(Me),xt,Z)}if(V.isShaderMaterial&&V.uniformsNeedUpdate===!0&&(un.upload(B,al(Me),xt,Z),V.uniformsNeedUpdate=!1),V.isSpriteMaterial&&st.setValue(B,"center",W.center),st.setValue(B,"modelViewMatrix",W.modelViewMatrix),st.setValue(B,"normalMatrix",W.normalMatrix),st.setValue(B,"modelMatrix",W.matrixWorld),V.uniformsGroups!==void 0){let ht=V.uniformsGroups;for(let Ki=0,Nn=ht.length;Ki<Nn;Ki++){let ul=ht[Ki];te.update(ul,ai),te.bind(ul,ai)}}return ai}function Xd(v,O){v.ambientLightColor.needsUpdate=O,v.lightProbe.needsUpdate=O,v.sunLights.needsUpdate=O,v.sunLightShadows.needsUpdate=O,v.directionalLights.needsUpdate=O,v.directionalLightShadows.needsUpdate=O,v.pointLights.needsUpdate=O,v.pointLightShadows.needsUpdate=O,v.spotLights.needsUpdate=O,v.spotLightShadows.needsUpdate=O,v.rectAreaLights.needsUpdate=O,v.hemisphereLights.needsUpdate=O}function qd(v){return v.isMeshLambertMaterial||v.isMeshToonMaterial||v.isMeshPhongMaterial||v.isMeshStandardMaterial||v.isShadowMaterial||v.isShaderMaterial&&v.lights===!0}this.getActiveCubeFace=function(){return K},this.getActiveMipmapLevel=function(){return $},this.getRenderTarget=function(){return oe},this.setRenderTargetTextures=function(v,O,Y){let V=X.get(v);V.__autoAllocateDepthBuffer=v.resolveDepthBuffer===!1,V.__autoAllocateDepthBuffer===!1&&(V.__useRenderToTexture=!1),X.get(v.texture).__webglTexture=O,X.get(v.depthTexture).__webglTexture=V.__autoAllocateDepthBuffer?void 0:Y,V.__hasExternalTextures=!0},this.setRenderTargetFramebuffer=function(v,O){let Y=X.get(v);Y.__webglFramebuffer=O,Y.__useDefaultFramebuffer=O===void 0},this.setRenderTarget=function(v,O=0,Y=0){oe=v,K=O,$=Y;let V=null,W=!1,me=!1;if(v){let pe=X.get(v);if(pe.__useDefaultFramebuffer!==void 0){g.bindFramebuffer(B.FRAMEBUFFER,pe.__webglFramebuffer),se.copy(v.viewport),Pe.copy(v.scissor),Ce=v.scissorTest,g.viewport(se),g.scissor(Pe),g.setScissorTest(Ce),Q=-1;return}else if(pe.__webglFramebuffer===void 0)Z.setupRenderTarget(v);else if(pe.__hasExternalTextures)Z.rebindTextures(v,X.get(v.texture).__webglTexture,X.get(v.depthTexture).__webglTexture);else if(v.depthBuffer){let ke=v.depthTexture;if(pe.__boundDepthTexture!==ke){if(ke!==null&&X.has(ke)&&(v.width!==ke.image.width||v.height!==ke.image.height))throw new Error("THREE.WebGLRenderer: Attached DepthTexture is initialized to the incorrect size.");Z.setupDepthRenderbuffer(v)}}let Te=v.texture;(Te.isData3DTexture||Te.isDataArrayTexture||Te.isCompressedArrayTexture)&&(me=!0);let Re=X.get(v).__webglFramebuffer;v.isWebGLCubeRenderTarget?(Array.isArray(Re[O])?V=Re[O][Y]:V=Re[O],W=!0):v.samples>0&&Z.useMultisampledRTT(v)===!1?V=X.get(v).__webglMultisampledFramebuffer:Array.isArray(Re)?V=Re[Y]:V=Re,se.copy(v.viewport),Pe.copy(v.scissor),Ce=v.scissorTest}else se.copy(ve).multiplyScalar(ne).floor(),Pe.copy(ze).multiplyScalar(ne).floor(),Ce=Ke;if(Y!==0&&(V=k),g.bindFramebuffer(B.FRAMEBUFFER,V)&&g.drawBuffers(v,V),g.viewport(se),g.scissor(Pe),g.setScissorTest(Ce),W){let pe=X.get(v.texture);B.framebufferTexture2D(B.FRAMEBUFFER,B.COLOR_ATTACHMENT0,B.TEXTURE_CUBE_MAP_POSITIVE_X+O,pe.__webglTexture,Y)}else if(me){let pe=O;for(let Te=0;Te<v.textures.length;Te++){let Re=X.get(v.textures[Te]);B.framebufferTextureLayer(B.FRAMEBUFFER,B.COLOR_ATTACHMENT0+Te,Re.__webglTexture,Y,pe)}}else if(v!==null&&Y!==0){let pe=X.get(v.texture);B.framebufferTexture2D(B.FRAMEBUFFER,B.COLOR_ATTACHMENT0,B.TEXTURE_2D,pe.__webglTexture,Y)}Q=-1};function cl(v){let O=X.get(v);return(O.__readFormat!==v.format||O.__readType!==v.type)&&(O.__readFormat=v.format,O.__readType=v.type,O.__formatReadable=T.textureFormatReadable(v.format),O.__typeReadable=T.textureTypeReadable(v.type)),O}this.readRenderTargetPixels=function(v,O,Y,V,W,me,ye,pe=0){if(!(v&&v.isWebGLRenderTarget)){Fe("WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");return}let Te=X.get(v).__webglFramebuffer;if(v.isWebGLCubeRenderTarget&&ye!==void 0&&(Te=Te[ye]),Te){g.bindFramebuffer(B.FRAMEBUFFER,Te);try{let Re=v.textures[pe],ke=Re.format,Xe=Re.type;v.textures.length>1&&B.readBuffer(B.COLOR_ATTACHMENT0+pe);let Ae=cl(Re);if(Ae.__formatReadable===!1){Fe("WebGLRenderer.readRenderTargetPixels: renderTarget is not in RGBA or implementation defined format.");return}if(Ae.__typeReadable===!1){Fe("WebGLRenderer.readRenderTargetPixels: renderTarget is not in UnsignedByteType or implementation defined type.");return}O>=0&&O<=v.width-V&&Y>=0&&Y<=v.height-W&&B.readPixels(O,Y,V,W,J.convert(ke),J.convert(Xe),me)}finally{let Re=oe!==null?X.get(oe).__webglFramebuffer:null;g.bindFramebuffer(B.FRAMEBUFFER,Re)}}},this.readRenderTargetPixelsAsync=async function(v,O,Y,V,W,me,ye,pe=0){if(!(v&&v.isWebGLRenderTarget))throw new Error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");let Te=X.get(v).__webglFramebuffer;if(v.isWebGLCubeRenderTarget&&ye!==void 0&&(Te=Te[ye]),Te)if(O>=0&&O<=v.width-V&&Y>=0&&Y<=v.height-W){g.bindFramebuffer(B.FRAMEBUFFER,Te);let Re=v.textures[pe],ke=Re.format,Xe=Re.type;v.textures.length>1&&B.readBuffer(B.COLOR_ATTACHMENT0+pe);let Ae=cl(Re);if(Ae.__formatReadable===!1)throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in RGBA or implementation defined format.");if(Ae.__typeReadable===!1)throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in UnsignedByteType or implementation defined type.");let et=B.createBuffer();B.bindBuffer(B.PIXEL_PACK_BUFFER,et),B.bufferData(B.PIXEL_PACK_BUFFER,me.byteLength,B.STREAM_READ),B.readPixels(O,Y,V,W,J.convert(ke),J.convert(Xe),0),B.bindBuffer(B.PIXEL_PACK_BUFFER,null);let yt=oe!==null?X.get(oe).__webglFramebuffer:null;g.bindFramebuffer(B.FRAMEBUFFER,yt);let dt=B.fenceSync(B.SYNC_GPU_COMMANDS_COMPLETE,0);return B.flush(),await Zl(B,dt,4),B.bindBuffer(B.PIXEL_PACK_BUFFER,et),B.getBufferSubData(B.PIXEL_PACK_BUFFER,0,me),B.bindBuffer(B.PIXEL_PACK_BUFFER,null),B.deleteBuffer(et),B.deleteSync(dt),me}else throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: requested read bounds are out of range.")},this.copyFramebufferToTexture=function(v,O=null,Y=0){let V=Math.pow(2,-Y),W=Math.floor(v.image.width*V),me=Math.floor(v.image.height*V),ye=O!==null?O.x:0,pe=O!==null?O.y:0;Z.setTexture2D(v,0),B.copyTexSubImage2D(B.TEXTURE_2D,Y,0,0,ye,pe,W,me),g.unbindTexture()},this.copyTextureToTexture=function(v,O,Y=null,V=null,W=0,me=0){let ye,pe,Te,Re,ke,Xe,Ae,et,yt,dt=v.isCompressedTexture?v.mipmaps[me]:v.image;if(Y!==null)ye=Y.max.x-Y.min.x,pe=Y.max.y-Y.min.y,Te=Y.isBox3?Y.max.z-Y.min.z:1,Re=Y.min.x,ke=Y.min.y,Xe=Y.isBox3?Y.min.z:0;else{let xt=Math.pow(2,-W);ye=Math.floor(dt.width*xt),pe=Math.floor(dt.height*xt),v.isDataArrayTexture?Te=dt.depth:v.isData3DTexture?Te=Math.floor(dt.depth*xt):Te=1,Re=0,ke=0,Xe=0}V!==null?(Ae=V.x,et=V.y,yt=V.z):(Ae=0,et=0,yt=0);let lt=J.convert(O.format),Bt=J.convert(O.type),Me;O.isData3DTexture?(Z.setTexture3D(O,0),Me=B.TEXTURE_3D):O.isDataArrayTexture||O.isCompressedArrayTexture?(Z.setTexture2DArray(O,0),Me=B.TEXTURE_2D_ARRAY):(Z.setTexture2D(O,0),Me=B.TEXTURE_2D),g.activeTexture(B.TEXTURE0),g.pixelStorei(B.UNPACK_FLIP_Y_WEBGL,O.flipY),g.pixelStorei(B.UNPACK_PREMULTIPLY_ALPHA_WEBGL,O.premultiplyAlpha),g.pixelStorei(B.UNPACK_ALIGNMENT,O.unpackAlignment);let Xt=g.getParameter(B.UNPACK_ROW_LENGTH),Ze=g.getParameter(B.UNPACK_IMAGE_HEIGHT),ai=g.getParameter(B.UNPACK_SKIP_PIXELS),wi=g.getParameter(B.UNPACK_SKIP_ROWS),qi=g.getParameter(B.UNPACK_SKIP_IMAGES);g.pixelStorei(B.UNPACK_ROW_LENGTH,dt.width),g.pixelStorei(B.UNPACK_IMAGE_HEIGHT,dt.height),g.pixelStorei(B.UNPACK_SKIP_PIXELS,Re),g.pixelStorei(B.UNPACK_SKIP_ROWS,ke),g.pixelStorei(B.UNPACK_SKIP_IMAGES,Xe);let In=v.isDataArrayTexture||v.isData3DTexture,st=O.isDataArrayTexture||O.isData3DTexture;if(v.isDepthTexture){let xt=X.get(v),Yi=X.get(O),ht=X.get(xt.__renderTarget),Ki=X.get(Yi.__renderTarget);g.bindFramebuffer(B.READ_FRAMEBUFFER,ht.__webglFramebuffer),g.bindFramebuffer(B.DRAW_FRAMEBUFFER,Ki.__webglFramebuffer);for(let Nn=0;Nn<Te;Nn++)In&&(B.framebufferTextureLayer(B.READ_FRAMEBUFFER,B.COLOR_ATTACHMENT0,X.get(v).__webglTexture,W,Xe+Nn),B.framebufferTextureLayer(B.DRAW_FRAMEBUFFER,B.COLOR_ATTACHMENT0,X.get(O).__webglTexture,me,yt+Nn)),B.blitFramebuffer(Re,ke,ye,pe,Ae,et,ye,pe,B.DEPTH_BUFFER_BIT,B.NEAREST);g.bindFramebuffer(B.READ_FRAMEBUFFER,null),g.bindFramebuffer(B.DRAW_FRAMEBUFFER,null)}else if(W!==0||v.isRenderTargetTexture||X.has(v)){let xt=X.get(v),Yi=X.get(O);g.bindFramebuffer(B.READ_FRAMEBUFFER,L),g.bindFramebuffer(B.DRAW_FRAMEBUFFER,H);for(let ht=0;ht<Te;ht++)In?B.framebufferTextureLayer(B.READ_FRAMEBUFFER,B.COLOR_ATTACHMENT0,xt.__webglTexture,W,Xe+ht):B.framebufferTexture2D(B.READ_FRAMEBUFFER,B.COLOR_ATTACHMENT0,B.TEXTURE_2D,xt.__webglTexture,W),st?B.framebufferTextureLayer(B.DRAW_FRAMEBUFFER,B.COLOR_ATTACHMENT0,Yi.__webglTexture,me,yt+ht):B.framebufferTexture2D(B.DRAW_FRAMEBUFFER,B.COLOR_ATTACHMENT0,B.TEXTURE_2D,Yi.__webglTexture,me),W!==0?B.blitFramebuffer(Re,ke,ye,pe,Ae,et,ye,pe,B.COLOR_BUFFER_BIT,B.NEAREST):st?B.copyTexSubImage3D(Me,me,Ae,et,yt+ht,Re,ke,ye,pe):B.copyTexSubImage2D(Me,me,Ae,et,Re,ke,ye,pe);g.bindFramebuffer(B.READ_FRAMEBUFFER,null),g.bindFramebuffer(B.DRAW_FRAMEBUFFER,null)}else st?v.isDataTexture||v.isData3DTexture?B.texSubImage3D(Me,me,Ae,et,yt,ye,pe,Te,lt,Bt,dt.data):O.isCompressedArrayTexture?B.compressedTexSubImage3D(Me,me,Ae,et,yt,ye,pe,Te,lt,dt.data):B.texSubImage3D(Me,me,Ae,et,yt,ye,pe,Te,lt,Bt,dt):v.isDataTexture?B.texSubImage2D(B.TEXTURE_2D,me,Ae,et,ye,pe,lt,Bt,dt.data):v.isCompressedTexture?B.compressedTexSubImage2D(B.TEXTURE_2D,me,Ae,et,dt.width,dt.height,lt,dt.data):B.texSubImage2D(B.TEXTURE_2D,me,Ae,et,ye,pe,lt,Bt,dt);g.pixelStorei(B.UNPACK_ROW_LENGTH,Xt),g.pixelStorei(B.UNPACK_IMAGE_HEIGHT,Ze),g.pixelStorei(B.UNPACK_SKIP_PIXELS,ai),g.pixelStorei(B.UNPACK_SKIP_ROWS,wi),g.pixelStorei(B.UNPACK_SKIP_IMAGES,qi),me===0&&O.generateMipmaps&&B.generateMipmap(Me),g.unbindTexture()},this.initRenderTarget=function(v){X.get(v).__webglFramebuffer===void 0&&Z.setupRenderTarget(v)},this.initTexture=function(v){v.isCubeTexture?Z.setTextureCube(v,0):v.isData3DTexture?Z.setTexture3D(v,0):v.isDataArrayTexture||v.isCompressedArrayTexture?Z.setTexture2DArray(v,0):Z.setTexture2D(v,0),g.unbindTexture()},this.resetState=function(){K=0,$=0,oe=null,g.reset(),ae.reset()},typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}get coordinateSystem(){return Zt}get outputColorSpace(){return this._outputColorSpace}set outputColorSpace(e){this._outputColorSpace=e;let t=this.getContext();t.drawingBufferColorSpace=Ue._getDrawingBufferColorSpace(e),t.unpackColorSpace=Ue._getUnpackColorSpace()}};var ud={type:"change"},Ja={type:"start"},fd={type:"end"},$s=new yi,hd=new Vt,Ag=Math.cos(70*ua.DEG2RAD),Ct=new P,jt=2*Math.PI,rt={NONE:-1,ROTATE:0,DOLLY:1,PAN:2,TOUCH_ROTATE:3,TOUCH_PAN:4,TOUCH_DOLLY_PAN:5,TOUCH_DOLLY_ROTATE:6},Za=1e-6,Qs=class extends Eo{constructor(e,t=null){super(e,t),this.state=rt.NONE,this.target=new P,this.cursor=new P,this.minDistance=0,this.maxDistance=1/0,this.minZoom=0,this.maxZoom=1/0,this.minTargetRadius=0,this.maxTargetRadius=1/0,this.minPolarAngle=0,this.maxPolarAngle=Math.PI,this.minAzimuthAngle=-1/0,this.maxAzimuthAngle=1/0,this.enableDamping=!1,this.dampingFactor=.05,this.enableZoom=!0,this.zoomSpeed=1,this.enableRotate=!0,this.rotateSpeed=1,this.keyRotateSpeed=1,this.enablePan=!0,this.panSpeed=1,this.screenSpacePanning=!0,this.keyPanSpeed=7,this.zoomToCursor=!1,this.autoRotate=!1,this.autoRotateSpeed=2,this.keys={LEFT:"ArrowLeft",UP:"ArrowUp",RIGHT:"ArrowRight",BOTTOM:"ArrowDown"},this.mouseButtons={LEFT:dn.ROTATE,MIDDLE:dn.DOLLY,RIGHT:dn.PAN},this.touches={ONE:pn.ROTATE,TWO:pn.DOLLY_PAN},this.target0=this.target.clone(),this.position0=this.object.position.clone(),this.zoom0=this.object.zoom,this._cursorStyle="auto",this._domElementKeyEvents=null,this._lastPosition=new P,this._lastQuaternion=new kt,this._lastTargetPosition=new P,this._quat=new kt().setFromUnitVectors(e.up,new P(0,1,0)),this._quatInverse=this._quat.clone().invert(),this._spherical=new Mr,this._sphericalDelta=new Mr,this._scale=1,this._panOffset=new P,this._rotateStart=new _e,this._rotateEnd=new _e,this._rotateDelta=new _e,this._panStart=new _e,this._panEnd=new _e,this._panDelta=new _e,this._dollyStart=new _e,this._dollyEnd=new _e,this._dollyDelta=new _e,this._dollyDirection=new P,this._mouse=new _e,this._performCursorZoom=!1,this._pointers=[],this._pointerPositions={},this._controlActive=!1,this._onPointerMove=Rg.bind(this),this._onPointerDown=wg.bind(this),this._onPointerUp=Cg.bind(this),this._onContextMenu=Fg.bind(this),this._onMouseWheel=Dg.bind(this),this._onKeyDown=Ig.bind(this),this._onTouchStart=Ng.bind(this),this._onTouchMove=Ug.bind(this),this._onMouseDown=Pg.bind(this),this._onMouseMove=Lg.bind(this),this._interceptControlDown=Og.bind(this),this._interceptControlUp=Bg.bind(this),this.domElement!==null&&this.connect(this.domElement),this.update()}set cursorStyle(e){this._cursorStyle=e,e==="grab"?this.domElement.style.cursor="grab":this.domElement.style.cursor="auto"}get cursorStyle(){return this._cursorStyle}connect(e){super.connect(e),this.domElement.addEventListener("pointerdown",this._onPointerDown),this.domElement.addEventListener("pointercancel",this._onPointerUp),this.domElement.addEventListener("contextmenu",this._onContextMenu),this.domElement.addEventListener("wheel",this._onMouseWheel,{passive:!1}),this.domElement.getRootNode().addEventListener("keydown",this._interceptControlDown,{passive:!0,capture:!0}),this.domElement.style.touchAction="none"}disconnect(){this.state=rt.NONE,this.domElement.removeEventListener("pointerdown",this._onPointerDown),this.domElement.ownerDocument.removeEventListener("pointermove",this._onPointerMove),this.domElement.ownerDocument.removeEventListener("pointerup",this._onPointerUp),this.domElement.removeEventListener("pointercancel",this._onPointerUp),this.domElement.removeEventListener("wheel",this._onMouseWheel),this.domElement.removeEventListener("contextmenu",this._onContextMenu),this.stopListenToKeyEvents();let e=this.domElement.getRootNode();e.removeEventListener("keydown",this._interceptControlDown,{capture:!0}),e.removeEventListener("keyup",this._interceptControlUp,{capture:!0}),this._controlActive=!1,this._pointers.length=0,this._pointerPositions={},this.domElement.style.touchAction="",this.domElement.style.cursor="auto"}dispose(){this.disconnect()}getPolarAngle(){return this._spherical.phi}getAzimuthalAngle(){return this._spherical.theta}getDistance(){return this.object.position.distanceTo(this.target)}listenToKeyEvents(e){e.addEventListener("keydown",this._onKeyDown),this._domElementKeyEvents=e}stopListenToKeyEvents(){this._domElementKeyEvents!==null&&(this._domElementKeyEvents.removeEventListener("keydown",this._onKeyDown),this._domElementKeyEvents=null)}saveState(){this.target0.copy(this.target),this.position0.copy(this.object.position),this.zoom0=this.object.zoom}reset(){this.target.copy(this.target0),this.object.position.copy(this.position0),this.object.zoom=this.zoom0,this.object.updateProjectionMatrix(),this.dispatchEvent(ud),this.update(),this.state=rt.NONE}pan(e,t){this._pan(e,t),this.update()}dollyIn(e){this._dollyIn(e),this.update()}dollyOut(e){this._dollyOut(e),this.update()}rotateLeft(e){this._rotateLeft(e),this.update()}rotateUp(e){this._rotateUp(e),this.update()}update(e=null){let t=this.object.position;Ct.copy(t).sub(this.target),Ct.applyQuaternion(this._quat),this._spherical.setFromVector3(Ct),this.autoRotate&&this.state===rt.NONE&&this._rotateLeft(this._getAutoRotationAngle(e)),this.enableDamping?(this._spherical.theta+=this._sphericalDelta.theta*this.dampingFactor,this._spherical.phi+=this._sphericalDelta.phi*this.dampingFactor):(this._spherical.theta+=this._sphericalDelta.theta,this._spherical.phi+=this._sphericalDelta.phi);let i=this.minAzimuthAngle,r=this.maxAzimuthAngle;isFinite(i)&&isFinite(r)&&(i<-Math.PI?i+=jt:i>Math.PI&&(i-=jt),r<-Math.PI?r+=jt:r>Math.PI&&(r-=jt),i<=r?this._spherical.theta=Math.max(i,Math.min(r,this._spherical.theta)):this._spherical.theta=this._spherical.theta>(i+r)/2?Math.max(i,this._spherical.theta):Math.min(r,this._spherical.theta)),this._spherical.phi=Math.max(this.minPolarAngle,Math.min(this.maxPolarAngle,this._spherical.phi)),this._spherical.makeSafe(),this.enableDamping===!0?this.target.addScaledVector(this._panOffset,this.dampingFactor):this.target.add(this._panOffset),this.target.sub(this.cursor),this.target.clampLength(this.minTargetRadius,this.maxTargetRadius),this.target.add(this.cursor);let o=!1;if(this.zoomToCursor&&this._performCursorZoom||this.object.isOrthographicCamera)this._spherical.radius=this._clampDistance(this._spherical.radius);else{let s=this._spherical.radius;this._spherical.radius=this._clampDistance(this._spherical.radius*this._scale),o=s!=this._spherical.radius}if(Ct.setFromSpherical(this._spherical),Ct.applyQuaternion(this._quatInverse),t.copy(this.target).add(Ct),this.object.lookAt(this.target),this.enableDamping===!0?(this._sphericalDelta.theta*=1-this.dampingFactor,this._sphericalDelta.phi*=1-this.dampingFactor,this._panOffset.multiplyScalar(1-this.dampingFactor)):(this._sphericalDelta.set(0,0,0),this._panOffset.set(0,0,0)),this.zoomToCursor&&this._performCursorZoom){let s=null;if(this.object.isPerspectiveCamera){let a=Ct.length();s=this._clampDistance(a*this._scale);let l=a-s;this.object.position.addScaledVector(this._dollyDirection,l),this.object.updateMatrixWorld(),o=!!l}else if(this.object.isOrthographicCamera){let a=new P(this._mouse.x,this._mouse.y,0);a.unproject(this.object);let l=this.object.zoom;this.object.zoom=Math.max(this.minZoom,Math.min(this.maxZoom,this.object.zoom/this._scale)),this.object.updateProjectionMatrix(),o=l!==this.object.zoom;let c=new P(this._mouse.x,this._mouse.y,0);c.unproject(this.object),this.object.position.sub(c).add(a),this.object.updateMatrixWorld(),s=Ct.length()}else console.warn("WARNING: OrbitControls.js encountered an unknown camera type - zoom to cursor disabled."),this.zoomToCursor=!1;s!==null&&(this.screenSpacePanning?this.target.set(0,0,-1).transformDirection(this.object.matrix).multiplyScalar(s).add(this.object.position):($s.origin.copy(this.object.position),$s.direction.set(0,0,-1).transformDirection(this.object.matrix),Math.abs(this.object.up.dot($s.direction))<Ag?this.object.lookAt(this.target):(hd.setFromNormalAndCoplanarPoint(this.object.up,this.target),$s.intersectPlane(hd,this.target))))}else if(this.object.isOrthographicCamera){let s=this.object.zoom;this.object.zoom=Math.max(this.minZoom,Math.min(this.maxZoom,this.object.zoom/this._scale)),s!==this.object.zoom&&(this.object.updateProjectionMatrix(),o=!0)}return this._scale=1,this._performCursorZoom=!1,o||this._lastPosition.distanceToSquared(this.object.position)>Za||8*(1-this._lastQuaternion.dot(this.object.quaternion))>Za||this._lastTargetPosition.distanceToSquared(this.target)>Za?(this.dispatchEvent(ud),this._lastPosition.copy(this.object.position),this._lastQuaternion.copy(this.object.quaternion),this._lastTargetPosition.copy(this.target),!0):!1}_getAutoRotationAngle(e){return e!==null?jt/60*this.autoRotateSpeed*e:jt/60/60*this.autoRotateSpeed}_getZoomScale(e){let t=Math.abs(e*.01);return Math.pow(.95,this.zoomSpeed*t)}_rotateLeft(e){this._sphericalDelta.theta-=e}_rotateUp(e){this._sphericalDelta.phi-=e}_panLeft(e,t){Ct.setFromMatrixColumn(t,0),Ct.multiplyScalar(-e),this._panOffset.add(Ct)}_panUp(e,t){this.screenSpacePanning===!0?Ct.setFromMatrixColumn(t,1):(Ct.setFromMatrixColumn(t,0),Ct.crossVectors(this.object.up,Ct)),Ct.multiplyScalar(e),this._panOffset.add(Ct)}_pan(e,t){let i=this.domElement;if(this.object.isPerspectiveCamera){let r=this.object.position;Ct.copy(r).sub(this.target);let o=Ct.length();o*=Math.tan(this.object.fov/2*Math.PI/180),this._panLeft(2*e*o/i.clientHeight,this.object.matrix),this._panUp(2*t*o/i.clientHeight,this.object.matrix)}else this.object.isOrthographicCamera?(this._panLeft(e*(this.object.right-this.object.left)/this.object.zoom/i.clientWidth,this.object.matrix),this._panUp(t*(this.object.top-this.object.bottom)/this.object.zoom/i.clientHeight,this.object.matrix)):(console.warn("WARNING: OrbitControls.js encountered an unknown camera type - pan disabled."),this.enablePan=!1)}_dollyOut(e){this.object.isPerspectiveCamera||this.object.isOrthographicCamera?this._scale/=e:(console.warn("WARNING: OrbitControls.js encountered an unknown camera type - dolly/zoom disabled."),this.enableZoom=!1)}_dollyIn(e){this.object.isPerspectiveCamera||this.object.isOrthographicCamera?this._scale*=e:(console.warn("WARNING: OrbitControls.js encountered an unknown camera type - dolly/zoom disabled."),this.enableZoom=!1)}_updateZoomParameters(e,t){if(!this.zoomToCursor)return;this._performCursorZoom=!0;let i=this.domElement.getBoundingClientRect(),r=e-i.left,o=t-i.top,s=i.width,a=i.height;this._mouse.x=r/s*2-1,this._mouse.y=-(o/a)*2+1,this._dollyDirection.set(this._mouse.x,this._mouse.y,1).unproject(this.object).sub(this.object.position).normalize()}_clampDistance(e){return Math.max(this.minDistance,Math.min(this.maxDistance,e))}_handleMouseDownRotate(e){this._rotateStart.set(e.clientX,e.clientY)}_handleMouseDownDolly(e){this._updateZoomParameters(e.clientX,e.clientX),this._dollyStart.set(e.clientX,e.clientY)}_handleMouseDownPan(e){this._panStart.set(e.clientX,e.clientY)}_handleMouseMoveRotate(e){this._rotateEnd.set(e.clientX,e.clientY),this._rotateDelta.subVectors(this._rotateEnd,this._rotateStart).multiplyScalar(this.rotateSpeed);let t=this.domElement;this._rotateLeft(jt*this._rotateDelta.x/t.clientHeight),this._rotateUp(jt*this._rotateDelta.y/t.clientHeight),this._rotateStart.copy(this._rotateEnd),this.update()}_handleMouseMoveDolly(e){this._dollyEnd.set(e.clientX,e.clientY),this._dollyDelta.subVectors(this._dollyEnd,this._dollyStart),this._dollyDelta.y>0?this._dollyOut(this._getZoomScale(this._dollyDelta.y)):this._dollyDelta.y<0&&this._dollyIn(this._getZoomScale(this._dollyDelta.y)),this._dollyStart.copy(this._dollyEnd),this.update()}_handleMouseMovePan(e){this._panEnd.set(e.clientX,e.clientY),this._panDelta.subVectors(this._panEnd,this._panStart).multiplyScalar(this.panSpeed),this._pan(this._panDelta.x,this._panDelta.y),this._panStart.copy(this._panEnd),this.update()}_handleMouseWheel(e){this._updateZoomParameters(e.clientX,e.clientY),e.deltaY<0?this._dollyIn(this._getZoomScale(e.deltaY)):e.deltaY>0&&this._dollyOut(this._getZoomScale(e.deltaY)),this.update()}_handleKeyDown(e){let t=!1;switch(e.code){case this.keys.UP:e.ctrlKey||e.metaKey||e.shiftKey?this.enableRotate&&this._rotateUp(jt*this.keyRotateSpeed/this.domElement.clientHeight):this.enablePan&&this._pan(0,this.keyPanSpeed),t=!0;break;case this.keys.BOTTOM:e.ctrlKey||e.metaKey||e.shiftKey?this.enableRotate&&this._rotateUp(-jt*this.keyRotateSpeed/this.domElement.clientHeight):this.enablePan&&this._pan(0,-this.keyPanSpeed),t=!0;break;case this.keys.LEFT:e.ctrlKey||e.metaKey||e.shiftKey?this.enableRotate&&this._rotateLeft(jt*this.keyRotateSpeed/this.domElement.clientHeight):this.enablePan&&this._pan(this.keyPanSpeed,0),t=!0;break;case this.keys.RIGHT:e.ctrlKey||e.metaKey||e.shiftKey?this.enableRotate&&this._rotateLeft(-jt*this.keyRotateSpeed/this.domElement.clientHeight):this.enablePan&&this._pan(-this.keyPanSpeed,0),t=!0;break}t&&(e.preventDefault(),this.update())}_handleTouchStartRotate(e){if(this._pointers.length===1)this._rotateStart.set(e.pageX,e.pageY);else{let t=this._getSecondPointerPosition(e),i=.5*(e.pageX+t.x),r=.5*(e.pageY+t.y);this._rotateStart.set(i,r)}}_handleTouchStartPan(e){if(this._pointers.length===1)this._panStart.set(e.pageX,e.pageY);else{let t=this._getSecondPointerPosition(e),i=.5*(e.pageX+t.x),r=.5*(e.pageY+t.y);this._panStart.set(i,r)}}_handleTouchStartDolly(e){let t=this._getSecondPointerPosition(e),i=e.pageX-t.x,r=e.pageY-t.y,o=Math.sqrt(i*i+r*r);this._dollyStart.set(0,o)}_handleTouchStartDollyPan(e){this.enableZoom&&this._handleTouchStartDolly(e),this.enablePan&&this._handleTouchStartPan(e)}_handleTouchStartDollyRotate(e){this.enableZoom&&this._handleTouchStartDolly(e),this.enableRotate&&this._handleTouchStartRotate(e)}_handleTouchMoveRotate(e){if(this._pointers.length==1)this._rotateEnd.set(e.pageX,e.pageY);else{let i=this._getSecondPointerPosition(e),r=.5*(e.pageX+i.x),o=.5*(e.pageY+i.y);this._rotateEnd.set(r,o)}this._rotateDelta.subVectors(this._rotateEnd,this._rotateStart).multiplyScalar(this.rotateSpeed);let t=this.domElement;this._rotateLeft(jt*this._rotateDelta.x/t.clientHeight),this._rotateUp(jt*this._rotateDelta.y/t.clientHeight),this._rotateStart.copy(this._rotateEnd)}_handleTouchMovePan(e){if(this._pointers.length===1)this._panEnd.set(e.pageX,e.pageY);else{let t=this._getSecondPointerPosition(e),i=.5*(e.pageX+t.x),r=.5*(e.pageY+t.y);this._panEnd.set(i,r)}this._panDelta.subVectors(this._panEnd,this._panStart).multiplyScalar(this.panSpeed),this._pan(this._panDelta.x,this._panDelta.y),this._panStart.copy(this._panEnd)}_handleTouchMoveDolly(e){let t=this._getSecondPointerPosition(e),i=e.pageX-t.x,r=e.pageY-t.y,o=Math.sqrt(i*i+r*r);this._dollyEnd.set(0,o),this._dollyDelta.set(0,Math.pow(this._dollyEnd.y/this._dollyStart.y,this.zoomSpeed)),this._dollyOut(this._dollyDelta.y),this._dollyStart.copy(this._dollyEnd);let s=(e.pageX+t.x)*.5,a=(e.pageY+t.y)*.5;this._updateZoomParameters(s,a)}_handleTouchMoveDollyPan(e){this.enableZoom&&this._handleTouchMoveDolly(e),this.enablePan&&this._handleTouchMovePan(e)}_handleTouchMoveDollyRotate(e){this.enableZoom&&this._handleTouchMoveDolly(e),this.enableRotate&&this._handleTouchMoveRotate(e)}_addPointer(e){this._pointers.push(e.pointerId)}_removePointer(e){delete this._pointerPositions[e.pointerId];for(let t=0;t<this._pointers.length;t++)if(this._pointers[t]==e.pointerId){this._pointers.splice(t,1);return}}_isTrackingPointer(e){for(let t=0;t<this._pointers.length;t++)if(this._pointers[t]==e.pointerId)return!0;return!1}_trackPointer(e){let t=this._pointerPositions[e.pointerId];t===void 0&&(t=new _e,this._pointerPositions[e.pointerId]=t),t.set(e.pageX,e.pageY)}_getSecondPointerPosition(e){let t=e.pointerId===this._pointers[0]?this._pointers[1]:this._pointers[0];return this._pointerPositions[t]}_customWheelEvent(e){let t=e.deltaMode,i={clientX:e.clientX,clientY:e.clientY,deltaY:e.deltaY};switch(t){case 1:i.deltaY*=16;break;case 2:i.deltaY*=100;break}return e.ctrlKey&&!this._controlActive&&(i.deltaY*=10),i}};function wg(n){this.enabled!==!1&&(this._pointers.length===0&&(this.domElement.setPointerCapture(n.pointerId),this.domElement.ownerDocument.addEventListener("pointermove",this._onPointerMove),this.domElement.ownerDocument.addEventListener("pointerup",this._onPointerUp)),!this._isTrackingPointer(n)&&(this._addPointer(n),n.pointerType==="touch"?this._onTouchStart(n):this._onMouseDown(n),this._cursorStyle==="grab"&&(this.domElement.style.cursor="grabbing")))}function Rg(n){this.enabled!==!1&&(n.pointerType==="touch"?this._onTouchMove(n):this._onMouseMove(n))}function Cg(n){switch(this._removePointer(n),this._pointers.length){case 0:this.domElement.releasePointerCapture(n.pointerId),this.domElement.ownerDocument.removeEventListener("pointermove",this._onPointerMove),this.domElement.ownerDocument.removeEventListener("pointerup",this._onPointerUp),this.dispatchEvent(fd),this.state=rt.NONE,this._cursorStyle==="grab"&&(this.domElement.style.cursor="grab");break;case 1:let e=this._pointers[0],t=this._pointerPositions[e];this._onTouchStart({pointerId:e,pageX:t.x,pageY:t.y});break}}function Pg(n){let e;switch(n.button){case 0:e=this.mouseButtons.LEFT;break;case 1:e=this.mouseButtons.MIDDLE;break;case 2:e=this.mouseButtons.RIGHT;break;default:e=-1}switch(e){case dn.DOLLY:if(this.enableZoom===!1)return;this._handleMouseDownDolly(n),this.state=rt.DOLLY;break;case dn.ROTATE:if(n.ctrlKey||n.metaKey||n.shiftKey){if(this.enablePan===!1)return;this._handleMouseDownPan(n),this.state=rt.PAN}else{if(this.enableRotate===!1)return;this._handleMouseDownRotate(n),this.state=rt.ROTATE}break;case dn.PAN:if(n.ctrlKey||n.metaKey||n.shiftKey){if(this.enableRotate===!1)return;this._handleMouseDownRotate(n),this.state=rt.ROTATE}else{if(this.enablePan===!1)return;this._handleMouseDownPan(n),this.state=rt.PAN}break;default:this.state=rt.NONE}this.state!==rt.NONE&&this.dispatchEvent(Ja)}function Lg(n){switch(this.state){case rt.ROTATE:if(this.enableRotate===!1)return;this._handleMouseMoveRotate(n);break;case rt.DOLLY:if(this.enableZoom===!1)return;this._handleMouseMoveDolly(n);break;case rt.PAN:if(this.enablePan===!1)return;this._handleMouseMovePan(n);break}}function Dg(n){this.enabled===!1||this.enableZoom===!1||this.state!==rt.NONE||(n.preventDefault(),this.dispatchEvent(Ja),this._handleMouseWheel(this._customWheelEvent(n)),this.dispatchEvent(fd))}function Ig(n){this.enabled!==!1&&this._handleKeyDown(n)}function Ng(n){switch(this._trackPointer(n),this._pointers.length){case 1:switch(this.touches.ONE){case pn.ROTATE:if(this.enableRotate===!1)return;this._handleTouchStartRotate(n),this.state=rt.TOUCH_ROTATE;break;case pn.PAN:if(this.enablePan===!1)return;this._handleTouchStartPan(n),this.state=rt.TOUCH_PAN;break;default:this.state=rt.NONE}break;case 2:switch(this.touches.TWO){case pn.DOLLY_PAN:if(this.enableZoom===!1&&this.enablePan===!1)return;this._handleTouchStartDollyPan(n),this.state=rt.TOUCH_DOLLY_PAN;break;case pn.DOLLY_ROTATE:if(this.enableZoom===!1&&this.enableRotate===!1)return;this._handleTouchStartDollyRotate(n),this.state=rt.TOUCH_DOLLY_ROTATE;break;default:this.state=rt.NONE}break;default:this.state=rt.NONE}this.state!==rt.NONE&&this.dispatchEvent(Ja)}function Ug(n){switch(this._trackPointer(n),this.state){case rt.TOUCH_ROTATE:if(this.enableRotate===!1)return;this._handleTouchMoveRotate(n),this.update();break;case rt.TOUCH_PAN:if(this.enablePan===!1)return;this._handleTouchMovePan(n),this.update();break;case rt.TOUCH_DOLLY_PAN:if(this.enableZoom===!1&&this.enablePan===!1)return;this._handleTouchMoveDollyPan(n),this.update();break;case rt.TOUCH_DOLLY_ROTATE:if(this.enableZoom===!1&&this.enableRotate===!1)return;this._handleTouchMoveDollyRotate(n),this.update();break;default:this.state=rt.NONE}}function Fg(n){this.enabled!==!1&&n.preventDefault()}function Og(n){n.key==="Control"&&(this._controlActive=!0,this.domElement.getRootNode().addEventListener("keyup",this._interceptControlUp,{passive:!0,capture:!0}))}function Bg(n){n.key==="Control"&&(this._controlActive=!1,this.domElement.getRootNode().removeEventListener("keyup",this._interceptControlUp,{passive:!0,capture:!0}))}var hn=class extends it{constructor(e=document.createElement("div")){super(),this.isCSS2DObject=!0,this.element=e,this.element.style.position="absolute",this.element.style.userSelect="none",this.element.setAttribute("draggable",!1),this.center=new _e(.5,.5),this.rotation2D=0,this.addEventListener("removed",function(){this.traverse(function(t){t.element&&t.element instanceof t.element.ownerDocument.defaultView.Element&&t.element.parentNode!==null&&t.element.remove()})})}copy(e,t){return super.copy(e,t),this.element=e.element.cloneNode(!0),this.center=e.center,this.rotation2D=e.rotation2D,this}},Ar=new P,dd=new Oe,pd=new Oe,md=new P,gd=new P,js=class{constructor(e={}){let t=this,i,r,o,s,a={objects:new WeakMap},l=e.element!==void 0?e.element:document.createElement("div");l.style.overflow="hidden",this.domElement=l,this.sortObjects=!0,this.getSize=function(){return{width:i,height:r}},this.render=function(_,S){_.matrixWorldAutoUpdate===!0&&_.updateMatrixWorld(),S.parent===null&&S.matrixWorldAutoUpdate===!0&&S.updateMatrixWorld(),dd.copy(S.matrixWorldInverse),pd.multiplyMatrices(S.projectionMatrix,dd),f(_,_,S),this.sortObjects&&p(_)},this.setSize=function(_,S){i=_,r=S,o=i/2,s=r/2,l.style.width=_+"px",l.style.height=S+"px"};function c(_){_.isCSS2DObject&&(_.element.style.display="none");for(let S=0,d=_.children.length;S<d;S++)c(_.children[S])}function f(_,S,d){if(_.visible===!1){c(_);return}if(_.isCSS2DObject){Ar.setFromMatrixPosition(_.matrixWorld),Ar.applyMatrix4(pd);let h=Ar.z>=-1&&Ar.z<=1&&_.layers.test(d.layers)===!0,A=_.element;if(A.style.display=h===!0?"":"none",h===!0){_.onBeforeRender(t,S,d);let M=100*_.center.x,y=100*_.center.y;A.style.transformOrigin=`${M}% ${y}%`;let b=-_.rotation2D,C=Ar.x*o+o,x=-Ar.y*s+s;A.style.transform=`translate(${-M}%, ${-y}%) translate(${C}px, ${x}px) rotate(${b}rad)`,A.parentNode!==l&&l.appendChild(A),_.onAfterRender(t,S,d)}let I={distanceToCameraSquared:m(d,_)};a.objects.set(_,I)}for(let h=0,A=_.children.length;h<A;h++)f(_.children[h],S,d)}function m(_,S){return md.setFromMatrixPosition(_.matrixWorld),gd.setFromMatrixPosition(S.matrixWorld),md.distanceToSquared(gd)}function u(_){let S=[];return _.traverseVisible(function(d){d.isCSS2DObject&&S.push(d)}),S}function p(_){let S=u(_).sort(function(h,A){if(h.renderOrder!==A.renderOrder)return A.renderOrder-h.renderOrder;let I=a.objects.get(h).distanceToCameraSquared,M=a.objects.get(A).distanceToCameraSquared;return I-M}),d=S.length;for(let h=0,A=S.length;h<A;h++)S[h].element.style.zIndex=d-h}}};var xd=["loc","player","org","trade","danger","distress","rumor","unknown","comms","infra","resource","threshold","economy","event"];var _d={loc:{id:"loc",label:"Location",meaning:"here",fallback:"here",category:"LOCATION",counterpart:"room",d:"M3.2 3.2h9.6v9.6H3.2z M6.2 6.2h3.6v3.6H6.2z"},player:{id:"player",label:"Player",meaning:"a Player",fallback:"P",category:"PLAYER",counterpart:"player",d:"M8 2.4l5.6 5.6L8 13.6 2.4 8z"},org:{id:"org",label:"Institution",meaning:"institution",fallback:"org",category:"INSTITUTION",counterpart:"organization",d:"M3.5 13V5.4 M8 13V3.4 M12.5 13V5.4 M3 13.2h10"},trade:{id:"trade",label:"Trade",meaning:"trade or opportunity",fallback:"trade",category:"TRADE",counterpart:"trade",d:"M2.6 5.4h8.4 M8.4 3.2l3 2.2-3 2.2 M13.4 10.6H5 M7.6 8.4l-3 2.2 3 2.2"},danger:{id:"danger",label:"Danger",meaning:"hostile or contested",fallback:"danger",category:"DANGER",counterpart:"contest",d:"M8 2.6l6.2 10.6H1.8z M8 6.6v3.2 M8 11.6v.9"},distress:{id:"distress",label:"Distress",meaning:"strained or failing works",fallback:"strained",category:"DISTRESS",counterpart:"condition",d:"M3.4 3.2h9.2 M3.4 12.8h9.2 M3.4 3.2l9.2 9.6 M12.6 3.2l-9.2 9.6"},rumor:{id:"rumor",label:"Rumor",meaning:"unconfirmed claim",fallback:"rumor",category:"RUMOR",counterpart:"rumor",d:"M3 11.2h3.4 M6.2 8h4 M10.2 4.8h2.8"},unknown:{id:"unknown",label:"Unknown",meaning:"incomplete or unreadable",fallback:"?",category:"UNKNOWN",counterpart:"artifact",d:"M5.2 3.2H12.8V7 M12.8 9.2v3.6H3.2V5.6"},comms:{id:"comms",label:"Signal",meaning:"message or board traffic",fallback:"message",category:"COMMUNICATION",counterpart:"message",d:"M8 12.6v-1.4 M5.2 9.2a3.6 3.6 0 0 1 5.6 0 M3.4 7a6.2 6.2 0 0 1 9.2 0"},infra:{id:"infra",label:"Works",meaning:"infrastructure",fallback:"works",category:"INFRASTRUCTURE",counterpart:"infrastructure",d:"M3.2 3.2h4.2v4.2H3.2z M8.6 3.2h4.2v4.2H8.6z M3.2 8.6h4.2v4.2H3.2z M8.6 8.6h4.2v4.2H8.6z"},resource:{id:"resource",label:"Resource",meaning:"stock or harvest",fallback:"stock",category:"RESOURCE",counterpart:"resource",d:"M4.2 12.2V7.2h2.2v5 M7 12.2V4.4h2.2v7.8 M9.8 12.2V8.4h2.2v3.8 M3.4 12.4h9.4"},threshold:{id:"threshold",label:"Threshold",meaning:"consequential change",fallback:"change",category:"THRESHOLD",counterpart:"exit",d:"M4.2 13V3.8h7.6V13 M6.6 13V8.2h2.8V13"},economy:{id:"economy",label:"Economy",meaning:"economic change",fallback:"trade",category:"ECONOMIC CHANGE",counterpart:"market",d:"M8 3.2v9.4 M3.4 6.6L8 4.4l4.6 2.2 M3.6 11.4h3.2 M9.2 11.4h3.2"},event:{id:"event",label:"Event",meaning:"world event",fallback:"event",category:"WORLD EVENT",counterpart:"event",d:"M8 2.6v3.2 M8 10.2v3.2 M2.6 8h3.2 M10.2 8h3.2 M4.4 4.4l2.2 2.2 M9.4 9.4l2.2 2.2 M11.6 4.4l-2.2 2.2 M6.6 9.4l-2.2 2.2"}};function vd(n){return _d[n]||_d.unknown}var bd=320,Ed=180;var y1=100*1024,b1=200*1024;var Gg=Object.fromEntries(xd.map(n=>[n,vd(n).d]));var Sd={north:[0,-1],n:[0,-1],south:[0,1],s:[0,1],east:[1,0],e:[1,0],west:[-1,0],w:[-1,0],up:[.35,-.65],down:[-.35,.65],northeast:[1,-1],northwest:[-1,-1],southeast:[1,1],southwest:[-1,1]},$a={NORMAL:280,NOTABLE:560,MAJOR:920};function ea(n){if(!n||!n.room_id||n.hidden===!0)return!1;let e=n.tags||[];for(let t=0;t<e.length;t++){let i=String(e[t]||"").toLowerCase();if(i==="hidden"||i==="secret"||i==="unpublished")return!1}return!0}function Td(n){return String(n||"").replace(/[<>&"'`]/g,"").replace(/[\u0000-\u001f\u007f]/g,"").slice(0,24)}function zg(n,e,t){if(!Array.isArray(n))return[];let i=String(e||"").trim().toLowerCase(),r=String(t||"").trim().toLowerCase(),o=r.replace(/^room\./,""),s=[];for(let a=0;a<n.length;a++){let l=Td(n[a]);if(!l)continue;let c=l.toLowerCase();c.startsWith("room.")||i&&c===i||r&&(c===r||c===o)||s.indexOf(l)>=0||s.push(l)}return s}function kg(n,e,t){if(!ea(n))return"unknown";let i=Number(n.players_present||0),r=String(t||"");if(r){if(String(n.room_id||"")===r)return"active"}else if(n.active===!0||i>0)return"active";let o=n.room_id||"";if(!r&&(e||[]).some(c=>c.room_id===o))return"active";if((n.entities||[]).filter(l=>l&&l.hidden!==!0).length||String(n.description||"").trim()||r&&i>0)return"known";let a=n.tags||[];for(let l=0;l<a.length;l++)if(String(a[l]||"").toLowerCase()==="partial")return"partial";return"empty"}function Md(n){let e=String(n||"");return!e||e==="loc"||e==="player"||!Object.prototype.hasOwnProperty.call(Gg,e)?null:e}function Hg(n,e){let t={},i=[];function r(l){!l||t[l]||(t[l]=!0,i.push(l))}let o=n.entities||[];for(let l=0;l<o.length;l++){let c=o[l];!c||c.hidden===!0||r(Md(c.glyph))}let s=n.room_id||"",a=e||[];for(let l=0;l<a.length;l++){let c=a[l];!c||c.room_id!==s||r(Md(c.glyph))}return i.sort(),i.slice(0,4)}function Vg(n,e){let t=[],i=n.exits||[];for(let r=0;r<i.length;r++){let o=i[r];if(!o||o.hidden===!0)continue;let s=String(o.to_room_id||"");!s||!e.has(s)||t.push(o)}return t}function Wg(n,e){let t=String(n||"").toLowerCase().trim();if(Sd[t])return Sd[t];let i=(e%4+4)%4;return i===0?[1,0]:i===1?[0,1]:i===2?[-1,0]:[0,-1]}function Po(n,e){return Math.round(n*2)/2+","+Math.round(e*2)/2}function yd(n,e,t){if(!t.has(Po(n,e)))return[n,e];let i=[1,-1,2,-2,3,-3];for(let r=0;r<i.length;r++){let o=i[r];for(let s=0;s<i.length;s++){let a=n+o*.5,l=e+i[s]*.5;if(!t.has(Po(a,l)))return[a,l]}}return[n+.75,e+.75]}function Ad(n,e,t){let i=(n||[]).filter(ea).slice().sort((y,b)=>String(y.room_id).localeCompare(String(b.room_id))),r=new Set(i.map(y=>String(y.room_id))),o=new Map,s=new Set,a=[],l=new Set;if(i.length){let y=String(i[0].room_id);o.set(y,[0,0]),s.add(Po(0,0));let b=[y],C=new Set([y]);for(;b.length;){let E=b.shift(),D=i.find(k=>k.room_id===E);if(!D)continue;let U=o.get(E)||[0,0],G=Vg(D,r).slice().sort((k,L)=>String(k.direction||"").localeCompare(String(L.direction||""))||String(k.to_room_id||"").localeCompare(String(L.to_room_id||"")));for(let k=0;k<G.length;k++){let L=String(G[k].to_room_id),H=E<L?E+">"+L:L+">"+E;if(l.has(H)||(l.add(H),a.push({from:E,to:L,direction:String(G[k].direction||"")})),C.has(L))continue;let K=Wg(G[k].direction,k+E.length),$=U[0]+K[0]*2,oe=U[1]+K[1]*2,Q=yd($,oe,s);$=Q[0],oe=Q[1],o.set(L,[$,oe]),s.add(Po($,oe)),C.add(L),b.push(L)}}let x=0;for(let E=0;E<i.length;E++){let D=String(i[E].room_id);if(o.has(D))continue;let U=yd(x*2,2,s);o.set(D,U),s.add(Po(U[0],U[1])),x+=1}}let c=1/0,f=1/0,m=-1/0,u=-1/0;o.forEach(y=>{y[0]<c&&(c=y[0]),y[1]<f&&(f=y[1]),y[0]>m&&(m=y[0]),y[1]>u&&(u=y[1])}),Number.isFinite(c)||(c=0,f=0,m=0,u=0);let p=Math.max(1,m-c),_=Math.max(1,u-f),S=28,d=24,h=bd-S*2,A=Ed-d*2,I=i.map(y=>{let b=String(y.room_id),C=o.get(b)||[0,0],x=S+(C[0]-c)/p*h,E=d+(C[1]-f)/_*A,D=Xg(x,E),U=Td(y.name||b),G=zg(y.public_player_labels,U,b);return{room_id:b,name:U,x:D.x,y:D.y,gx:C[0],gy:C[1],certainty:kg(y,e,t),players:Math.max(0,Number(y.players_present||0)||0),labels:G,marks:Hg(y,e)}}),M=new Map(I.map(y=>[y.room_id,y.certainty]));for(let y=0;y<a.length;y++){let b=a[y],C=M.get(b.from),x=M.get(b.to);b.dashed=C==="partial"||x==="partial"}return{nodes:I,edges:a}}function Xg(n,e){return{x:Math.max(12,Math.min(bd-12,Math.round(n))),y:Math.max(14,Math.min(Ed-14,Math.round(e)))}}var A1=160*1024,Lo=4,qg=20*Math.PI/180,Yg=70*Math.PI/180,Cd=$a.NOTABLE,Kg=3,Zg={NORMAL:2500,NOTABLE:3500,MAJOR:4e3},Xi={MIN_GAP_MS:400,MAX_GAP_MS:2500,UNKNOWN_GAP_MS:600,MAX_TOTAL_MS:9e3};function Pd(n){let e=[];for(let r of Array.isArray(n)?n:[]){let o=r?.sequence;if(typeof o!="number"||!Number.isSafeInteger(o))continue;let s=r?.occurredAt,a=typeof s=="number"&&Number.isFinite(s)?s:null,l=e.find(c=>c.sequence===o);if(l){l.occurredAt===null&&a!==null&&(l.occurredAt=a);continue}e.push({sequence:o,occurredAt:a})}e.sort((r,o)=>r.sequence-o.sequence);let t=[];for(let r=0;r<e.length;r++){let o=0;if(r>0){let s=e[r-1].occurredAt,a=e[r].occurredAt,l=Xi.UNKNOWN_GAP_MS;if(s!==null&&a!==null){let c=a-s;c>=0&&(l=Math.min(Xi.MAX_GAP_MS,Math.max(Xi.MIN_GAP_MS,c)))}o=t[r-1].atMs+l}t.push({sequence:e[r].sequence,atMs:o})}let i=t.length?t[t.length-1].atMs:0;if(i>Xi.MAX_TOTAL_MS){let r=Xi.MAX_TOTAL_MS/i;for(let o of t)o.atMs=Math.round(o.atMs*r)}return t}function Ld(n,e){let t=typeof e=="number"&&Number.isFinite(e)?e:0,i=t;for(let o of Array.isArray(n)?n:[])typeof o!="number"||!Number.isFinite(o)||o>i&&(i=o);let r=i-t;return r>Xi.MAX_TOTAL_MS?{flush:!0,offsetMs:0}:r<=0?{flush:!1,offsetMs:0}:{flush:!1,offsetMs:r+Xi.MIN_GAP_MS}}var Jg=["faint","marked","deep"],wd=["low","moderate","high"];function Qa(n,e){let t=String(n??"").trim().toLowerCase();return e.includes(t)?t:""}function $g(n){let e={},t=n&&typeof n=="object"?n.base:null,i=t&&Array.isArray(t.rooms)?t.rooms:[];for(let r of i){if(!r||typeof r!="object")continue;let o=r,s=String(o.room_id||"");if(!s)continue;let a={scar:Qa(o.scar_band,Jg),pressure:Qa(o.pressure_band,wd),protocol:Qa(o.protocol_band,wd)};(a.scar||a.pressure||a.protocol)&&(e[s]=a)}return e}function Dd(n){let e=[];return n.scar&&e.push("scar "+n.scar),n.pressure&&e.push("pressure "+n.pressure),n.protocol&&e.push("protocol "+n.protocol),e.join(" \xB7 ")}var Qg=/\b(?:player|room|entity|ctrl|event|controller|device)\.[a-z0-9._-]+/i;function Ln(n,e){let t=String(n??"").replace(/[\u0000-\u001f\u007f]/g,"").replace(/\s+/g," ").trim();return!t||Qg.test(t)?"":t.length>e?t.slice(0,e):t}function Id(n){return Ln(n,48)}function jg(n){let e=Id(n.name).toLowerCase(),t=[];for(let i of Array.isArray(n.public_player_labels)?n.public_player_labels:[]){let r=Ln(i,32);!r||r.toLowerCase()===e||t.includes(r)||t.push(r)}return t}function Rd(n,e){let t=e+" ";for(let i of Array.isArray(n)?n:[])if(String(i??"").startsWith(t))return Ln(i,120);return""}function e_(n,e){let t=Rd(n.public_focus_lines,e);return t||Rd(n.public_title_lines,e)}function Nd(n,e={}){let t=Array.isArray(n?.rooms)?n.rooms:[],i=Array.isArray(n?.recent_events)?n.recent_events:[],r=Ad(t,i),o=new Map;for(let S of t)ea(S)&&o.set(String(S.room_id),S);let s=$g(e.map),a={scar:"",pressure:"",protocol:""},l=r.nodes.filter(S=>o.has(S.room_id)),c=l.length?l.reduce((S,d)=>S+(d.gx??0),0)/l.length:0,f=l.length?l.reduce((S,d)=>S+(d.gy??0),0)/l.length:0,m=[],u=0;for(let S of l){let d=o.get(S.room_id),h=Id(d.name);if(!h)continue;let A=((S.gx??0)-c)*Lo,I=((S.gy??0)-f)*Lo;u=Math.max(u,Math.hypot(A,I));let M=Array.isArray(d.traces)?d.traces.filter(x=>x&&Ln(x.text,400)).length:0,y=Math.max(0,Number(d.players_present)||0),b=jg(d),C=b.slice(0,6).map(x=>({handle:x,line:e_(d,x)}));m.push({id:S.room_id,name:h,x:A,z:I,certainty:S.certainty,active:d.active===!0||S.certainty==="active",players:y,handles:b,tokens:C,unnamed:Math.max(0,Math.min(y,6)-C.length),more:Math.max(0,Math.max(y,b.length)-6),traces:M,selected:!!e.selectedId&&e.selectedId===S.room_id,followed:!!e.followRoomId&&e.followRoomId===S.room_id,major:!!e.majorRoomId&&e.majorRoomId===S.room_id,bands:s[S.room_id]||a})}let p=new Set(m.map(S=>S.id)),_=[];for(let S of r.edges){if(!p.has(S.from)||!p.has(S.to))continue;let d=(o.get(S.to)?.exits||[]).some(h=>h&&h.hidden!==!0&&String(h.to_room_id)===S.from);_.push({from:S.from,to:S.to,direction:S.direction,dashed:!!S.dashed,oneWay:!d})}return{sites:m,routes:_,radius:u+Lo*.75}}function Ud(n){let e=String(n||"").toUpperCase();return e==="MAJOR"||e==="NOTABLE"?e:"NORMAL"}function Fd(n,e,t,i={}){let r=new Set(t),o=[],s=e;for(let c of Array.isArray(n)?n:[]){let f=c?.sequence;if(typeof f!="number"||!Number.isSafeInteger(f)||((s===null||f>s)&&(s=f),e===null||f<=e))continue;let m=String(c.room_id||"");if(!r.has(m))continue;let u=Ud(c.tier),p={roomId:m,tier:u,ttl:$a[u],sequence:f},_=c.projection_id;typeof _=="string"&&_&&(p.projectionId=_),o.push(p)}if(e===null){let c=Number.isSafeInteger(i.snapshotSequence)?i.snapshotSequence:0;return{pulses:[],lastSequence:Math.max(s??c,c)}}if(i.reduce)return{pulses:[],lastSequence:s};o.sort((c,f)=>f.sequence-c.sequence);let a=o.find(c=>c.tier==="MAJOR"),l=o.filter(c=>c.tier!=="MAJOR").slice(0,Kg);return{pulses:a?[a,...l]:l,lastSequence:s}}function t_(n,e){let t=i=>i.replace(/\.+$/,"").toLowerCase();return t(n)===t(e)}function Od(n,e,t){if(e===null)return[];let i=new Set(t),r=[];for(let a of Array.isArray(n)?n:[]){let l=a,c=l?.sequence;if(typeof c!="number"||!Number.isSafeInteger(c)||c<=e)continue;let f=String(l.room_id||"");if(!i.has(f))continue;let m=Ln(l.line,120);if(!m)continue;let u=Ud(l.tier),p=Ln(l.actor_label,32),_=Ln(l.consequence,120);_&&t_(_,m)&&(_=""),r.push({roomId:f,tier:u,sequence:c,line:m,actor:p,consequence:_,holdMs:Zg[u]})}r.sort((a,l)=>l.sequence-a.sequence);let o=r.find(a=>a.tier==="MAJOR"),s=r.filter(a=>a.tier!=="MAJOR").slice(0,2);return o?[o,...s]:s}function Bd(n,e){let t=new Set;for(let i of Array.isArray(n)?n:[])for(let r of e)(r.from===i.roomId||r.to===i.roomId)&&t.add(r.from+"|"+r.to);return t}function ja(n){let e=Math.max(n,Lo*2);return{minDistance:e*.8,maxDistance:e*3.2,maxTargetRadius:e,minPolarAngle:qg,maxPolarAngle:Yg}}function Gd(n){let t=Math.max(n,Lo*2)*2.3,i=40*Math.PI/180,r=-.35;return{target:[0,0,0],position:[t*Math.sin(i)*Math.sin(r),t*Math.cos(i),t*Math.sin(i)*Math.cos(r)]}}function el(n,e,t,i){return e.selectedId&&e.selectedId!==n.selectedId?e.selectedId:e.followRoomId&&e.followRoomId!==n.followRoomId?e.followRoomId:i?"":t||""}var i_={NORMAL:.25,NOTABLE:.45,MAJOR:.7},n_={low:.14,moderate:.28,high:.42},r_={faint:.45,marked:.7,deep:1},Ii=2.4,o_=new P(0,1,0),s_=new Set(["ArrowLeft","ArrowRight","ArrowUp","ArrowDown"]);function Dn(n,e){try{return getComputedStyle(document.documentElement).getPropertyValue(n).trim()||e}catch{return e}}function a_(){return{world:new be(Dn("--color-surface-world","#0E1114")),plate:new be("#2F3943"),raised:new be("#3A4652"),edge:new be("#8A8F92"),ink:new be(Dn("--color-text-primary","#E8E4DC")),active:new be(Dn("--color-state-active","#3DDCFF")),warning:new be(Dn("--color-state-warning","#FFB020")),social:new be(Dn("--color-state-social","#C4A882")),unknown:new be(Dn("--color-state-unknown","#9B6DFF")),machine:new be(Dn("--color-text-machine","#9BB8C4")),route:new be("#4a5258")}}var l_=n=>1-Math.pow(1-n,3);function c_(n,e){let t=e.canvas,i=e.labels,r=!!e.reduce,o=typeof e.onSelect=="function"?e.onSelect:()=>{},s=typeof e.onLost=="function"?e.onLost:()=>{},a=a_(),l=new Co({canvas:t,antialias:!0,powerPreference:"low-power"});l.setPixelRatio(Math.min(window.devicePixelRatio||1,2)),l.setClearColor(a.world,1);let c=new js({element:i}),f=new go;f.add(new Mo(a.ink,a.world,.95));let m=new yo(16777215,.55);m.position.set(-6,14,8),f.add(m);let u=new Et(38,1,.1,2e3),p=new Qs(u,t);p.enableDamping=!1,p.screenSpacePanning=!1,p.listenToKeyEvents(n);let _={plate:new si(Ii,.3,Ii),ring:new si(Ii+.5,.04,Ii+.5),scar:new si(Ii-.6,.02,Ii-.6),pip:new dr(.13,.13,.5,12),trace:new si(.3,.08,.3),arrow:new Rs(.22,.6,12),pulse:new Ds(1.7,1.95,48)},S=new ri;f.add(S);let d=null,h={sites:[],routes:[],radius:8},A={},I=null,M=[],y=null,b=!1,C=!1,x=0,E=!1,D=!1,U=new Map,G=[],k=[],L=new Map;function H(){let w=Math.max(1,n.clientWidth),R=Math.max(1,n.clientHeight);if(l.setSize(w,R,!1),c.setSize(w,R),u.aspect=w/R,u.updateProjectionMatrix(),C&&!b&&!y&&ne()){let F=j();u.position.copy(F.position),p.update()}K()}function K(){if(!(D||x)){if(document.hidden){E=!0;return}x=requestAnimationFrame($)}}function $(w){if(x=0,D)return;let R=!1;if(y){let q=y.ms>0?Math.min(1,(w-y.start)/y.ms):1,ce=l_(q);p.target.lerpVectors(y.fromTarget,y.toTarget,ce),u.position.lerpVectors(y.fromPos,y.toPos,ce),p.update(),q>=1?y=null:R=!0}for(let q of U.values())q.position.y=0;M=M.filter(q=>{let ce=U.get(q.roomId);q.start===void 0&&(q.start=w);let ie=(w-q.start)/q.ttl;return!ce||ie>=1?(q.ring&&(S.remove(q.ring),q.ring.material.dispose()),!1):(ce.position.y=Math.max(ce.position.y,Math.sin(ie*Math.PI)*i_[q.tier]),q.ring&&(q.ring.scale.setScalar(1+ie*.8),q.ring.material.opacity=.9*(1-ie)),R=!0,!0)});let F=Bd(M.filter(q=>q.projectionId==="agent_move"),h.routes);for(let q of G){let ce=F.has(q.from+"|"+q.to);for(let ie of q.mats)ie.color.copy(ce?a.active:a.route)}l.render(f,u),c.render(f,u),oe(),R&&K()}function oe(){let w=Array.from(i.querySelectorAll(".stage3d-label, .stage3d-nameplate"));w.sort((F,q)=>Number(q.dataset.priority||0)-Number(F.dataset.priority||0));let R=[];for(let F of w){if(F.classList.remove("is-tucked"),F.style.display==="none")continue;let q=F.getBoundingClientRect();R.some(ie=>q.left<ie.right+4&&q.right>ie.left-4&&q.top<ie.bottom+2&&q.bottom>ie.top-2)?F.classList.add("is-tucked"):R.push(q)}}function Q(w){let R=document.createElement("div");R.className="stage3d-label";let F=[];w.active&&F.push("active"),w.selected&&F.push("selected"),w.followed&&F.push("followed"),w.major&&F.push("major"),(w.certainty==="partial"||w.certainty==="unknown")&&F.push("partial"),R.setAttribute("data-state",F.join(" ")),R.dataset.priority=String((w.selected?32:0)+(w.followed?16:0)+(w.major?8:0)+(w.active?4:0)+(w.players>0?2:0)),R.title=w.name;let q=document.createElement("span");if(q.textContent=w.name,R.append(q),w.handles.length){let fe=document.createElement("span");fe.className="stage3d-handles",fe.textContent=w.handles.join(", "),R.append(fe)}else if(w.players>0){let fe=document.createElement("span");fe.className="stage3d-handles",fe.textContent=w.players===1?"1 agent":w.players+" agents",R.append(fe)}for(let fe of w.tokens.filter(ge=>ge.line).slice(0,2)){let ge=document.createElement("span");ge.className="stage3d-lines",ge.textContent=fe.line,R.append(ge)}let ce=Dd(w.bands);if(ce){let fe=document.createElement("span");fe.className="stage3d-bands",fe.textContent=ce,R.append(fe)}let ie=w.major?"MAJOR":w.followed?"Followed":w.selected?"Selected":"";if(ie){let fe=document.createElement("span");fe.className="stage3d-state",fe.textContent=ie,R.append(fe)}R.addEventListener("click",fe=>{fe.stopPropagation(),o(w.id)});let ue=new hn(R);return ue.position.set(0,.5,Ii/2+.3),ue}function re(w){let R=new ri;R.userData.siteId=w.id;let F=w.certainty==="partial"||w.certainty==="unknown",q=(w.selected||w.active?a.raised:a.plate).clone();w.bands.pressure&&q.lerp(a.warning,n_[w.bands.pressure]);let ce=new gr({color:q,roughness:.9,metalness:.05,transparent:F,opacity:F?.55:1}),ie=new mt(_.plate,ce);ie.position.y=w.selected?.3:.15,ie.userData.siteId=w.id,R.add(ie);let ue=w.major?a.warning:w.selected?a.ink:w.active||w.followed?a.active:a.edge,fe=F?new Cn({color:ue,dashSize:.25,gapSize:.18}):new Ei({color:ue}),ge=new Rn(new pr(_.plate),fe);if(ge.position.copy(ie.position),F&&ge.computeLineDistances(),R.add(ge),w.followed||w.major){let le=new Rn(new pr(_.ring),new Ei({color:w.major?a.warning:a.active}));le.position.y=.02,R.add(le)}if(w.bands.scar){let le=new Rn(new pr(_.scar),new Cn({color:a.unknown,dashSize:.2,gapSize:.12,transparent:!0,opacity:r_[w.bands.scar]}));le.position.y=ie.position.y+.16,le.computeLineDistances(),R.add(le)}let De=w.tokens.slice(0,6),N=De.length+w.unnamed;for(let le=0;le<N;le++){let ee=De[le],J=new mt(_.pip,new gr({color:a.social,roughness:.6,emissive:ee?a.active:0,emissiveIntensity:ee?.55:0}));if(J.position.set(-.75+le%3*.75,ie.position.y+.4,-.45+Math.floor(le/3)*.6),R.add(J),ee){let ae=document.createElement("div");ae.className="stage3d-nameplate",ae.textContent=ee.handle,ae.dataset.priority="-1";let te=new hn(ae);te.position.set(J.position.x,J.position.y+.35,J.position.z),R.add(te)}}if(w.more>0){let le=document.createElement("div");le.className="stage3d-more",le.textContent="+"+w.more;let ee=new hn(le);ee.position.set(.95,ie.position.y+.45,.95),R.add(ee)}if(w.traces>0){let le=new mt(_.trace,new bi({color:a.machine}));le.position.set(Ii/2-.35,ie.position.y+.19,Ii/2-.35),R.add(le)}return R.add(Q(w)),R.position.set(w.x,0,w.z),R}function se(w,R,F){let q=[new P(R.x,.06,R.z),new P(F.x,.06,F.z)],ce=new ft().setFromPoints(q),ie=w.dashed?new Cn({color:a.route,dashSize:.45,gapSize:.3}):new Ei({color:a.route}),ue=new wn(ce,ie);w.dashed&&ue.computeLineDistances();let fe=new ri;if(fe.add(ue),w.oneWay){let ge=new P(F.x-R.x,0,F.z-R.z),De=ge.length();if(De>0){ge.normalize();let N=new mt(_.arrow,new bi({color:a.route}));N.position.set(R.x+ge.x*De*.62,.12,R.z+ge.z*De*.62),N.quaternion.setFromUnitVectors(o_,ge),fe.add(N)}}return fe}function Pe(){S.traverse(w=>{w.isCSS2DObject&&w.element&&w.element.parentNode&&w.element.remove(),w.material&&!Object.values(_).includes(w.geometry)&&w.geometry&&w.geometry.dispose(),w.material&&w.material.dispose()}),f.remove(S),S=new ri,f.add(S),U.clear(),G=[];for(let w of M)w.ring=null}function Ce(w){d&&(d.element&&d.element.parentNode&&d.element.remove(),f.remove(d));let R=document.createElement("div");R.className="stage3d-compass",R.textContent="N",d=new hn(R),d.position.set(0,.05,-w-1.2),f.add(d)}function ot(w){let R=ja(w);p.minDistance=R.minDistance,p.maxDistance=R.maxDistance,p.maxTargetRadius=R.maxTargetRadius,p.minPolarAngle=R.minPolarAngle,p.maxPolarAngle=R.maxPolarAngle}function Ve(w,R){y={start:performance.now(),ms:r?0:Cd,fromTarget:p.target.clone(),toTarget:w,fromPos:u.position.clone(),toPos:R},K()}function Ye(w){let R=U.get(w);if(!R)return;let F=new P(R.position.x,0,R.position.z),q=u.position.clone().sub(p.target);Ve(F,F.clone().add(q))}function j(){let w=Gd(h.radius),R=new P(...w.position),F=Math.atan(Math.tan(u.fov*Math.PI/360)*u.aspect),q=h.radius*1.15/Math.tan(F),ce=ja(h.radius);return R.setLength(Math.min(ce.maxDistance,Math.max(R.length(),q))),{target:new P(...w.target),position:R}}function ne(){return p.target.lengthSq()<1e-6}function Se(){let w=j();b=!1,Ve(w.target,w.position)}function Ie(w){let R=new mt(_.pulse,new bi({color:a.warning,transparent:!0,opacity:.9}));R.rotation.x=-Math.PI/2;let F=U.get(w);return R.position.set(F.position.x,.03,F.position.z),S.add(R),R}function ve(w){let R=L.get(w);if(R)return R;let F=U.get(w);if(!F)return null;let q=document.createElement("div");q.className="stage3d-says";let ce=document.createElement("div");ce.className="stage3d-says-list",q.append(ce);let ie=new hn(q);return ie.position.set(0,1.4,-Ii/2),F.add(ie),R={obj:ie,el:ce,anchor:q},L.set(w,R),R}function ze(w){let R=ve(w.roomId);if(!R)return;let F=document.createElement("div");if(F.className="stage3d-say"+(w.tier==="MAJOR"?" is-major":""),w.actor){let ie=document.createElement("b");ie.textContent=w.actor,F.append(ie," ")}let q=document.createElement("span");if(q.className="stage3d-say-line",q.textContent=w.line,F.append(q),w.consequence){let ie=document.createElement("span");ie.className="stage3d-say-consequence",ie.textContent=w.consequence,F.append(ie)}w.tier==="MAJOR"?R.el.prepend(F):R.el.append(F);let ce={caption:w,el:F,timer:0};ce.timer=setTimeout(()=>{k=k.filter(ie=>ie!==ce),F.remove(),R.el.childElementCount||(R.obj.parent&&R.obj.parent.remove(R.obj),R.anchor.remove(),L.get(w.roomId)===R&&L.delete(w.roomId)),K()},Math.max(0,w.holdMs)),k.push(ce),K()}let Ke=[],Ge=!1;function We(w){let R="";for(let F of w.pulses)U.has(F.roomId)&&(F.tier==="MAJOR"&&(R=F.roomId,F.ring=Ie(F.roomId)),M.push(F));for(let F of w.captions)ze(F);if(R&&C){let F=el(A,A,R,b);F&&Ye(F)}K()}function tt(w){let R=Ke.indexOf(w);R>=0&&Ke.splice(R,1),w.timer=0;let F=Ke.filter(q=>q.sequence<w.sequence).sort((q,ce)=>q.sequence-ce.sequence);for(let q of F){let ce=Ke.indexOf(q);ce>=0&&Ke.splice(ce,1),q.timer&&clearTimeout(q.timer),q.timer=0,We(q.slot)}We(w.slot)}function He(w,R){let F={timer:0,sequence:w.sequence,atMs:R,startedAt:performance.now(),remaining:R,slot:w};Ke.push(F),Ge||(F.timer=setTimeout(()=>tt(F),R))}function ct(w){let R=performance.now();for(let F of Ke)F.timer&&(clearTimeout(F.timer),F.remaining=Math.max(0,F.atMs-(R-F.startedAt)),F.timer=0);if(Ge=!!w,!w)for(let F of Ke){let q=Math.max(0,F.remaining);F.atMs=q,F.startedAt=performance.now(),F.timer=setTimeout(()=>tt(F),q)}}function Mt(w,R){if(D)return;let F=A;A=R||{};let q=h.radius;h=Nd(w,A),Pe();for(let J of h.sites){let ae=re(J);U.set(J.id,ae),S.add(ae)}G=[];for(let J of h.routes){let ae=U.get(J.from),te=U.get(J.to);if(!ae||!te)continue;let we=se(J,ae.position,te.position);S.add(we);let Ee=[];we.traverse(Qe=>{Qe.material&&Qe.material.color&&Ee.push(Qe.material)}),G.push({from:J.from,to:J.to,mats:Ee})}(!C||Math.abs(q-h.radius)>.01)&&(Ce(h.radius),ot(h.radius));for(let J of M)J.tier==="MAJOR"&&!J.ring&&U.has(J.roomId)&&(J.ring=Ie(J.roomId));for(let[J,ae]of L){let te=U.get(J);te&&te.add(ae.obj)}let ce=Fd(w&&w.recent_events,I,U.keys(),{reduce:r,snapshotSequence:w&&w.sequence}),ie=Od(w&&w.recent_events,I,U.keys());I=ce.lastSequence;let ue=new Map,fe=Array.isArray(w&&w.recent_events)?w.recent_events:[];for(let J of fe)J&&typeof J.sequence=="number"&&typeof J.occurred_at=="number"&&ue.set(J.sequence,J.occurred_at);let ge=new Map,De=J=>{let ae=ge.get(J);return ae||(ae={sequence:J,occurredAt:ue.get(J),pulses:[],captions:[]},ge.set(J,ae)),ae};for(let J of ce.pulses)De(J.sequence).pulses.push(J);for(let J of ie)De(J.sequence).captions.push(J);let N=performance.now(),le=N;for(let J of Ke){let ae=J.timer?J.startedAt+J.atMs:N+J.remaining;ae>le&&(le=ae)}let ee=Ld([le],N);if(!Ge&&(ee.flush||le-N>Xi.MAX_TOTAL_MS)){let J=Ke.slice().sort((ae,te)=>ae.sequence-te.sequence);Ke.length=0;for(let ae of J)ae.timer&&clearTimeout(ae.timer),ae.timer=0,We(ae.slot)}for(let J of Pd(Array.from(ge.values()))){let ae=ge.get(J.sequence);if(!ae)continue;let te=ee.offsetMs+J.atMs;te<=0?We(ae):He(ae,te)}if(C){let J=el(F,A,"",b);J&&((J===A.selectedId||J===A.followRoomId)&&(b=!1),Ye(J))}else{C=!0;let J=j();p.target.copy(J.target),u.position.copy(J.position),p.update()}K()}let Ft=new bo,ut=new _e,at=null,B=w=>{at={x:w.clientX,y:w.clientY}},Tt=w=>{if(!at||Math.hypot(w.clientX-at.x,w.clientY-at.y)>5){at=null;return}at=null;let R=t.getBoundingClientRect();ut.set((w.clientX-R.left)/R.width*2-1,-((w.clientY-R.top)/R.height)*2+1),Ft.setFromCamera(ut,u);let F=Ft.intersectObjects(S.children,!0).find(q=>q.object.userData&&q.object.userData.siteId);F&&o(F.object.userData.siteId)};t.addEventListener("pointerdown",B),t.addEventListener("pointerup",Tt),p.addEventListener("start",()=>{b=!0,y=null}),p.addEventListener("change",K);let Je=w=>{s_.has(w.key)&&(b=!0,y=null)};n.addEventListener("keydown",Je);let T=e.reset,g=()=>Se();T&&T.addEventListener("click",g);let z=()=>{!document.hidden&&E&&(E=!1,K())};document.addEventListener("visibilitychange",z);let X=w=>{w.preventDefault(),s()};t.addEventListener("webglcontextlost",X);let Z=typeof ResizeObserver=="function"?new ResizeObserver(H):null;Z?Z.observe(n):window.addEventListener("resize",H),H();function he(){if(!D){D=!0,x&&cancelAnimationFrame(x);for(let w of k)w.timer&&clearTimeout(w.timer);k=[];for(let w of Ke)w.timer&&clearTimeout(w.timer);Ke.length=0;for(let w of L.values())w.anchor.remove();L.clear(),Pe();for(let w of Object.values(_))w.dispose();p.dispose(),t.removeEventListener("pointerdown",B),t.removeEventListener("pointerup",Tt),t.removeEventListener("webglcontextlost",X),n.removeEventListener("keydown",Je),p.stopListenToKeyEvents(),document.removeEventListener("visibilitychange",z),T&&T.removeEventListener("click",g),Z?Z.disconnect():window.removeEventListener("resize",H),i.replaceChildren(),l.dispose()}}return{update:Mt,focus:Ye,reset:Se,dispose:he,pause:ct}}window.NoemaWatchStage={mount:c_};
