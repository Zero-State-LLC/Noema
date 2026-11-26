/*! NOEMA WATCH Chamber stage. Bundles three.js (MIT, Copyright 2010-2026 three.js authors); see /assets/THREE-LICENSE.txt */
var Bn={LEFT:0,MIDDLE:1,RIGHT:2,ROTATE:0,DOLLY:1,PAN:2},Gn={ROTATE:0,PAN:1,DOLLY_PAN:2,DOLLY_ROTATE:3},Bl=0,Ua=1,Gl=2;var gn=1,zl=2,zn=3,Ci=0,wt=1,ri=2,vi=0,_n=1,yi=2,Fa=3,Oa=4,kl=5;var xn=100,Hl=101,Vl=102,Wl=103,Xl=104,ql=200,Yl=201,Kl=202,Zl=203,fs=204,hs=205,Jl=206,$l=207,Ql=208,jl=209,ec=210,tc=211,ic=212,nc=213,rc=214,to=0,io=1,no=2,Sn=3,ro=4,oo=5,so=6,ao=7,ds=0,oc=1,sc=2,mi=0,ps=1,ms=2,gs=3,lr=4,_s=5,xs=6,Ss=7;var Ba=300,Pi=301,$i=302,Ms=303,vs=304,Mn=306,vn=1e3,xi=1001,lo=1002,Ct=1003,ac=1004;var co=1005;var Lt=1006,ys=1007;var Fi=1008;var Ot=1009,bs=1010,Es=1011,Qi=1012,cr=1013,$t=1014,oi=1015,Qt=1016,ur=1017,fr=1018,ji=1020,Ts=35902,As=35899,ws=1021,Rs=1022,jt=1023,gi=1026,Oi=1027,Cs=1028,hr=1029,bi=1030,dr=1031;var pr=1033,mr=33776,gr=33777,_r=33778,xr=33779,uo=35840,fo=35841,ho=35842,po=35843,mo=36196,go=37492,_o=37496,xo=37488,So=37489,kn=37490,Mo=37491,vo=37808,yo=37809,bo=37810,Eo=37811,To=37812,Ao=37813,wo=37814,Ro=37815,Co=37816,Po=37817,Lo=37818,Do=37819,Io=37820,No=37821,Uo=36492,Fo=36494,Oo=36495,Bo=36283,Go=36284,Hn=36285,zo=36286;var lc=3200;var ko=0,cc=1,Li="",Ht="srgb",Vn="srgb-linear",Wn="linear",lt="srgb";var Ps=7680;var uc=519,fc=512,hc=513,dc=514,Sr=515,pc=516,mc=517,Mr=518,gc=519,_c=35044;var Ga="300 es",_i=2e3,en=2001;function Sc(n){for(let e=n.length-1;e>=0;--e)if(n[e]>=65535)return!0;return!1}function yr(n){return document.createElementNS("http://www.w3.org/1999/xhtml",n)}function Mc(){let n=yr("canvas");return n.style.display="block",n}var xc={},vr=null;function za(...n){let e="THREE."+n.shift();vr?vr("log",e,...n):console.log(e,...n)}function vc(n){let e=n[0];if(typeof e=="string"&&e.startsWith("TSL:")){let t=n[1];t&&t.isStackTrace?n[0]+=" "+t.getLocation():n[1]='Stack trace not available. Enable "THREE.Node.captureStackTrace" to capture stack traces.'}return n}function Ie(...n){n=vc(n);let e="THREE."+n.shift();if(vr)vr("warn",e,...n);else{let t=n[0];t&&t.isStackTrace?console.warn(t.getError(e)):console.warn(e,...n)}}function et(...n){n=vc(n);let e="THREE."+n.shift();if(vr)vr("error",e,...n);else{let t=n[0];t&&t.isStackTrace?console.error(t.getError(e)):console.error(e,...n)}}function qi(...n){let e=n.join(" ");e in xc||(xc[e]=!0,Ie(...n))}function yc(n,e,t){return new Promise(function(i,r){function o(){switch(n.clientWaitSync(e,n.SYNC_FLUSH_COMMANDS_BIT,0)){case n.WAIT_FAILED:r();break;case n.TIMEOUT_EXPIRED:setTimeout(o,t);break;default:i()}}setTimeout(o,t)})}var bc={[to]:io,[no]:so,[ro]:ao,[Sn]:oo,[io]:to,[so]:no,[ao]:ro,[oo]:Sn};var ei=class{addEventListener(e,t){this._listeners===void 0&&(this._listeners={});let i=this._listeners;i[e]===void 0&&(i[e]=[]),i[e].indexOf(t)===-1&&i[e].push(t)}hasEventListener(e,t){let i=this._listeners;return i===void 0?!1:i[e]!==void 0&&i[e].indexOf(t)!==-1}removeEventListener(e,t){let i=this._listeners;if(i===void 0)return;let r=i[e];if(r!==void 0){let o=r.indexOf(t);o!==-1&&r.splice(o,1)}}dispatchEvent(e){let t=this._listeners;if(t===void 0)return;let i=t[e.type];if(i!==void 0){e.target=this;let r=i.slice(0);for(let o=0,s=r.length;o<s;o++)r[o].call(this,e);e.target=null}}};var ai=["00","01","02","03","04","05","06","07","08","09","0a","0b","0c","0d","0e","0f","10","11","12","13","14","15","16","17","18","19","1a","1b","1c","1d","1e","1f","20","21","22","23","24","25","26","27","28","29","2a","2b","2c","2d","2e","2f","30","31","32","33","34","35","36","37","38","39","3a","3b","3c","3d","3e","3f","40","41","42","43","44","45","46","47","48","49","4a","4b","4c","4d","4e","4f","50","51","52","53","54","55","56","57","58","59","5a","5b","5c","5d","5e","5f","60","61","62","63","64","65","66","67","68","69","6a","6b","6c","6d","6e","6f","70","71","72","73","74","75","76","77","78","79","7a","7b","7c","7d","7e","7f","80","81","82","83","84","85","86","87","88","89","8a","8b","8c","8d","8e","8f","90","91","92","93","94","95","96","97","98","99","9a","9b","9c","9d","9e","9f","a0","a1","a2","a3","a4","a5","a6","a7","a8","a9","aa","ab","ac","ad","ae","af","b0","b1","b2","b3","b4","b5","b6","b7","b8","b9","ba","bb","bc","bd","be","bf","c0","c1","c2","c3","c4","c5","c6","c7","c8","c9","ca","cb","cc","cd","ce","cf","d0","d1","d2","d3","d4","d5","d6","d7","d8","d9","da","db","dc","dd","de","df","e0","e1","e2","e3","e4","e5","e6","e7","e8","e9","ea","eb","ec","ed","ee","ef","f0","f1","f2","f3","f4","f5","f6","f7","f8","f9","fa","fb","fc","fd","fe","ff"],Ec=1234567,yn=Math.PI/180,Xn=180/Math.PI;function Bi(){let n=Math.random()*4294967295|0,e=Math.random()*4294967295|0,t=Math.random()*4294967295|0,i=Math.random()*4294967295|0;return(ai[n&255]+ai[n>>8&255]+ai[n>>16&255]+ai[n>>24&255]+"-"+ai[e&255]+ai[e>>8&255]+"-"+ai[e>>16&15|64]+ai[e>>24&255]+"-"+ai[t&63|128]+ai[t>>8&255]+"-"+ai[t>>16&255]+ai[t>>24&255]+ai[i&255]+ai[i>>8&255]+ai[i>>16&255]+ai[i>>24&255]).toLowerCase()}function Ze(n,e,t){return Math.max(e,Math.min(t,n))}function Ls(n,e){return(n%e+e)%e}function vp(n,e,t,i,r){return i+(n-e)*(r-i)/(t-e)}function yp(n,e,t){return n!==e?(t-n)/(e-n):0}function br(n,e,t){return(1-t)*n+t*e}function bp(n,e,t,i){return br(n,e,1-Math.exp(-t*i))}function Ep(n,e=1){return e-Math.abs(Ls(n,e*2)-e)}function Tp(n,e,t){return n<=e?0:n>=t?1:(n=(n-e)/(t-e),n*n*(3-2*n))}function Ap(n,e,t){return n<=e?0:n>=t?1:(n=(n-e)/(t-e),n*n*n*(n*(n*6-15)+10))}function wp(n,e){return n+Math.floor(Math.random()*(e-n+1))}function Rp(n,e){return n+Math.random()*(e-n)}function Cp(n){return n*(.5-Math.random())}function Pp(n){n!==void 0&&(Ec=n);let e=Ec+=1831565813;return e=Math.imul(e^e>>>15,e|1),e^=e+Math.imul(e^e>>>7,e|61),((e^e>>>14)>>>0)/4294967296}function Lp(n){return n*yn}function Dp(n){return n*Xn}function Ip(n){return n>0&&Number.isInteger(n)&&2**Math.round(Math.log2(n))===n}function Np(n){return Math.pow(2,Math.ceil(Math.log(n)/Math.LN2))}function Up(n){return Math.pow(2,Math.floor(Math.log(n)/Math.LN2))}function Fp(n,e,t,i,r){let o=Math.cos,s=Math.sin,a=o(t/2),l=s(t/2),c=o((e+i)/2),h=s((e+i)/2),d=o((e-i)/2),u=s((e-i)/2),m=o((i-e)/2),_=s((i-e)/2);switch(r){case"XYX":n.set(a*h,l*d,l*u,a*c);break;case"YZY":n.set(l*u,a*h,l*d,a*c);break;case"ZXZ":n.set(l*d,l*u,a*h,a*c);break;case"XZX":n.set(a*h,l*_,l*m,a*c);break;case"YXY":n.set(l*m,a*h,l*_,a*c);break;case"ZYZ":n.set(l*_,l*m,a*h,a*c);break;default:Ie("MathUtils: .setQuaternionFromProperEuler() encountered an unknown order: "+r)}}function qn(n,e){switch(e.constructor){case Float32Array:return n;case Uint32Array:return n/4294967295;case Uint16Array:return n/65535;case Uint8Array:case Uint8ClampedArray:return n/255;case Int32Array:return Math.max(n/2147483647,-1);case Int16Array:return Math.max(n/32767,-1);case Int8Array:return Math.max(n/127,-1);default:throw new Error("THREE.MathUtils: Invalid component type.")}}function li(n,e){switch(e.constructor){case Float32Array:return n;case Uint32Array:return Math.round(n*4294967295);case Uint16Array:return Math.round(n*65535);case Uint8Array:case Uint8ClampedArray:return Math.round(n*255);case Int32Array:return Math.round(n*2147483647);case Int16Array:return Math.round(n*32767);case Int8Array:return Math.round(n*127);default:throw new Error("THREE.MathUtils: Invalid component type.")}}var ka={DEG2RAD:yn,RAD2DEG:Xn,generateUUID:Bi,clamp:Ze,euclideanModulo:Ls,mapLinear:vp,inverseLerp:yp,lerp:br,damp:bp,pingpong:Ep,smoothstep:Tp,smootherstep:Ap,randInt:wp,randFloat:Rp,randFloatSpread:Cp,seededRandom:Pp,degToRad:Lp,radToDeg:Dp,isPowerOfTwo:Ip,ceilPowerOfTwo:Np,floorPowerOfTwo:Up,setQuaternionFromProperEuler:Fp,normalize:li,denormalize:qn};var Ae=class n{static{n.prototype.isVector2=!0}constructor(e=0,t=0){this.x=e,this.y=t}get width(){return this.x}set width(e){this.x=e}get height(){return this.y}set height(e){this.y=e}set(e,t){return this.x=e,this.y=t,this}setScalar(e){return this.x=e,this.y=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;default:throw new Error("THREE.Vector2: index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;default:throw new Error("THREE.Vector2: index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y)}copy(e){return this.x=e.x,this.y=e.y,this}add(e){return this.x+=e.x,this.y+=e.y,this}addScalar(e){return this.x+=e,this.y+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this}subScalar(e){return this.x-=e,this.y-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this}multiply(e){return this.x*=e.x,this.y*=e.y,this}multiplyScalar(e){return this.x*=e,this.y*=e,this}divide(e){return this.x/=e.x,this.y/=e.y,this}divideScalar(e){return this.multiplyScalar(1/e)}applyMatrix3(e){let t=this.x,i=this.y,r=e.elements;return this.x=r[0]*t+r[3]*i+r[6],this.y=r[1]*t+r[4]*i+r[7],this}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this}clamp(e,t){return this.x=Ze(this.x,e.x,t.x),this.y=Ze(this.y,e.y,t.y),this}clampScalar(e,t){return this.x=Ze(this.x,e,t),this.y=Ze(this.y,e,t),this}clampLength(e,t){let i=this.length();return this.divideScalar(i||1).multiplyScalar(Ze(i,e,t))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this}negate(){return this.x=-this.x,this.y=-this.y,this}dot(e){return this.x*e.x+this.y*e.y}cross(e){return this.x*e.y-this.y*e.x}lengthSq(){return this.x*this.x+this.y*this.y}length(){return Math.sqrt(this.x*this.x+this.y*this.y)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)}normalize(){return this.divideScalar(this.length()||1)}angle(){return Math.atan2(-this.y,-this.x)+Math.PI}angleTo(e){let t=Math.sqrt(this.lengthSq()*e.lengthSq());if(t===0)return Math.PI/2;let i=this.dot(e)/t;return Math.acos(Ze(i,-1,1))}distanceTo(e){return Math.sqrt(this.distanceToSquared(e))}distanceToSquared(e){let t=this.x-e.x,i=this.y-e.y;return t*t+i*i}manhattanDistanceTo(e){return Math.abs(this.x-e.x)+Math.abs(this.y-e.y)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this}lerpVectors(e,t,i){return this.x=e.x+(t.x-e.x)*i,this.y=e.y+(t.y-e.y)*i,this}equals(e){return e.x===this.x&&e.y===this.y}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this}rotateAround(e,t){let i=Math.cos(t),r=Math.sin(t),o=this.x-e.x,s=this.y-e.y;return this.x=o*i-s*r+e.x,this.y=o*r+s*i+e.y,this}random(){return this.x=Math.random(),this.y=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y}};var ci=class{constructor(e=0,t=0,i=0,r=1){this.isQuaternion=!0,this._x=e,this._y=t,this._z=i,this._w=r}static slerpFlat(e,t,i,r,o,s,a){let l=i[r+0],c=i[r+1],h=i[r+2],d=i[r+3],u=o[s+0],m=o[s+1],_=o[s+2],M=o[s+3];if(d!==M||l!==u||c!==m||h!==_){let p=l*u+c*m+h*_+d*M;p<0&&(u=-u,m=-m,_=-_,M=-M,p=-p);let f=1-a;if(p<.9995){let E=Math.acos(p),C=Math.sin(E);f=Math.sin(f*E)/C,a=Math.sin(a*E)/C,l=l*f+u*a,c=c*f+m*a,h=h*f+_*a,d=d*f+M*a}else{l=l*f+u*a,c=c*f+m*a,h=h*f+_*a,d=d*f+M*a;let E=1/Math.sqrt(l*l+c*c+h*h+d*d);l*=E,c*=E,h*=E,d*=E}}e[t]=l,e[t+1]=c,e[t+2]=h,e[t+3]=d}static multiplyQuaternionsFlat(e,t,i,r,o,s){let a=i[r],l=i[r+1],c=i[r+2],h=i[r+3],d=o[s],u=o[s+1],m=o[s+2],_=o[s+3];return e[t]=a*_+h*d+l*m-c*u,e[t+1]=l*_+h*u+c*d-a*m,e[t+2]=c*_+h*m+a*u-l*d,e[t+3]=h*_-a*d-l*u-c*m,e}get x(){return this._x}set x(e){this._x=e,this._onChangeCallback()}get y(){return this._y}set y(e){this._y=e,this._onChangeCallback()}get z(){return this._z}set z(e){this._z=e,this._onChangeCallback()}get w(){return this._w}set w(e){this._w=e,this._onChangeCallback()}set(e,t,i,r){return this._x=e,this._y=t,this._z=i,this._w=r,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._w)}copy(e){return this._x=e.x,this._y=e.y,this._z=e.z,this._w=e.w,this._onChangeCallback(),this}setFromEuler(e,t=!0){let i=e._x,r=e._y,o=e._z,s=e._order,a=Math.cos,l=Math.sin,c=a(i/2),h=a(r/2),d=a(o/2),u=l(i/2),m=l(r/2),_=l(o/2);switch(s){case"XYZ":this._x=u*h*d+c*m*_,this._y=c*m*d-u*h*_,this._z=c*h*_+u*m*d,this._w=c*h*d-u*m*_;break;case"YXZ":this._x=u*h*d+c*m*_,this._y=c*m*d-u*h*_,this._z=c*h*_-u*m*d,this._w=c*h*d+u*m*_;break;case"ZXY":this._x=u*h*d-c*m*_,this._y=c*m*d+u*h*_,this._z=c*h*_+u*m*d,this._w=c*h*d-u*m*_;break;case"ZYX":this._x=u*h*d-c*m*_,this._y=c*m*d+u*h*_,this._z=c*h*_-u*m*d,this._w=c*h*d+u*m*_;break;case"YZX":this._x=u*h*d+c*m*_,this._y=c*m*d+u*h*_,this._z=c*h*_-u*m*d,this._w=c*h*d-u*m*_;break;case"XZY":this._x=u*h*d-c*m*_,this._y=c*m*d-u*h*_,this._z=c*h*_+u*m*d,this._w=c*h*d+u*m*_;break;default:Ie("Quaternion: .setFromEuler() encountered an unknown order: "+s)}return t===!0&&this._onChangeCallback(),this}setFromAxisAngle(e,t){let i=t/2,r=Math.sin(i);return this._x=e.x*r,this._y=e.y*r,this._z=e.z*r,this._w=Math.cos(i),this._onChangeCallback(),this}setFromRotationMatrix(e){let t=e.elements,i=t[0],r=t[4],o=t[8],s=t[1],a=t[5],l=t[9],c=t[2],h=t[6],d=t[10],u=i+a+d;if(u>0){let m=.5/Math.sqrt(u+1);this._w=.25/m,this._x=(h-l)*m,this._y=(o-c)*m,this._z=(s-r)*m}else if(i>a&&i>d){let m=2*Math.sqrt(1+i-a-d);this._w=(h-l)/m,this._x=.25*m,this._y=(r+s)/m,this._z=(o+c)/m}else if(a>d){let m=2*Math.sqrt(1+a-i-d);this._w=(o-c)/m,this._x=(r+s)/m,this._y=.25*m,this._z=(l+h)/m}else{let m=2*Math.sqrt(1+d-i-a);this._w=(s-r)/m,this._x=(o+c)/m,this._y=(l+h)/m,this._z=.25*m}return this._onChangeCallback(),this}setFromUnitVectors(e,t){let i=e.dot(t)+1;return i<1e-8?(i=0,Math.abs(e.x)>Math.abs(e.z)?(this._x=-e.y,this._y=e.x,this._z=0,this._w=i):(this._x=0,this._y=-e.z,this._z=e.y,this._w=i)):(this._x=e.y*t.z-e.z*t.y,this._y=e.z*t.x-e.x*t.z,this._z=e.x*t.y-e.y*t.x,this._w=i),this.normalize()}angleTo(e){return 2*Math.acos(Math.abs(Ze(this.dot(e),-1,1)))}rotateTowards(e,t){let i=this.angleTo(e);if(i===0)return this;let r=Math.min(1,t/i);return this.slerp(e,r),this}identity(){return this.set(0,0,0,1)}invert(){return this.conjugate()}conjugate(){return this._x*=-1,this._y*=-1,this._z*=-1,this._onChangeCallback(),this}dot(e){return this._x*e._x+this._y*e._y+this._z*e._z+this._w*e._w}lengthSq(){return this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w}length(){return Math.sqrt(this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w)}normalize(){let e=this.length();return e===0?(this._x=0,this._y=0,this._z=0,this._w=1):(e=1/e,this._x=this._x*e,this._y=this._y*e,this._z=this._z*e,this._w=this._w*e),this._onChangeCallback(),this}multiply(e){return this.multiplyQuaternions(this,e)}premultiply(e){return this.multiplyQuaternions(e,this)}multiplyQuaternions(e,t){let i=e._x,r=e._y,o=e._z,s=e._w,a=t._x,l=t._y,c=t._z,h=t._w;return this._x=i*h+s*a+r*c-o*l,this._y=r*h+s*l+o*a-i*c,this._z=o*h+s*c+i*l-r*a,this._w=s*h-i*a-r*l-o*c,this._onChangeCallback(),this}slerp(e,t){let i=e._x,r=e._y,o=e._z,s=e._w,a=this.dot(e);a<0&&(i=-i,r=-r,o=-o,s=-s,a=-a);let l=1-t;if(a<.9995){let c=Math.acos(a),h=Math.sin(c);l=Math.sin(l*c)/h,t=Math.sin(t*c)/h,this._x=this._x*l+i*t,this._y=this._y*l+r*t,this._z=this._z*l+o*t,this._w=this._w*l+s*t,this._onChangeCallback()}else this._x=this._x*l+i*t,this._y=this._y*l+r*t,this._z=this._z*l+o*t,this._w=this._w*l+s*t,this.normalize();return this}slerpQuaternions(e,t,i){return this.copy(e).slerp(t,i)}random(){let e=2*Math.PI*Math.random(),t=2*Math.PI*Math.random(),i=Math.random(),r=Math.sqrt(1-i),o=Math.sqrt(i);return this.set(r*Math.sin(e),r*Math.cos(e),o*Math.sin(t),o*Math.cos(t))}equals(e){return e._x===this._x&&e._y===this._y&&e._z===this._z&&e._w===this._w}fromArray(e,t=0){return this._x=e[t],this._y=e[t+1],this._z=e[t+2],this._w=e[t+3],this._onChangeCallback(),this}toArray(e=[],t=0){return e[t]=this._x,e[t+1]=this._y,e[t+2]=this._z,e[t+3]=this._w,e}fromBufferAttribute(e,t){return this._x=e.getX(t),this._y=e.getY(t),this._z=e.getZ(t),this._w=e.getW(t),this._onChangeCallback(),this}toJSON(){return this.toArray()}_onChange(e){return this._onChangeCallback=e,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._w}};var U=class n{static{n.prototype.isVector3=!0}constructor(e=0,t=0,i=0){this.x=e,this.y=t,this.z=i}set(e,t,i){return i===void 0&&(i=this.z),this.x=e,this.y=t,this.z=i,this}setScalar(e){return this.x=e,this.y=e,this.z=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setZ(e){return this.z=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;case 2:this.z=t;break;default:throw new Error("THREE.Vector3: index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;case 2:return this.z;default:throw new Error("THREE.Vector3: index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y,this.z)}copy(e){return this.x=e.x,this.y=e.y,this.z=e.z,this}add(e){return this.x+=e.x,this.y+=e.y,this.z+=e.z,this}addScalar(e){return this.x+=e,this.y+=e,this.z+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this.z=e.z+t.z,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this.z+=e.z*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this.z-=e.z,this}subScalar(e){return this.x-=e,this.y-=e,this.z-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this.z=e.z-t.z,this}multiply(e){return this.x*=e.x,this.y*=e.y,this.z*=e.z,this}multiplyScalar(e){return this.x*=e,this.y*=e,this.z*=e,this}multiplyVectors(e,t){return this.x=e.x*t.x,this.y=e.y*t.y,this.z=e.z*t.z,this}applyEuler(e){return this.applyQuaternion(Tc.setFromEuler(e))}applyAxisAngle(e,t){return this.applyQuaternion(Tc.setFromAxisAngle(e,t))}applyMatrix3(e){let t=this.x,i=this.y,r=this.z,o=e.elements;return this.x=o[0]*t+o[3]*i+o[6]*r,this.y=o[1]*t+o[4]*i+o[7]*r,this.z=o[2]*t+o[5]*i+o[8]*r,this}applyNormalMatrix(e){return this.applyMatrix3(e).normalize()}applyMatrix4(e){let t=this.x,i=this.y,r=this.z,o=e.elements,s=1/(o[3]*t+o[7]*i+o[11]*r+o[15]);return this.x=(o[0]*t+o[4]*i+o[8]*r+o[12])*s,this.y=(o[1]*t+o[5]*i+o[9]*r+o[13])*s,this.z=(o[2]*t+o[6]*i+o[10]*r+o[14])*s,this}applyQuaternion(e){let t=this.x,i=this.y,r=this.z,o=e.x,s=e.y,a=e.z,l=e.w,c=2*(s*r-a*i),h=2*(a*t-o*r),d=2*(o*i-s*t);return this.x=t+l*c+s*d-a*h,this.y=i+l*h+a*c-o*d,this.z=r+l*d+o*h-s*c,this}project(e){return this.applyMatrix4(e.matrixWorldInverse).applyMatrix4(e.projectionMatrix)}unproject(e){return this.applyMatrix4(e.projectionMatrixInverse).applyMatrix4(e.matrixWorld)}transformDirection(e){let t=this.x,i=this.y,r=this.z,o=e.elements;return this.x=o[0]*t+o[4]*i+o[8]*r,this.y=o[1]*t+o[5]*i+o[9]*r,this.z=o[2]*t+o[6]*i+o[10]*r,this.normalize()}divide(e){return this.x/=e.x,this.y/=e.y,this.z/=e.z,this}divideScalar(e){return this.multiplyScalar(1/e)}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this.z=Math.min(this.z,e.z),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this.z=Math.max(this.z,e.z),this}clamp(e,t){return this.x=Ze(this.x,e.x,t.x),this.y=Ze(this.y,e.y,t.y),this.z=Ze(this.z,e.z,t.z),this}clampScalar(e,t){return this.x=Ze(this.x,e,t),this.y=Ze(this.y,e,t),this.z=Ze(this.z,e,t),this}clampLength(e,t){let i=this.length();return this.divideScalar(i||1).multiplyScalar(Ze(i,e,t))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this}dot(e){return this.x*e.x+this.y*e.y+this.z*e.z}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)}normalize(){return this.divideScalar(this.length()||1)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this.z+=(e.z-this.z)*t,this}lerpVectors(e,t,i){return this.x=e.x+(t.x-e.x)*i,this.y=e.y+(t.y-e.y)*i,this.z=e.z+(t.z-e.z)*i,this}cross(e){return this.crossVectors(this,e)}crossVectors(e,t){let i=e.x,r=e.y,o=e.z,s=t.x,a=t.y,l=t.z;return this.x=r*l-o*a,this.y=o*s-i*l,this.z=i*a-r*s,this}projectOnVector(e){let t=e.lengthSq();if(t===0)return this.set(0,0,0);let i=e.dot(this)/t;return this.copy(e).multiplyScalar(i)}projectOnPlane(e){return Ha.copy(this).projectOnVector(e),this.sub(Ha)}reflect(e){return this.sub(Ha.copy(e).multiplyScalar(2*this.dot(e)))}angleTo(e){let t=Math.sqrt(this.lengthSq()*e.lengthSq());if(t===0)return Math.PI/2;let i=this.dot(e)/t;return Math.acos(Ze(i,-1,1))}distanceTo(e){return Math.sqrt(this.distanceToSquared(e))}distanceToSquared(e){let t=this.x-e.x,i=this.y-e.y,r=this.z-e.z;return t*t+i*i+r*r}manhattanDistanceTo(e){return Math.abs(this.x-e.x)+Math.abs(this.y-e.y)+Math.abs(this.z-e.z)}setFromSpherical(e){return this.setFromSphericalCoords(e.radius,e.phi,e.theta)}setFromSphericalCoords(e,t,i){let r=Math.sin(t)*e;return this.x=r*Math.sin(i),this.y=Math.cos(t)*e,this.z=r*Math.cos(i),this}setFromCylindrical(e){return this.setFromCylindricalCoords(e.radius,e.theta,e.y)}setFromCylindricalCoords(e,t,i){return this.x=e*Math.sin(t),this.y=i,this.z=e*Math.cos(t),this}setFromMatrixPosition(e){let t=e.elements;return this.x=t[12],this.y=t[13],this.z=t[14],this}setFromMatrixScale(e){let t=this.setFromMatrixColumn(e,0).length(),i=this.setFromMatrixColumn(e,1).length(),r=this.setFromMatrixColumn(e,2).length();return this.x=t,this.y=i,this.z=r,this}setFromMatrixColumn(e,t){return this.fromArray(e.elements,t*4)}setFromMatrix3Column(e,t){return this.fromArray(e.elements,t*3)}setFromEuler(e){return this.x=e._x,this.y=e._y,this.z=e._z,this}setFromColor(e){return this.x=e.r,this.y=e.g,this.z=e.b,this}equals(e){return e.x===this.x&&e.y===this.y&&e.z===this.z}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this.z=e[t+2],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e[t+2]=this.z,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this.z=e.getZ(t),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this}randomDirection(){let e=Math.random()*Math.PI*2,t=Math.random()*2-1,i=Math.sqrt(1-t*t);return this.x=i*Math.cos(e),this.y=t,this.z=i*Math.sin(e),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z}},Ha=new U,Tc=new ci;var ke=class n{static{n.prototype.isMatrix3=!0}constructor(e,t,i,r,o,s,a,l,c){this.elements=[1,0,0,0,1,0,0,0,1],e!==void 0&&this.set(e,t,i,r,o,s,a,l,c)}set(e,t,i,r,o,s,a,l,c){let h=this.elements;return h[0]=e,h[1]=r,h[2]=a,h[3]=t,h[4]=o,h[5]=l,h[6]=i,h[7]=s,h[8]=c,this}identity(){return this.set(1,0,0,0,1,0,0,0,1),this}copy(e){let t=this.elements,i=e.elements;return t[0]=i[0],t[1]=i[1],t[2]=i[2],t[3]=i[3],t[4]=i[4],t[5]=i[5],t[6]=i[6],t[7]=i[7],t[8]=i[8],this}extractBasis(e,t,i){return e.setFromMatrix3Column(this,0),t.setFromMatrix3Column(this,1),i.setFromMatrix3Column(this,2),this}setFromMatrix4(e){let t=e.elements;return this.set(t[0],t[4],t[8],t[1],t[5],t[9],t[2],t[6],t[10]),this}multiply(e){return this.multiplyMatrices(this,e)}premultiply(e){return this.multiplyMatrices(e,this)}multiplyMatrices(e,t){let i=e.elements,r=t.elements,o=this.elements,s=i[0],a=i[3],l=i[6],c=i[1],h=i[4],d=i[7],u=i[2],m=i[5],_=i[8],M=r[0],p=r[3],f=r[6],E=r[1],C=r[4],y=r[7],b=r[2],v=r[5],D=r[8];return o[0]=s*M+a*E+l*b,o[3]=s*p+a*C+l*v,o[6]=s*f+a*y+l*D,o[1]=c*M+h*E+d*b,o[4]=c*p+h*C+d*v,o[7]=c*f+h*y+d*D,o[2]=u*M+m*E+_*b,o[5]=u*p+m*C+_*v,o[8]=u*f+m*y+_*D,this}multiplyScalar(e){let t=this.elements;return t[0]*=e,t[3]*=e,t[6]*=e,t[1]*=e,t[4]*=e,t[7]*=e,t[2]*=e,t[5]*=e,t[8]*=e,this}determinant(){let e=this.elements,t=e[0],i=e[1],r=e[2],o=e[3],s=e[4],a=e[5],l=e[6],c=e[7],h=e[8];return t*s*h-t*a*c-i*o*h+i*a*l+r*o*c-r*s*l}invert(){let e=this.elements,t=e[0],i=e[1],r=e[2],o=e[3],s=e[4],a=e[5],l=e[6],c=e[7],h=e[8],d=h*s-a*c,u=a*l-h*o,m=c*o-s*l,_=t*d+i*u+r*m;if(_===0)return this.set(0,0,0,0,0,0,0,0,0);let M=1/_;return e[0]=d*M,e[1]=(r*c-h*i)*M,e[2]=(a*i-r*s)*M,e[3]=u*M,e[4]=(h*t-r*l)*M,e[5]=(r*o-a*t)*M,e[6]=m*M,e[7]=(i*l-c*t)*M,e[8]=(s*t-i*o)*M,this}transpose(){let e,t=this.elements;return e=t[1],t[1]=t[3],t[3]=e,e=t[2],t[2]=t[6],t[6]=e,e=t[5],t[5]=t[7],t[7]=e,this}getNormalMatrix(e){return this.setFromMatrix4(e).invert().transpose()}transposeIntoArray(e){let t=this.elements;return e[0]=t[0],e[1]=t[3],e[2]=t[6],e[3]=t[1],e[4]=t[4],e[5]=t[7],e[6]=t[2],e[7]=t[5],e[8]=t[8],this}setUvTransform(e,t,i,r,o,s,a){let l=Math.cos(o),c=Math.sin(o);return this.set(i*l,i*c,-i*(l*s+c*a)+s+e,-r*c,r*l,-r*(-c*s+l*a)+a+t,0,0,1),this}scale(e,t){return qi("Matrix3: .scale() is deprecated. Use .makeScale() instead."),this.premultiply(Va.makeScale(e,t)),this}rotate(e){return qi("Matrix3: .rotate() is deprecated. Use .makeRotation() instead."),this.premultiply(Va.makeRotation(-e)),this}translate(e,t){return qi("Matrix3: .translate() is deprecated. Use .makeTranslation() instead."),this.premultiply(Va.makeTranslation(e,t)),this}makeTranslation(e,t){return e.isVector2?this.set(1,0,e.x,0,1,e.y,0,0,1):this.set(1,0,e,0,1,t,0,0,1),this}makeRotation(e){let t=Math.cos(e),i=Math.sin(e);return this.set(t,-i,0,i,t,0,0,0,1),this}makeScale(e,t){return this.set(e,0,0,0,t,0,0,0,1),this}equals(e){let t=this.elements,i=e.elements;for(let r=0;r<9;r++)if(t[r]!==i[r])return!1;return!0}fromArray(e,t=0){for(let i=0;i<9;i++)this.elements[i]=e[i+t];return this}toArray(e=[],t=0){let i=this.elements;return e[t]=i[0],e[t+1]=i[1],e[t+2]=i[2],e[t+3]=i[3],e[t+4]=i[4],e[t+5]=i[5],e[t+6]=i[6],e[t+7]=i[7],e[t+8]=i[8],e}clone(){return new this.constructor().fromArray(this.elements)}},Va=new ke;var Ac=new ke().set(.4123908,.3575843,.1804808,.212639,.7151687,.0721923,.0193308,.1191948,.9505322),wc=new ke().set(3.2409699,-1.5373832,-.4986108,-.9692436,1.8759675,.0415551,.0556301,-.203977,1.0569715);function Op(){let n={enabled:!0,workingColorSpace:Vn,spaces:{},convert:function(r,o,s){return this.enabled===!1||o===s||!o||!s||(this.spaces[o].transfer===lt&&(r.r=Gi(r.r),r.g=Gi(r.g),r.b=Gi(r.b)),this.spaces[o].primaries!==this.spaces[s].primaries&&(r.applyMatrix3(this.spaces[o].toXYZ),r.applyMatrix3(this.spaces[s].fromXYZ)),this.spaces[s].transfer===lt&&(r.r=Yn(r.r),r.g=Yn(r.g),r.b=Yn(r.b))),r},workingToColorSpace:function(r,o){return this.convert(r,this.workingColorSpace,o)},colorSpaceToWorking:function(r,o){return this.convert(r,o,this.workingColorSpace)},getPrimaries:function(r){return this.spaces[r].primaries},getTransfer:function(r){return r===Li?Wn:this.spaces[r].transfer},getToneMappingMode:function(r){return this.spaces[r].outputColorSpaceConfig.toneMappingMode||"standard"},getLuminanceCoefficients:function(r,o=this.workingColorSpace){return r.fromArray(this.spaces[o].luminanceCoefficients)},define:function(r){Object.assign(this.spaces,r)},_getMatrix:function(r,o,s){return r.copy(this.spaces[o].toXYZ).multiply(this.spaces[s].fromXYZ)},_getDrawingBufferColorSpace:function(r){return this.spaces[r].outputColorSpaceConfig.drawingBufferColorSpace},_getUnpackColorSpace:function(r=this.workingColorSpace){return this.spaces[r].workingColorSpaceConfig.unpackColorSpace},fromWorkingColorSpace:function(r,o){return qi("ColorManagement: .fromWorkingColorSpace() has been renamed to .workingToColorSpace()."),n.workingToColorSpace(r,o)},toWorkingColorSpace:function(r,o){return qi("ColorManagement: .toWorkingColorSpace() has been renamed to .colorSpaceToWorking()."),n.colorSpaceToWorking(r,o)}},e=[.64,.33,.3,.6,.15,.06],t=[.2126,.7152,.0722],i=[.3127,.329];return n.define({[Vn]:{primaries:e,whitePoint:i,transfer:Wn,toXYZ:Ac,fromXYZ:wc,luminanceCoefficients:t,workingColorSpaceConfig:{unpackColorSpace:Ht},outputColorSpaceConfig:{drawingBufferColorSpace:Ht}},[Ht]:{primaries:e,whitePoint:i,transfer:lt,toXYZ:Ac,fromXYZ:wc,luminanceCoefficients:t,outputColorSpaceConfig:{drawingBufferColorSpace:Ht}}}),n}var $e=Op();function Gi(n){return n<.04045?n*.0773993808:Math.pow(n*.9478672986+.0521327014,2.4)}function Yn(n){return n<.0031308?n*12.92:1.055*Math.pow(n,.41666)-.055}var Er,Ds=class{static getDataURL(e,t="image/png"){if(/^data:/i.test(e.src)||typeof HTMLCanvasElement>"u")return e.src;let i;if(e instanceof HTMLCanvasElement)i=e;else{Er===void 0&&(Er=yr("canvas")),Er.width=e.width,Er.height=e.height;let r=Er.getContext("2d");e instanceof ImageData?r.putImageData(e,0,0):r.drawImage(e,0,0,e.width,e.height),i=Er}return i.toDataURL(t)}static sRGBToLinear(e){if(typeof HTMLImageElement<"u"&&e instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&e instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&e instanceof ImageBitmap){let t=yr("canvas");t.width=e.width,t.height=e.height;let i=t.getContext("2d");i.drawImage(e,0,0,e.width,e.height);let r=i.getImageData(0,0,e.width,e.height),o=r.data;for(let s=0;s<o.length;s++)o[s]=Gi(o[s]/255)*255;return i.putImageData(r,0,0),t}else if(e.data){let t=e.data.slice(0);for(let i=0;i<t.length;i++)t instanceof Uint8Array||t instanceof Uint8ClampedArray?t[i]=Math.floor(Gi(t[i]/255)*255):t[i]=Gi(t[i]);return{data:t,width:e.width,height:e.height}}else return Ie("ImageUtils.sRGBToLinear(): Unsupported image type. No color space conversion applied."),e}};var Bp=0,bn=class{constructor(e=null){this.isTextureSource=!0,Object.defineProperty(this,"id",{value:Bp++}),this.uuid=Bi(),this.data=e,this.dataReady=!0,this.version=0}getSize(e){let t=this.data;return typeof HTMLVideoElement<"u"&&t instanceof HTMLVideoElement?e.set(t.videoWidth,t.videoHeight,0):typeof VideoFrame<"u"&&t instanceof VideoFrame?e.set(t.displayWidth,t.displayHeight,0):t!==null?e.set(t.width,t.height,t.depth||0):e.set(0,0,0),e}set needsUpdate(e){e===!0&&this.version++}toJSON(e){let t=e===void 0||typeof e=="string";if(!t&&e.images[this.uuid]!==void 0)return e.images[this.uuid];let i={uuid:this.uuid,url:""},r=this.data;if(r!==null){let o;if(Array.isArray(r)){o=[];for(let s=0,a=r.length;s<a;s++)r[s].isDataTexture?o.push(Wa(r[s].image)):o.push(Wa(r[s]))}else o=Wa(r);i.url=o}return t||(e.images[this.uuid]=i),i}};function Wa(n){return typeof HTMLImageElement<"u"&&n instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&n instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&n instanceof ImageBitmap?Ds.getDataURL(n):n.data?{data:Array.from(n.data),width:n.width,height:n.height,type:n.data.constructor.name}:(Ie("Texture: Unable to serialize Texture."),{})}var Gp=0,Xa=new U,Dt=class n extends ei{constructor(e=n.DEFAULT_IMAGE,t=n.DEFAULT_MAPPING,i=xi,r=xi,o=Lt,s=Fi,a=jt,l=Ot,c=n.DEFAULT_ANISOTROPY,h=Li){super(),this.isTexture=!0,Object.defineProperty(this,"id",{value:Gp++}),this.uuid=Bi(),this.name="",this.source=new bn(e),this.mipmaps=[],this.mapping=t,this.channel=0,this.wrapS=i,this.wrapT=r,this.magFilter=o,this.minFilter=s,this.anisotropy=c,this.format=a,this.internalFormat=null,this.type=l,this.offset=new Ae(0,0),this.repeat=new Ae(1,1),this.center=new Ae(0,0),this.rotation=0,this.matrixAutoUpdate=!0,this.matrix=new ke,this.generateMipmaps=!0,this.premultiplyAlpha=!1,this.flipY=!0,this.unpackAlignment=4,this.colorSpace=h,this.userData={},this.updateRanges=[],this.version=0,this.onUpdate=null,this.renderTarget=null,this.isRenderTargetTexture=!1,this.isArrayTexture=!!(e&&e.depth&&e.depth>1),this.pmremVersion=0,this.normalized=!1}get width(){return this.source.getSize(Xa).x}get height(){return this.source.getSize(Xa).y}get depth(){return this.source.getSize(Xa).z}get image(){return this.source.data}set image(e){this.source.data=e}updateMatrix(){this.matrix.setUvTransform(this.offset.x,this.offset.y,this.repeat.x,this.repeat.y,this.rotation,this.center.x,this.center.y)}addUpdateRange(e,t){this.updateRanges.push({start:e,count:t})}clearUpdateRanges(){this.updateRanges.length=0}clone(){return new this.constructor().copy(this)}copy(e){return this.name=e.name,this.source=e.source,this.mipmaps=e.mipmaps.slice(0),this.mapping=e.mapping,this.channel=e.channel,this.wrapS=e.wrapS,this.wrapT=e.wrapT,this.magFilter=e.magFilter,this.minFilter=e.minFilter,this.anisotropy=e.anisotropy,this.format=e.format,this.internalFormat=e.internalFormat,this.type=e.type,this.normalized=e.normalized,this.offset.copy(e.offset),this.repeat.copy(e.repeat),this.center.copy(e.center),this.rotation=e.rotation,this.matrixAutoUpdate=e.matrixAutoUpdate,this.matrix.copy(e.matrix),this.generateMipmaps=e.generateMipmaps,this.premultiplyAlpha=e.premultiplyAlpha,this.flipY=e.flipY,this.unpackAlignment=e.unpackAlignment,this.colorSpace=e.colorSpace,this.renderTarget=e.renderTarget,this.isRenderTargetTexture=e.isRenderTargetTexture,this.isArrayTexture=e.isArrayTexture,this.userData=JSON.parse(JSON.stringify(e.userData)),this.needsUpdate=!0,this}setValues(e){for(let t in e){let i=e[t];if(i===void 0){Ie(`Texture.setValues(): parameter '${t}' has value of undefined.`);continue}let r=this[t];if(r===void 0){Ie(`Texture.setValues(): property '${t}' does not exist.`);continue}r&&i&&r.isVector2&&i.isVector2||r&&i&&r.isVector3&&i.isVector3||r&&i&&r.isMatrix3&&i.isMatrix3?r.copy(i):this[t]=i}}toJSON(e){let t=e===void 0||typeof e=="string";if(!t&&e.textures[this.uuid]!==void 0)return e.textures[this.uuid];let i={metadata:{version:4.7,type:"Texture",generator:"Texture.toJSON"},uuid:this.uuid,name:this.name,image:this.source.toJSON(e).uuid,mapping:this.mapping,channel:this.channel,repeat:[this.repeat.x,this.repeat.y],offset:[this.offset.x,this.offset.y],center:[this.center.x,this.center.y],rotation:this.rotation,wrap:[this.wrapS,this.wrapT],format:this.format,internalFormat:this.internalFormat,type:this.type,normalized:this.normalized,colorSpace:this.colorSpace,minFilter:this.minFilter,magFilter:this.magFilter,anisotropy:this.anisotropy,flipY:this.flipY,generateMipmaps:this.generateMipmaps,premultiplyAlpha:this.premultiplyAlpha,unpackAlignment:this.unpackAlignment};return Object.keys(this.userData).length>0&&(i.userData=this.userData),t||(e.textures[this.uuid]=i),i}dispose(){this.dispatchEvent({type:"dispose"})}transformUv(e){if(this.mapping!==Ba)return e;if(e.applyMatrix3(this.matrix),e.x<0||e.x>1)switch(this.wrapS){case vn:e.x=e.x-Math.floor(e.x);break;case xi:e.x=e.x<0?0:1;break;case lo:Math.abs(Math.floor(e.x)%2)===1?e.x=Math.ceil(e.x)-e.x:e.x=e.x-Math.floor(e.x);break}if(e.y<0||e.y>1)switch(this.wrapT){case vn:e.y=e.y-Math.floor(e.y);break;case xi:e.y=e.y<0?0:1;break;case lo:Math.abs(Math.floor(e.y)%2)===1?e.y=Math.ceil(e.y)-e.y:e.y=e.y-Math.floor(e.y);break}return this.flipY&&(e.y=1-e.y),e}set needsUpdate(e){e===!0&&(this.version++,this.source.needsUpdate=!0)}set needsPMREMUpdate(e){e===!0&&this.pmremVersion++}};Dt.DEFAULT_IMAGE=null;Dt.DEFAULT_MAPPING=Ba;Dt.DEFAULT_ANISOTROPY=1;var dt=class n{static{n.prototype.isVector4=!0}constructor(e=0,t=0,i=0,r=1){this.x=e,this.y=t,this.z=i,this.w=r}get width(){return this.z}set width(e){this.z=e}get height(){return this.w}set height(e){this.w=e}set(e,t,i,r){return this.x=e,this.y=t,this.z=i,this.w=r,this}setScalar(e){return this.x=e,this.y=e,this.z=e,this.w=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setZ(e){return this.z=e,this}setW(e){return this.w=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;case 2:this.z=t;break;case 3:this.w=t;break;default:throw new Error("THREE.Vector4: index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;case 2:return this.z;case 3:return this.w;default:throw new Error("THREE.Vector4: index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y,this.z,this.w)}copy(e){return this.x=e.x,this.y=e.y,this.z=e.z,this.w=e.w!==void 0?e.w:1,this}add(e){return this.x+=e.x,this.y+=e.y,this.z+=e.z,this.w+=e.w,this}addScalar(e){return this.x+=e,this.y+=e,this.z+=e,this.w+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this.z=e.z+t.z,this.w=e.w+t.w,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this.z+=e.z*t,this.w+=e.w*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this.z-=e.z,this.w-=e.w,this}subScalar(e){return this.x-=e,this.y-=e,this.z-=e,this.w-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this.z=e.z-t.z,this.w=e.w-t.w,this}multiply(e){return this.x*=e.x,this.y*=e.y,this.z*=e.z,this.w*=e.w,this}multiplyScalar(e){return this.x*=e,this.y*=e,this.z*=e,this.w*=e,this}applyMatrix4(e){let t=this.x,i=this.y,r=this.z,o=this.w,s=e.elements;return this.x=s[0]*t+s[4]*i+s[8]*r+s[12]*o,this.y=s[1]*t+s[5]*i+s[9]*r+s[13]*o,this.z=s[2]*t+s[6]*i+s[10]*r+s[14]*o,this.w=s[3]*t+s[7]*i+s[11]*r+s[15]*o,this}divide(e){return this.x/=e.x,this.y/=e.y,this.z/=e.z,this.w/=e.w,this}divideScalar(e){return this.multiplyScalar(1/e)}setAxisAngleFromQuaternion(e){this.w=2*Math.acos(e.w);let t=Math.sqrt(1-e.w*e.w);return t<1e-4?(this.x=1,this.y=0,this.z=0):(this.x=e.x/t,this.y=e.y/t,this.z=e.z/t),this}setAxisAngleFromRotationMatrix(e){let t,i,r,o,l=e.elements,c=l[0],h=l[4],d=l[8],u=l[1],m=l[5],_=l[9],M=l[2],p=l[6],f=l[10];if(Math.abs(h-u)<.01&&Math.abs(d-M)<.01&&Math.abs(_-p)<.01){if(Math.abs(h+u)<.1&&Math.abs(d+M)<.1&&Math.abs(_+p)<.1&&Math.abs(c+m+f-3)<.1)return this.set(1,0,0,0),this;t=Math.PI;let C=(c+1)/2,y=(m+1)/2,b=(f+1)/2,v=(h+u)/4,D=(d+M)/4,S=(_+p)/4;return C>y&&C>b?C<.01?(i=0,r=.707106781,o=.707106781):(i=Math.sqrt(C),r=v/i,o=D/i):y>b?y<.01?(i=.707106781,r=0,o=.707106781):(r=Math.sqrt(y),i=v/r,o=S/r):b<.01?(i=.707106781,r=.707106781,o=0):(o=Math.sqrt(b),i=D/o,r=S/o),this.set(i,r,o,t),this}let E=Math.sqrt((p-_)*(p-_)+(d-M)*(d-M)+(u-h)*(u-h));return Math.abs(E)<.001&&(E=1),this.x=(p-_)/E,this.y=(d-M)/E,this.z=(u-h)/E,this.w=Math.acos((c+m+f-1)/2),this}setFromMatrixPosition(e){let t=e.elements;return this.x=t[12],this.y=t[13],this.z=t[14],this.w=t[15],this}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this.z=Math.min(this.z,e.z),this.w=Math.min(this.w,e.w),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this.z=Math.max(this.z,e.z),this.w=Math.max(this.w,e.w),this}clamp(e,t){return this.x=Ze(this.x,e.x,t.x),this.y=Ze(this.y,e.y,t.y),this.z=Ze(this.z,e.z,t.z),this.w=Ze(this.w,e.w,t.w),this}clampScalar(e,t){return this.x=Ze(this.x,e,t),this.y=Ze(this.y,e,t),this.z=Ze(this.z,e,t),this.w=Ze(this.w,e,t),this}clampLength(e,t){let i=this.length();return this.divideScalar(i||1).multiplyScalar(Ze(i,e,t))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this.w=Math.floor(this.w),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this.w=Math.ceil(this.w),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this.w=Math.round(this.w),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this.w=Math.trunc(this.w),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this.w=-this.w,this}dot(e){return this.x*e.x+this.y*e.y+this.z*e.z+this.w*e.w}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)+Math.abs(this.w)}normalize(){return this.divideScalar(this.length()||1)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this.z+=(e.z-this.z)*t,this.w+=(e.w-this.w)*t,this}lerpVectors(e,t,i){return this.x=e.x+(t.x-e.x)*i,this.y=e.y+(t.y-e.y)*i,this.z=e.z+(t.z-e.z)*i,this.w=e.w+(t.w-e.w)*i,this}equals(e){return e.x===this.x&&e.y===this.y&&e.z===this.z&&e.w===this.w}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this.z=e[t+2],this.w=e[t+3],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e[t+2]=this.z,e[t+3]=this.w,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this.z=e.getZ(t),this.w=e.getW(t),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this.w=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z,yield this.w}};var Is=class extends ei{constructor(e=1,t=1,i={}){super(),i=Object.assign({generateMipmaps:!1,internalFormat:null,minFilter:Lt,depthBuffer:!0,stencilBuffer:!1,resolveColorBuffer:!0,resolveDepthBuffer:!0,resolveStencilBuffer:!0,storeMultisampledColorBuffer:!0,storeMultisampledDepthBuffer:!0,storeMultisampledStencilBuffer:!0,depthTexture:null,samples:0,count:1,depth:1,multiview:!1,useArrayDepthTexture:!1},i),this.isRenderTarget=!0,this.width=e,this.height=t,this.depth=i.depth,this.scissor=new dt(0,0,e,t),this.scissorTest=!1,this.viewport=new dt(0,0,e,t),this.textures=[];let r={width:e,height:t,depth:i.depth},o=new Dt(r),s=i.count;for(let a=0;a<s;a++)this.textures[a]=o.clone(),this.textures[a].isRenderTargetTexture=!0,this.textures[a].renderTarget=this;this._setTextureOptions(i),this.depthBuffer=i.depthBuffer,this.stencilBuffer=i.stencilBuffer,this.resolveColorBuffer=i.resolveColorBuffer,this.resolveDepthBuffer=i.resolveDepthBuffer,this.resolveStencilBuffer=i.resolveStencilBuffer,this.storeMultisampledColorBuffer=i.storeMultisampledColorBuffer,this.storeMultisampledDepthBuffer=i.storeMultisampledDepthBuffer,this.storeMultisampledStencilBuffer=i.storeMultisampledStencilBuffer,this._depthTexture=null,this.depthTexture=i.depthTexture,this.samples=i.samples,this.multiview=i.multiview,this.useArrayDepthTexture=i.useArrayDepthTexture}_setTextureOptions(e={}){let t={minFilter:Lt,generateMipmaps:!1,flipY:!1,internalFormat:null};e.mapping!==void 0&&(t.mapping=e.mapping),e.wrapS!==void 0&&(t.wrapS=e.wrapS),e.wrapT!==void 0&&(t.wrapT=e.wrapT),e.wrapR!==void 0&&(t.wrapR=e.wrapR),e.magFilter!==void 0&&(t.magFilter=e.magFilter),e.minFilter!==void 0&&(t.minFilter=e.minFilter),e.format!==void 0&&(t.format=e.format),e.type!==void 0&&(t.type=e.type),e.anisotropy!==void 0&&(t.anisotropy=e.anisotropy),e.colorSpace!==void 0&&(t.colorSpace=e.colorSpace),e.flipY!==void 0&&(t.flipY=e.flipY),e.generateMipmaps!==void 0&&(t.generateMipmaps=e.generateMipmaps),e.internalFormat!==void 0&&(t.internalFormat=e.internalFormat);for(let i=0;i<this.textures.length;i++)this.textures[i].setValues(t)}get texture(){return this.textures[0]}set texture(e){this.textures[0]=e}set depthTexture(e){this._depthTexture!==null&&this._depthTexture.renderTarget===this&&(this._depthTexture.renderTarget=null),e!==null&&e.renderTarget===null&&(e.renderTarget=this),this._depthTexture=e}get depthTexture(){return this._depthTexture}setSize(e,t,i=1){if(this.width!==e||this.height!==t||this.depth!==i){this.width=e,this.height=t,this.depth=i;for(let r=0,o=this.textures.length;r<o;r++)this.textures[r].image.width=e,this.textures[r].image.height=t,this.textures[r].image.depth=i,this.textures[r].isData3DTexture!==!0&&(this.textures[r].isArrayTexture=this.textures[r].image.depth>1);this.dispose()}this.viewport.set(0,0,e,t),this.scissor.set(0,0,e,t)}clone(){return new this.constructor().copy(this)}copy(e){this.width=e.width,this.height=e.height,this.depth=e.depth,this.scissor.copy(e.scissor),this.scissorTest=e.scissorTest,this.viewport.copy(e.viewport),this.textures.length=0;for(let t=0,i=e.textures.length;t<i;t++){this.textures[t]=e.textures[t].clone(),this.textures[t].isRenderTargetTexture=!0,this.textures[t].renderTarget=this;let r=Object.assign({},e.textures[t].image);this.textures[t].source=new bn(r)}if(this.depthBuffer=e.depthBuffer,this.stencilBuffer=e.stencilBuffer,this.resolveColorBuffer=e.resolveColorBuffer,this.resolveDepthBuffer=e.resolveDepthBuffer,this.resolveStencilBuffer=e.resolveStencilBuffer,this.storeMultisampledColorBuffer=e.storeMultisampledColorBuffer,this.storeMultisampledDepthBuffer=e.storeMultisampledDepthBuffer,this.storeMultisampledStencilBuffer=e.storeMultisampledStencilBuffer,e.depthTexture!==null)if(e.depthTexture.renderTarget===e){let t=e.depthTexture.clone();t.renderTarget=null,this.depthTexture=t}else this.depthTexture=e.depthTexture;return this.samples=e.samples,this.multiview=e.multiview,this.useArrayDepthTexture=e.useArrayDepthTexture,this}dispose(){this.dispatchEvent({type:"dispose"})}};var Vt=class extends Is{constructor(e=1,t=1,i={}){super(e,t,i),this.isWebGLRenderTarget=!0}};var Tr=class extends Dt{constructor(e=null,t=1,i=1,r=1){super(null),this.isDataArrayTexture=!0,this.image={data:e,width:t,height:i,depth:r},this.magFilter=Ct,this.minFilter=Ct,this.wrapR=xi,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1,this.layerUpdates=new Set}copy(e){return super.copy(e),this.wrapR=e.wrapR,this}addLayerUpdate(e){this.layerUpdates.add(e)}clearLayerUpdates(){this.layerUpdates.clear()}};var Ns=class extends Dt{constructor(e=null,t=1,i=1,r=1){super(null),this.isData3DTexture=!0,this.image={data:e,width:t,height:i,depth:r},this.magFilter=Ct,this.minFilter=Ct,this.wrapR=xi,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}copy(e){return super.copy(e),this.wrapR=e.wrapR,this}};var Qe=class n{static{n.prototype.isMatrix4=!0}constructor(e,t,i,r,o,s,a,l,c,h,d,u,m,_,M,p){this.elements=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],e!==void 0&&this.set(e,t,i,r,o,s,a,l,c,h,d,u,m,_,M,p)}set(e,t,i,r,o,s,a,l,c,h,d,u,m,_,M,p){let f=this.elements;return f[0]=e,f[4]=t,f[8]=i,f[12]=r,f[1]=o,f[5]=s,f[9]=a,f[13]=l,f[2]=c,f[6]=h,f[10]=d,f[14]=u,f[3]=m,f[7]=_,f[11]=M,f[15]=p,this}identity(){return this.set(1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1),this}clone(){return new n().fromArray(this.elements)}copy(e){let t=this.elements,i=e.elements;return t[0]=i[0],t[1]=i[1],t[2]=i[2],t[3]=i[3],t[4]=i[4],t[5]=i[5],t[6]=i[6],t[7]=i[7],t[8]=i[8],t[9]=i[9],t[10]=i[10],t[11]=i[11],t[12]=i[12],t[13]=i[13],t[14]=i[14],t[15]=i[15],this}copyPosition(e){let t=this.elements,i=e.elements;return t[12]=i[12],t[13]=i[13],t[14]=i[14],this}setFromMatrix3(e){let t=e.elements;return this.set(t[0],t[3],t[6],0,t[1],t[4],t[7],0,t[2],t[5],t[8],0,0,0,0,1),this}extractBasis(e,t,i){return this.determinantAffine()===0?(e.set(1,0,0),t.set(0,1,0),i.set(0,0,1),this):(e.setFromMatrixColumn(this,0),t.setFromMatrixColumn(this,1),i.setFromMatrixColumn(this,2),this)}makeBasis(e,t,i){return this.set(e.x,t.x,i.x,0,e.y,t.y,i.y,0,e.z,t.z,i.z,0,0,0,0,1),this}extractRotation(e){if(e.determinantAffine()===0)return this.identity();let t=this.elements,i=e.elements,r=1/Ar.setFromMatrixColumn(e,0).length(),o=1/Ar.setFromMatrixColumn(e,1).length(),s=1/Ar.setFromMatrixColumn(e,2).length();return t[0]=i[0]*r,t[1]=i[1]*r,t[2]=i[2]*r,t[3]=0,t[4]=i[4]*o,t[5]=i[5]*o,t[6]=i[6]*o,t[7]=0,t[8]=i[8]*s,t[9]=i[9]*s,t[10]=i[10]*s,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,this}makeRotationFromEuler(e){let t=this.elements,i=e.x,r=e.y,o=e.z,s=Math.cos(i),a=Math.sin(i),l=Math.cos(r),c=Math.sin(r),h=Math.cos(o),d=Math.sin(o);if(e.order==="XYZ"){let u=s*h,m=s*d,_=a*h,M=a*d;t[0]=l*h,t[4]=-l*d,t[8]=c,t[1]=m+_*c,t[5]=u-M*c,t[9]=-a*l,t[2]=M-u*c,t[6]=_+m*c,t[10]=s*l}else if(e.order==="YXZ"){let u=l*h,m=l*d,_=c*h,M=c*d;t[0]=u+M*a,t[4]=_*a-m,t[8]=s*c,t[1]=s*d,t[5]=s*h,t[9]=-a,t[2]=m*a-_,t[6]=M+u*a,t[10]=s*l}else if(e.order==="ZXY"){let u=l*h,m=l*d,_=c*h,M=c*d;t[0]=u-M*a,t[4]=-s*d,t[8]=_+m*a,t[1]=m+_*a,t[5]=s*h,t[9]=M-u*a,t[2]=-s*c,t[6]=a,t[10]=s*l}else if(e.order==="ZYX"){let u=s*h,m=s*d,_=a*h,M=a*d;t[0]=l*h,t[4]=_*c-m,t[8]=u*c+M,t[1]=l*d,t[5]=M*c+u,t[9]=m*c-_,t[2]=-c,t[6]=a*l,t[10]=s*l}else if(e.order==="YZX"){let u=s*l,m=s*c,_=a*l,M=a*c;t[0]=l*h,t[4]=M-u*d,t[8]=_*d+m,t[1]=d,t[5]=s*h,t[9]=-a*h,t[2]=-c*h,t[6]=m*d+_,t[10]=u-M*d}else if(e.order==="XZY"){let u=s*l,m=s*c,_=a*l,M=a*c;t[0]=l*h,t[4]=-d,t[8]=c*h,t[1]=u*d+M,t[5]=s*h,t[9]=m*d-_,t[2]=_*d-m,t[6]=a*h,t[10]=M*d+u}return t[3]=0,t[7]=0,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,this}makeRotationFromQuaternion(e){return this.compose(zp,e,kp)}lookAt(e,t,i){let r=this.elements;return Ei.subVectors(e,t),Ei.lengthSq()===0&&(Ei.z=1),Ei.normalize(),En.crossVectors(i,Ei),En.lengthSq()===0&&(Math.abs(i.z)===1?Ei.x+=1e-4:Ei.z+=1e-4,Ei.normalize(),En.crossVectors(i,Ei)),En.normalize(),Us.crossVectors(Ei,En),r[0]=En.x,r[4]=Us.x,r[8]=Ei.x,r[1]=En.y,r[5]=Us.y,r[9]=Ei.y,r[2]=En.z,r[6]=Us.z,r[10]=Ei.z,this}multiply(e){return this.multiplyMatrices(this,e)}premultiply(e){return this.multiplyMatrices(e,this)}multiplyMatrices(e,t){let i=e.elements,r=t.elements,o=this.elements,s=i[0],a=i[4],l=i[8],c=i[12],h=i[1],d=i[5],u=i[9],m=i[13],_=i[2],M=i[6],p=i[10],f=i[14],E=i[3],C=i[7],y=i[11],b=i[15],v=r[0],D=r[4],S=r[8],T=r[12],I=r[1],G=r[5],z=r[9],W=r[13],O=r[2],X=r[6],Z=r[10],J=r[14],ae=r[3],Q=r[7],se=r[11],le=r[15];return o[0]=s*v+a*I+l*O+c*ae,o[4]=s*D+a*G+l*X+c*Q,o[8]=s*S+a*z+l*Z+c*se,o[12]=s*T+a*W+l*J+c*le,o[1]=h*v+d*I+u*O+m*ae,o[5]=h*D+d*G+u*X+m*Q,o[9]=h*S+d*z+u*Z+m*se,o[13]=h*T+d*W+u*J+m*le,o[2]=_*v+M*I+p*O+f*ae,o[6]=_*D+M*G+p*X+f*Q,o[10]=_*S+M*z+p*Z+f*se,o[14]=_*T+M*W+p*J+f*le,o[3]=E*v+C*I+y*O+b*ae,o[7]=E*D+C*G+y*X+b*Q,o[11]=E*S+C*z+y*Z+b*se,o[15]=E*T+C*W+y*J+b*le,this}multiplyScalar(e){let t=this.elements;return t[0]*=e,t[4]*=e,t[8]*=e,t[12]*=e,t[1]*=e,t[5]*=e,t[9]*=e,t[13]*=e,t[2]*=e,t[6]*=e,t[10]*=e,t[14]*=e,t[3]*=e,t[7]*=e,t[11]*=e,t[15]*=e,this}determinant(){let e=this.elements,t=e[0],i=e[4],r=e[8],o=e[12],s=e[1],a=e[5],l=e[9],c=e[13],h=e[2],d=e[6],u=e[10],m=e[14],_=e[3],M=e[7],p=e[11],f=e[15],E=l*m-c*u,C=a*m-c*d,y=a*u-l*d,b=s*m-c*h,v=s*u-l*h,D=s*d-a*h;return t*(M*E-p*C+f*y)-i*(_*E-p*b+f*v)+r*(_*C-M*b+f*D)-o*(_*y-M*v+p*D)}determinantAffine(){let e=this.elements,t=e[0],i=e[4],r=e[8],o=e[1],s=e[5],a=e[9],l=e[2],c=e[6],h=e[10];return t*(s*h-a*c)-i*(o*h-a*l)+r*(o*c-s*l)}transpose(){let e=this.elements,t;return t=e[1],e[1]=e[4],e[4]=t,t=e[2],e[2]=e[8],e[8]=t,t=e[6],e[6]=e[9],e[9]=t,t=e[3],e[3]=e[12],e[12]=t,t=e[7],e[7]=e[13],e[13]=t,t=e[11],e[11]=e[14],e[14]=t,this}setPosition(e,t,i){let r=this.elements;return e.isVector3?(r[12]=e.x,r[13]=e.y,r[14]=e.z):(r[12]=e,r[13]=t,r[14]=i),this}invert(){let e=this.elements,t=e[0],i=e[1],r=e[2],o=e[3],s=e[4],a=e[5],l=e[6],c=e[7],h=e[8],d=e[9],u=e[10],m=e[11],_=e[12],M=e[13],p=e[14],f=e[15],E=t*a-i*s,C=t*l-r*s,y=t*c-o*s,b=i*l-r*a,v=i*c-o*a,D=r*c-o*l,S=h*M-d*_,T=h*p-u*_,I=h*f-m*_,G=d*p-u*M,z=d*f-m*M,W=u*f-m*p,O=E*W-C*z+y*G+b*I-v*T+D*S;if(O===0)return this.set(0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0);let X=1/O;return e[0]=(a*W-l*z+c*G)*X,e[1]=(r*z-i*W-o*G)*X,e[2]=(M*D-p*v+f*b)*X,e[3]=(u*v-d*D-m*b)*X,e[4]=(l*I-s*W-c*T)*X,e[5]=(t*W-r*I+o*T)*X,e[6]=(p*y-_*D-f*C)*X,e[7]=(h*D-u*y+m*C)*X,e[8]=(s*z-a*I+c*S)*X,e[9]=(i*I-t*z-o*S)*X,e[10]=(_*v-M*y+f*E)*X,e[11]=(d*y-h*v-m*E)*X,e[12]=(a*T-s*G-l*S)*X,e[13]=(t*G-i*T+r*S)*X,e[14]=(M*C-_*b-p*E)*X,e[15]=(h*b-d*C+u*E)*X,this}scale(e){let t=this.elements,i=e.x,r=e.y,o=e.z;return t[0]*=i,t[4]*=r,t[8]*=o,t[1]*=i,t[5]*=r,t[9]*=o,t[2]*=i,t[6]*=r,t[10]*=o,t[3]*=i,t[7]*=r,t[11]*=o,this}getMaxScaleOnAxis(){let e=this.elements,t=e[0]*e[0]+e[1]*e[1]+e[2]*e[2],i=e[4]*e[4]+e[5]*e[5]+e[6]*e[6],r=e[8]*e[8]+e[9]*e[9]+e[10]*e[10];return Math.sqrt(Math.max(t,i,r))}makeTranslation(e,t,i){return e.isVector3?this.set(1,0,0,e.x,0,1,0,e.y,0,0,1,e.z,0,0,0,1):this.set(1,0,0,e,0,1,0,t,0,0,1,i,0,0,0,1),this}makeRotationX(e){let t=Math.cos(e),i=Math.sin(e);return this.set(1,0,0,0,0,t,-i,0,0,i,t,0,0,0,0,1),this}makeRotationY(e){let t=Math.cos(e),i=Math.sin(e);return this.set(t,0,i,0,0,1,0,0,-i,0,t,0,0,0,0,1),this}makeRotationZ(e){let t=Math.cos(e),i=Math.sin(e);return this.set(t,-i,0,0,i,t,0,0,0,0,1,0,0,0,0,1),this}makeRotationAxis(e,t){let i=Math.cos(t),r=Math.sin(t),o=1-i,s=e.x,a=e.y,l=e.z,c=o*s,h=o*a;return this.set(c*s+i,c*a-r*l,c*l+r*a,0,c*a+r*l,h*a+i,h*l-r*s,0,c*l-r*a,h*l+r*s,o*l*l+i,0,0,0,0,1),this}makeScale(e,t,i){return this.set(e,0,0,0,0,t,0,0,0,0,i,0,0,0,0,1),this}makeShear(e,t,i,r,o,s){return this.set(1,i,o,0,e,1,s,0,t,r,1,0,0,0,0,1),this}compose(e,t,i){let r=this.elements,o=t._x,s=t._y,a=t._z,l=t._w,c=o+o,h=s+s,d=a+a,u=o*c,m=o*h,_=o*d,M=s*h,p=s*d,f=a*d,E=l*c,C=l*h,y=l*d,b=i.x,v=i.y,D=i.z;return r[0]=(1-(M+f))*b,r[1]=(m+y)*b,r[2]=(_-C)*b,r[3]=0,r[4]=(m-y)*v,r[5]=(1-(u+f))*v,r[6]=(p+E)*v,r[7]=0,r[8]=(_+C)*D,r[9]=(p-E)*D,r[10]=(1-(u+M))*D,r[11]=0,r[12]=e.x,r[13]=e.y,r[14]=e.z,r[15]=1,this}decompose(e,t,i){let r=this.elements;e.x=r[12],e.y=r[13],e.z=r[14];let o=this.determinantAffine();if(o===0)return i.set(1,1,1),t.identity(),this;let s=Ar.set(r[0],r[1],r[2]).length(),a=Ar.set(r[4],r[5],r[6]).length(),l=Ar.set(r[8],r[9],r[10]).length();o<0&&(s=-s),zi.copy(this);let c=1/s,h=1/a,d=1/l;return zi.elements[0]*=c,zi.elements[1]*=c,zi.elements[2]*=c,zi.elements[4]*=h,zi.elements[5]*=h,zi.elements[6]*=h,zi.elements[8]*=d,zi.elements[9]*=d,zi.elements[10]*=d,t.setFromRotationMatrix(zi),i.x=s,i.y=a,i.z=l,this}makePerspective(e,t,i,r,o,s,a=_i,l=!1){let c=this.elements,h=2*o/(t-e),d=2*o/(i-r),u=(t+e)/(t-e),m=(i+r)/(i-r),_,M;if(l)_=o/(s-o),M=s*o/(s-o);else if(a===_i)_=-(s+o)/(s-o),M=-2*s*o/(s-o);else if(a===en)_=-s/(s-o),M=-s*o/(s-o);else throw new Error("THREE.Matrix4.makePerspective(): Invalid coordinate system: "+a);return c[0]=h,c[4]=0,c[8]=u,c[12]=0,c[1]=0,c[5]=d,c[9]=m,c[13]=0,c[2]=0,c[6]=0,c[10]=_,c[14]=M,c[3]=0,c[7]=0,c[11]=-1,c[15]=0,this}makeOrthographic(e,t,i,r,o,s,a=_i,l=!1){let c=this.elements,h=2/(t-e),d=2/(i-r),u=-(t+e)/(t-e),m=-(i+r)/(i-r),_,M;if(l)_=1/(s-o),M=s/(s-o);else if(a===_i)_=-2/(s-o),M=-(s+o)/(s-o);else if(a===en)_=-1/(s-o),M=-o/(s-o);else throw new Error("THREE.Matrix4.makeOrthographic(): Invalid coordinate system: "+a);return c[0]=h,c[4]=0,c[8]=0,c[12]=u,c[1]=0,c[5]=d,c[9]=0,c[13]=m,c[2]=0,c[6]=0,c[10]=_,c[14]=M,c[3]=0,c[7]=0,c[11]=0,c[15]=1,this}equals(e){let t=this.elements,i=e.elements;for(let r=0;r<16;r++)if(t[r]!==i[r])return!1;return!0}fromArray(e,t=0){for(let i=0;i<16;i++)this.elements[i]=e[i+t];return this}toArray(e=[],t=0){let i=this.elements;return e[t]=i[0],e[t+1]=i[1],e[t+2]=i[2],e[t+3]=i[3],e[t+4]=i[4],e[t+5]=i[5],e[t+6]=i[6],e[t+7]=i[7],e[t+8]=i[8],e[t+9]=i[9],e[t+10]=i[10],e[t+11]=i[11],e[t+12]=i[12],e[t+13]=i[13],e[t+14]=i[14],e[t+15]=i[15],e}},Ar=new U,zi=new Qe,zp=new U(0,0,0),kp=new U(1,1,1),En=new U,Us=new U,Ei=new U;var Rc=new Qe,Cc=new ci,Di=class n{constructor(e=0,t=0,i=0,r=n.DEFAULT_ORDER){this.isEuler=!0,this._x=e,this._y=t,this._z=i,this._order=r}get x(){return this._x}set x(e){this._x=e,this._onChangeCallback()}get y(){return this._y}set y(e){this._y=e,this._onChangeCallback()}get z(){return this._z}set z(e){this._z=e,this._onChangeCallback()}get order(){return this._order}set order(e){this._order=e,this._onChangeCallback()}set(e,t,i,r=this._order){return this._x=e,this._y=t,this._z=i,this._order=r,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._order)}copy(e){return this._x=e._x,this._y=e._y,this._z=e._z,this._order=e._order,this._onChangeCallback(),this}setFromRotationMatrix(e,t=this._order,i=!0){let r=e.elements,o=r[0],s=r[4],a=r[8],l=r[1],c=r[5],h=r[9],d=r[2],u=r[6],m=r[10];switch(t){case"XYZ":this._y=Math.asin(Ze(a,-1,1)),Math.abs(a)<.9999999?(this._x=Math.atan2(-h,m),this._z=Math.atan2(-s,o)):(this._x=Math.atan2(u,c),this._z=0);break;case"YXZ":this._x=Math.asin(-Ze(h,-1,1)),Math.abs(h)<.9999999?(this._y=Math.atan2(a,m),this._z=Math.atan2(l,c)):(this._y=Math.atan2(-d,o),this._z=0);break;case"ZXY":this._x=Math.asin(Ze(u,-1,1)),Math.abs(u)<.9999999?(this._y=Math.atan2(-d,m),this._z=Math.atan2(-s,c)):(this._y=0,this._z=Math.atan2(l,o));break;case"ZYX":this._y=Math.asin(-Ze(d,-1,1)),Math.abs(d)<.9999999?(this._x=Math.atan2(u,m),this._z=Math.atan2(l,o)):(this._x=0,this._z=Math.atan2(-s,c));break;case"YZX":this._z=Math.asin(Ze(l,-1,1)),Math.abs(l)<.9999999?(this._x=Math.atan2(-h,c),this._y=Math.atan2(-d,o)):(this._x=0,this._y=Math.atan2(a,m));break;case"XZY":this._z=Math.asin(-Ze(s,-1,1)),Math.abs(s)<.9999999?(this._x=Math.atan2(u,c),this._y=Math.atan2(a,o)):(this._x=Math.atan2(-h,m),this._y=0);break;default:Ie("Euler: .setFromRotationMatrix() encountered an unknown order: "+t)}return this._order=t,i===!0&&this._onChangeCallback(),this}setFromQuaternion(e,t,i){return Rc.makeRotationFromQuaternion(e),this.setFromRotationMatrix(Rc,t,i)}setFromVector3(e,t=this._order){return this.set(e.x,e.y,e.z,t)}reorder(e){return Cc.setFromEuler(this),this.setFromQuaternion(Cc,e)}equals(e){return e._x===this._x&&e._y===this._y&&e._z===this._z&&e._order===this._order}fromArray(e){return this._x=e[0],this._y=e[1],this._z=e[2],e[3]!==void 0&&(this._order=e[3]),this._onChangeCallback(),this}toArray(e=[],t=0){return e[t]=this._x,e[t+1]=this._y,e[t+2]=this._z,e[t+3]=this._order,e}_onChange(e){return this._onChangeCallback=e,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._order}};Di.DEFAULT_ORDER="XYZ";var Tn=class{constructor(){this.mask=1}set(e){this.mask=(1<<e|0)>>>0}enable(e){this.mask|=1<<e|0}enableAll(){this.mask=-1}toggle(e){this.mask^=1<<e|0}disable(e){this.mask&=~(1<<e|0)}disableAll(){this.mask=0}test(e){return(this.mask&e.mask)!==0}isEnabled(e){return(this.mask&(1<<e|0))!==0}};var Hp=0,Pc=new U,wr=new ci,tn=new Qe,Fs=new U,Ho=new U,Vp=new U,Wp=new ci,Lc=new U(1,0,0),Dc=new U(0,1,0),Ic=new U(0,0,1),Nc={type:"added"},Xp={type:"removed"},Rr={type:"childadded",child:null},qa={type:"childremoved",child:null},xt=class n extends ei{constructor(){super(),this.isObject3D=!0,Object.defineProperty(this,"id",{value:Hp++}),this.uuid=Bi(),this.name="",this.type="Object3D",this.parent=null,this.children=[],this.up=n.DEFAULT_UP.clone();let e=new U,t=new Di,i=new ci,r=new U(1,1,1);function o(){i.setFromEuler(t,!1)}function s(){t.setFromQuaternion(i,void 0,!1)}t._onChange(o),i._onChange(s),Object.defineProperties(this,{position:{configurable:!0,enumerable:!0,value:e},rotation:{configurable:!0,enumerable:!0,value:t},quaternion:{configurable:!0,enumerable:!0,value:i},scale:{configurable:!0,enumerable:!0,value:r},modelViewMatrix:{value:new Qe},normalMatrix:{value:new ke}}),this.matrix=new Qe,this.matrixWorld=new Qe,this.matrixAutoUpdate=n.DEFAULT_MATRIX_AUTO_UPDATE,this.matrixWorldAutoUpdate=n.DEFAULT_MATRIX_WORLD_AUTO_UPDATE,this.matrixWorldNeedsUpdate=!1,this.layers=new Tn,this.visible=!0,this.castShadow=!1,this.receiveShadow=!1,this.frustumCulled=!0,this.renderOrder=0,this.animations=[],this.customDepthMaterial=void 0,this.customDistanceMaterial=void 0,this.static=!1,this.userData={},this.pivot=null}onBeforeShadow(){}onAfterShadow(){}onBeforeRender(){}onAfterRender(){}applyMatrix4(e){this.matrixAutoUpdate&&this.updateMatrix(),this.matrix.premultiply(e),this.matrix.decompose(this.position,this.quaternion,this.scale)}applyQuaternion(e){return this.quaternion.premultiply(e),this}setRotationFromAxisAngle(e,t){this.quaternion.setFromAxisAngle(e,t)}setRotationFromEuler(e){this.quaternion.setFromEuler(e,!0)}setRotationFromMatrix(e){this.quaternion.setFromRotationMatrix(e)}setRotationFromQuaternion(e){this.quaternion.copy(e)}rotateOnAxis(e,t){return wr.setFromAxisAngle(e,t),this.quaternion.multiply(wr),this}rotateOnWorldAxis(e,t){return wr.setFromAxisAngle(e,t),this.quaternion.premultiply(wr),this}rotateX(e){return this.rotateOnAxis(Lc,e)}rotateY(e){return this.rotateOnAxis(Dc,e)}rotateZ(e){return this.rotateOnAxis(Ic,e)}translateOnAxis(e,t){return Pc.copy(e).applyQuaternion(this.quaternion),this.position.add(Pc.multiplyScalar(t)),this}translateX(e){return this.translateOnAxis(Lc,e)}translateY(e){return this.translateOnAxis(Dc,e)}translateZ(e){return this.translateOnAxis(Ic,e)}localToWorld(e){return this.updateWorldMatrix(!0,!1),e.applyMatrix4(this.matrixWorld)}worldToLocal(e){return this.updateWorldMatrix(!0,!1),e.applyMatrix4(tn.copy(this.matrixWorld).invert())}lookAt(e,t,i){e.isVector3?Fs.copy(e):Fs.set(e,t,i);let r=this.parent;this.updateWorldMatrix(!0,!1),Ho.setFromMatrixPosition(this.matrixWorld),this.isCamera||this.isLight?tn.lookAt(Ho,Fs,this.up):tn.lookAt(Fs,Ho,this.up),this.quaternion.setFromRotationMatrix(tn),r&&(tn.extractRotation(r.matrixWorld),wr.setFromRotationMatrix(tn),this.quaternion.premultiply(wr.invert()))}add(e){if(arguments.length>1){for(let t=0;t<arguments.length;t++)this.add(arguments[t]);return this}return e===this?(et("Object3D.add: object can't be added as a child of itself.",e),this):(e&&e.isObject3D?(e.removeFromParent(),e.parent=this,this.children.push(e),e.dispatchEvent(Nc),Rr.child=e,this.dispatchEvent(Rr),Rr.child=null):et("Object3D.add: object not an instance of THREE.Object3D.",e),this)}remove(e){if(arguments.length>1){for(let i=0;i<arguments.length;i++)this.remove(arguments[i]);return this}let t=this.children.indexOf(e);return t!==-1&&(e.parent=null,this.children.splice(t,1),e.dispatchEvent(Xp),qa.child=e,this.dispatchEvent(qa),qa.child=null),this}removeFromParent(){let e=this.parent;return e!==null&&e.remove(this),this}clear(){return this.remove(...this.children)}attach(e){return this.updateWorldMatrix(!0,!1),tn.copy(this.matrixWorld).invert(),e.parent!==null&&(e.parent.updateWorldMatrix(!0,!1),tn.multiply(e.parent.matrixWorld)),e.applyMatrix4(tn),e.removeFromParent(),e.parent=this,this.children.push(e),e.updateWorldMatrix(!1,!0),e.dispatchEvent(Nc),Rr.child=e,this.dispatchEvent(Rr),Rr.child=null,this}getObjectById(e){return this.getObjectByProperty("id",e)}getObjectByName(e){return this.getObjectByProperty("name",e)}getObjectByProperty(e,t){if(this[e]===t)return this;for(let i=0,r=this.children.length;i<r;i++){let s=this.children[i].getObjectByProperty(e,t);if(s!==void 0)return s}}getObjectsByProperty(e,t,i=[]){this[e]===t&&i.push(this);let r=this.children;for(let o=0,s=r.length;o<s;o++)r[o].getObjectsByProperty(e,t,i);return i}getWorldPosition(e){return this.updateWorldMatrix(!0,!1),e.setFromMatrixPosition(this.matrixWorld)}getWorldQuaternion(e){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(Ho,e,Vp),e}getWorldScale(e){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(Ho,Wp,e),e}getWorldDirection(e){this.updateWorldMatrix(!0,!1);let t=this.matrixWorld.elements;return e.set(t[8],t[9],t[10]).normalize()}raycast(){}intersectsFrustum(){}traverse(e){e(this);let t=this.children;for(let i=0,r=t.length;i<r;i++)t[i].traverse(e)}traverseVisible(e){if(this.visible===!1)return;e(this);let t=this.children;for(let i=0,r=t.length;i<r;i++)t[i].traverseVisible(e)}traverseAncestors(e){let t=this.parent;t!==null&&(e(t),t.traverseAncestors(e))}updateMatrix(){this.matrix.compose(this.position,this.quaternion,this.scale);let e=this.pivot;if(e!==null){let t=e.x,i=e.y,r=e.z,o=this.matrix.elements;o[12]+=t-o[0]*t-o[4]*i-o[8]*r,o[13]+=i-o[1]*t-o[5]*i-o[9]*r,o[14]+=r-o[2]*t-o[6]*i-o[10]*r}this.matrixWorldNeedsUpdate=!0}updateMatrixWorld(e){this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||e)&&(this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),this.matrixWorldNeedsUpdate=!1,e=!0);let t=this.children;for(let i=0,r=t.length;i<r;i++)t[i].updateMatrixWorld(e)}updateWorldMatrix(e,t,i=!1){let r=this.parent;if(e===!0&&r!==null&&r.updateWorldMatrix(!0,!1),this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||i)&&(this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),this.matrixWorldNeedsUpdate=!1,i=!0),t===!0){let o=this.children;for(let s=0,a=o.length;s<a;s++)o[s].updateWorldMatrix(!1,!0,i)}}toJSON(e){let t=e===void 0||typeof e=="string",i={};t&&(e={geometries:{},materials:{},textures:{},images:{},shapes:{},skeletons:{},animations:{},nodes:{}},i.metadata={version:4.7,type:"Object",generator:"Object3D.toJSON"});let r={};r.uuid=this.uuid,r.type=this.type,r.name=this.name,r.castShadow=this.castShadow,r.receiveShadow=this.receiveShadow,r.visible=this.visible,r.frustumCulled=this.frustumCulled,r.renderOrder=this.renderOrder,r.static=this.static,r.matrixAutoUpdate=this.matrixAutoUpdate,Object.keys(this.userData).length>0&&(r.userData=this.userData),r.layers=this.layers.mask,r.matrix=this.matrix.toArray(),r.up=this.up.toArray(),this.pivot!==null&&(r.pivot=this.pivot.toArray()),this.morphTargetDictionary!==void 0&&(r.morphTargetDictionary=Object.assign({},this.morphTargetDictionary)),this.morphTargetInfluences!==void 0&&(r.morphTargetInfluences=this.morphTargetInfluences.slice()),this.isInstancedMesh&&(r.type="InstancedMesh",r.count=this.count,r.instanceMatrix=this.instanceMatrix.toJSON(),this.instanceColor!==null&&(r.instanceColor=this.instanceColor.toJSON())),this.isBatchedMesh&&(r.type="BatchedMesh",r.perObjectFrustumCulled=this.perObjectFrustumCulled,r.sortObjects=this.sortObjects,r.drawRanges=this._drawRanges,r.reservedRanges=this._reservedRanges,r.geometryInfo=this._geometryInfo.map(a=>({...a,boundingBox:a.boundingBox?a.boundingBox.toJSON():void 0,boundingSphere:a.boundingSphere?a.boundingSphere.toJSON():void 0})),r.instanceInfo=this._instanceInfo.map(a=>({...a})),r.availableInstanceIds=this._availableInstanceIds.slice(),r.availableGeometryIds=this._availableGeometryIds.slice(),r.nextIndexStart=this._nextIndexStart,r.nextVertexStart=this._nextVertexStart,r.geometryCount=this._geometryCount,r.maxInstanceCount=this._maxInstanceCount,r.maxVertexCount=this._maxVertexCount,r.maxIndexCount=this._maxIndexCount,r.geometryInitialized=this._geometryInitialized,r.matricesTexture=this._matricesTexture.toJSON(e),r.indirectTexture=this._indirectTexture.toJSON(e),this._colorsTexture!==null&&(r.colorsTexture=this._colorsTexture.toJSON(e)),this.boundingSphere!==null&&(r.boundingSphere=this.boundingSphere.toJSON()),this.boundingBox!==null&&(r.boundingBox=this.boundingBox.toJSON()));function o(a,l){return a[l.uuid]===void 0&&(a[l.uuid]=l.toJSON(e)),l.uuid}if(this.isScene)this.background&&(this.background.isColor?r.background=this.background.toJSON():this.background.isTexture&&(r.background=this.background.toJSON(e).uuid)),this.environment&&this.environment.isTexture&&this.environment.isRenderTargetTexture!==!0&&(r.environment=this.environment.toJSON(e).uuid);else if(this.isMesh||this.isLine||this.isPoints){r.geometry=o(e.geometries,this.geometry);let a=this.geometry.parameters;if(a!==void 0&&a.shapes!==void 0){let l=a.shapes;if(Array.isArray(l))for(let c=0,h=l.length;c<h;c++){let d=l[c];o(e.shapes,d)}else o(e.shapes,l)}}if(this.isSkinnedMesh&&(r.bindMode=this.bindMode,r.bindMatrix=this.bindMatrix.toArray(),this.skeleton!==void 0&&(o(e.skeletons,this.skeleton),r.skeleton=this.skeleton.uuid)),this.material!==void 0)if(Array.isArray(this.material)){let a=[];for(let l=0,c=this.material.length;l<c;l++)a.push(o(e.materials,this.material[l]));r.material=a}else r.material=o(e.materials,this.material);if(this.children.length>0){r.children=[];for(let a=0;a<this.children.length;a++)r.children.push(this.children[a].toJSON(e).object)}if(this.animations.length>0){r.animations=[];for(let a=0;a<this.animations.length;a++){let l=this.animations[a];r.animations.push(o(e.animations,l))}}if(t){let a=s(e.geometries),l=s(e.materials),c=s(e.textures),h=s(e.images),d=s(e.shapes),u=s(e.skeletons),m=s(e.animations),_=s(e.nodes);a.length>0&&(i.geometries=a),l.length>0&&(i.materials=l),c.length>0&&(i.textures=c),h.length>0&&(i.images=h),d.length>0&&(i.shapes=d),u.length>0&&(i.skeletons=u),m.length>0&&(i.animations=m),_.length>0&&(i.nodes=_)}return i.object=r,i;function s(a){let l=[];for(let c in a){let h=a[c];delete h.metadata,l.push(h)}return l}}clone(e){return new this.constructor().copy(this,e)}copy(e,t=!0){if(this.name=e.name,this.up.copy(e.up),this.position.copy(e.position),this.rotation.order=e.rotation.order,this.quaternion.copy(e.quaternion),this.scale.copy(e.scale),this.pivot=e.pivot!==null?e.pivot.clone():null,this.matrix.copy(e.matrix),this.matrixWorld.copy(e.matrixWorld),this.matrixAutoUpdate=e.matrixAutoUpdate,this.matrixWorldAutoUpdate=e.matrixWorldAutoUpdate,this.matrixWorldNeedsUpdate=e.matrixWorldNeedsUpdate,this.layers.mask=e.layers.mask,this.visible=e.visible,this.castShadow=e.castShadow,this.receiveShadow=e.receiveShadow,this.frustumCulled=e.frustumCulled,this.renderOrder=e.renderOrder,this.static=e.static,this.animations=e.animations.slice(),this.userData=JSON.parse(JSON.stringify(e.userData)),t===!0)for(let i=0;i<e.children.length;i++){let r=e.children[i];this.add(r.clone())}return this}dispose(){this.dispatchEvent({type:"dispose"})}};xt.DEFAULT_UP=new U(0,1,0);xt.DEFAULT_MATRIX_AUTO_UPDATE=!0;xt.DEFAULT_MATRIX_WORLD_AUTO_UPDATE=!0;var Wt=class extends xt{constructor(){super(),this.isGroup=!0,this.type="Group"}};var qp={type:"move"},Cr=class{constructor(){this._targetRay=null,this._grip=null,this._hand=null}getHandSpace(){return this._hand===null&&(this._hand=new Wt,this._hand.matrixAutoUpdate=!1,this._hand.visible=!1,this._hand.joints={},this._hand.inputState={pinching:!1}),this._hand}getTargetRaySpace(){return this._targetRay===null&&(this._targetRay=new Wt,this._targetRay.matrixAutoUpdate=!1,this._targetRay.visible=!1,this._targetRay.hasLinearVelocity=!1,this._targetRay.linearVelocity=new U,this._targetRay.hasAngularVelocity=!1,this._targetRay.angularVelocity=new U),this._targetRay}getGripSpace(){return this._grip===null&&(this._grip=new Wt,this._grip.matrixAutoUpdate=!1,this._grip.visible=!1,this._grip.hasLinearVelocity=!1,this._grip.linearVelocity=new U,this._grip.hasAngularVelocity=!1,this._grip.angularVelocity=new U,this._grip.eventsEnabled=!1),this._grip}dispatchEvent(e){return this._targetRay!==null&&this._targetRay.dispatchEvent(e),this._grip!==null&&this._grip.dispatchEvent(e),this._hand!==null&&this._hand.dispatchEvent(e),this}connect(e){if(e&&e.hand){let t=this._hand;if(t)for(let i of e.hand.values())this._getHandJoint(t,i)}return this.dispatchEvent({type:"connected",data:e}),this}disconnect(e){return this.dispatchEvent({type:"disconnected",data:e}),this._targetRay!==null&&(this._targetRay.visible=!1),this._grip!==null&&(this._grip.visible=!1),this._hand!==null&&(this._hand.visible=!1),this}update(e,t,i){let r=null,o=null,s=null,a=this._targetRay,l=this._grip,c=this._hand;if(e&&t.session.visibilityState!=="visible-blurred"){if(c&&e.hand){s=!0;for(let M of e.hand.values()){let p=t.getJointPose(M,i),f=this._getHandJoint(c,M);p!==null&&(f.matrix.fromArray(p.transform.matrix),f.matrix.decompose(f.position,f.rotation,f.scale),f.matrixWorldNeedsUpdate=!0,f.jointRadius=p.radius),f.visible=p!==null}let h=c.joints["index-finger-tip"],d=c.joints["thumb-tip"],u=h.position.distanceTo(d.position),m=.02,_=.005;c.inputState.pinching&&u>m+_?(c.inputState.pinching=!1,this.dispatchEvent({type:"pinchend",handedness:e.handedness,target:this})):!c.inputState.pinching&&u<=m-_&&(c.inputState.pinching=!0,this.dispatchEvent({type:"pinchstart",handedness:e.handedness,target:this}))}else l!==null&&e.gripSpace&&(o=t.getPose(e.gripSpace,i),o!==null&&(l.matrix.fromArray(o.transform.matrix),l.matrix.decompose(l.position,l.rotation,l.scale),l.matrixWorldNeedsUpdate=!0,o.linearVelocity?(l.hasLinearVelocity=!0,l.linearVelocity.copy(o.linearVelocity)):l.hasLinearVelocity=!1,o.angularVelocity?(l.hasAngularVelocity=!0,l.angularVelocity.copy(o.angularVelocity)):l.hasAngularVelocity=!1,l.eventsEnabled&&l.dispatchEvent({type:"gripUpdated",data:e,target:this})));a!==null&&(r=t.getPose(e.targetRaySpace,i),r===null&&o!==null&&(r=o),r!==null&&(a.matrix.fromArray(r.transform.matrix),a.matrix.decompose(a.position,a.rotation,a.scale),a.matrixWorldNeedsUpdate=!0,r.linearVelocity?(a.hasLinearVelocity=!0,a.linearVelocity.copy(r.linearVelocity)):a.hasLinearVelocity=!1,r.angularVelocity?(a.hasAngularVelocity=!0,a.angularVelocity.copy(r.angularVelocity)):a.hasAngularVelocity=!1,this.dispatchEvent(qp)))}return a!==null&&(a.visible=r!==null),l!==null&&(l.visible=o!==null),c!==null&&(c.visible=s!==null),this}_getHandJoint(e,t){if(e.joints[t.jointName]===void 0){let i=new Wt;i.matrixAutoUpdate=!1,i.visible=!1,e.joints[t.jointName]=i,e.add(i)}return e.joints[t.jointName]}};var Uc={aliceblue:15792383,antiquewhite:16444375,aqua:65535,aquamarine:8388564,azure:15794175,beige:16119260,bisque:16770244,black:0,blanchedalmond:16772045,blue:255,blueviolet:9055202,brown:10824234,burlywood:14596231,cadetblue:6266528,chartreuse:8388352,chocolate:13789470,coral:16744272,cornflowerblue:6591981,cornsilk:16775388,crimson:14423100,cyan:65535,darkblue:139,darkcyan:35723,darkgoldenrod:12092939,darkgray:11119017,darkgreen:25600,darkgrey:11119017,darkkhaki:12433259,darkmagenta:9109643,darkolivegreen:5597999,darkorange:16747520,darkorchid:10040012,darkred:9109504,darksalmon:15308410,darkseagreen:9419919,darkslateblue:4734347,darkslategray:3100495,darkslategrey:3100495,darkturquoise:52945,darkviolet:9699539,deeppink:16716947,deepskyblue:49151,dimgray:6908265,dimgrey:6908265,dodgerblue:2003199,firebrick:11674146,floralwhite:16775920,forestgreen:2263842,fuchsia:16711935,gainsboro:14474460,ghostwhite:16316671,gold:16766720,goldenrod:14329120,gray:8421504,green:32768,greenyellow:11403055,grey:8421504,honeydew:15794160,hotpink:16738740,indianred:13458524,indigo:4915330,ivory:16777200,khaki:15787660,lavender:15132410,lavenderblush:16773365,lawngreen:8190976,lemonchiffon:16775885,lightblue:11393254,lightcoral:15761536,lightcyan:14745599,lightgoldenrodyellow:16448210,lightgray:13882323,lightgreen:9498256,lightgrey:13882323,lightpink:16758465,lightsalmon:16752762,lightseagreen:2142890,lightskyblue:8900346,lightslategray:7833753,lightslategrey:7833753,lightsteelblue:11584734,lightyellow:16777184,lime:65280,limegreen:3329330,linen:16445670,magenta:16711935,maroon:8388608,mediumaquamarine:6737322,mediumblue:205,mediumorchid:12211667,mediumpurple:9662683,mediumseagreen:3978097,mediumslateblue:8087790,mediumspringgreen:64154,mediumturquoise:4772300,mediumvioletred:13047173,midnightblue:1644912,mintcream:16121850,mistyrose:16770273,moccasin:16770229,navajowhite:16768685,navy:128,oldlace:16643558,olive:8421376,olivedrab:7048739,orange:16753920,orangered:16729344,orchid:14315734,palegoldenrod:15657130,palegreen:10025880,paleturquoise:11529966,palevioletred:14381203,papayawhip:16773077,peachpuff:16767673,peru:13468991,pink:16761035,plum:14524637,powderblue:11591910,purple:8388736,rebeccapurple:6697881,red:16711680,rosybrown:12357519,royalblue:4286945,saddlebrown:9127187,salmon:16416882,sandybrown:16032864,seagreen:3050327,seashell:16774638,sienna:10506797,silver:12632256,skyblue:8900331,slateblue:6970061,slategray:7372944,slategrey:7372944,snow:16775930,springgreen:65407,steelblue:4620980,tan:13808780,teal:32896,thistle:14204888,tomato:16737095,turquoise:4251856,violet:15631086,wheat:16113331,white:16777215,whitesmoke:16119285,yellow:16776960,yellowgreen:10145074},An={h:0,s:0,l:0},Os={h:0,s:0,l:0};function Ya(n,e,t){return t<0&&(t+=1),t>1&&(t-=1),t<1/6?n+(e-n)*6*t:t<1/2?e:t<2/3?n+(e-n)*6*(2/3-t):n}var Le=class{constructor(e,t,i){return this.isColor=!0,this.r=1,this.g=1,this.b=1,this.set(e,t,i)}set(e,t,i){if(t===void 0&&i===void 0){let r=e;r&&r.isColor?this.copy(r):typeof r=="number"?this.setHex(r):typeof r=="string"&&this.setStyle(r)}else this.setRGB(e,t,i);return this}setScalar(e){return this.r=e,this.g=e,this.b=e,this}setHex(e,t=Ht){return e=Math.floor(e),this.r=(e>>16&255)/255,this.g=(e>>8&255)/255,this.b=(e&255)/255,$e.colorSpaceToWorking(this,t),this}setRGB(e,t,i,r=$e.workingColorSpace){return this.r=e,this.g=t,this.b=i,$e.colorSpaceToWorking(this,r),this}setHSL(e,t,i,r=$e.workingColorSpace){if(e=Ls(e,1),t=Ze(t,0,1),i=Ze(i,0,1),t===0)this.r=this.g=this.b=i;else{let o=i<=.5?i*(1+t):i+t-i*t,s=2*i-o;this.r=Ya(s,o,e+1/3),this.g=Ya(s,o,e),this.b=Ya(s,o,e-1/3)}return $e.colorSpaceToWorking(this,r),this}setStyle(e,t=Ht){function i(o){o!==void 0&&parseFloat(o)<1&&Ie("Color: Alpha component of "+e+" will be ignored.")}let r;if(r=/^(\w+)\(([^\)]*)\)/.exec(e)){let o,s=r[1],a=r[2];switch(s){case"rgb":case"rgba":if(o=/^\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(a))return i(o[4]),this.setRGB(Math.min(255,parseInt(o[1],10))/255,Math.min(255,parseInt(o[2],10))/255,Math.min(255,parseInt(o[3],10))/255,t);if(o=/^\s*(\d+)\%\s*,\s*(\d+)\%\s*,\s*(\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(a))return i(o[4]),this.setRGB(Math.min(100,parseInt(o[1],10))/100,Math.min(100,parseInt(o[2],10))/100,Math.min(100,parseInt(o[3],10))/100,t);break;case"hsl":case"hsla":if(o=/^\s*(\d*\.?\d+)\s*,\s*(\d*\.?\d+)\%\s*,\s*(\d*\.?\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(a))return i(o[4]),this.setHSL(parseFloat(o[1])/360,parseFloat(o[2])/100,parseFloat(o[3])/100,t);break;default:Ie("Color: Unknown color model "+e)}}else if(r=/^\#([A-Fa-f\d]+)$/.exec(e)){let o=r[1],s=o.length;if(s===3)return this.setRGB(parseInt(o.charAt(0),16)/15,parseInt(o.charAt(1),16)/15,parseInt(o.charAt(2),16)/15,t);if(s===6)return this.setHex(parseInt(o,16),t);Ie("Color: Invalid hex color "+e)}else if(e&&e.length>0)return this.setColorName(e,t);return this}setColorName(e,t=Ht){let i=Uc[e.toLowerCase()];return i!==void 0?this.setHex(i,t):Ie("Color: Unknown color "+e),this}clone(){return new this.constructor(this.r,this.g,this.b)}copy(e){return this.r=e.r,this.g=e.g,this.b=e.b,this}copySRGBToLinear(e){return this.r=Gi(e.r),this.g=Gi(e.g),this.b=Gi(e.b),this}copyLinearToSRGB(e){return this.r=Yn(e.r),this.g=Yn(e.g),this.b=Yn(e.b),this}convertSRGBToLinear(){return this.copySRGBToLinear(this),this}convertLinearToSRGB(){return this.copyLinearToSRGB(this),this}getHex(e=Ht){return $e.workingToColorSpace(ui.copy(this),e),Math.round(Ze(ui.r*255,0,255))*65536+Math.round(Ze(ui.g*255,0,255))*256+Math.round(Ze(ui.b*255,0,255))}getHexString(e=Ht){return("000000"+this.getHex(e).toString(16)).slice(-6)}getHSL(e,t=$e.workingColorSpace){$e.workingToColorSpace(ui.copy(this),t);let i=ui.r,r=ui.g,o=ui.b,s=Math.max(i,r,o),a=Math.min(i,r,o),l,c,h=(a+s)/2;if(a===s)l=0,c=0;else{let d=s-a;switch(c=h<=.5?d/(s+a):d/(2-s-a),s){case i:l=(r-o)/d+(r<o?6:0);break;case r:l=(o-i)/d+2;break;case o:l=(i-r)/d+4;break}l/=6}return e.h=l,e.s=c,e.l=h,e}getRGB(e,t=$e.workingColorSpace){return $e.workingToColorSpace(ui.copy(this),t),e.r=ui.r,e.g=ui.g,e.b=ui.b,e}getStyle(e=Ht){$e.workingToColorSpace(ui.copy(this),e);let t=ui.r,i=ui.g,r=ui.b;return e!==Ht?`color(${e} ${t.toFixed(3)} ${i.toFixed(3)} ${r.toFixed(3)})`:`rgb(${Math.round(t*255)},${Math.round(i*255)},${Math.round(r*255)})`}offsetHSL(e,t,i){return this.getHSL(An),this.setHSL(An.h+e,An.s+t,An.l+i)}add(e){return this.r+=e.r,this.g+=e.g,this.b+=e.b,this}addColors(e,t){return this.r=e.r+t.r,this.g=e.g+t.g,this.b=e.b+t.b,this}addScalar(e){return this.r+=e,this.g+=e,this.b+=e,this}sub(e){return this.r=Math.max(0,this.r-e.r),this.g=Math.max(0,this.g-e.g),this.b=Math.max(0,this.b-e.b),this}multiply(e){return this.r*=e.r,this.g*=e.g,this.b*=e.b,this}multiplyScalar(e){return this.r*=e,this.g*=e,this.b*=e,this}lerp(e,t){return this.r+=(e.r-this.r)*t,this.g+=(e.g-this.g)*t,this.b+=(e.b-this.b)*t,this}lerpColors(e,t,i){return this.r=e.r+(t.r-e.r)*i,this.g=e.g+(t.g-e.g)*i,this.b=e.b+(t.b-e.b)*i,this}lerpHSL(e,t){this.getHSL(An),e.getHSL(Os);let i=br(An.h,Os.h,t),r=br(An.s,Os.s,t),o=br(An.l,Os.l,t);return this.setHSL(i,r,o),this}setFromVector3(e){return this.r=e.x,this.g=e.y,this.b=e.z,this}applyMatrix3(e){let t=this.r,i=this.g,r=this.b,o=e.elements;return this.r=o[0]*t+o[3]*i+o[6]*r,this.g=o[1]*t+o[4]*i+o[7]*r,this.b=o[2]*t+o[5]*i+o[8]*r,this}equals(e){return e.r===this.r&&e.g===this.g&&e.b===this.b}fromArray(e,t=0){return this.r=e[t],this.g=e[t+1],this.b=e[t+2],this}toArray(e=[],t=0){return e[t]=this.r,e[t+1]=this.g,e[t+2]=this.b,e}fromBufferAttribute(e,t){return this.r=e.getX(t),this.g=e.getY(t),this.b=e.getZ(t),this}toJSON(){return this.getHex()}*[Symbol.iterator](){yield this.r,yield this.g,yield this.b}},ui=new Le;Le.NAMES=Uc;var Vo=class n{constructor(e,t=25e-5){this.isFogExp2=!0,this.name="",this.color=new Le(e),this.density=t}clone(){return new n(this.color,this.density)}toJSON(){return{type:"FogExp2",name:this.name,color:this.color.getHex(),density:this.density}}};var Wo=class extends xt{constructor(){super(),this.isScene=!0,this.type="Scene",this.background=null,this.environment=null,this.fog=null,this.backgroundBlurriness=0,this.backgroundIntensity=1,this.backgroundRotation=new Di,this.environmentIntensity=1,this.environmentRotation=new Di,this.overrideMaterial=null,typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}copy(e,t){return super.copy(e,t),e.background!==null&&(this.background=e.background.clone()),e.environment!==null&&(this.environment=e.environment.clone()),e.fog!==null&&(this.fog=e.fog.clone()),this.backgroundBlurriness=e.backgroundBlurriness,this.backgroundIntensity=e.backgroundIntensity,this.backgroundRotation.copy(e.backgroundRotation),this.environmentIntensity=e.environmentIntensity,this.environmentRotation.copy(e.environmentRotation),e.overrideMaterial!==null&&(this.overrideMaterial=e.overrideMaterial.clone()),this.matrixAutoUpdate=e.matrixAutoUpdate,this}toJSON(e){let t=super.toJSON(e);return this.fog!==null&&(t.object.fog=this.fog.toJSON()),t.object.backgroundBlurriness=this.backgroundBlurriness,t.object.backgroundIntensity=this.backgroundIntensity,t.object.backgroundRotation=this.backgroundRotation.toArray(),t.object.environmentIntensity=this.environmentIntensity,t.object.environmentRotation=this.environmentRotation.toArray(),t}};var ki=new U,nn=new U,Ka=new U,rn=new U,Pr=new U,Lr=new U,Fc=new U,Za=new U,Ja=new U,$a=new U,Qa=new dt,ja=new dt,el=new dt,Yi=class n{constructor(e=new U,t=new U,i=new U){this.a=e,this.b=t,this.c=i}static getNormal(e,t,i,r){r.subVectors(i,t),ki.subVectors(e,t),r.cross(ki);let o=r.lengthSq();return o>0?r.multiplyScalar(1/Math.sqrt(o)):r.set(0,0,0)}static getBarycoord(e,t,i,r,o){ki.subVectors(r,t),nn.subVectors(i,t),Ka.subVectors(e,t);let s=ki.dot(ki),a=ki.dot(nn),l=ki.dot(Ka),c=nn.dot(nn),h=nn.dot(Ka),d=s*c-a*a;if(d===0)return o.set(0,0,0),null;let u=1/d,m=(c*l-a*h)*u,_=(s*h-a*l)*u;return o.set(1-m-_,_,m)}static containsPoint(e,t,i,r){return this.getBarycoord(e,t,i,r,rn)===null?!1:rn.x>=0&&rn.y>=0&&rn.x+rn.y<=1}static getInterpolation(e,t,i,r,o,s,a,l){return this.getBarycoord(e,t,i,r,rn)===null?(l.x=0,l.y=0,"z"in l&&(l.z=0),"w"in l&&(l.w=0),null):(l.setScalar(0),l.addScaledVector(o,rn.x),l.addScaledVector(s,rn.y),l.addScaledVector(a,rn.z),l)}static getInterpolatedAttribute(e,t,i,r,o,s){return Qa.setScalar(0),ja.setScalar(0),el.setScalar(0),Qa.fromBufferAttribute(e,t),ja.fromBufferAttribute(e,i),el.fromBufferAttribute(e,r),s.setScalar(0),s.addScaledVector(Qa,o.x),s.addScaledVector(ja,o.y),s.addScaledVector(el,o.z),s}static isFrontFacing(e,t,i,r){return ki.subVectors(i,t),nn.subVectors(e,t),ki.cross(nn).dot(r)<0}set(e,t,i){return this.a.copy(e),this.b.copy(t),this.c.copy(i),this}setFromPointsAndIndices(e,t,i,r){return this.a.copy(e[t]),this.b.copy(e[i]),this.c.copy(e[r]),this}setFromAttributeAndIndices(e,t,i,r){return this.a.fromBufferAttribute(e,t),this.b.fromBufferAttribute(e,i),this.c.fromBufferAttribute(e,r),this}clone(){return new this.constructor().copy(this)}copy(e){return this.a.copy(e.a),this.b.copy(e.b),this.c.copy(e.c),this}getArea(){return ki.subVectors(this.c,this.b),nn.subVectors(this.a,this.b),ki.cross(nn).length()*.5}getMidpoint(e){return e.addVectors(this.a,this.b).add(this.c).multiplyScalar(1/3)}getNormal(e){return n.getNormal(this.a,this.b,this.c,e)}getPlane(e){return e.setFromCoplanarPoints(this.a,this.b,this.c)}getBarycoord(e,t){return n.getBarycoord(e,this.a,this.b,this.c,t)}getInterpolation(e,t,i,r,o){return n.getInterpolation(e,this.a,this.b,this.c,t,i,r,o)}containsPoint(e){return n.containsPoint(e,this.a,this.b,this.c)}isFrontFacing(e){return n.isFrontFacing(this.a,this.b,this.c,e)}intersectsBox(e){return e.intersectsTriangle(this)}closestPointToPoint(e,t){let i=this.a,r=this.b,o=this.c,s,a;Pr.subVectors(r,i),Lr.subVectors(o,i),Za.subVectors(e,i);let l=Pr.dot(Za),c=Lr.dot(Za);if(l<=0&&c<=0)return t.copy(i);Ja.subVectors(e,r);let h=Pr.dot(Ja),d=Lr.dot(Ja);if(h>=0&&d<=h)return t.copy(r);let u=l*d-h*c;if(u<=0&&l>=0&&h<=0)return s=l/(l-h),t.copy(i).addScaledVector(Pr,s);$a.subVectors(e,o);let m=Pr.dot($a),_=Lr.dot($a);if(_>=0&&m<=_)return t.copy(o);let M=m*c-l*_;if(M<=0&&c>=0&&_<=0)return a=c/(c-_),t.copy(i).addScaledVector(Lr,a);let p=h*_-m*d;if(p<=0&&d-h>=0&&m-_>=0)return Fc.subVectors(o,r),a=(d-h)/(d-h+(m-_)),t.copy(r).addScaledVector(Fc,a);let f=1/(p+M+u);return s=M*f,a=u*f,t.copy(i).addScaledVector(Pr,s).addScaledVector(Lr,a)}equals(e){return e.a.equals(this.a)&&e.b.equals(this.b)&&e.c.equals(this.c)}};var sn=class{constructor(e=new U(1/0,1/0,1/0),t=new U(-1/0,-1/0,-1/0)){this.isBox3=!0,this.min=e,this.max=t}set(e,t){return this.min.copy(e),this.max.copy(t),this}setFromArray(e){this.makeEmpty();for(let t=0,i=e.length;t<i;t+=3)this.expandByPoint(Hi.fromArray(e,t));return this}setFromBufferAttribute(e){this.makeEmpty();for(let t=0,i=e.count;t<i;t++)this.expandByPoint(Hi.fromBufferAttribute(e,t));return this}setFromPoints(e){this.makeEmpty();for(let t=0,i=e.length;t<i;t++)this.expandByPoint(e[t]);return this}setFromCenterAndSize(e,t){let i=Hi.copy(t).multiplyScalar(.5);return this.min.copy(e).sub(i),this.max.copy(e).add(i),this}setFromObject(e,t=!1){return this.makeEmpty(),this.expandByObject(e,t)}clone(){return new this.constructor().copy(this)}copy(e){return this.min.copy(e.min),this.max.copy(e.max),this}makeEmpty(){return this.min.x=this.min.y=this.min.z=1/0,this.max.x=this.max.y=this.max.z=-1/0,this}isEmpty(){return this.max.x<this.min.x||this.max.y<this.min.y||this.max.z<this.min.z}getCenter(e){return this.isEmpty()?e.set(0,0,0):e.addVectors(this.min,this.max).multiplyScalar(.5)}getSize(e){return this.isEmpty()?e.set(0,0,0):e.subVectors(this.max,this.min)}expandByPoint(e){return this.min.min(e),this.max.max(e),this}expandByVector(e){return this.min.sub(e),this.max.add(e),this}expandByScalar(e){return this.min.addScalar(-e),this.max.addScalar(e),this}expandByObject(e,t=!1){e.updateWorldMatrix(!1,!1);let i=e.geometry;if(i!==void 0){let o=i.getAttribute("position");if(t===!0&&o!==void 0&&e.isInstancedMesh!==!0)for(let s=0,a=o.count;s<a;s++)e.isMesh===!0?e.getVertexPosition(s,Hi):Hi.fromBufferAttribute(o,s),Hi.applyMatrix4(e.matrixWorld),this.expandByPoint(Hi);else e.boundingBox!==void 0?(e.boundingBox===null&&e.computeBoundingBox(),Bs.copy(e.boundingBox)):(i.boundingBox===null&&i.computeBoundingBox(),Bs.copy(i.boundingBox)),Bs.applyMatrix4(e.matrixWorld),this.union(Bs)}let r=e.children;for(let o=0,s=r.length;o<s;o++)this.expandByObject(r[o],t);return this}containsPoint(e){return e.x>=this.min.x&&e.x<=this.max.x&&e.y>=this.min.y&&e.y<=this.max.y&&e.z>=this.min.z&&e.z<=this.max.z}containsBox(e){return this.min.x<=e.min.x&&e.max.x<=this.max.x&&this.min.y<=e.min.y&&e.max.y<=this.max.y&&this.min.z<=e.min.z&&e.max.z<=this.max.z}getParameter(e,t){return t.set((e.x-this.min.x)/(this.max.x-this.min.x),(e.y-this.min.y)/(this.max.y-this.min.y),(e.z-this.min.z)/(this.max.z-this.min.z))}intersectsBox(e){return e.max.x>=this.min.x&&e.min.x<=this.max.x&&e.max.y>=this.min.y&&e.min.y<=this.max.y&&e.max.z>=this.min.z&&e.min.z<=this.max.z}intersectsSphere(e){return this.clampPoint(e.center,Hi),Hi.distanceToSquared(e.center)<=e.radius*e.radius}intersectsPlane(e){let t,i;return e.normal.x>0?(t=e.normal.x*this.min.x,i=e.normal.x*this.max.x):(t=e.normal.x*this.max.x,i=e.normal.x*this.min.x),e.normal.y>0?(t+=e.normal.y*this.min.y,i+=e.normal.y*this.max.y):(t+=e.normal.y*this.max.y,i+=e.normal.y*this.min.y),e.normal.z>0?(t+=e.normal.z*this.min.z,i+=e.normal.z*this.max.z):(t+=e.normal.z*this.max.z,i+=e.normal.z*this.min.z),t<=-e.constant&&i>=-e.constant}intersectsTriangle(e){if(this.isEmpty())return!1;this.getCenter(Xo),Gs.subVectors(this.max,Xo),Dr.subVectors(e.a,Xo),Ir.subVectors(e.b,Xo),Nr.subVectors(e.c,Xo),wn.subVectors(Ir,Dr),Rn.subVectors(Nr,Ir),Kn.subVectors(Dr,Nr);let t=[0,-wn.z,wn.y,0,-Rn.z,Rn.y,0,-Kn.z,Kn.y,wn.z,0,-wn.x,Rn.z,0,-Rn.x,Kn.z,0,-Kn.x,-wn.y,wn.x,0,-Rn.y,Rn.x,0,-Kn.y,Kn.x,0];return!tl(t,Dr,Ir,Nr,Gs)||(t=[1,0,0,0,1,0,0,0,1],!tl(t,Dr,Ir,Nr,Gs))?!1:(zs.crossVectors(wn,Rn),t=[zs.x,zs.y,zs.z],tl(t,Dr,Ir,Nr,Gs))}clampPoint(e,t){return t.copy(e).clamp(this.min,this.max)}distanceToPoint(e){return this.clampPoint(e,Hi).distanceTo(e)}getBoundingSphere(e){return this.isEmpty()?e.makeEmpty():(this.getCenter(e.center),e.radius=this.getSize(Hi).length()*.5),e}intersect(e){return this.min.max(e.min),this.max.min(e.max),this.isEmpty()&&this.makeEmpty(),this}union(e){return this.min.min(e.min),this.max.max(e.max),this}applyMatrix4(e){return this.isEmpty()?this:(on[0].set(this.min.x,this.min.y,this.min.z).applyMatrix4(e),on[1].set(this.min.x,this.min.y,this.max.z).applyMatrix4(e),on[2].set(this.min.x,this.max.y,this.min.z).applyMatrix4(e),on[3].set(this.min.x,this.max.y,this.max.z).applyMatrix4(e),on[4].set(this.max.x,this.min.y,this.min.z).applyMatrix4(e),on[5].set(this.max.x,this.min.y,this.max.z).applyMatrix4(e),on[6].set(this.max.x,this.max.y,this.min.z).applyMatrix4(e),on[7].set(this.max.x,this.max.y,this.max.z).applyMatrix4(e),this.setFromPoints(on),this)}translate(e){return this.min.add(e),this.max.add(e),this}equals(e){return e.min.equals(this.min)&&e.max.equals(this.max)}toJSON(){return{min:this.min.toArray(),max:this.max.toArray()}}fromJSON(e){return this.min.fromArray(e.min),this.max.fromArray(e.max),this}},on=[new U,new U,new U,new U,new U,new U,new U,new U],Hi=new U,Bs=new sn,Dr=new U,Ir=new U,Nr=new U,wn=new U,Rn=new U,Kn=new U,Xo=new U,Gs=new U,zs=new U,Zn=new U;function tl(n,e,t,i,r){for(let o=0,s=n.length-3;o<=s;o+=3){Zn.fromArray(n,o);let a=r.x*Math.abs(Zn.x)+r.y*Math.abs(Zn.y)+r.z*Math.abs(Zn.z),l=e.dot(Zn),c=t.dot(Zn),h=i.dot(Zn);if(Math.max(-Math.max(l,c,h),Math.min(l,c,h))>a)return!1}return!0}var zt=new U,ks=new Ae,Yp=0,fi=class extends ei{constructor(e,t,i=!1){if(super(),Array.isArray(e))throw new TypeError("THREE.BufferAttribute: array should be a Typed Array.");this.isBufferAttribute=!0,Object.defineProperty(this,"id",{value:Yp++}),this.name="",this.array=e,this.itemSize=t,this.count=e!==void 0?e.length/t:0,this.normalized=i,this.usage=_c,this.updateRanges=[],this.gpuType=oi,this.version=0}onUploadCallback(){}set needsUpdate(e){e===!0&&this.version++}setUsage(e){return this.usage=e,this}addUpdateRange(e,t){this.updateRanges.push({start:e,count:t})}clearUpdateRanges(){this.updateRanges.length=0}copy(e){return this.name=e.name,this.array=new e.array.constructor(e.array),this.itemSize=e.itemSize,this.count=e.count,this.normalized=e.normalized,this.usage=e.usage,this.gpuType=e.gpuType,this}copyAt(e,t,i){e*=this.itemSize,i*=t.itemSize;for(let r=0,o=this.itemSize;r<o;r++)this.array[e+r]=t.array[i+r];return this}copyArray(e){return this.array.set(e),this}applyMatrix3(e){if(this.itemSize===2)for(let t=0,i=this.count;t<i;t++)ks.fromBufferAttribute(this,t),ks.applyMatrix3(e),this.setXY(t,ks.x,ks.y);else if(this.itemSize===3)for(let t=0,i=this.count;t<i;t++)zt.fromBufferAttribute(this,t),zt.applyMatrix3(e),this.setXYZ(t,zt.x,zt.y,zt.z);return this}applyMatrix4(e){for(let t=0,i=this.count;t<i;t++)zt.fromBufferAttribute(this,t),zt.applyMatrix4(e),this.setXYZ(t,zt.x,zt.y,zt.z);return this}applyNormalMatrix(e){for(let t=0,i=this.count;t<i;t++)zt.fromBufferAttribute(this,t),zt.applyNormalMatrix(e),this.setXYZ(t,zt.x,zt.y,zt.z);return this}transformDirection(e){for(let t=0,i=this.count;t<i;t++)zt.fromBufferAttribute(this,t),zt.transformDirection(e),this.setXYZ(t,zt.x,zt.y,zt.z);return this}set(e,t=0){return this.array.set(e,t),this}getComponent(e,t){let i=this.array[e*this.itemSize+t];return this.normalized&&(i=qn(i,this.array)),i}setComponent(e,t,i){return this.normalized&&(i=li(i,this.array)),this.array[e*this.itemSize+t]=i,this}getX(e){let t=this.array[e*this.itemSize];return this.normalized&&(t=qn(t,this.array)),t}setX(e,t){return this.normalized&&(t=li(t,this.array)),this.array[e*this.itemSize]=t,this}getY(e){let t=this.array[e*this.itemSize+1];return this.normalized&&(t=qn(t,this.array)),t}setY(e,t){return this.normalized&&(t=li(t,this.array)),this.array[e*this.itemSize+1]=t,this}getZ(e){let t=this.array[e*this.itemSize+2];return this.normalized&&(t=qn(t,this.array)),t}setZ(e,t){return this.normalized&&(t=li(t,this.array)),this.array[e*this.itemSize+2]=t,this}getW(e){let t=this.array[e*this.itemSize+3];return this.normalized&&(t=qn(t,this.array)),t}setW(e,t){return this.normalized&&(t=li(t,this.array)),this.array[e*this.itemSize+3]=t,this}setXY(e,t,i){return e*=this.itemSize,this.normalized&&(t=li(t,this.array),i=li(i,this.array)),this.array[e+0]=t,this.array[e+1]=i,this}setXYZ(e,t,i,r){return e*=this.itemSize,this.normalized&&(t=li(t,this.array),i=li(i,this.array),r=li(r,this.array)),this.array[e+0]=t,this.array[e+1]=i,this.array[e+2]=r,this}setXYZW(e,t,i,r,o){return e*=this.itemSize,this.normalized&&(t=li(t,this.array),i=li(i,this.array),r=li(r,this.array),o=li(o,this.array)),this.array[e+0]=t,this.array[e+1]=i,this.array[e+2]=r,this.array[e+3]=o,this}onUpload(e){return this.onUploadCallback=e,this}clone(){return new this.constructor(this.array,this.itemSize).copy(this)}toJSON(){let e={itemSize:this.itemSize,type:this.array.constructor.name,array:Array.from(this.array),normalized:this.normalized};return e.name=this.name,e.usage=this.usage,e.gpuType=this.gpuType,e}dispose(){this.dispatchEvent({type:"dispose"})}};var Ur=class extends fi{constructor(e,t,i){super(new Uint16Array(e),t,i)}};var Fr=class extends fi{constructor(e,t,i){super(new Uint32Array(e),t,i)}};var at=class extends fi{constructor(e,t,i){super(new Float32Array(e),t,i)}};var Kp=new sn,qo=new U,il=new U,Ii=class{constructor(e=new U,t=-1){this.isSphere=!0,this.center=e,this.radius=t}set(e,t){return this.center.copy(e),this.radius=t,this}setFromPoints(e,t){let i=this.center;t!==void 0?i.copy(t):Kp.setFromPoints(e).getCenter(i);let r=0;for(let o=0,s=e.length;o<s;o++)r=Math.max(r,i.distanceToSquared(e[o]));return this.radius=Math.sqrt(r),this}copy(e){return this.center.copy(e.center),this.radius=e.radius,this}isEmpty(){return this.radius<0}makeEmpty(){return this.center.set(0,0,0),this.radius=-1,this}containsPoint(e){return e.distanceToSquared(this.center)<=this.radius*this.radius}distanceToPoint(e){return e.distanceTo(this.center)-this.radius}intersectsSphere(e){let t=this.radius+e.radius;return e.center.distanceToSquared(this.center)<=t*t}intersectsBox(e){return e.intersectsSphere(this)}intersectsPlane(e){return Math.abs(e.distanceToPoint(this.center))<=this.radius}clampPoint(e,t){let i=this.center.distanceToSquared(e);return t.copy(e),i>this.radius*this.radius&&(t.sub(this.center).normalize(),t.multiplyScalar(this.radius).add(this.center)),t}getBoundingBox(e){return this.isEmpty()?(e.makeEmpty(),e):(e.set(this.center,this.center),e.expandByScalar(this.radius),e)}applyMatrix4(e){return this.center.applyMatrix4(e),this.radius=this.radius*e.getMaxScaleOnAxis(),this}translate(e){return this.center.add(e),this}expandByPoint(e){if(this.isEmpty())return this.center.copy(e),this.radius=0,this;qo.subVectors(e,this.center);let t=qo.lengthSq();if(t>this.radius*this.radius){let i=Math.sqrt(t),r=(i-this.radius)*.5;this.center.addScaledVector(qo,r/i),this.radius+=r}return this}union(e){return e.isEmpty()?this:this.isEmpty()?(this.copy(e),this):(this.center.equals(e.center)===!0?this.radius=Math.max(this.radius,e.radius):(il.subVectors(e.center,this.center).setLength(e.radius),this.expandByPoint(qo.copy(e.center).add(il)),this.expandByPoint(qo.copy(e.center).sub(il))),this)}equals(e){return e.center.equals(this.center)&&e.radius===this.radius}clone(){return new this.constructor().copy(this)}toJSON(){return{radius:this.radius,center:this.center.toArray()}}fromJSON(e){return this.radius=e.radius,this.center.fromArray(e.center),this}};var Zp=0,Ni=new Qe,nl=new xt,Or=new U,Ti=new sn,Yo=new sn,ti=new U,pt=class n extends ei{constructor(){super(),this.isBufferGeometry=!0,Object.defineProperty(this,"id",{value:Zp++}),this.uuid=Bi(),this.name="",this.type="BufferGeometry",this.index=null,this.indirect=null,this.indirectOffset=0,this.attributes={},this.morphAttributes={},this.morphTargetsRelative=!1,this.groups=[],this.boundingBox=null,this.boundingSphere=null,this.drawRange={start:0,count:1/0},this.userData={},this._transformed=!1}getIndex(){return this.index}setIndex(e){return Array.isArray(e)?this.index=new(Sc(e)?Fr:Ur)(e,1):this.index=e,this}setIndirect(e,t=0){return this.indirect=e,this.indirectOffset=t,this}getIndirect(){return this.indirect}getAttribute(e){return this.attributes[e]}setAttribute(e,t){return this.attributes[e]=t,this}deleteAttribute(e){return delete this.attributes[e],this}hasAttribute(e){return this.attributes[e]!==void 0}addGroup(e,t,i=0){this.groups.push({start:e,count:t,materialIndex:i})}clearGroups(){this.groups=[]}setDrawRange(e,t){this.drawRange.start=e,this.drawRange.count=t}applyMatrix4(e){let t=this.attributes.position;t!==void 0&&(t.applyMatrix4(e),t.needsUpdate=!0);let i=this.attributes.normal;if(i!==void 0){let o=new ke().getNormalMatrix(e);i.applyNormalMatrix(o),i.needsUpdate=!0}let r=this.attributes.tangent;return r!==void 0&&(r.transformDirection(e),r.needsUpdate=!0),this.boundingBox!==null&&this.computeBoundingBox(),this.boundingSphere!==null&&this.computeBoundingSphere(),this._transformed=!0,this}applyQuaternion(e){return Ni.makeRotationFromQuaternion(e),this.applyMatrix4(Ni),this}rotateX(e){return Ni.makeRotationX(e),this.applyMatrix4(Ni),this}rotateY(e){return Ni.makeRotationY(e),this.applyMatrix4(Ni),this}rotateZ(e){return Ni.makeRotationZ(e),this.applyMatrix4(Ni),this}translate(e,t,i){return Ni.makeTranslation(e,t,i),this.applyMatrix4(Ni),this}scale(e,t,i){return Ni.makeScale(e,t,i),this.applyMatrix4(Ni),this}lookAt(e){return nl.lookAt(e),nl.updateMatrix(),this.applyMatrix4(nl.matrix),this}center(){return this.computeBoundingBox(),this.boundingBox.getCenter(Or).negate(),this.translate(Or.x,Or.y,Or.z),this}setFromPoints(e){let t=this.getAttribute("position");if(t===void 0){let i=[];for(let r=0,o=e.length;r<o;r++){let s=e[r];i.push(s.x,s.y,s.z||0)}this.setAttribute("position",new at(i,3))}else{let i=Math.min(e.length,t.count);for(let r=0;r<i;r++){let o=e[r];t.setXYZ(r,o.x,o.y,o.z||0)}e.length>t.count&&Ie("BufferGeometry: Buffer size too small for points data. Use .dispose() and create a new geometry."),t.needsUpdate=!0}return this}computeBoundingBox(){this.boundingBox===null&&(this.boundingBox=new sn);let e=this.attributes.position,t=this.morphAttributes.position;if(e&&e.isGLBufferAttribute){et("BufferGeometry.computeBoundingBox(): GLBufferAttribute requires a manual bounding box.",this),this.boundingBox.set(new U(-1/0,-1/0,-1/0),new U(1/0,1/0,1/0));return}if(e!==void 0){if(this.boundingBox.setFromBufferAttribute(e),t)for(let i=0,r=t.length;i<r;i++){let o=t[i];Ti.setFromBufferAttribute(o),this.morphTargetsRelative?(ti.addVectors(this.boundingBox.min,Ti.min),this.boundingBox.expandByPoint(ti),ti.addVectors(this.boundingBox.max,Ti.max),this.boundingBox.expandByPoint(ti)):(this.boundingBox.expandByPoint(Ti.min),this.boundingBox.expandByPoint(Ti.max))}}else this.boundingBox.makeEmpty();(isNaN(this.boundingBox.min.x)||isNaN(this.boundingBox.min.y)||isNaN(this.boundingBox.min.z))&&et('BufferGeometry.computeBoundingBox(): Computed min/max have NaN values. The "position" attribute is likely to have NaN values.',this)}computeBoundingSphere(){this.boundingSphere===null&&(this.boundingSphere=new Ii);let e=this.attributes.position,t=this.morphAttributes.position;if(e&&e.isGLBufferAttribute){et("BufferGeometry.computeBoundingSphere(): GLBufferAttribute requires a manual bounding sphere.",this),this.boundingSphere.set(new U,1/0);return}if(e){let i=this.boundingSphere.center;if(Ti.setFromBufferAttribute(e),t)for(let o=0,s=t.length;o<s;o++){let a=t[o];Yo.setFromBufferAttribute(a),this.morphTargetsRelative?(ti.addVectors(Ti.min,Yo.min),Ti.expandByPoint(ti),ti.addVectors(Ti.max,Yo.max),Ti.expandByPoint(ti)):(Ti.expandByPoint(Yo.min),Ti.expandByPoint(Yo.max))}Ti.getCenter(i);let r=0;for(let o=0,s=e.count;o<s;o++)ti.fromBufferAttribute(e,o),r=Math.max(r,i.distanceToSquared(ti));if(t)for(let o=0,s=t.length;o<s;o++){let a=t[o],l=this.morphTargetsRelative;for(let c=0,h=a.count;c<h;c++)ti.fromBufferAttribute(a,c),l&&(Or.fromBufferAttribute(e,c),ti.add(Or)),r=Math.max(r,i.distanceToSquared(ti))}this.boundingSphere.radius=Math.sqrt(r),isNaN(this.boundingSphere.radius)&&et('BufferGeometry.computeBoundingSphere(): Computed radius is NaN. The "position" attribute is likely to have NaN values.',this)}}computeTangents(){let e=this.index,t=this.attributes;if(e===null||t.position===void 0||t.normal===void 0||t.uv===void 0){et("BufferGeometry: .computeTangents() failed. Missing required attributes (index, position, normal or uv)");return}let i=t.position,r=t.normal,o=t.uv,s=this.getAttribute("tangent");(s===void 0||s.count!==i.count)&&(s=new fi(new Float32Array(4*i.count),4),this.setAttribute("tangent",s));let a=[],l=[];for(let S=0;S<i.count;S++)a[S]=new U,l[S]=new U;let c=new U,h=new U,d=new U,u=new Ae,m=new Ae,_=new Ae,M=new U,p=new U;function f(S,T,I){c.fromBufferAttribute(i,S),h.fromBufferAttribute(i,T),d.fromBufferAttribute(i,I),u.fromBufferAttribute(o,S),m.fromBufferAttribute(o,T),_.fromBufferAttribute(o,I),h.sub(c),d.sub(c),m.sub(u),_.sub(u);let G=1/(m.x*_.y-_.x*m.y);isFinite(G)&&(M.copy(h).multiplyScalar(_.y).addScaledVector(d,-m.y).multiplyScalar(G),p.copy(d).multiplyScalar(m.x).addScaledVector(h,-_.x).multiplyScalar(G),a[S].add(M),a[T].add(M),a[I].add(M),l[S].add(p),l[T].add(p),l[I].add(p))}let E=this.groups;E.length===0&&(E=[{start:0,count:e.count}]);for(let S=0,T=E.length;S<T;++S){let I=E[S],G=I.start,z=I.count;for(let W=G,O=G+z;W<O;W+=3)f(e.getX(W+0),e.getX(W+1),e.getX(W+2))}let C=new U,y=new U,b=new U,v=new U;function D(S){b.fromBufferAttribute(r,S),v.copy(b);let T=a[S];C.copy(T),C.sub(b.multiplyScalar(b.dot(T))).normalize(),y.crossVectors(v,T);let G=y.dot(l[S])<0?-1:1;s.setXYZW(S,C.x,C.y,C.z,G)}for(let S=0,T=E.length;S<T;++S){let I=E[S],G=I.start,z=I.count;for(let W=G,O=G+z;W<O;W+=3)D(e.getX(W+0)),D(e.getX(W+1)),D(e.getX(W+2))}this._transformed=!0}computeVertexNormals(){let e=this.index,t=this.getAttribute("position");if(t!==void 0){let i=this.getAttribute("normal");if(i===void 0||i.count!==t.count)i=new fi(new Float32Array(t.count*3),3),this.setAttribute("normal",i);else for(let u=0,m=i.count;u<m;u++)i.setXYZ(u,0,0,0);let r=new U,o=new U,s=new U,a=new U,l=new U,c=new U,h=new U,d=new U;if(e)for(let u=0,m=e.count;u<m;u+=3){let _=e.getX(u+0),M=e.getX(u+1),p=e.getX(u+2);r.fromBufferAttribute(t,_),o.fromBufferAttribute(t,M),s.fromBufferAttribute(t,p),h.subVectors(s,o),d.subVectors(r,o),h.cross(d),a.fromBufferAttribute(i,_),l.fromBufferAttribute(i,M),c.fromBufferAttribute(i,p),a.add(h),l.add(h),c.add(h),i.setXYZ(_,a.x,a.y,a.z),i.setXYZ(M,l.x,l.y,l.z),i.setXYZ(p,c.x,c.y,c.z)}else for(let u=0,m=t.count;u<m;u+=3)r.fromBufferAttribute(t,u+0),o.fromBufferAttribute(t,u+1),s.fromBufferAttribute(t,u+2),h.subVectors(s,o),d.subVectors(r,o),h.cross(d),i.setXYZ(u+0,h.x,h.y,h.z),i.setXYZ(u+1,h.x,h.y,h.z),i.setXYZ(u+2,h.x,h.y,h.z);this.normalizeNormals(),i.needsUpdate=!0}}normalizeNormals(){let e=this.attributes.normal;for(let t=0,i=e.count;t<i;t++)ti.fromBufferAttribute(e,t),ti.normalize(),e.setXYZ(t,ti.x,ti.y,ti.z)}toNonIndexed(){function e(a,l){let c=a.array,h=a.itemSize,d=a.normalized,u=new c.constructor(l.length*h),m=0,_=0;for(let M=0,p=l.length;M<p;M++){a.isInterleavedBufferAttribute?m=l[M]*a.data.stride+a.offset:m=l[M]*h;for(let f=0;f<h;f++)u[_++]=c[m++]}return new fi(u,h,d)}if(this.index===null)return Ie("BufferGeometry.toNonIndexed(): BufferGeometry is already non-indexed."),this;let t=new n,i=this.index.array,r=this.attributes;for(let a in r){let l=r[a],c=e(l,i);t.setAttribute(a,c)}let o=this.morphAttributes;for(let a in o){let l=[],c=o[a];for(let h=0,d=c.length;h<d;h++){let u=c[h],m=e(u,i);l.push(m)}t.morphAttributes[a]=l}t.morphTargetsRelative=this.morphTargetsRelative;let s=this.groups;for(let a=0,l=s.length;a<l;a++){let c=s[a];t.addGroup(c.start,c.count,c.materialIndex)}return t}toJSON(){let e={metadata:{version:4.7,type:"BufferGeometry",generator:"BufferGeometry.toJSON"}};if(e.uuid=this.uuid,e.type=this.parameters!==void 0&&this._transformed===!0?"BufferGeometry":this.type,e.name=this.name,Object.keys(this.userData).length>0&&(e.userData=this.userData),this.parameters!==void 0&&this._transformed!==!0){let l=this.parameters;for(let c in l)l[c]!==void 0&&(e[c]=l[c]);return e}e.data={attributes:{}};let t=this.index;t!==null&&(e.data.index={type:t.array.constructor.name,array:Array.prototype.slice.call(t.array)});let i=this.attributes;for(let l in i){let c=i[l];e.data.attributes[l]=c.toJSON(e.data)}let r={},o=!1;for(let l in this.morphAttributes){let c=this.morphAttributes[l],h=[];for(let d=0,u=c.length;d<u;d++){let m=c[d];h.push(m.toJSON(e.data))}h.length>0&&(r[l]=h,o=!0)}o&&(e.data.morphAttributes=r,e.data.morphTargetsRelative=this.morphTargetsRelative);let s=this.groups;s.length>0&&(e.data.groups=JSON.parse(JSON.stringify(s)));let a=this.boundingSphere;return a!==null&&(e.data.boundingSphere=a.toJSON()),e}clone(){return new this.constructor().copy(this)}copy(e){this.index=null,this.attributes={},this.morphAttributes={},this.groups=[],this.boundingBox=null,this.boundingSphere=null;let t={};this.name=e.name;let i=e.index;i!==null&&this.setIndex(i.clone());let r=e.attributes;for(let c in r){let h=r[c];this.setAttribute(c,h.clone(t))}let o=e.morphAttributes;for(let c in o){let h=[],d=o[c];for(let u=0,m=d.length;u<m;u++)h.push(d[u].clone(t));this.morphAttributes[c]=h}this.morphTargetsRelative=e.morphTargetsRelative;let s=e.groups;for(let c=0,h=s.length;c<h;c++){let d=s[c];this.addGroup(d.start,d.count,d.materialIndex)}let a=e.boundingBox;a!==null&&(this.boundingBox=a.clone());let l=e.boundingSphere;return l!==null&&(this.boundingSphere=l.clone()),this.drawRange.start=e.drawRange.start,this.drawRange.count=e.drawRange.count,this.userData=e.userData,this._transformed=e._transformed,this}dispose(){this.dispatchEvent({type:"dispose"})}};var rl=new U,Jp=new U,$p=new ke,hi=class{constructor(e=new U(1,0,0),t=0){this.isPlane=!0,this.normal=e,this.constant=t}set(e,t){return this.normal.copy(e),this.constant=t,this}setComponents(e,t,i,r){return this.normal.set(e,t,i),this.constant=r,this}setFromNormalAndCoplanarPoint(e,t){return this.normal.copy(e),this.constant=-t.dot(this.normal),this}setFromCoplanarPoints(e,t,i){let r=rl.subVectors(i,t).cross(Jp.subVectors(e,t)).normalize();return this.setFromNormalAndCoplanarPoint(r,e),this}copy(e){return this.normal.copy(e.normal),this.constant=e.constant,this}normalize(){let e=1/this.normal.length();return this.normal.multiplyScalar(e),this.constant*=e,this}negate(){return this.constant*=-1,this.normal.negate(),this}distanceToPoint(e){return this.normal.dot(e)+this.constant}distanceToSphere(e){return this.distanceToPoint(e.center)-e.radius}projectPoint(e,t){return t.copy(e).addScaledVector(this.normal,-this.distanceToPoint(e))}intersectLine(e,t,i=!0){let r=e.delta(rl),o=this.normal.dot(r);if(o===0)return this.distanceToPoint(e.start)===0?t.copy(e.start):null;let s=-(e.start.dot(this.normal)+this.constant)/o;return i===!0&&(s<0||s>1)?null:t.copy(e.start).addScaledVector(r,s)}intersectsLine(e){let t=this.distanceToPoint(e.start),i=this.distanceToPoint(e.end);return t<0&&i>0||i<0&&t>0}intersectsBox(e){return e.intersectsPlane(this)}intersectsSphere(e){return e.intersectsPlane(this)}coplanarPoint(e){return e.copy(this.normal).multiplyScalar(-this.constant)}applyMatrix4(e,t){let i=t||$p.getNormalMatrix(e),r=this.coplanarPoint(rl).applyMatrix4(e),o=this.normal.applyMatrix3(i).normalize();return this.constant=-r.dot(o),this}translate(e){return this.constant-=e.dot(this.normal),this}equals(e){return e.normal.equals(this.normal)&&e.constant===this.constant}clone(){return new this.constructor().copy(this)}toJSON(){return{normal:this.normal.toArray(),constant:this.constant}}fromJSON(e){return this.normal.fromArray(e.normal),this.constant=e.constant,this}};var Qp=0,di=class extends ei{constructor(){super(),this.isMaterial=!0,Object.defineProperty(this,"id",{value:Qp++}),this.uuid=Bi(),this.name="",this.type="Material",this.blending=_n,this.side=Ci,this.vertexColors=!1,this.opacity=1,this.transparent=!1,this.alphaHash=!1,this.blendSrc=fs,this.blendDst=hs,this.blendEquation=xn,this.blendSrcAlpha=null,this.blendDstAlpha=null,this.blendEquationAlpha=null,this.blendColor=new Le(0,0,0),this.blendAlpha=0,this.depthFunc=Sn,this.depthTest=!0,this.depthWrite=!0,this.stencilWriteMask=255,this.stencilFunc=uc,this.stencilRef=0,this.stencilFuncMask=255,this.stencilFail=Ps,this.stencilZFail=Ps,this.stencilZPass=Ps,this.stencilWrite=!1,this.clippingPlanes=null,this.clipIntersection=!1,this.clipShadows=!1,this.shadowSide=null,this.colorWrite=!0,this.precision=null,this.polygonOffset=!1,this.polygonOffsetFactor=0,this.polygonOffsetUnits=0,this.dithering=!1,this.alphaToCoverage=!1,this.premultipliedAlpha=!1,this.forceSinglePass=!1,this.allowOverride=!0,this.visible=!0,this.toneMapped=!0,this.userData={},this.version=0,this._alphaTest=0}get alphaTest(){return this._alphaTest}set alphaTest(e){this._alphaTest>0!=e>0&&this.version++,this._alphaTest=e}onBeforeRender(){}onBeforeCompile(){}customProgramCacheKey(){return this.onBeforeCompile.toString()}setValues(e){if(e!==void 0)for(let t in e){let i=e[t];if(i===void 0){Ie(`Material: parameter '${t}' has value of undefined.`);continue}let r=this[t];if(r===void 0){Ie(`Material: '${t}' is not a property of THREE.${this.type}.`);continue}r&&r.isColor?r.set(i):r&&r.isVector2&&i&&i.isVector2||r&&r.isEuler&&i&&i.isEuler||r&&r.isVector3&&i&&i.isVector3?r.copy(i):this[t]=i}}toJSON(e){let t=e===void 0||typeof e=="string";t&&(e={textures:{},images:{}});let i={metadata:{version:4.7,type:"Material",generator:"Material.toJSON"}};i.uuid=this.uuid,i.type=this.type,i.blending=this.blending,i.side=this.side,i.shadowSide=this.shadowSide,i.vertexColors=this.vertexColors,i.opacity=this.opacity,i.transparent=this.transparent,i.blendSrc=this.blendSrc,i.blendDst=this.blendDst,i.blendEquation=this.blendEquation,i.blendSrcAlpha=this.blendSrcAlpha,i.blendDstAlpha=this.blendDstAlpha,i.blendEquationAlpha=this.blendEquationAlpha,i.blendColor=this.blendColor.getHex(),i.blendAlpha=this.blendAlpha,i.depthFunc=this.depthFunc,i.depthTest=this.depthTest,i.depthWrite=this.depthWrite,i.colorWrite=this.colorWrite,i.clipIntersection=this.clipIntersection,i.clipShadows=this.clipShadows,i.stencilWriteMask=this.stencilWriteMask,i.stencilFunc=this.stencilFunc,i.stencilRef=this.stencilRef,i.stencilFuncMask=this.stencilFuncMask,i.stencilFail=this.stencilFail,i.stencilZFail=this.stencilZFail,i.stencilZPass=this.stencilZPass,i.stencilWrite=this.stencilWrite,i.polygonOffset=this.polygonOffset,i.polygonOffsetFactor=this.polygonOffsetFactor,i.polygonOffsetUnits=this.polygonOffsetUnits,i.dithering=this.dithering,i.alphaTest=this.alphaTest,i.alphaHash=this.alphaHash,i.alphaToCoverage=this.alphaToCoverage,i.premultipliedAlpha=this.premultipliedAlpha,i.forceSinglePass=this.forceSinglePass,i.allowOverride=this.allowOverride,i.visible=this.visible,i.toneMapped=this.toneMapped,i.name=this.name,this.color&&this.color.isColor&&(i.color=this.color.getHex()),this.roughness!==void 0&&(i.roughness=this.roughness),this.metalness!==void 0&&(i.metalness=this.metalness),this.sheen!==void 0&&(i.sheen=this.sheen),this.sheenColor&&this.sheenColor.isColor&&(i.sheenColor=this.sheenColor.getHex()),this.sheenRoughness!==void 0&&(i.sheenRoughness=this.sheenRoughness),this.emissive&&this.emissive.isColor&&(i.emissive=this.emissive.getHex()),this.emissiveIntensity!==void 0&&(i.emissiveIntensity=this.emissiveIntensity),this.specular&&this.specular.isColor&&(i.specular=this.specular.getHex()),this.specularIntensity!==void 0&&(i.specularIntensity=this.specularIntensity),this.specularColor&&this.specularColor.isColor&&(i.specularColor=this.specularColor.getHex()),this.shininess!==void 0&&(i.shininess=this.shininess),this.clearcoat!==void 0&&(i.clearcoat=this.clearcoat),this.clearcoatRoughness!==void 0&&(i.clearcoatRoughness=this.clearcoatRoughness),this.clearcoatMap&&this.clearcoatMap.isTexture&&(i.clearcoatMap=this.clearcoatMap.toJSON(e).uuid),this.clearcoatRoughnessMap&&this.clearcoatRoughnessMap.isTexture&&(i.clearcoatRoughnessMap=this.clearcoatRoughnessMap.toJSON(e).uuid),this.clearcoatNormalMap&&this.clearcoatNormalMap.isTexture&&(i.clearcoatNormalMap=this.clearcoatNormalMap.toJSON(e).uuid,i.clearcoatNormalScale=this.clearcoatNormalScale.toArray()),this.sheenColorMap&&this.sheenColorMap.isTexture&&(i.sheenColorMap=this.sheenColorMap.toJSON(e).uuid),this.sheenRoughnessMap&&this.sheenRoughnessMap.isTexture&&(i.sheenRoughnessMap=this.sheenRoughnessMap.toJSON(e).uuid),this.dispersion!==void 0&&(i.dispersion=this.dispersion),this.retroreflectivity!==void 0&&(i.retroreflectivity=this.retroreflectivity),this.iridescence!==void 0&&(i.iridescence=this.iridescence),this.iridescenceIOR!==void 0&&(i.iridescenceIOR=this.iridescenceIOR),this.iridescenceThicknessRange!==void 0&&(i.iridescenceThicknessRange=this.iridescenceThicknessRange),this.iridescenceMap&&this.iridescenceMap.isTexture&&(i.iridescenceMap=this.iridescenceMap.toJSON(e).uuid),this.iridescenceThicknessMap&&this.iridescenceThicknessMap.isTexture&&(i.iridescenceThicknessMap=this.iridescenceThicknessMap.toJSON(e).uuid),this.anisotropy!==void 0&&(i.anisotropy=this.anisotropy),this.anisotropyRotation!==void 0&&(i.anisotropyRotation=this.anisotropyRotation),this.anisotropyMap&&this.anisotropyMap.isTexture&&(i.anisotropyMap=this.anisotropyMap.toJSON(e).uuid),this.map&&this.map.isTexture&&(i.map=this.map.toJSON(e).uuid),this.matcap&&this.matcap.isTexture&&(i.matcap=this.matcap.toJSON(e).uuid),this.alphaMap&&this.alphaMap.isTexture&&(i.alphaMap=this.alphaMap.toJSON(e).uuid),this.lightMap&&this.lightMap.isTexture&&(i.lightMap=this.lightMap.toJSON(e).uuid,i.lightMapIntensity=this.lightMapIntensity),this.aoMap&&this.aoMap.isTexture&&(i.aoMap=this.aoMap.toJSON(e).uuid,i.aoMapIntensity=this.aoMapIntensity),this.bumpMap&&this.bumpMap.isTexture&&(i.bumpMap=this.bumpMap.toJSON(e).uuid,i.bumpScale=this.bumpScale),this.normalMap&&this.normalMap.isTexture&&(i.normalMap=this.normalMap.toJSON(e).uuid,i.normalMapType=this.normalMapType,i.normalScale=this.normalScale.toArray()),this.displacementMap&&this.displacementMap.isTexture&&(i.displacementMap=this.displacementMap.toJSON(e).uuid,i.displacementScale=this.displacementScale,i.displacementBias=this.displacementBias),this.roughnessMap&&this.roughnessMap.isTexture&&(i.roughnessMap=this.roughnessMap.toJSON(e).uuid),this.metalnessMap&&this.metalnessMap.isTexture&&(i.metalnessMap=this.metalnessMap.toJSON(e).uuid),this.emissiveMap&&this.emissiveMap.isTexture&&(i.emissiveMap=this.emissiveMap.toJSON(e).uuid),this.specularMap&&this.specularMap.isTexture&&(i.specularMap=this.specularMap.toJSON(e).uuid),this.specularIntensityMap&&this.specularIntensityMap.isTexture&&(i.specularIntensityMap=this.specularIntensityMap.toJSON(e).uuid),this.specularColorMap&&this.specularColorMap.isTexture&&(i.specularColorMap=this.specularColorMap.toJSON(e).uuid),this.envMap&&this.envMap.isTexture&&(i.envMap=this.envMap.toJSON(e).uuid,this.combine!==void 0&&(i.combine=this.combine)),this.envMapRotation!==void 0&&(i.envMapRotation=this.envMapRotation.toArray()),this.envMapIntensity!==void 0&&(i.envMapIntensity=this.envMapIntensity),this.reflectivity!==void 0&&(i.reflectivity=this.reflectivity),this.refractionRatio!==void 0&&(i.refractionRatio=this.refractionRatio),this.gradientMap&&this.gradientMap.isTexture&&(i.gradientMap=this.gradientMap.toJSON(e).uuid),this.transmission!==void 0&&(i.transmission=this.transmission),this.transmissionMap&&this.transmissionMap.isTexture&&(i.transmissionMap=this.transmissionMap.toJSON(e).uuid),this.thickness!==void 0&&(i.thickness=this.thickness),this.thicknessMap&&this.thicknessMap.isTexture&&(i.thicknessMap=this.thicknessMap.toJSON(e).uuid),this.attenuationDistance!==void 0&&(i.attenuationDistance=this.attenuationDistance),this.attenuationColor!==void 0&&(i.attenuationColor=this.attenuationColor.getHex()),this.size!==void 0&&(i.size=this.size),this.sizeAttenuation!==void 0&&(i.sizeAttenuation=this.sizeAttenuation),Array.isArray(this.clippingPlanes)&&this.clippingPlanes.length>0&&(i.clippingPlanes=this.clippingPlanes.map(o=>o.toJSON())),this.rotation!==void 0&&(i.rotation=this.rotation),this.depthPacking!==void 0&&(i.depthPacking=this.depthPacking),this.linewidth!==void 0&&(i.linewidth=this.linewidth),this.linecap!==void 0&&(i.linecap=this.linecap),this.linejoin!==void 0&&(i.linejoin=this.linejoin),this.dashSize!==void 0&&(i.dashSize=this.dashSize),this.gapSize!==void 0&&(i.gapSize=this.gapSize),this.scale!==void 0&&(i.scale=this.scale),this.wireframe!==void 0&&(i.wireframe=this.wireframe),this.wireframeLinewidth!==void 0&&(i.wireframeLinewidth=this.wireframeLinewidth),this.wireframeLinecap!==void 0&&(i.wireframeLinecap=this.wireframeLinecap),this.wireframeLinejoin!==void 0&&(i.wireframeLinejoin=this.wireframeLinejoin),this.flatShading!==void 0&&(i.flatShading=this.flatShading),this.fog!==void 0&&(i.fog=this.fog),Object.keys(this.userData).length>0&&(i.userData=this.userData);function r(o){let s=[];for(let a in o){let l=o[a];delete l.metadata,s.push(l)}return s}if(t){let o=r(e.textures),s=r(e.images);o.length>0&&(i.textures=o),s.length>0&&(i.images=s)}return i}fromJSON(e,t){if(e.uuid!==void 0&&(this.uuid=e.uuid),e.name!==void 0&&(this.name=e.name),e.color!==void 0&&this.color!==void 0&&this.color.setHex(e.color),e.roughness!==void 0&&(this.roughness=e.roughness),e.metalness!==void 0&&(this.metalness=e.metalness),e.sheen!==void 0&&(this.sheen=e.sheen),e.sheenColor!==void 0&&(this.sheenColor=new Le().setHex(e.sheenColor)),e.sheenRoughness!==void 0&&(this.sheenRoughness=e.sheenRoughness),e.emissive!==void 0&&this.emissive!==void 0&&this.emissive.setHex(e.emissive),e.specular!==void 0&&this.specular!==void 0&&this.specular.setHex(e.specular),e.specularIntensity!==void 0&&(this.specularIntensity=e.specularIntensity),e.specularColor!==void 0&&this.specularColor!==void 0&&this.specularColor.setHex(e.specularColor),e.shininess!==void 0&&(this.shininess=e.shininess),e.clearcoat!==void 0&&(this.clearcoat=e.clearcoat),e.clearcoatRoughness!==void 0&&(this.clearcoatRoughness=e.clearcoatRoughness),e.dispersion!==void 0&&(this.dispersion=e.dispersion),e.retroreflectivity!==void 0&&(this.retroreflectivity=e.retroreflectivity),e.iridescence!==void 0&&(this.iridescence=e.iridescence),e.iridescenceIOR!==void 0&&(this.iridescenceIOR=e.iridescenceIOR),e.iridescenceThicknessRange!==void 0&&(this.iridescenceThicknessRange=e.iridescenceThicknessRange),e.transmission!==void 0&&(this.transmission=e.transmission),e.thickness!==void 0&&(this.thickness=e.thickness),e.attenuationDistance!==void 0&&(this.attenuationDistance=e.attenuationDistance),e.attenuationColor!==void 0&&this.attenuationColor!==void 0&&this.attenuationColor.setHex(e.attenuationColor),e.anisotropy!==void 0&&(this.anisotropy=e.anisotropy),e.anisotropyRotation!==void 0&&(this.anisotropyRotation=e.anisotropyRotation),e.fog!==void 0&&(this.fog=e.fog),e.flatShading!==void 0&&(this.flatShading=e.flatShading),e.blending!==void 0&&(this.blending=e.blending),e.combine!==void 0&&(this.combine=e.combine),e.side!==void 0&&(this.side=e.side),e.shadowSide!==void 0&&(this.shadowSide=e.shadowSide),e.opacity!==void 0&&(this.opacity=e.opacity),e.transparent!==void 0&&(this.transparent=e.transparent),e.alphaTest!==void 0&&(this.alphaTest=e.alphaTest),e.alphaHash!==void 0&&(this.alphaHash=e.alphaHash),e.depthFunc!==void 0&&(this.depthFunc=e.depthFunc),e.depthTest!==void 0&&(this.depthTest=e.depthTest),e.depthWrite!==void 0&&(this.depthWrite=e.depthWrite),e.colorWrite!==void 0&&(this.colorWrite=e.colorWrite),e.clippingPlanes!==void 0&&(this.clippingPlanes=e.clippingPlanes.map(i=>new hi().fromJSON(i))),e.clipIntersection!==void 0&&(this.clipIntersection=e.clipIntersection),e.clipShadows!==void 0&&(this.clipShadows=e.clipShadows),e.depthPacking!==void 0&&(this.depthPacking=e.depthPacking),e.blendSrc!==void 0&&(this.blendSrc=e.blendSrc),e.blendDst!==void 0&&(this.blendDst=e.blendDst),e.blendEquation!==void 0&&(this.blendEquation=e.blendEquation),e.blendSrcAlpha!==void 0&&(this.blendSrcAlpha=e.blendSrcAlpha),e.blendDstAlpha!==void 0&&(this.blendDstAlpha=e.blendDstAlpha),e.blendEquationAlpha!==void 0&&(this.blendEquationAlpha=e.blendEquationAlpha),e.blendColor!==void 0&&this.blendColor!==void 0&&this.blendColor.setHex(e.blendColor),e.blendAlpha!==void 0&&(this.blendAlpha=e.blendAlpha),e.stencilWriteMask!==void 0&&(this.stencilWriteMask=e.stencilWriteMask),e.stencilFunc!==void 0&&(this.stencilFunc=e.stencilFunc),e.stencilRef!==void 0&&(this.stencilRef=e.stencilRef),e.stencilFuncMask!==void 0&&(this.stencilFuncMask=e.stencilFuncMask),e.stencilFail!==void 0&&(this.stencilFail=e.stencilFail),e.stencilZFail!==void 0&&(this.stencilZFail=e.stencilZFail),e.stencilZPass!==void 0&&(this.stencilZPass=e.stencilZPass),e.stencilWrite!==void 0&&(this.stencilWrite=e.stencilWrite),e.wireframe!==void 0&&(this.wireframe=e.wireframe),e.wireframeLinewidth!==void 0&&(this.wireframeLinewidth=e.wireframeLinewidth),e.wireframeLinecap!==void 0&&(this.wireframeLinecap=e.wireframeLinecap),e.wireframeLinejoin!==void 0&&(this.wireframeLinejoin=e.wireframeLinejoin),e.rotation!==void 0&&(this.rotation=e.rotation),e.linewidth!==void 0&&(this.linewidth=e.linewidth),e.linecap!==void 0&&(this.linecap=e.linecap),e.linejoin!==void 0&&(this.linejoin=e.linejoin),e.dashSize!==void 0&&(this.dashSize=e.dashSize),e.gapSize!==void 0&&(this.gapSize=e.gapSize),e.scale!==void 0&&(this.scale=e.scale),e.polygonOffset!==void 0&&(this.polygonOffset=e.polygonOffset),e.polygonOffsetFactor!==void 0&&(this.polygonOffsetFactor=e.polygonOffsetFactor),e.polygonOffsetUnits!==void 0&&(this.polygonOffsetUnits=e.polygonOffsetUnits),e.dithering!==void 0&&(this.dithering=e.dithering),e.alphaToCoverage!==void 0&&(this.alphaToCoverage=e.alphaToCoverage),e.premultipliedAlpha!==void 0&&(this.premultipliedAlpha=e.premultipliedAlpha),e.forceSinglePass!==void 0&&(this.forceSinglePass=e.forceSinglePass),e.allowOverride!==void 0&&(this.allowOverride=e.allowOverride),e.visible!==void 0&&(this.visible=e.visible),e.toneMapped!==void 0&&(this.toneMapped=e.toneMapped),e.userData!==void 0&&(this.userData=e.userData),e.vertexColors!==void 0&&(typeof e.vertexColors=="number"?this.vertexColors=e.vertexColors>0:this.vertexColors=e.vertexColors),e.size!==void 0&&(this.size=e.size),e.sizeAttenuation!==void 0&&(this.sizeAttenuation=e.sizeAttenuation),e.map!==void 0&&(this.map=t[e.map]||null),e.matcap!==void 0&&(this.matcap=t[e.matcap]||null),e.alphaMap!==void 0&&(this.alphaMap=t[e.alphaMap]||null),e.bumpMap!==void 0&&(this.bumpMap=t[e.bumpMap]||null),e.bumpScale!==void 0&&(this.bumpScale=e.bumpScale),e.normalMap!==void 0&&(this.normalMap=t[e.normalMap]||null),e.normalMapType!==void 0&&(this.normalMapType=e.normalMapType),e.normalScale!==void 0){let i=e.normalScale;Array.isArray(i)===!1&&(i=[i,i]),this.normalScale=new Ae().fromArray(i)}return e.displacementMap!==void 0&&(this.displacementMap=t[e.displacementMap]||null),e.displacementScale!==void 0&&(this.displacementScale=e.displacementScale),e.displacementBias!==void 0&&(this.displacementBias=e.displacementBias),e.roughnessMap!==void 0&&(this.roughnessMap=t[e.roughnessMap]||null),e.metalnessMap!==void 0&&(this.metalnessMap=t[e.metalnessMap]||null),e.emissiveMap!==void 0&&(this.emissiveMap=t[e.emissiveMap]||null),e.emissiveIntensity!==void 0&&(this.emissiveIntensity=e.emissiveIntensity),e.specularMap!==void 0&&(this.specularMap=t[e.specularMap]||null),e.specularIntensityMap!==void 0&&(this.specularIntensityMap=t[e.specularIntensityMap]||null),e.specularColorMap!==void 0&&(this.specularColorMap=t[e.specularColorMap]||null),e.envMap!==void 0&&(this.envMap=t[e.envMap]||null),e.envMapRotation!==void 0&&this.envMapRotation.fromArray(e.envMapRotation),e.envMapIntensity!==void 0&&(this.envMapIntensity=e.envMapIntensity),e.reflectivity!==void 0&&(this.reflectivity=e.reflectivity),e.refractionRatio!==void 0&&(this.refractionRatio=e.refractionRatio),e.lightMap!==void 0&&(this.lightMap=t[e.lightMap]||null),e.lightMapIntensity!==void 0&&(this.lightMapIntensity=e.lightMapIntensity),e.aoMap!==void 0&&(this.aoMap=t[e.aoMap]||null),e.aoMapIntensity!==void 0&&(this.aoMapIntensity=e.aoMapIntensity),e.gradientMap!==void 0&&(this.gradientMap=t[e.gradientMap]||null),e.clearcoatMap!==void 0&&(this.clearcoatMap=t[e.clearcoatMap]||null),e.clearcoatRoughnessMap!==void 0&&(this.clearcoatRoughnessMap=t[e.clearcoatRoughnessMap]||null),e.clearcoatNormalMap!==void 0&&(this.clearcoatNormalMap=t[e.clearcoatNormalMap]||null),e.clearcoatNormalScale!==void 0&&(this.clearcoatNormalScale=new Ae().fromArray(e.clearcoatNormalScale)),e.iridescenceMap!==void 0&&(this.iridescenceMap=t[e.iridescenceMap]||null),e.iridescenceThicknessMap!==void 0&&(this.iridescenceThicknessMap=t[e.iridescenceThicknessMap]||null),e.transmissionMap!==void 0&&(this.transmissionMap=t[e.transmissionMap]||null),e.thicknessMap!==void 0&&(this.thicknessMap=t[e.thicknessMap]||null),e.anisotropyMap!==void 0&&(this.anisotropyMap=t[e.anisotropyMap]||null),e.sheenColorMap!==void 0&&(this.sheenColorMap=t[e.sheenColorMap]||null),e.sheenRoughnessMap!==void 0&&(this.sheenRoughnessMap=t[e.sheenRoughnessMap]||null),this}clone(){return new this.constructor().copy(this)}copy(e){this.name=e.name,this.blending=e.blending,this.side=e.side,this.vertexColors=e.vertexColors,this.opacity=e.opacity,this.transparent=e.transparent,this.blendSrc=e.blendSrc,this.blendDst=e.blendDst,this.blendEquation=e.blendEquation,this.blendSrcAlpha=e.blendSrcAlpha,this.blendDstAlpha=e.blendDstAlpha,this.blendEquationAlpha=e.blendEquationAlpha,this.blendColor.copy(e.blendColor),this.blendAlpha=e.blendAlpha,this.depthFunc=e.depthFunc,this.depthTest=e.depthTest,this.depthWrite=e.depthWrite,this.stencilWriteMask=e.stencilWriteMask,this.stencilFunc=e.stencilFunc,this.stencilRef=e.stencilRef,this.stencilFuncMask=e.stencilFuncMask,this.stencilFail=e.stencilFail,this.stencilZFail=e.stencilZFail,this.stencilZPass=e.stencilZPass,this.stencilWrite=e.stencilWrite;let t=e.clippingPlanes,i=null;if(t!==null){let r=t.length;i=new Array(r);for(let o=0;o!==r;++o)i[o]=t[o].clone()}return this.clippingPlanes=i,this.clipIntersection=e.clipIntersection,this.clipShadows=e.clipShadows,this.shadowSide=e.shadowSide,this.colorWrite=e.colorWrite,this.precision=e.precision,this.polygonOffset=e.polygonOffset,this.polygonOffsetFactor=e.polygonOffsetFactor,this.polygonOffsetUnits=e.polygonOffsetUnits,this.dithering=e.dithering,this.alphaTest=e.alphaTest,this.alphaHash=e.alphaHash,this.alphaToCoverage=e.alphaToCoverage,this.premultipliedAlpha=e.premultipliedAlpha,this.forceSinglePass=e.forceSinglePass,this.allowOverride=e.allowOverride,this.visible=e.visible,this.toneMapped=e.toneMapped,this.userData=JSON.parse(JSON.stringify(e.userData)),this}dispose(){this.dispatchEvent({type:"dispose"})}set needsUpdate(e){e===!0&&this.version++}};var an=new U,ol=new U,Hs=new U,Vs=new U,Ai=class{constructor(e=new U,t=new U(0,0,-1)){this.origin=e,this.direction=t}set(e,t){return this.origin.copy(e),this.direction.copy(t),this}copy(e){return this.origin.copy(e.origin),this.direction.copy(e.direction),this}at(e,t){return t.copy(this.origin).addScaledVector(this.direction,e)}lookAt(e){return this.direction.copy(e).sub(this.origin).normalize(),this}recast(e){return this.origin.copy(this.at(e,an)),this}closestPointToPoint(e,t){t.subVectors(e,this.origin);let i=t.dot(this.direction);return i<0?t.copy(this.origin):t.copy(this.origin).addScaledVector(this.direction,i)}distanceToPoint(e){return Math.sqrt(this.distanceSqToPoint(e))}distanceSqToPoint(e){let t=an.subVectors(e,this.origin).dot(this.direction);return t<0?this.origin.distanceToSquared(e):(an.copy(this.origin).addScaledVector(this.direction,t),an.distanceToSquared(e))}distanceSqToSegment(e,t,i,r){ol.copy(e).add(t).multiplyScalar(.5),Hs.copy(t).sub(e).normalize(),Vs.copy(this.origin).sub(ol);let o=e.distanceTo(t)*.5,s=-this.direction.dot(Hs),a=Vs.dot(this.direction),l=-Vs.dot(Hs),c=Vs.lengthSq(),h=Math.abs(1-s*s),d,u,m,_;if(h>0)if(d=s*l-a,u=s*a-l,_=o*h,d>=0)if(u>=-_)if(u<=_){let M=1/h;d*=M,u*=M,m=d*(d+s*u+2*a)+u*(s*d+u+2*l)+c}else u=o,d=Math.max(0,-(s*u+a)),m=-d*d+u*(u+2*l)+c;else u=-o,d=Math.max(0,-(s*u+a)),m=-d*d+u*(u+2*l)+c;else u<=-_?(d=Math.max(0,-(-s*o+a)),u=d>0?-o:Math.min(Math.max(-o,-l),o),m=-d*d+u*(u+2*l)+c):u<=_?(d=0,u=Math.min(Math.max(-o,-l),o),m=u*(u+2*l)+c):(d=Math.max(0,-(s*o+a)),u=d>0?o:Math.min(Math.max(-o,-l),o),m=-d*d+u*(u+2*l)+c);else u=s>0?-o:o,d=Math.max(0,-(s*u+a)),m=-d*d+u*(u+2*l)+c;return i&&i.copy(this.origin).addScaledVector(this.direction,d),r&&r.copy(ol).addScaledVector(Hs,u),m}intersectSphere(e,t){if(e.radius<0)return null;an.subVectors(e.center,this.origin);let i=an.dot(this.direction),r=an.dot(an)-i*i,o=e.radius*e.radius;if(r>o)return null;let s=Math.sqrt(o-r),a=i-s,l=i+s;return l<0?null:a<0?this.at(l,t):this.at(a,t)}intersectsSphere(e){return e.radius<0?!1:this.distanceSqToPoint(e.center)<=e.radius*e.radius}distanceToPlane(e){let t=e.normal.dot(this.direction);if(t===0)return e.distanceToPoint(this.origin)===0?0:null;let i=-(this.origin.dot(e.normal)+e.constant)/t;return i>=0?i:null}intersectPlane(e,t){let i=this.distanceToPlane(e);return i===null?null:this.at(i,t)}intersectsPlane(e){let t=e.distanceToPoint(this.origin);return t===0||e.normal.dot(this.direction)*t<0}intersectBox(e,t){let i,r,o,s,a,l,c=1/this.direction.x,h=1/this.direction.y,d=1/this.direction.z,u=this.origin;return c>=0?(i=(e.min.x-u.x)*c,r=(e.max.x-u.x)*c):(i=(e.max.x-u.x)*c,r=(e.min.x-u.x)*c),h>=0?(o=(e.min.y-u.y)*h,s=(e.max.y-u.y)*h):(o=(e.max.y-u.y)*h,s=(e.min.y-u.y)*h),i>s||o>r||((o>i||isNaN(i))&&(i=o),(s<r||isNaN(r))&&(r=s),d>=0?(a=(e.min.z-u.z)*d,l=(e.max.z-u.z)*d):(a=(e.max.z-u.z)*d,l=(e.min.z-u.z)*d),i>l||a>r)||((a>i||i!==i)&&(i=a),(l<r||r!==r)&&(r=l),r<0)?null:this.at(i>=0?i:r,t)}intersectsBox(e){return this.intersectBox(e,an)!==null}intersectTriangle(e,t,i,r,o){let s=this.origin,a=this.direction,l=a.x,c=a.y,h=a.z,d=e.x-s.x,u=e.y-s.y,m=e.z-s.z,_=t.x-s.x,M=t.y-s.y,p=t.z-s.z,f=i.x-s.x,E=i.y-s.y,C=i.z-s.z,y=Math.abs(l),b=Math.abs(c),v=Math.abs(h),D,S,T,I,G,z,W,O,X,Z,J,ae;if(y>=b&&y>=v?(T=l,z=d,X=_,ae=f,l>=0?(D=c,S=h,I=u,G=m,W=M,O=p,Z=E,J=C):(D=h,S=c,I=m,G=u,W=p,O=M,Z=C,J=E)):b>=v?(T=c,z=u,X=M,ae=E,c>=0?(D=h,S=l,I=m,G=d,W=p,O=_,Z=C,J=f):(D=l,S=h,I=d,G=m,W=_,O=p,Z=f,J=C)):(T=h,z=m,X=p,ae=C,h>=0?(D=l,S=c,I=d,G=u,W=_,O=M,Z=f,J=E):(D=c,S=l,I=u,G=d,W=M,O=_,Z=E,J=f)),T===0)return null;let Q=D/T,se=S/T,le=1/T,Oe=I-Q*z,ve=G-se*z,mt=W-Q*X,it=O-se*X,ot=Z-Q*ae,te=J-se*ae,ne=ot*it-te*mt,we=Oe*te-ve*ot,Xe=mt*ve-it*Oe;if(r){if(ne<0||we<0||Xe<0)return null}else if((ne<0||we<0||Xe<0)&&(ne>0||we>0||Xe>0))return null;let de=ne+we+Xe;if(de===0)return null;let nt=le*(ne*z+we*X+Xe*ae);return(de>0?nt<0:nt>0)?null:this.at(nt/de,o)}applyMatrix4(e){return this.origin.applyMatrix4(e),this.direction.transformDirection(e),this}equals(e){return e.origin.equals(this.origin)&&e.direction.equals(this.direction)}clone(){return new this.constructor().copy(this)}};var ii=class extends di{constructor(e){super(),this.isMeshBasicMaterial=!0,this.type="MeshBasicMaterial",this.color=new Le(16777215),this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.specularMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new Di,this.combine=ds,this.reflectivity=1,this.refractionRatio=.98,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.lightMap=e.lightMap,this.lightMapIntensity=e.lightMapIntensity,this.aoMap=e.aoMap,this.aoMapIntensity=e.aoMapIntensity,this.specularMap=e.specularMap,this.alphaMap=e.alphaMap,this.envMap=e.envMap,this.envMapRotation.copy(e.envMapRotation),this.combine=e.combine,this.reflectivity=e.reflectivity,this.refractionRatio=e.refractionRatio,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.wireframeLinecap=e.wireframeLinecap,this.wireframeLinejoin=e.wireframeLinejoin,this.fog=e.fog,this}};var Oc=new Qe,Jn=new Ai,Ws=new Ii,Bc=new U,Xs=new U,qs=new U,Ys=new U,sl=new U,Ks=new U,Gc=new U,Zs=new U,_e=class extends xt{constructor(e=new pt,t=new ii){super(),this.isMesh=!0,this.type="Mesh",this.geometry=e,this.material=t,this.morphTargetDictionary=void 0,this.morphTargetInfluences=void 0,this.count=1,this.updateMorphTargets()}copy(e,t){return super.copy(e,t),e.morphTargetInfluences!==void 0&&(this.morphTargetInfluences=e.morphTargetInfluences.slice()),e.morphTargetDictionary!==void 0&&(this.morphTargetDictionary=Object.assign({},e.morphTargetDictionary)),this.material=Array.isArray(e.material)?e.material.slice():e.material,this.geometry=e.geometry,this}updateMorphTargets(){let t=this.geometry.morphAttributes,i=Object.keys(t);if(i.length>0){let r=t[i[0]];if(r!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let o=0,s=r.length;o<s;o++){let a=r[o].name||String(o);this.morphTargetInfluences.push(0),this.morphTargetDictionary[a]=o}}}}getVertexPosition(e,t){let i=this.geometry,r=i.attributes.position,o=i.morphAttributes.position,s=i.morphTargetsRelative;t.fromBufferAttribute(r,e);let a=this.morphTargetInfluences;if(o&&a){Ks.set(0,0,0);for(let l=0,c=o.length;l<c;l++){let h=a[l],d=o[l];h!==0&&(sl.fromBufferAttribute(d,e),s?Ks.addScaledVector(sl,h):Ks.addScaledVector(sl.sub(t),h))}t.add(Ks)}return t}intersectsFrustum(e){return e.intersectsObject(this)}raycast(e,t){let i=this.geometry,r=this.material,o=this.matrixWorld;r!==void 0&&(i.boundingSphere===null&&i.computeBoundingSphere(),Ws.copy(i.boundingSphere),Ws.applyMatrix4(o),Jn.copy(e.ray).recast(e.near),!(Ws.containsPoint(Jn.origin)===!1&&(Jn.intersectSphere(Ws,Bc)===null||Jn.origin.distanceToSquared(Bc)>(e.far-e.near)**2))&&(Oc.copy(o).invert(),Jn.copy(e.ray).applyMatrix4(Oc),!(i.boundingBox!==null&&Jn.intersectsBox(i.boundingBox)===!1)&&this._computeIntersections(e,t,Jn)))}_computeIntersections(e,t,i){let r,o=this.geometry,s=this.material,a=o.index,l=o.attributes.position,c=o.attributes.uv,h=o.attributes.uv1,d=o.attributes.normal,u=o.groups,m=o.drawRange;if(a!==null)if(Array.isArray(s))for(let _=0,M=u.length;_<M;_++){let p=u[_],f=s[p.materialIndex],E=Math.max(p.start,m.start),C=Math.min(a.count,Math.min(p.start+p.count,m.start+m.count));for(let y=E,b=C;y<b;y+=3){let v=a.getX(y),D=a.getX(y+1),S=a.getX(y+2);r=Js(this,f,e,i,c,h,d,v,D,S),r&&(r.faceIndex=Math.floor(y/3),r.face.materialIndex=p.materialIndex,t.push(r))}}else{let _=Math.max(0,m.start),M=Math.min(a.count,m.start+m.count);for(let p=_,f=M;p<f;p+=3){let E=a.getX(p),C=a.getX(p+1),y=a.getX(p+2);r=Js(this,s,e,i,c,h,d,E,C,y),r&&(r.faceIndex=Math.floor(p/3),t.push(r))}}else if(l!==void 0)if(Array.isArray(s))for(let _=0,M=u.length;_<M;_++){let p=u[_],f=s[p.materialIndex],E=Math.max(p.start,m.start),C=Math.min(l.count,Math.min(p.start+p.count,m.start+m.count));for(let y=E,b=C;y<b;y+=3){let v=y,D=y+1,S=y+2;r=Js(this,f,e,i,c,h,d,v,D,S),r&&(r.faceIndex=Math.floor(y/3),r.face.materialIndex=p.materialIndex,t.push(r))}}else{let _=Math.max(0,m.start),M=Math.min(l.count,m.start+m.count);for(let p=_,f=M;p<f;p+=3){let E=p,C=p+1,y=p+2;r=Js(this,s,e,i,c,h,d,E,C,y),r&&(r.faceIndex=Math.floor(p/3),t.push(r))}}}};function jp(n,e,t,i,r,o,s,a){let l;if(e.side===wt?l=i.intersectTriangle(s,o,r,!0,a):l=i.intersectTriangle(r,o,s,e.side===Ci,a),l===null)return null;Zs.copy(a),Zs.applyMatrix4(n.matrixWorld);let c=t.ray.origin.distanceTo(Zs);return c<t.near||c>t.far?null:{distance:c,point:Zs.clone(),object:n}}function Js(n,e,t,i,r,o,s,a,l,c){n.getVertexPosition(a,Xs),n.getVertexPosition(l,qs),n.getVertexPosition(c,Ys);let h=jp(n,e,t,i,Xs,qs,Ys,Gc);if(h){let d=new U;Yi.getBarycoord(Gc,Xs,qs,Ys,d),r&&(h.uv=Yi.getInterpolatedAttribute(r,a,l,c,d,new Ae)),o&&(h.uv1=Yi.getInterpolatedAttribute(o,a,l,c,d,new Ae)),s&&(h.normal=Yi.getInterpolatedAttribute(s,a,l,c,d,new U),h.normal.dot(i.direction)>0&&h.normal.multiplyScalar(-1));let u={a,b:l,c,normal:new U,materialIndex:0};Yi.getNormal(Xs,qs,Ys,u.normal),h.face=u,h.barycoord=d}return h}var $s=class extends Dt{constructor(e=null,t=1,i=1,r,o,s,a,l,c=Ct,h=Ct,d,u){super(null,s,a,l,c,h,r,o,d,u),this.isDataTexture=!0,this.image={data:e,width:t,height:i},this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}};var $n=new Ii,em=new Ae(.5,.5),Qs=new U,Cn=class{constructor(e=new hi,t=new hi,i=new hi,r=new hi,o=new hi,s=new hi){this.planes=[e,t,i,r,o,s]}set(e,t,i,r,o,s){let a=this.planes;return a[0].copy(e),a[1].copy(t),a[2].copy(i),a[3].copy(r),a[4].copy(o),a[5].copy(s),this}copy(e){let t=this.planes;for(let i=0;i<6;i++)t[i].copy(e.planes[i]);return this}setFromProjectionMatrix(e,t=_i,i=!1){let r=this.planes,o=e.elements,s=o[0],a=o[1],l=o[2],c=o[3],h=o[4],d=o[5],u=o[6],m=o[7],_=o[8],M=o[9],p=o[10],f=o[11],E=o[12],C=o[13],y=o[14],b=o[15];if(r[0].setComponents(c-s,m-h,f-_,b-E).normalize(),r[1].setComponents(c+s,m+h,f+_,b+E).normalize(),r[2].setComponents(c+a,m+d,f+M,b+C).normalize(),r[3].setComponents(c-a,m-d,f-M,b-C).normalize(),i)r[4].setComponents(l,u,p,y).normalize(),r[5].setComponents(c-l,m-u,f-p,b-y).normalize();else if(r[4].setComponents(c-l,m-u,f-p,b-y).normalize(),t===_i)r[5].setComponents(c+l,m+u,f+p,b+y).normalize();else if(t===en)r[5].setComponents(l,u,p,y).normalize();else throw new Error("THREE.Frustum.setFromProjectionMatrix(): Invalid coordinate system: "+t);return this}intersectsObject(e){if(e.boundingSphere!==void 0)e.boundingSphere===null&&e.computeBoundingSphere(),$n.copy(e.boundingSphere).applyMatrix4(e.matrixWorld);else{let t=e.geometry;t.boundingSphere===null&&t.computeBoundingSphere(),$n.copy(t.boundingSphere).applyMatrix4(e.matrixWorld)}return this.intersectsSphere($n)}intersectsSprite(e){$n.center.set(0,0,0);let t=em.distanceTo(e.center);return $n.radius=.7071067811865476+t,$n.applyMatrix4(e.matrixWorld),this.intersectsSphere($n)}intersectsSphere(e){let t=this.planes,i=e.center,r=-e.radius;for(let o=0;o<6;o++)if(t[o].distanceToPoint(i)<r)return!1;return!0}intersectsBox(e){let t=this.planes;for(let i=0;i<6;i++){let r=t[i];if(Qs.x=r.normal.x>0?e.max.x:e.min.x,Qs.y=r.normal.y>0?e.max.y:e.min.y,Qs.z=r.normal.z>0?e.max.z:e.min.z,r.distanceToPoint(Qs)<0)return!1}return!0}containsPoint(e){let t=this.planes;for(let i=0;i<6;i++)if(t[i].distanceToPoint(e)<0)return!1;return!0}clone(){return new this.constructor().copy(this)}};var ln=class extends di{constructor(e){super(),this.isLineBasicMaterial=!0,this.type="LineBasicMaterial",this.color=new Le(16777215),this.map=null,this.linewidth=1,this.linecap="round",this.linejoin="round",this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.linewidth=e.linewidth,this.linecap=e.linecap,this.linejoin=e.linejoin,this.fog=e.fog,this}};var ta=new U,ia=new U,zc=new Qe,Ko=new Ai,js=new Ii,al=new U,kc=new U,na=class extends xt{constructor(e=new pt,t=new ln){super(),this.isLine=!0,this.type="Line",this.geometry=e,this.material=t,this.morphTargetDictionary=void 0,this.morphTargetInfluences=void 0,this.updateMorphTargets()}copy(e,t){return super.copy(e,t),this.material=Array.isArray(e.material)?e.material.slice():e.material,this.geometry=e.geometry,this}computeLineDistances(){let e=this.geometry;if(e.index===null){let t=e.attributes.position,i=[0];for(let r=1,o=t.count;r<o;r++)ta.fromBufferAttribute(t,r-1),ia.fromBufferAttribute(t,r),i[r]=i[r-1],i[r]+=ta.distanceTo(ia);e.setAttribute("lineDistance",new at(i,1))}else Ie("Line.computeLineDistances(): Computation only possible with non-indexed BufferGeometry.");return this}intersectsFrustum(e){return e.intersectsObject(this)}raycast(e,t){let i=this.geometry,r=this.matrixWorld,o=e.params.Line.threshold,s=i.drawRange;if(i.boundingSphere===null&&i.computeBoundingSphere(),js.copy(i.boundingSphere),js.applyMatrix4(r),js.radius+=o,e.ray.intersectsSphere(js)===!1)return;zc.copy(r).invert(),Ko.copy(e.ray).applyMatrix4(zc);let a=o/((this.scale.x+this.scale.y+this.scale.z)/3),l=a*a,c=this.isLineSegments?2:1,h=i.index,u=i.attributes.position;if(h!==null){let m=Math.max(0,s.start),_=Math.min(h.count,s.start+s.count);for(let M=m,p=_-1;M<p;M+=c){let f=h.getX(M),E=h.getX(M+1),C=ea(this,e,Ko,l,f,E,M);C&&t.push(C)}if(this.isLineLoop){let M=h.getX(_-1),p=h.getX(m),f=ea(this,e,Ko,l,M,p,_-1);f&&t.push(f)}}else{let m=Math.max(0,s.start),_=Math.min(u.count,s.start+s.count);for(let M=m,p=_-1;M<p;M+=c){let f=ea(this,e,Ko,l,M,M+1,M);f&&t.push(f)}if(this.isLineLoop){let M=ea(this,e,Ko,l,_-1,m,_-1);M&&t.push(M)}}}updateMorphTargets(){let t=this.geometry.morphAttributes,i=Object.keys(t);if(i.length>0){let r=t[i[0]];if(r!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let o=0,s=r.length;o<s;o++){let a=r[o].name||String(o);this.morphTargetInfluences.push(0),this.morphTargetDictionary[a]=o}}}}};function ea(n,e,t,i,r,o,s){let a=n.geometry.attributes.position;if(ta.fromBufferAttribute(a,r),ia.fromBufferAttribute(a,o),t.distanceSqToSegment(ta,ia,al,kc)>i)return;al.applyMatrix4(n.matrixWorld);let c=e.ray.origin.distanceTo(al);if(!(c<e.near||c>e.far))return{distance:c,point:kc.clone().applyMatrix4(n.matrixWorld),index:s,face:null,faceIndex:null,barycoord:null,object:n}}var Hc=new U,Vc=new U,Qn=class extends na{constructor(e,t){super(e,t),this.isLineSegments=!0,this.type="LineSegments"}computeLineDistances(){let e=this.geometry;if(e.index===null){let t=e.attributes.position,i=[];for(let r=0,o=t.count;r<o;r+=2)Hc.fromBufferAttribute(t,r),Vc.fromBufferAttribute(t,r+1),i[r]=r===0?0:i[r-1],i[r+1]=i[r]+Hc.distanceTo(Vc);e.setAttribute("lineDistance",new at(i,1))}else Ie("LineSegments.computeLineDistances(): Computation only possible with non-indexed BufferGeometry.");return this}};var jn=class extends di{constructor(e){super(),this.isPointsMaterial=!0,this.type="PointsMaterial",this.color=new Le(16777215),this.map=null,this.alphaMap=null,this.size=1,this.sizeAttenuation=!0,this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.alphaMap=e.alphaMap,this.size=e.size,this.sizeAttenuation=e.sizeAttenuation,this.fog=e.fog,this}};var Wc=new Qe,ll=new Ai,ra=new Ii,oa=new U,Zo=class extends xt{constructor(e=new pt,t=new jn){super(),this.isPoints=!0,this.type="Points",this.geometry=e,this.material=t,this.morphTargetDictionary=void 0,this.morphTargetInfluences=void 0,this.updateMorphTargets()}copy(e,t){return super.copy(e,t),this.material=Array.isArray(e.material)?e.material.slice():e.material,this.geometry=e.geometry,this}intersectsFrustum(e){return e.intersectsObject(this)}raycast(e,t){let i=this.geometry,r=this.matrixWorld,o=e.params.Points.threshold,s=i.drawRange;if(i.boundingSphere===null&&i.computeBoundingSphere(),ra.copy(i.boundingSphere),ra.applyMatrix4(r),ra.radius+=o,e.ray.intersectsSphere(ra)===!1)return;Wc.copy(r).invert(),ll.copy(e.ray).applyMatrix4(Wc);let a=o/((this.scale.x+this.scale.y+this.scale.z)/3),l=a*a,c=i.index,d=i.attributes.position;if(c!==null){let u=Math.max(0,s.start),m=Math.min(c.count,s.start+s.count);for(let _=u,M=m;_<M;_++){let p=c.getX(_);oa.fromBufferAttribute(d,p),Xc(oa,p,l,r,e,t,this)}}else{let u=Math.max(0,s.start),m=Math.min(d.count,s.start+s.count);for(let _=u,M=m;_<M;_++)oa.fromBufferAttribute(d,_),Xc(oa,_,l,r,e,t,this)}}updateMorphTargets(){let t=this.geometry.morphAttributes,i=Object.keys(t);if(i.length>0){let r=t[i[0]];if(r!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let o=0,s=r.length;o<s;o++){let a=r[o].name||String(o);this.morphTargetInfluences.push(0),this.morphTargetDictionary[a]=o}}}}};function Xc(n,e,t,i,r,o,s){let a=ll.distanceSqToPoint(n);if(a<t){let l=new U;ll.closestPointToPoint(n,l),l.applyMatrix4(i);let c=r.ray.origin.distanceTo(l);if(c<r.near||c>r.far)return;o.push({distance:c,distanceToRay:Math.sqrt(a),point:l,index:e,face:null,faceIndex:null,barycoord:null,object:s})}}var Br=class extends Dt{constructor(e=[],t=Pi,i,r,o,s,a,l,c,h){super(e,t,i,r,o,s,a,l,c,h),this.isCubeTexture=!0,this.flipY=!1}get images(){return this.image}set images(e){this.image=e}};var Vi=class extends Dt{constructor(e,t,i,r,o,s,a,l,c){super(e,t,i,r,o,s,a,l,c),this.isCanvasTexture=!0,this.needsUpdate=!0}};var Wi=class extends Dt{constructor(e,t,i=$t,r,o,s,a=Ct,l=Ct,c,h=gi,d=1){if(h!==gi&&h!==Oi)throw new Error("THREE.DepthTexture: format must be either THREE.DepthFormat or THREE.DepthStencilFormat");let u={width:e,height:t,depth:d};super(u,r,o,s,a,l,h,i,c),this.isDepthTexture=!0,this.flipY=!1,this.generateMipmaps=!1,this.compareFunction=null}copy(e){return super.copy(e),this.source=new bn(Object.assign({},e.image)),this.compareFunction=e.compareFunction,this}toJSON(e){let t=super.toJSON(e);return t.compareFunction=this.compareFunction,t}};var sa=class extends Wi{constructor(e,t=$t,i=Pi,r,o,s=Ct,a=Ct,l,c=gi){let h={width:e,height:e,depth:1},d=[h,h,h,h,h,h];super(e,e,t,i,r,o,s,a,l,c),this.image=d,this.isCubeDepthTexture=!0,this.isCubeTexture=!0}get images(){return this.image}set images(e){this.image=e}};var Gr=class extends Dt{constructor(e=null){super(),this.sourceTexture=e,this.isExternalTexture=!0}copy(e){return super.copy(e),this.sourceTexture=e.sourceTexture,this}};var Pt=class n extends pt{constructor(e=1,t=1,i=1,r=1,o=1,s=1){super(),this.type="BoxGeometry",this.parameters={width:e,height:t,depth:i,widthSegments:r,heightSegments:o,depthSegments:s};let a=this;r=Math.floor(r),o=Math.floor(o),s=Math.floor(s);let l=[],c=[],h=[],d=[],u=0,m=0;_("z","y","x",-1,-1,i,t,e,s,o,0),_("z","y","x",1,-1,i,t,-e,s,o,1),_("x","z","y",1,1,e,i,t,r,s,2),_("x","z","y",1,-1,e,i,-t,r,s,3),_("x","y","z",1,-1,e,t,i,r,o,4),_("x","y","z",-1,-1,e,t,-i,r,o,5),this.setIndex(l),this.setAttribute("position",new at(c,3)),this.setAttribute("normal",new at(h,3)),this.setAttribute("uv",new at(d,2));function _(M,p,f,E,C,y,b,v,D,S,T){let I=y/D,G=b/S,z=y/2,W=b/2,O=v/2,X=D+1,Z=S+1,J=0,ae=0,Q=new U;for(let se=0;se<Z;se++){let le=se*G-W;for(let Oe=0;Oe<X;Oe++){let ve=Oe*I-z;Q[M]=ve*E,Q[p]=le*C,Q[f]=O,c.push(Q.x,Q.y,Q.z),Q[M]=0,Q[p]=0,Q[f]=v>0?1:-1,h.push(Q.x,Q.y,Q.z),d.push(Oe/D),d.push(1-se/S),J+=1}}for(let se=0;se<S;se++)for(let le=0;le<D;le++){let Oe=u+le+X*se,ve=u+le+X*(se+1),mt=u+(le+1)+X*(se+1),it=u+(le+1)+X*se;l.push(Oe,ve,it),l.push(ve,mt,it),ae+=6}a.addGroup(m,ae,T),m+=ae,u+=J}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new n(e.width,e.height,e.depth,e.widthSegments,e.heightSegments,e.depthSegments)}};var wi=class n extends pt{constructor(e=1,t=1,i=1,r=32,o=1,s=!1,a=0,l=Math.PI*2){super(),this.type="CylinderGeometry",this.parameters={radiusTop:e,radiusBottom:t,height:i,radialSegments:r,heightSegments:o,openEnded:s,thetaStart:a,thetaLength:l};let c=this;r=Math.floor(r),o=Math.floor(o);let h=[],d=[],u=[],m=[],_=0,M=[],p=i/2,f=0;E(),s===!1&&(e>0&&C(!0),t>0&&C(!1)),this.setIndex(h),this.setAttribute("position",new at(d,3)),this.setAttribute("normal",new at(u,3)),this.setAttribute("uv",new at(m,2));function E(){let y=new U,b=new U,v=0,D=(t-e)/i;for(let S=0;S<=o;S++){let T=[],I=S/o,G=I*(t-e)+e;for(let z=0;z<=r;z++){let W=z/r,O=W*l+a,X=Math.sin(O),Z=Math.cos(O);b.x=G*X,b.y=-I*i+p,b.z=G*Z,d.push(b.x,b.y,b.z),y.set(X,D,Z).normalize(),u.push(y.x,y.y,y.z),m.push(W,1-I),T.push(_++)}M.push(T)}for(let S=0;S<r;S++)for(let T=0;T<o;T++){let I=M[T][S],G=M[T+1][S],z=M[T+1][S+1],W=M[T][S+1];(e>0||T!==0)&&(h.push(I,G,W),v+=3),(t>0||T!==o-1)&&(h.push(G,z,W),v+=3)}c.addGroup(f,v,0),f+=v}function C(y){let b=_,v=new Ae,D=new U,S=0,T=y===!0?e:t,I=y===!0?1:-1;for(let z=1;z<=r;z++)d.push(0,p*I,0),u.push(0,I,0),m.push(.5,.5),_++;let G=_;for(let z=0;z<=r;z++){let O=z/r*l+a,X=Math.cos(O),Z=Math.sin(O);D.x=T*Z,D.y=p*I,D.z=T*X,d.push(D.x,D.y,D.z),u.push(0,I,0),v.x=X*.5+.5,v.y=Z*.5*I+.5,m.push(v.x,v.y),_++}for(let z=0;z<r;z++){let W=b+z,O=G+z;y===!0?h.push(O,O+1,W):h.push(O+1,O,W),S+=3}c.addGroup(f,S,y===!0?1:2),f+=S}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new n(e.radiusTop,e.radiusBottom,e.height,e.radialSegments,e.heightSegments,e.openEnded,e.thetaStart,e.thetaLength)}};var Jo=class n extends wi{constructor(e=1,t=1,i=32,r=1,o=!1,s=0,a=Math.PI*2){super(0,e,t,i,r,o,s,a),this.type="ConeGeometry",this.parameters={radius:e,height:t,radialSegments:i,heightSegments:r,openEnded:o,thetaStart:s,thetaLength:a}}static fromJSON(e){return new n(e.radius,e.height,e.radialSegments,e.heightSegments,e.openEnded,e.thetaStart,e.thetaLength)}};var aa=class n extends pt{constructor(e=[],t=[],i=1,r=0){super(),this.type="PolyhedronGeometry",this.parameters={vertices:e,indices:t,radius:i,detail:r};let o=[],s=[];a(r),c(i),h(),this.setAttribute("position",new at(o,3)),this.setAttribute("normal",new at(o.slice(),3)),this.setAttribute("uv",new at(s,2)),r===0?this.computeVertexNormals():this.normalizeNormals();function a(E){let C=new U,y=new U,b=new U;for(let v=0;v<t.length;v+=3)m(t[v+0],C),m(t[v+1],y),m(t[v+2],b),l(C,y,b,E)}function l(E,C,y,b){let v=b+1,D=[];for(let S=0;S<=v;S++){D[S]=[];let T=E.clone().lerp(y,S/v),I=C.clone().lerp(y,S/v),G=v-S;for(let z=0;z<=G;z++)z===0&&S===v?D[S][z]=T:D[S][z]=T.clone().lerp(I,z/G)}for(let S=0;S<v;S++)for(let T=0;T<2*(v-S)-1;T++){let I=Math.floor(T/2);T%2===0?(u(D[S][I+1]),u(D[S+1][I]),u(D[S][I])):(u(D[S][I+1]),u(D[S+1][I+1]),u(D[S+1][I]))}}function c(E){let C=new U;for(let y=0;y<o.length;y+=3)C.x=o[y+0],C.y=o[y+1],C.z=o[y+2],C.normalize().multiplyScalar(E),o[y+0]=C.x,o[y+1]=C.y,o[y+2]=C.z}function h(){let E=new U;for(let C=0;C<o.length;C+=3){E.x=o[C+0],E.y=o[C+1],E.z=o[C+2];let y=p(E)/2/Math.PI+.5,b=f(E)/Math.PI+.5;s.push(y,1-b)}_(),d()}function d(){for(let E=0;E<s.length;E+=6){let C=s[E+0],y=s[E+2],b=s[E+4],v=Math.max(C,y,b),D=Math.min(C,y,b);v>.9&&D<.1&&(C<.2&&(s[E+0]+=1),y<.2&&(s[E+2]+=1),b<.2&&(s[E+4]+=1))}}function u(E){o.push(E.x,E.y,E.z)}function m(E,C){let y=E*3;C.x=e[y+0],C.y=e[y+1],C.z=e[y+2]}function _(){let E=new U,C=new U,y=new U,b=new U,v=new Ae,D=new Ae,S=new Ae;for(let T=0,I=0;T<o.length;T+=9,I+=6){E.set(o[T+0],o[T+1],o[T+2]),C.set(o[T+3],o[T+4],o[T+5]),y.set(o[T+6],o[T+7],o[T+8]),v.set(s[I+0],s[I+1]),D.set(s[I+2],s[I+3]),S.set(s[I+4],s[I+5]),b.copy(E).add(C).add(y).divideScalar(3);let G=p(b);M(v,I+0,E,G),M(D,I+2,C,G),M(S,I+4,y,G)}}function M(E,C,y,b){b<0&&E.x===1&&(s[C]=E.x-1),y.x===0&&y.z===0&&(s[C]=b/2/Math.PI+.5)}function p(E){return Math.atan2(E.z,-E.x)}function f(E){return Math.atan2(-E.y,Math.sqrt(E.x*E.x+E.z*E.z))}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new n(e.vertices,e.indices,e.radius,e.detail)}};var la=new U,ca=new U,cl=new U,ua=new Yi,zr=class extends pt{constructor(e=null,t=1){if(super(),this.type="EdgesGeometry",this.parameters={geometry:e,thresholdAngle:t},e!==null){let r=Math.pow(10,4),o=Math.cos(yn*t),s=e.getIndex(),a=e.getAttribute("position"),l=s?s.count:a.count,c=[0,0,0],h=["a","b","c"],d=new Array(3),u={},m=[];for(let _=0;_<l;_+=3){s?(c[0]=s.getX(_),c[1]=s.getX(_+1),c[2]=s.getX(_+2)):(c[0]=_,c[1]=_+1,c[2]=_+2);let{a:M,b:p,c:f}=ua;if(M.fromBufferAttribute(a,c[0]),p.fromBufferAttribute(a,c[1]),f.fromBufferAttribute(a,c[2]),ua.getNormal(cl),d[0]=`${Math.round(M.x*r)},${Math.round(M.y*r)},${Math.round(M.z*r)}`,d[1]=`${Math.round(p.x*r)},${Math.round(p.y*r)},${Math.round(p.z*r)}`,d[2]=`${Math.round(f.x*r)},${Math.round(f.y*r)},${Math.round(f.z*r)}`,!(d[0]===d[1]||d[1]===d[2]||d[2]===d[0]))for(let E=0;E<3;E++){let C=(E+1)%3,y=d[E],b=d[C],v=ua[h[E]],D=ua[h[C]],S=`${y}_${b}`,T=`${b}_${y}`;T in u&&u[T]?(cl.dot(u[T].normal)<=o&&(m.push(v.x,v.y,v.z),m.push(D.x,D.y,D.z)),u[T]=null):S in u||(u[S]={index0:c[E],index1:c[C],normal:cl.clone()})}}for(let _ in u)if(u[_]){let{index0:M,index1:p}=u[_];la.fromBufferAttribute(a,M),ca.fromBufferAttribute(a,p),m.push(la.x,la.y,la.z),m.push(ca.x,ca.y,ca.z)}this.setAttribute("position",new at(m,3))}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}};var er=class n extends aa{constructor(e=1,t=0){let i=[1,0,0,-1,0,0,0,1,0,0,-1,0,0,0,1,0,0,-1],r=[0,2,4,0,4,3,0,3,5,0,5,2,1,2,5,1,5,3,1,3,4,1,4,2];super(i,r,e,t),this.type="OctahedronGeometry",this.parameters={radius:e,detail:t}}static fromJSON(e){return new n(e.radius,e.detail)}};var cn=class n extends pt{constructor(e=1,t=1,i=1,r=1){super(),this.type="PlaneGeometry",this.parameters={width:e,height:t,widthSegments:i,heightSegments:r};let o=e/2,s=t/2,a=Math.floor(i),l=Math.floor(r),c=a+1,h=l+1,d=e/a,u=t/l,m=[],_=[],M=[],p=[];for(let f=0;f<h;f++){let E=f*u-s;for(let C=0;C<c;C++){let y=C*d-o;_.push(y,-E,0),M.push(0,0,1),p.push(C/a),p.push(1-f/l)}}for(let f=0;f<l;f++)for(let E=0;E<a;E++){let C=E+c*f,y=E+c*(f+1),b=E+1+c*(f+1),v=E+1+c*f;m.push(C,y,v),m.push(y,b,v)}this.setIndex(m),this.setAttribute("position",new at(_,3)),this.setAttribute("normal",new at(M,3)),this.setAttribute("uv",new at(p,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new n(e.width,e.height,e.widthSegments,e.heightSegments)}};var tr=class n extends pt{constructor(e=.5,t=1,i=32,r=1,o=0,s=Math.PI*2){super(),this.type="RingGeometry",this.parameters={innerRadius:e,outerRadius:t,thetaSegments:i,phiSegments:r,thetaStart:o,thetaLength:s},i=Math.max(3,i),r=Math.max(1,r);let a=[],l=[],c=[],h=[],d=e,u=(t-e)/r,m=new U,_=new Ae;for(let M=0;M<=r;M++){for(let p=0;p<=i;p++){let f=o+p/i*s;m.x=d*Math.cos(f),m.y=d*Math.sin(f),l.push(m.x,m.y,m.z),c.push(0,0,1),_.x=(m.x/t+1)/2,_.y=(m.y/t+1)/2,h.push(_.x,_.y)}d+=u}for(let M=0;M<r;M++){let p=M*(i+1);for(let f=0;f<i;f++){let E=f+p,C=E,y=E+i+1,b=E+i+2,v=E+1;a.push(C,y,v),a.push(y,b,v)}}this.setIndex(a),this.setAttribute("position",new at(l,3)),this.setAttribute("normal",new at(c,3)),this.setAttribute("uv",new at(h,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new n(e.innerRadius,e.outerRadius,e.thetaSegments,e.phiSegments,e.thetaStart,e.thetaLength)}};var kr=class n extends pt{constructor(e=1,t=.4,i=12,r=48,o=Math.PI*2,s=0,a=Math.PI*2){super(),this.type="TorusGeometry",this.parameters={radius:e,tube:t,radialSegments:i,tubularSegments:r,arc:o,thetaStart:s,thetaLength:a},i=Math.floor(i),r=Math.floor(r);let l=[],c=[],h=[],d=[],u=new U,m=new U,_=new U;for(let M=0;M<=i;M++){let p=s+M/i*a;for(let f=0;f<=r;f++){let E=f/r*o;m.x=(e+t*Math.cos(p))*Math.cos(E),m.y=(e+t*Math.cos(p))*Math.sin(E),m.z=t*Math.sin(p),c.push(m.x,m.y,m.z),u.x=e*Math.cos(E),u.y=e*Math.sin(E),_.subVectors(m,u).normalize(),h.push(_.x,_.y,_.z),d.push(f/r),d.push(M/i)}}for(let M=1;M<=i;M++)for(let p=1;p<=r;p++){let f=(r+1)*M+p-1,E=(r+1)*(M-1)+p-1,C=(r+1)*(M-1)+p,y=(r+1)*M+p;l.push(f,E,y),l.push(E,C,y)}this.setIndex(l),this.setAttribute("position",new at(c,3)),this.setAttribute("normal",new at(h,3)),this.setAttribute("uv",new at(d,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new n(e.radius,e.tube,e.radialSegments,e.tubularSegments,e.arc,e.thetaStart,e.thetaLength)}};function un(n){let e={};for(let t in n){e[t]={};for(let i in n[t]){let r=n[t][i];if(qc(r))r.isRenderTargetTexture?(Ie("UniformsUtils: Textures of render targets cannot be cloned via cloneUniforms() or mergeUniforms()."),e[t][i]=null):e[t][i]=r.clone();else if(Array.isArray(r))if(qc(r[0])){let o=[];for(let s=0,a=r.length;s<a;s++)o[s]=r[s].clone();e[t][i]=o}else e[t][i]=r.slice();else e[t][i]=r}}return e}function pi(n){let e={};for(let t=0;t<n.length;t++){let i=un(n[t]);for(let r in i)e[r]=i[r]}return e}function qc(n){return n&&(n.isColor||n.isMatrix3||n.isMatrix4||n.isVector2||n.isVector3||n.isVector4||n.isTexture||n.isQuaternion)}function Yc(n){let e=[];for(let t=0;t<n.length;t++)e.push(n[t].clone());return e}function fa(n){let e=n.getRenderTarget();return e===null?n.outputColorSpace:e.isXRRenderTarget===!0?e.texture.colorSpace:$e.workingColorSpace}var Kc={clone:un,merge:pi};var Zc=`
void main() {
gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}
`;var Jc=`
void main() {
gl_FragColor = vec4( 1.0, 0.0, 0.0, 1.0 );
}
`;var ni=class extends di{constructor(e){super(),this.isShaderMaterial=!0,this.type="ShaderMaterial",this.defines={},this.uniforms={},this.uniformsGroups=[],this.vertexShader=Zc,this.fragmentShader=Jc,this.linewidth=1,this.wireframe=!1,this.wireframeLinewidth=1,this.fog=!1,this.lights=!1,this.clipping=!1,this.forceSinglePass=!0,this.extensions={clipCullDistance:!1,multiDraw:!1},this.defaultAttributeValues={color:[1,1,1],uv:[0,0],uv1:[0,0]},this.index0AttributeName=void 0,this.uniformsNeedUpdate=!1,this.glslVersion=null,e!==void 0&&this.setValues(e)}copy(e){return super.copy(e),this.fragmentShader=e.fragmentShader,this.vertexShader=e.vertexShader,this.uniforms=un(e.uniforms),this.uniformsGroups=Yc(e.uniformsGroups),this.defines=Object.assign({},e.defines),this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.fog=e.fog,this.lights=e.lights,this.clipping=e.clipping,this.extensions=Object.assign({},e.extensions),this.glslVersion=e.glslVersion,this.defaultAttributeValues=Object.assign({},e.defaultAttributeValues),this.index0AttributeName=e.index0AttributeName,this.uniformsNeedUpdate=e.uniformsNeedUpdate,this}toJSON(e){let t=super.toJSON(e);t.glslVersion=this.glslVersion,t.uniforms={};for(let r in this.uniforms){let s=this.uniforms[r].value;s&&s.isTexture?t.uniforms[r]={type:"t",value:s.toJSON(e).uuid}:s&&s.isColor?t.uniforms[r]={type:"c",value:s.getHex()}:s&&s.isVector2?t.uniforms[r]={type:"v2",value:s.toArray()}:s&&s.isVector3?t.uniforms[r]={type:"v3",value:s.toArray()}:s&&s.isVector4?t.uniforms[r]={type:"v4",value:s.toArray()}:s&&s.isMatrix3?t.uniforms[r]={type:"m3",value:s.toArray()}:s&&s.isMatrix4?t.uniforms[r]={type:"m4",value:s.toArray()}:t.uniforms[r]={value:s}}Object.keys(this.defines).length>0&&(t.defines=this.defines),t.vertexShader=this.vertexShader,t.fragmentShader=this.fragmentShader,t.lights=this.lights,t.clipping=this.clipping;let i={};for(let r in this.extensions)this.extensions[r]===!0&&(i[r]=!0);return Object.keys(i).length>0&&(t.extensions=i),t}fromJSON(e,t){if(super.fromJSON(e,t),e.uniforms!==void 0)for(let i in e.uniforms){let r=e.uniforms[i];switch(this.uniforms[i]={},r.type){case"t":this.uniforms[i].value=t[r.value]||null;break;case"c":this.uniforms[i].value=new Le().setHex(r.value);break;case"v2":this.uniforms[i].value=new Ae().fromArray(r.value);break;case"v3":this.uniforms[i].value=new U().fromArray(r.value);break;case"v4":this.uniforms[i].value=new dt().fromArray(r.value);break;case"m3":this.uniforms[i].value=new ke().fromArray(r.value);break;case"m4":this.uniforms[i].value=new Qe().fromArray(r.value);break;default:this.uniforms[i].value=r.value}}if(e.defines!==void 0&&(this.defines=e.defines),e.vertexShader!==void 0&&(this.vertexShader=e.vertexShader),e.fragmentShader!==void 0&&(this.fragmentShader=e.fragmentShader),e.glslVersion!==void 0&&(this.glslVersion=e.glslVersion),e.extensions!==void 0)for(let i in e.extensions)this.extensions[i]=e.extensions[i];return e.lights!==void 0&&(this.lights=e.lights),e.clipping!==void 0&&(this.clipping=e.clipping),this}};var ha=class extends ni{constructor(e){super(e),this.isRawShaderMaterial=!0,this.type="RawShaderMaterial"}};var ut=class extends di{constructor(e){super(),this.isMeshStandardMaterial=!0,this.type="MeshStandardMaterial",this.defines={STANDARD:""},this.color=new Le(16777215),this.roughness=1,this.metalness=0,this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.emissive=new Le(0),this.emissiveIntensity=1,this.emissiveMap=null,this.bumpMap=null,this.bumpScale=1,this.normalMap=null,this.normalMapType=ko,this.normalScale=new Ae(1,1),this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.roughnessMap=null,this.metalnessMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new Di,this.envMapIntensity=1,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.flatShading=!1,this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.defines={STANDARD:""},this.color.copy(e.color),this.roughness=e.roughness,this.metalness=e.metalness,this.map=e.map,this.lightMap=e.lightMap,this.lightMapIntensity=e.lightMapIntensity,this.aoMap=e.aoMap,this.aoMapIntensity=e.aoMapIntensity,this.emissive.copy(e.emissive),this.emissiveMap=e.emissiveMap,this.emissiveIntensity=e.emissiveIntensity,this.bumpMap=e.bumpMap,this.bumpScale=e.bumpScale,this.normalMap=e.normalMap,this.normalMapType=e.normalMapType,this.normalScale.copy(e.normalScale),this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this.roughnessMap=e.roughnessMap,this.metalnessMap=e.metalnessMap,this.alphaMap=e.alphaMap,this.envMap=e.envMap,this.envMapRotation.copy(e.envMapRotation),this.envMapIntensity=e.envMapIntensity,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.wireframeLinecap=e.wireframeLinecap,this.wireframeLinejoin=e.wireframeLinejoin,this.flatShading=e.flatShading,this.fog=e.fog,this}};var da=class extends di{constructor(e){super(),this.isMeshDepthMaterial=!0,this.type="MeshDepthMaterial",this.depthPacking=lc,this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.wireframe=!1,this.wireframeLinewidth=1,this.setValues(e)}copy(e){return super.copy(e),this.depthPacking=e.depthPacking,this.map=e.map,this.alphaMap=e.alphaMap,this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this}};var pa=class extends di{constructor(e){super(),this.isMeshDistanceMaterial=!0,this.type="MeshDistanceMaterial",this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.setValues(e)}copy(e){return super.copy(e),this.map=e.map,this.alphaMap=e.alphaMap,this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this}};var Hr=class extends ln{constructor(e){super(),this.isLineDashedMaterial=!0,this.type="LineDashedMaterial",this.scale=1,this.dashSize=3,this.gapSize=1,this.setValues(e)}copy(e){return super.copy(e),this.scale=e.scale,this.dashSize=e.dashSize,this.gapSize=e.gapSize,this}};var Pn=class extends xt{constructor(e,t=1){super(),this.isLight=!0,this.type="Light",this.color=new Le(e),this.intensity=t}copy(e,t){return super.copy(e,t),this.color.copy(e.color),this.intensity=e.intensity,this}toJSON(e){let t=super.toJSON(e);return t.object.color=this.color.getHex(),t.object.intensity=this.intensity,t}};var $o=class extends Pn{constructor(e,t,i){super(e,i),this.isHemisphereLight=!0,this.type="HemisphereLight",this.position.copy(xt.DEFAULT_UP),this.updateMatrix(),this.groundColor=new Le(t)}copy(e,t){return super.copy(e,t),this.groundColor.copy(e.groundColor),this}toJSON(e){let t=super.toJSON(e);return t.object.groundColor=this.groundColor.getHex(),t}};var ul=new Qe,$c=new U,Qc=new U,Vr=class{constructor(e){this.camera=e,this.intensity=1,this.bias=0,this.biasNode=null,this.normalBias=0,this.radius=1,this.blurSamples=8,this.mapSize=new Ae(512,512),this.mapType=Ot,this.map=null,this.mapPass=null,this.matrix=new Qe,this.autoUpdate=!0,this.needsUpdate=!1,this._frustum=new Cn,this._frameExtents=new Ae(1,1),this._viewportCount=1,this._viewports=[new dt(0,0,1,1)]}getViewportCount(){return this._viewportCount}getCamera(){return this.camera}getFrustum(){return this._frustum}updateMatrices(e){let t=this.camera;$c.setFromMatrixPosition(e.matrixWorld),t.position.copy($c),Qc.setFromMatrixPosition(e.target.matrixWorld),t.lookAt(Qc),t.updateMatrixWorld(),this._updateMatrix(t,this.matrix,this._frustum)}_updateMatrix(e,t,i,r){ul.multiplyMatrices(e.projectionMatrix,e.matrixWorldInverse),i.setFromProjectionMatrix(ul,e.coordinateSystem,e.reversedDepth);let o=this._frameExtents,s=r?r.z/o.x:1,a=r?r.w/o.y:1,l=r?r.x/o.x:0,c=r?r.y/o.y:0;e.coordinateSystem===en||e.reversedDepth?t.set(.5*s,0,0,.5*s+l,0,.5*a,0,.5*a+c,0,0,1,0,0,0,0,1):t.set(.5*s,0,0,.5*s+l,0,.5*a,0,.5*a+c,0,0,.5,.5,0,0,0,1),t.multiply(ul)}getViewport(e){return this._viewports[e]}getFrameExtents(){return this._frameExtents}dispose(){this.map&&this.map.dispose(),this.mapPass&&this.mapPass.dispose()}copy(e){return this.camera=e.camera.clone(),this.intensity=e.intensity,this.bias=e.bias,this.radius=e.radius,this.autoUpdate=e.autoUpdate,this.needsUpdate=e.needsUpdate,this.normalBias=e.normalBias,this.blurSamples=e.blurSamples,this.mapSize.copy(e.mapSize),this.biasNode=e.biasNode,this}clone(){return new this.constructor().copy(this)}toJSON(){let e={};return e.intensity=this.intensity,e.bias=this.bias,e.normalBias=this.normalBias,e.radius=this.radius,e.blurSamples=this.blurSamples,e.mapSize=this.mapSize.toArray(),e.camera=this.camera.toJSON(!1).object,delete e.camera.matrix,e}};var ma=new U,ga=new ci,Ki=new U,Wr=class extends xt{constructor(){super(),this.isCamera=!0,this.type="Camera",this.matrixWorldInverse=new Qe,this.projectionMatrix=new Qe,this.projectionMatrixInverse=new Qe,this.coordinateSystem=_i,this._reversedDepth=!1}get reversedDepth(){return this._reversedDepth}copy(e,t){return super.copy(e,t),this.matrixWorldInverse.copy(e.matrixWorldInverse),this.projectionMatrix.copy(e.projectionMatrix),this.projectionMatrixInverse.copy(e.projectionMatrixInverse),this.coordinateSystem=e.coordinateSystem,this}getWorldDirection(e){return super.getWorldDirection(e).negate()}updateMatrixWorld(e){super.updateMatrixWorld(e),this.matrixWorld.decompose(ma,ga,Ki),Ki.x===1&&Ki.y===1&&Ki.z===1?this.matrixWorldInverse.copy(this.matrixWorld).invert():this.matrixWorldInverse.compose(ma,ga,Ki.set(1,1,1)).invert()}updateWorldMatrix(e,t,i=!1){super.updateWorldMatrix(e,t,i),this.matrixWorld.decompose(ma,ga,Ki),Ki.x===1&&Ki.y===1&&Ki.z===1?this.matrixWorldInverse.copy(this.matrixWorld).invert():this.matrixWorldInverse.compose(ma,ga,Ki.set(1,1,1)).invert()}clone(){return new this.constructor().copy(this)}};var Ln=new U,jc=new Ae,eu=new Ae,Nt=class extends Wr{constructor(e=50,t=1,i=.1,r=2e3){super(),this.isPerspectiveCamera=!0,this.type="PerspectiveCamera",this.fov=e,this.zoom=1,this.near=i,this.far=r,this.focus=10,this.aspect=t,this.view=null,this.filmGauge=35,this.filmOffset=0,this.updateProjectionMatrix()}copy(e,t){return super.copy(e,t),this.fov=e.fov,this.zoom=e.zoom,this.near=e.near,this.far=e.far,this.focus=e.focus,this.aspect=e.aspect,this.view=e.view===null?null:Object.assign({},e.view),this.filmGauge=e.filmGauge,this.filmOffset=e.filmOffset,this}setFocalLength(e){let t=.5*this.getFilmHeight()/e;this.fov=Xn*2*Math.atan(t),this.updateProjectionMatrix()}getFocalLength(){let e=Math.tan(yn*.5*this.fov);return .5*this.getFilmHeight()/e}getEffectiveFOV(){return Xn*2*Math.atan(Math.tan(yn*.5*this.fov)/this.zoom)}getFilmWidth(){return this.filmGauge*Math.min(this.aspect,1)}getFilmHeight(){return this.filmGauge/Math.max(this.aspect,1)}getViewBounds(e,t,i){Ln.set(-1,-1,.5).applyMatrix4(this.projectionMatrixInverse),t.set(Ln.x,Ln.y).multiplyScalar(-e/Ln.z),Ln.set(1,1,.5).applyMatrix4(this.projectionMatrixInverse),i.set(Ln.x,Ln.y).multiplyScalar(-e/Ln.z)}getViewSize(e,t){return this.getViewBounds(e,jc,eu),t.subVectors(eu,jc)}setViewOffset(e,t,i,r,o,s){this.aspect=e/t,this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=e,this.view.fullHeight=t,this.view.offsetX=i,this.view.offsetY=r,this.view.width=o,this.view.height=s,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){let e=this.near,t=e*Math.tan(yn*.5*this.fov)/this.zoom,i=2*t,r=this.aspect*i,o=-.5*r,s=this.view;if(this.view!==null&&this.view.enabled){let l=s.fullWidth,c=s.fullHeight;o+=s.offsetX*r/l,t-=s.offsetY*i/c,r*=s.width/l,i*=s.height/c}let a=this.filmOffset;a!==0&&(o+=e*a/this.getFilmWidth()),this.projectionMatrix.makePerspective(o,o+r,t,t-i,e,this.far,this.coordinateSystem,this.reversedDepth),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(e){let t=super.toJSON(e);return t.object.fov=this.fov,t.object.zoom=this.zoom,t.object.near=this.near,t.object.far=this.far,t.object.focus=this.focus,t.object.aspect=this.aspect,this.view!==null&&(t.object.view=Object.assign({},this.view)),t.object.filmGauge=this.filmGauge,t.object.filmOffset=this.filmOffset,t}};var _a=class extends Vr{constructor(){super(new Nt(90,1,.5,500)),this.isPointLightShadow=!0}};var Qo=class extends Pn{constructor(e,t,i=0,r=2){super(e,t),this.isPointLight=!0,this.type="PointLight",this.distance=i,this.decay=r,this.shadow=new _a}get power(){return this.intensity*4*Math.PI}set power(e){this.intensity=e/(4*Math.PI)}dispose(){super.dispose(),this.shadow.dispose()}copy(e,t){return super.copy(e,t),this.distance=e.distance,this.decay=e.decay,this.shadow=e.shadow.clone(),this}toJSON(e){let t=super.toJSON(e);return t.object.distance=this.distance,t.object.decay=this.decay,t.object.shadow=this.shadow.toJSON(),t}};var Dn=class extends Wr{constructor(e=-1,t=1,i=1,r=-1,o=.1,s=2e3){super(),this.isOrthographicCamera=!0,this.type="OrthographicCamera",this.zoom=1,this.view=null,this.left=e,this.right=t,this.top=i,this.bottom=r,this.near=o,this.far=s,this.updateProjectionMatrix()}copy(e,t){return super.copy(e,t),this.left=e.left,this.right=e.right,this.top=e.top,this.bottom=e.bottom,this.near=e.near,this.far=e.far,this.zoom=e.zoom,this.view=e.view===null?null:Object.assign({},e.view),this}setViewOffset(e,t,i,r,o,s){this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=e,this.view.fullHeight=t,this.view.offsetX=i,this.view.offsetY=r,this.view.width=o,this.view.height=s,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){let e=(this.right-this.left)/(2*this.zoom),t=(this.top-this.bottom)/(2*this.zoom),i=(this.right+this.left)/2,r=(this.top+this.bottom)/2,o=i-e,s=i+e,a=r+t,l=r-t;if(this.view!==null&&this.view.enabled){let c=(this.right-this.left)/this.view.fullWidth/this.zoom,h=(this.top-this.bottom)/this.view.fullHeight/this.zoom;o+=c*this.view.offsetX,s=o+c*this.view.width,a-=h*this.view.offsetY,l=a-h*this.view.height}this.projectionMatrix.makeOrthographic(o,s,a,l,this.near,this.far,this.coordinateSystem,this.reversedDepth),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(e){let t=super.toJSON(e);return t.object.zoom=this.zoom,t.object.left=this.left,t.object.right=this.right,t.object.top=this.top,t.object.bottom=this.bottom,t.object.near=this.near,t.object.far=this.far,this.view!==null&&(t.object.view=Object.assign({},this.view)),t}};var xa=class extends Vr{constructor(){super(new Dn(-5,5,5,-5,.5,500)),this.isDirectionalLightShadow=!0}};var Xr=class extends Pn{constructor(e,t){super(e,t),this.isDirectionalLight=!0,this.type="DirectionalLight",this.position.copy(xt.DEFAULT_UP),this.updateMatrix(),this.target=new xt,this.shadow=new xa}dispose(){super.dispose(),this.shadow.dispose()}copy(e){return super.copy(e),this.target=e.target.clone(),this.shadow=e.shadow.clone(),this}toJSON(e){let t=super.toJSON(e);return t.object.shadow=this.shadow.toJSON(),t.object.target=this.target.uuid,t}};var qr=-90,Yr=1,Sa=class extends xt{constructor(e,t,i){super(),this.type="CubeCamera",this.renderTarget=i,this.coordinateSystem=null,this.activeMipmapLevel=0;let r=new Nt(qr,Yr,e,t);r.layers=this.layers,this.add(r);let o=new Nt(qr,Yr,e,t);o.layers=this.layers,this.add(o);let s=new Nt(qr,Yr,e,t);s.layers=this.layers,this.add(s);let a=new Nt(qr,Yr,e,t);a.layers=this.layers,this.add(a);let l=new Nt(qr,Yr,e,t);l.layers=this.layers,this.add(l);let c=new Nt(qr,Yr,e,t);c.layers=this.layers,this.add(c)}updateCoordinateSystem(){let e=this.coordinateSystem,t=this.children.concat(),[i,r,o,s,a,l]=t;for(let c of t)this.remove(c);if(e===_i)i.up.set(0,1,0),i.lookAt(1,0,0),r.up.set(0,1,0),r.lookAt(-1,0,0),o.up.set(0,0,-1),o.lookAt(0,1,0),s.up.set(0,0,1),s.lookAt(0,-1,0),a.up.set(0,1,0),a.lookAt(0,0,1),l.up.set(0,1,0),l.lookAt(0,0,-1);else if(e===en)i.up.set(0,-1,0),i.lookAt(-1,0,0),r.up.set(0,-1,0),r.lookAt(1,0,0),o.up.set(0,0,1),o.lookAt(0,1,0),s.up.set(0,0,-1),s.lookAt(0,-1,0),a.up.set(0,-1,0),a.lookAt(0,0,1),l.up.set(0,-1,0),l.lookAt(0,0,-1);else throw new Error("THREE.CubeCamera.updateCoordinateSystem(): Invalid coordinate system: "+e);for(let c of t)this.add(c),c.updateMatrixWorld()}update(e,t){this.parent===null&&this.updateMatrixWorld();let{renderTarget:i,activeMipmapLevel:r}=this;this.coordinateSystem!==e.coordinateSystem&&(this.coordinateSystem=e.coordinateSystem,this.updateCoordinateSystem());let[o,s,a,l,c,h]=this.children,d=e.getRenderTarget(),u=e.getActiveCubeFace(),m=e.getActiveMipmapLevel(),_=e.xr.enabled;e.xr.enabled=!1;let M=i.texture.generateMipmaps;i.texture.generateMipmaps=!1;let p=!1;e.isWebGLRenderer===!0?p=e.state.buffers.depth.getReversed():p=e.reversedDepthBuffer,e.setRenderTarget(i,0,r),p&&e.autoClear===!1&&e.clearDepth(),e.render(t,o),e.setRenderTarget(i,1,r),p&&e.autoClear===!1&&e.clearDepth(),e.render(t,s),e.setRenderTarget(i,2,r),p&&e.autoClear===!1&&e.clearDepth(),e.render(t,a),e.setRenderTarget(i,3,r),p&&e.autoClear===!1&&e.clearDepth(),e.render(t,l),e.setRenderTarget(i,4,r),p&&e.autoClear===!1&&e.clearDepth(),e.render(t,c),i.texture.generateMipmaps=M,e.setRenderTarget(i,5,r),p&&e.autoClear===!1&&e.clearDepth(),e.render(t,h),e.setRenderTarget(d,u,m),e.xr.enabled=_,i.texture.needsPMREMUpdate=!0}};var Ma=class extends Nt{constructor(e=[]){super(),this.isArrayCamera=!0,this.isMultiViewCamera=!1,this.cameras=e}};var tu=new Qe,jo=class{constructor(e,t,i=0,r=1/0){this.ray=new Ai(e,t),this.near=i,this.far=r,this.camera=null,this.layers=new Tn,this.params={Mesh:{},Line:{threshold:1},LOD:{},Points:{threshold:1},Sprite:{}}}set(e,t){this.ray.set(e,t)}setFromCamera(e,t){t.isPerspectiveCamera?(this.ray.origin.setFromMatrixPosition(t.matrixWorld),this.ray.direction.set(e.x,e.y,.5).unproject(t).sub(this.ray.origin).normalize(),this.camera=t):t.isOrthographicCamera?(this.ray.origin.set(e.x,e.y,t.projectionMatrix.elements[14]).unproject(t),this.ray.direction.set(0,0,-1).transformDirection(t.matrixWorld),this.camera=t):et("Raycaster: Unsupported camera type: "+t.type)}setFromXRController(e){return tu.identity().extractRotation(e.matrixWorld),this.ray.origin.setFromMatrixPosition(e.matrixWorld),this.ray.direction.set(0,0,-1).applyMatrix4(tu),this}intersectObject(e,t=!0,i=[]){return fl(e,this,i,t),i.sort(iu),i}intersectObjects(e,t=!0,i=[]){for(let r=0,o=e.length;r<o;r++)fl(e[r],this,i,t);return i.sort(iu),i}};function iu(n,e){return n.distance-e.distance}function fl(n,e,t,i){let r=!0;if(n.layers.test(e.layers)&&n.raycast(e,t)===!1&&(r=!1),r===!0&&i===!0){let o=n.children;for(let s=0,a=o.length;s<a;s++)fl(o[s],e,t,!0)}}var Kr=class{constructor(e=1,t=0,i=0){this.radius=e,this.phi=t,this.theta=i}set(e,t,i){return this.radius=e,this.phi=t,this.theta=i,this}copy(e){return this.radius=e.radius,this.phi=e.phi,this.theta=e.theta,this}makeSafe(){return this.phi=Ze(this.phi,1e-6,Math.PI-1e-6),this}setFromVector3(e){return this.setFromCartesianCoords(e.x,e.y,e.z)}setFromCartesianCoords(e,t,i){return this.radius=Math.sqrt(e*e+t*t+i*i),this.radius===0?(this.theta=0,this.phi=0):(this.theta=Math.atan2(e,i),this.phi=Math.acos(Ze(t/this.radius,-1,1))),this}clone(){return new this.constructor().copy(this)}};var es=class extends ei{constructor(e,t=null){super(),this.object=e,this.domElement=t,this.enabled=!0,this.state=-1,this.keys={},this.mouseButtons={LEFT:null,MIDDLE:null,RIGHT:null},this.touches={ONE:null,TWO:null}}connect(e){this.domElement!==null&&this.disconnect(),this.domElement=e}disconnect(){}dispose(){}update(){}};function hl(n,e,t,i){let r=tm(i);switch(t){case ws:return n*e;case Cs:return n*e/r.components*r.byteLength;case hr:return n*e/r.components*r.byteLength;case bi:return n*e*2/r.components*r.byteLength;case dr:return n*e*2/r.components*r.byteLength;case Rs:return n*e*3/r.components*r.byteLength;case jt:return n*e*4/r.components*r.byteLength;case pr:return n*e*4/r.components*r.byteLength;case mr:case gr:return Math.floor((n+3)/4)*Math.floor((e+3)/4)*8;case _r:case xr:return Math.floor((n+3)/4)*Math.floor((e+3)/4)*16;case fo:case po:return Math.max(n,16)*Math.max(e,8)/4;case uo:case ho:return Math.max(n,8)*Math.max(e,8)/2;case mo:case go:case xo:case So:return Math.floor((n+3)/4)*Math.floor((e+3)/4)*8;case _o:case kn:case Mo:return Math.floor((n+3)/4)*Math.floor((e+3)/4)*16;case vo:return Math.floor((n+3)/4)*Math.floor((e+3)/4)*16;case yo:return Math.floor((n+4)/5)*Math.floor((e+3)/4)*16;case bo:return Math.floor((n+4)/5)*Math.floor((e+4)/5)*16;case Eo:return Math.floor((n+5)/6)*Math.floor((e+4)/5)*16;case To:return Math.floor((n+5)/6)*Math.floor((e+5)/6)*16;case Ao:return Math.floor((n+7)/8)*Math.floor((e+4)/5)*16;case wo:return Math.floor((n+7)/8)*Math.floor((e+5)/6)*16;case Ro:return Math.floor((n+7)/8)*Math.floor((e+7)/8)*16;case Co:return Math.floor((n+9)/10)*Math.floor((e+4)/5)*16;case Po:return Math.floor((n+9)/10)*Math.floor((e+5)/6)*16;case Lo:return Math.floor((n+9)/10)*Math.floor((e+7)/8)*16;case Do:return Math.floor((n+9)/10)*Math.floor((e+9)/10)*16;case Io:return Math.floor((n+11)/12)*Math.floor((e+9)/10)*16;case No:return Math.floor((n+11)/12)*Math.floor((e+11)/12)*16;case Uo:case Fo:case Oo:return Math.ceil(n/4)*Math.ceil(e/4)*16;case Bo:case Go:return Math.ceil(n/4)*Math.ceil(e/4)*8;case Hn:case zo:return Math.ceil(n/4)*Math.ceil(e/4)*16}throw new Error(`Unable to determine texture byte length for ${t} format.`)}function tm(n){switch(n){case Ot:case bs:return{byteLength:1,components:1};case Qi:case Es:case Qt:return{byteLength:2,components:1};case ur:case fr:return{byteLength:2,components:4};case $t:case cr:case oi:return{byteLength:4,components:1};case Ts:case As:return{byteLength:4,components:3}}throw new Error(`THREE.TextureUtils: Unknown texture type ${n}.`)}typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("register",{detail:{revision:"186"}}));typeof window<"u"&&(window.__THREE__?Ie("WARNING: Multiple instances of Three.js being imported."):window.__THREE__="186");function va(){let n=null,e=!1,t=null,i=null;function r(o,s){i=n.requestAnimationFrame(r),t(o,s)}return{start:function(){e!==!0&&t!==null&&n!==null&&(i=n.requestAnimationFrame(r),e=!0)},stop:function(){n!==null&&n.cancelAnimationFrame(i),e=!1},setAnimationLoop:function(o){t=o},setContext:function(o){n=o}}}function nu(n){let e=new WeakMap;function t(a,l){let c=a.array,h=a.usage,d=c.byteLength,u=n.createBuffer();n.bindBuffer(l,u),n.bufferData(l,c,h),a.onUploadCallback();let m;if(c instanceof Float32Array)m=n.FLOAT;else if(typeof Float16Array<"u"&&c instanceof Float16Array)m=n.HALF_FLOAT;else if(c instanceof Uint16Array)a.isFloat16BufferAttribute?m=n.HALF_FLOAT:m=n.UNSIGNED_SHORT;else if(c instanceof Int16Array)m=n.SHORT;else if(c instanceof Uint32Array)m=n.UNSIGNED_INT;else if(c instanceof Int32Array)m=n.INT;else if(c instanceof Int8Array)m=n.BYTE;else if(c instanceof Uint8Array)m=n.UNSIGNED_BYTE;else if(c instanceof Uint8ClampedArray)m=n.UNSIGNED_BYTE;else throw new Error("THREE.WebGLAttributes: Unsupported buffer data format: "+c);return{buffer:u,type:m,bytesPerElement:c.BYTES_PER_ELEMENT,version:a.version,size:d}}function i(a,l,c){let h=l.array,d=l.updateRanges;if(n.bindBuffer(c,a),d.length===0)n.bufferSubData(c,0,h);else{d.sort((m,_)=>m.start-_.start);let u=0;for(let m=1;m<d.length;m++){let _=d[u],M=d[m];M.start<=_.start+_.count+1?_.count=Math.max(_.count,M.start+M.count-_.start):(++u,d[u]=M)}d.length=u+1;for(let m=0,_=d.length;m<_;m++){let M=d[m];n.bufferSubData(c,M.start*h.BYTES_PER_ELEMENT,h,M.start,M.count)}l.clearUpdateRanges()}l.onUploadCallback()}function r(a){return a.isInterleavedBufferAttribute&&(a=a.data),e.get(a)}function o(a){a.isInterleavedBufferAttribute&&(a=a.data);let l=e.get(a);l&&(n.deleteBuffer(l.buffer),e.delete(a))}function s(a,l){if(a.isInterleavedBufferAttribute&&(a=a.data),a.isGLBufferAttribute){let h=e.get(a);(!h||h.version<a.version)&&e.set(a,{buffer:a.buffer,type:a.type,bytesPerElement:a.elementSize,version:a.version});return}let c=e.get(a);if(c===void 0)e.set(a,t(a,l));else if(c.version<a.version){if(c.size!==a.array.byteLength)throw new Error("THREE.WebGLAttributes: The size of the buffer attribute's array buffer does not match the original size. Resizing buffer attributes is not supported.");i(c.buffer,a,l),c.version=a.version}}return{get:r,remove:o,update:s}}var ru=`
#ifdef USE_ALPHAHASH
if ( diffuseColor.a < getAlphaHashThreshold( vPosition ) ) discard;
#endif
`;var ou=`
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
`;var su=`
#ifdef USE_ALPHAMAP
diffuseColor.a *= texture2D( alphaMap, vAlphaMapUv ).g;
#endif
`;var au=`
#ifdef USE_ALPHAMAP
uniform sampler2D alphaMap;
#endif
`;var lu=`
#ifdef USE_ALPHATEST
#ifdef ALPHA_TO_COVERAGE
diffuseColor.a = smoothstep( alphaTest, alphaTest + fwidth( diffuseColor.a ), diffuseColor.a );
if ( diffuseColor.a == 0.0 ) discard;
#else
if ( diffuseColor.a < alphaTest ) discard;
#endif
#endif
`;var cu=`
#ifdef USE_ALPHATEST
uniform float alphaTest;
#endif
`;var uu=`
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
`;var fu=`
#ifdef USE_AOMAP
uniform sampler2D aoMap;
uniform float aoMapIntensity;
#endif
`;var hu=`
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
`;var du=`
#ifdef USE_BATCHING
mat4 batchingMatrix = getBatchingMatrix( getIndirectIndex( gl_DrawID ) );
#endif
`;var pu=`
vec3 transformed = vec3( position );
#ifdef USE_ALPHAHASH
vPosition = vec3( position );
#endif
`;var mu=`
vec3 objectNormal = vec3( normal );
#ifdef USE_TANGENT
vec3 objectTangent = vec3( tangent.xyz );
#endif
`;var gu=`
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
`;var _u=`
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
`;var xu=`
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
`;var Su=`
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
`;var Mu=`
#if NUM_CLIPPING_PLANES > 0
varying vec3 vClipPosition;
uniform vec4 clippingPlanes[ NUM_CLIPPING_PLANES ];
#endif
`;var vu=`
#if NUM_CLIPPING_PLANES > 0
varying vec3 vClipPosition;
#endif
`;var yu=`
#if NUM_CLIPPING_PLANES > 0
vClipPosition = - mvPosition.xyz;
#endif
`;var bu=`
#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA )
diffuseColor *= vColor;
#endif
`;var Eu=`
#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA )
varying vec4 vColor;
#endif
`;var Tu=`
#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
varying vec4 vColor;
#endif
`;var Au=`
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
`;var wu=`
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
`;var Ru=`
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
`;var Cu=`
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
`;var Pu=`
#ifdef USE_DISPLACEMENTMAP
uniform sampler2D displacementMap;
uniform float displacementScale;
uniform float displacementBias;
#endif
`;var Lu=`
#ifdef USE_DISPLACEMENTMAP
transformed += normalize( objectNormal ) * ( texture2D( displacementMap, vDisplacementMapUv ).x * displacementScale + displacementBias );
#endif
`;var Du=`
#ifdef USE_EMISSIVEMAP
vec4 emissiveColor = texture2D( emissiveMap, vEmissiveMapUv );
#ifdef DECODE_VIDEO_TEXTURE_EMISSIVE
emissiveColor = sRGBTransferEOTF( emissiveColor );
#endif
totalEmissiveRadiance *= emissiveColor.rgb;
#endif
`;var Iu=`
#ifdef USE_EMISSIVEMAP
uniform sampler2D emissiveMap;
#endif
`;var Nu=`
gl_FragColor = linearToOutputTexel( gl_FragColor );
`;var Uu=`
vec4 LinearTransferOETF( in vec4 value ) {
return value;
}
vec4 sRGBTransferEOTF( in vec4 value ) {
return vec4( mix( pow( value.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), value.rgb * 0.0773993808, vec3( lessThanEqual( value.rgb, vec3( 0.04045 ) ) ) ), value.a );
}
vec4 sRGBTransferOETF( in vec4 value ) {
return vec4( mix( pow( value.rgb, vec3( 0.41666 ) ) * 1.055 - vec3( 0.055 ), value.rgb * 12.92, vec3( lessThanEqual( value.rgb, vec3( 0.0031308 ) ) ) ), value.a );
}
`;var Fu=`
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
`;var Ou=`
#ifdef USE_ENVMAP
uniform float envMapIntensity;
uniform mat3 envMapRotation;
#ifdef ENVMAP_TYPE_CUBE
uniform samplerCube envMap;
#else
uniform sampler2D envMap;
#endif
#endif
`;var Bu=`
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
`;var Gu=`
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
`;var zu=`
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
`;var ku=`
#ifdef USE_FOG
vFogDepth = - mvPosition.z;
#endif
`;var Hu=`
#ifdef USE_FOG
varying float vFogDepth;
#endif
`;var Vu=`
#ifdef USE_FOG
#ifdef FOG_EXP2
float fogFactor = 1.0 - exp( - fogDensity * fogDensity * vFogDepth * vFogDepth );
#else
float fogFactor = smoothstep( fogNear, fogFar, vFogDepth );
#endif
gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );
#endif
`;var Wu=`
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
`;var Xu=`
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
`;var qu=`
#ifdef USE_LIGHTMAP
uniform sampler2D lightMap;
uniform float lightMapIntensity;
#endif
`;var Yu=`
LambertMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularStrength = specularStrength;
`;var Ku=`
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
`;var Zu=`
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
`;var Ju=`
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
`;var $u=`
ToonMaterial material;
material.diffuseColor = diffuseColor.rgb;
`;var Qu=`
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
`;var ju=`
BlinnPhongMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularColor = specular;
material.specularShininess = shininess;
material.specularStrength = specularStrength;
`;var ef=`
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
`;var tf=`
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
`;var nf=`
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
`;var rf=`
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
`;var of=`
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
`;var sf=`
#if defined( RE_IndirectDiffuse )
#if defined( LAMBERT ) || defined( PHONG )
irradiance += iblIrradiance;
#endif
RE_IndirectDiffuse( irradiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif
#if defined( RE_IndirectSpecular )
RE_IndirectSpecular( radiance, iblIrradiance, clearcoatRadiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif
`;var af=`
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
`;var lf=`
#if defined( USE_LOGARITHMIC_DEPTH_BUFFER )
gl_FragDepth = vIsPerspective == 0.0 ? gl_FragCoord.z : log2( vFragDepth ) * logDepthBufFC * 0.5;
#endif
`;var cf=`
#if defined( USE_LOGARITHMIC_DEPTH_BUFFER )
uniform float logDepthBufFC;
varying float vFragDepth;
varying float vIsPerspective;
#endif
`;var uf=`
#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
varying float vFragDepth;
varying float vIsPerspective;
#endif
`;var ff=`
#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
vFragDepth = 1.0 + gl_Position.w;
vIsPerspective = float( isPerspectiveMatrix( projectionMatrix ) );
#endif
`;var hf=`
#ifdef USE_MAP
vec4 sampledDiffuseColor = texture2D( map, vMapUv );
#ifdef DECODE_VIDEO_TEXTURE
sampledDiffuseColor = sRGBTransferEOTF( sampledDiffuseColor );
#endif
diffuseColor *= sampledDiffuseColor;
#endif
`;var df=`
#ifdef USE_MAP
uniform sampler2D map;
#endif
`;var pf=`
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
`;var mf=`
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
`;var gf=`
float metalnessFactor = metalness;
#ifdef USE_METALNESSMAP
vec4 texelMetalness = texture2D( metalnessMap, vMetalnessMapUv );
metalnessFactor *= texelMetalness.b;
#endif
`;var _f=`
#ifdef USE_METALNESSMAP
uniform sampler2D metalnessMap;
#endif
`;var xf=`
#ifdef USE_INSTANCING_MORPH
float morphTargetInfluences[ MORPHTARGETS_COUNT ];
float morphTargetBaseInfluence = texelFetch( morphTexture, ivec2( 0, gl_InstanceID ), 0 ).r;
for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
morphTargetInfluences[i] = texelFetch( morphTexture, ivec2( i + 1, gl_InstanceID ), 0 ).r;
}
#endif
`;var Sf=`
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
`;var Mf=`
#ifdef USE_MORPHNORMALS
objectNormal *= morphTargetBaseInfluence;
for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
if ( morphTargetInfluences[ i ] != 0.0 ) objectNormal += getMorph( gl_VertexID, i, 1 ).xyz * morphTargetInfluences[ i ];
}
#endif
`;var vf=`
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
`;var yf=`
#ifdef USE_MORPHTARGETS
transformed *= morphTargetBaseInfluence;
for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
if ( morphTargetInfluences[ i ] != 0.0 ) transformed += getMorph( gl_VertexID, i, 0 ).xyz * morphTargetInfluences[ i ];
}
#endif
`;var bf=`
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
`;var Ef=`
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
`;var Tf=`
#ifndef FLAT_SHADED
varying vec3 vNormal;
#ifdef USE_TANGENT
varying vec3 vTangent;
varying vec3 vBitangent;
#endif
#endif
`;var Af=`
#ifndef FLAT_SHADED
varying vec3 vNormal;
#ifdef USE_TANGENT
varying vec3 vTangent;
varying vec3 vBitangent;
#endif
#endif
`;var wf=`
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
`;var Rf=`
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
`;var Cf=`
#ifdef USE_CLEARCOAT
vec3 clearcoatNormal = nonPerturbedNormal;
#endif
`;var Pf=`
#ifdef USE_CLEARCOAT_NORMALMAP
vec3 clearcoatMapN = texture2D( clearcoatNormalMap, vClearcoatNormalMapUv ).xyz * 2.0 - 1.0;
clearcoatMapN.xy *= clearcoatNormalScale;
clearcoatNormal = normalize( tbn2 * clearcoatMapN );
#endif
`;var Lf=`
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
`;var Df=`
#ifdef USE_IRIDESCENCEMAP
uniform sampler2D iridescenceMap;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
uniform sampler2D iridescenceThicknessMap;
#endif
`;var If=`
#ifdef OPAQUE
diffuseColor.a = 1.0;
#endif
#ifdef USE_TRANSMISSION
diffuseColor.a *= material.transmissionAlpha;
#endif
gl_FragColor = vec4( outgoingLight, diffuseColor.a );
`;var Nf=`
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
`;var Uf=`
#ifdef PREMULTIPLIED_ALPHA
gl_FragColor.rgb *= gl_FragColor.a;
#endif
`;var Ff=`
vec4 mvPosition = vec4( transformed, 1.0 );
#ifdef USE_BATCHING
mvPosition = batchingMatrix * mvPosition;
#endif
#ifdef USE_INSTANCING
mvPosition = instanceMatrix * mvPosition;
#endif
mvPosition = modelViewMatrix * mvPosition;
gl_Position = projectionMatrix * mvPosition;
`;var Of=`
#ifdef DITHERING
gl_FragColor.rgb = dithering( gl_FragColor.rgb );
#endif
`;var Bf=`
#ifdef DITHERING
vec3 dithering( vec3 color ) {
float grid_position = rand( gl_FragCoord.xy );
vec3 dither_shift_RGB = vec3( 0.25 / 255.0, -0.25 / 255.0, 0.25 / 255.0 );
dither_shift_RGB = mix( 2.0 * dither_shift_RGB, -2.0 * dither_shift_RGB, grid_position );
return color + dither_shift_RGB;
}
#endif
`;var Gf=`
float roughnessFactor = roughness;
#ifdef USE_ROUGHNESSMAP
vec4 texelRoughness = texture2D( roughnessMap, vRoughnessMapUv );
roughnessFactor *= texelRoughness.g;
#endif
`;var zf=`
#ifdef USE_ROUGHNESSMAP
uniform sampler2D roughnessMap;
#endif
`;var kf=`
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
`;var Hf=`
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
`;var Vf=`
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
`;var Wf=`
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
`;var Xf=`
#ifdef USE_SKINNING
mat4 boneMatX = getBoneMatrix( skinIndex.x );
mat4 boneMatY = getBoneMatrix( skinIndex.y );
mat4 boneMatZ = getBoneMatrix( skinIndex.z );
mat4 boneMatW = getBoneMatrix( skinIndex.w );
#endif
`;var qf=`
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
`;var Yf=`
#ifdef USE_SKINNING
vec4 skinVertex = bindMatrix * vec4( transformed, 1.0 );
vec4 skinned = vec4( 0.0 );
skinned += boneMatX * skinVertex * skinWeight.x;
skinned += boneMatY * skinVertex * skinWeight.y;
skinned += boneMatZ * skinVertex * skinWeight.z;
skinned += boneMatW * skinVertex * skinWeight.w;
transformed = ( bindMatrixInverse * skinned ).xyz;
#endif
`;var Kf=`
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
`;var Zf=`
float specularStrength;
#ifdef USE_SPECULARMAP
vec4 texelSpecular = texture2D( specularMap, vSpecularMapUv );
specularStrength = texelSpecular.r;
#else
specularStrength = 1.0;
#endif
`;var Jf=`
#ifdef USE_SPECULARMAP
uniform sampler2D specularMap;
#endif
`;var $f=`
#if defined( TONE_MAPPING )
gl_FragColor.rgb = toneMapping( gl_FragColor.rgb );
#endif
`;var Qf=`
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
`;var jf=`
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
`;var eh=`
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
`;var th=`
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
`;var ih=`
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
`;var nh=`
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
`;var rh=`
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
`;var oh=`
varying vec2 vUv;
uniform mat3 uvTransform;
void main() {
vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
gl_Position = vec4( position.xy, 1.0, 1.0 );
}
`,sh=`
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
`;var ah=`
varying vec3 vWorldDirection;
#include <common>
void main() {
vWorldDirection = transformDirection( position, modelMatrix );
#include <begin_vertex>
#include <project_vertex>
gl_Position.z = gl_Position.w;
}
`,lh=`
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
`;var ch=`
varying vec3 vWorldDirection;
#include <common>
void main() {
vWorldDirection = transformDirection( position, modelMatrix );
#include <begin_vertex>
#include <project_vertex>
gl_Position.z = gl_Position.w;
}
`,uh=`
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
`;var fh=`
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
`,hh=`
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
`;var dh=`
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
`,ph=`
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
`;var mh=`
varying vec3 vWorldDirection;
#include <common>
void main() {
vWorldDirection = transformDirection( position, modelMatrix );
#include <begin_vertex>
#include <project_vertex>
}
`,gh=`
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
`;var _h=`
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
`,xh=`
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
`;var Sh=`
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
`,Mh=`
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
`;var vh=`
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
`,yh=`
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
`;var bh=`
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
`,Eh=`
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
`;var Th=`
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
`,Ah=`
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
`;var wh=`
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
`,Rh=`
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
`;var Ch=`
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
`,Ph=`
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
`;var Lh=`
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
`,Dh=`
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
`;var Ih=`
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
`,Nh=`
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
`;var Uh=`
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
`,Fh=`
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
`;var Oh=`
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
`,Bh=`
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
`;var tt={alphahash_fragment:ru,alphahash_pars_fragment:ou,alphamap_fragment:su,alphamap_pars_fragment:au,alphatest_fragment:lu,alphatest_pars_fragment:cu,aomap_fragment:uu,aomap_pars_fragment:fu,batching_pars_vertex:hu,batching_vertex:du,begin_vertex:pu,beginnormal_vertex:mu,bsdfs:gu,iridescence_fragment:_u,bumpmap_pars_fragment:xu,clipping_planes_fragment:Su,clipping_planes_pars_fragment:Mu,clipping_planes_pars_vertex:vu,clipping_planes_vertex:yu,color_fragment:bu,color_pars_fragment:Eu,color_pars_vertex:Tu,color_vertex:Au,common:wu,cube_uv_reflection_fragment:Ru,defaultnormal_vertex:Cu,displacementmap_pars_vertex:Pu,displacementmap_vertex:Lu,emissivemap_fragment:Du,emissivemap_pars_fragment:Iu,colorspace_fragment:Nu,colorspace_pars_fragment:Uu,envmap_fragment:Fu,envmap_common_pars_fragment:Ou,envmap_pars_fragment:Bu,envmap_pars_vertex:Gu,envmap_physical_pars_fragment:Ju,envmap_vertex:zu,fog_vertex:ku,fog_pars_vertex:Hu,fog_fragment:Vu,fog_pars_fragment:Wu,gradientmap_pars_fragment:Xu,lightmap_pars_fragment:qu,lights_lambert_fragment:Yu,lights_lambert_pars_fragment:Ku,lights_pars_begin:Zu,lights_toon_fragment:$u,lights_toon_pars_fragment:Qu,lights_phong_fragment:ju,lights_phong_pars_fragment:ef,lights_physical_fragment:tf,lights_physical_pars_fragment:nf,lights_fragment_begin:rf,lights_fragment_maps:of,lights_fragment_end:sf,lightprobes_pars_fragment:af,logdepthbuf_fragment:lf,logdepthbuf_pars_fragment:cf,logdepthbuf_pars_vertex:uf,logdepthbuf_vertex:ff,map_fragment:hf,map_pars_fragment:df,map_particle_fragment:pf,map_particle_pars_fragment:mf,metalnessmap_fragment:gf,metalnessmap_pars_fragment:_f,morphinstance_vertex:xf,morphcolor_vertex:Sf,morphnormal_vertex:Mf,morphtarget_pars_vertex:vf,morphtarget_vertex:yf,normal_fragment_begin:bf,normal_fragment_maps:Ef,normal_pars_fragment:Tf,normal_pars_vertex:Af,normal_vertex:wf,normalmap_pars_fragment:Rf,clearcoat_normal_fragment_begin:Cf,clearcoat_normal_fragment_maps:Pf,clearcoat_pars_fragment:Lf,iridescence_pars_fragment:Df,opaque_fragment:If,packing:Nf,premultiplied_alpha_fragment:Uf,project_vertex:Ff,dithering_fragment:Of,dithering_pars_fragment:Bf,roughnessmap_fragment:Gf,roughnessmap_pars_fragment:zf,shadowmap_pars_fragment:kf,shadowmap_pars_vertex:Hf,shadowmap_vertex:Vf,shadowmask_pars_fragment:Wf,skinbase_vertex:Xf,skinning_pars_vertex:qf,skinning_vertex:Yf,skinnormal_vertex:Kf,specularmap_fragment:Zf,specularmap_pars_fragment:Jf,tonemapping_fragment:$f,tonemapping_pars_fragment:Qf,transmission_fragment:jf,transmission_pars_fragment:eh,uv_pars_fragment:th,uv_pars_vertex:ih,uv_vertex:nh,worldpos_vertex:rh,background_vert:oh,background_frag:sh,backgroundCube_vert:ah,backgroundCube_frag:lh,cube_vert:ch,cube_frag:uh,depth_vert:fh,depth_frag:hh,distance_vert:dh,distance_frag:ph,equirect_vert:mh,equirect_frag:gh,linedashed_vert:_h,linedashed_frag:xh,meshbasic_vert:Sh,meshbasic_frag:Mh,meshlambert_vert:vh,meshlambert_frag:yh,meshmatcap_vert:bh,meshmatcap_frag:Eh,meshnormal_vert:Th,meshnormal_frag:Ah,meshphong_vert:wh,meshphong_frag:Rh,meshphysical_vert:Ch,meshphysical_frag:Ph,meshtoon_vert:Lh,meshtoon_frag:Dh,points_vert:Ih,points_frag:Nh,shadow_vert:Uh,shadow_frag:Fh,sprite_vert:Oh,sprite_frag:Bh};var Te={common:{diffuse:{value:new Le(16777215)},opacity:{value:1},map:{value:null},mapTransform:{value:new ke},alphaMap:{value:null},alphaMapTransform:{value:new ke},alphaTest:{value:0}},specularmap:{specularMap:{value:null},specularMapTransform:{value:new ke}},envmap:{envMap:{value:null},envMapRotation:{value:new ke},reflectivity:{value:1},ior:{value:1.5},refractionRatio:{value:.98},dfgLUT:{value:null}},aomap:{aoMap:{value:null},aoMapIntensity:{value:1},aoMapTransform:{value:new ke}},lightmap:{lightMap:{value:null},lightMapIntensity:{value:1},lightMapTransform:{value:new ke}},bumpmap:{bumpMap:{value:null},bumpMapTransform:{value:new ke},bumpScale:{value:1}},normalmap:{normalMap:{value:null},normalMapTransform:{value:new ke},normalScale:{value:new Ae(1,1)}},displacementmap:{displacementMap:{value:null},displacementMapTransform:{value:new ke},displacementScale:{value:1},displacementBias:{value:0}},emissivemap:{emissiveMap:{value:null},emissiveMapTransform:{value:new ke}},metalnessmap:{metalnessMap:{value:null},metalnessMapTransform:{value:new ke}},roughnessmap:{roughnessMap:{value:null},roughnessMapTransform:{value:new ke}},gradientmap:{gradientMap:{value:null}},fog:{fogDensity:{value:25e-5},fogNear:{value:1},fogFar:{value:2e3},fogColor:{value:new Le(16777215)}},lights:{ambientLightColor:{value:[]},lightProbe:{value:[]},sunLights:{value:[],properties:{direction:{},color:{}}},sunLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},sunShadowMatrix:{value:[]},sunShadowCascade:{value:[]},directionalLights:{value:[],properties:{direction:{},color:{}}},directionalLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},directionalShadowMatrix:{value:[]},spotLights:{value:[],properties:{color:{},position:{},direction:{},distance:{},coneCos:{},penumbraCos:{},decay:{}}},spotLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},spotLightMap:{value:[]},spotLightMatrix:{value:[]},pointLights:{value:[],properties:{color:{},position:{},decay:{},distance:{}}},pointLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{},shadowCameraNear:{},shadowCameraFar:{}}},pointShadowMatrix:{value:[]},hemisphereLights:{value:[],properties:{direction:{},skyColor:{},groundColor:{}}},rectAreaLights:{value:[],properties:{color:{},position:{},width:{},height:{}}},ltc_1:{value:null},ltc_2:{value:null},probesSH:{value:null},probesMin:{value:new U},probesMax:{value:new U},probesResolution:{value:new U}},points:{diffuse:{value:new Le(16777215)},opacity:{value:1},size:{value:1},scale:{value:1},map:{value:null},alphaMap:{value:null},alphaMapTransform:{value:new ke},alphaTest:{value:0},uvTransform:{value:new ke}},sprite:{diffuse:{value:new Le(16777215)},opacity:{value:1},center:{value:new Ae(.5,.5)},rotation:{value:0},map:{value:null},mapTransform:{value:new ke},alphaMap:{value:null},alphaMapTransform:{value:new ke},alphaTest:{value:0}}};var Ui={basic:{uniforms:pi([Te.common,Te.specularmap,Te.envmap,Te.aomap,Te.lightmap,Te.fog]),vertexShader:tt.meshbasic_vert,fragmentShader:tt.meshbasic_frag},lambert:{uniforms:pi([Te.common,Te.specularmap,Te.envmap,Te.aomap,Te.lightmap,Te.emissivemap,Te.bumpmap,Te.normalmap,Te.displacementmap,Te.fog,Te.lights,{emissive:{value:new Le(0)},envMapIntensity:{value:1}}]),vertexShader:tt.meshlambert_vert,fragmentShader:tt.meshlambert_frag},phong:{uniforms:pi([Te.common,Te.specularmap,Te.envmap,Te.aomap,Te.lightmap,Te.emissivemap,Te.bumpmap,Te.normalmap,Te.displacementmap,Te.fog,Te.lights,{emissive:{value:new Le(0)},specular:{value:new Le(1118481)},shininess:{value:30},envMapIntensity:{value:1}}]),vertexShader:tt.meshphong_vert,fragmentShader:tt.meshphong_frag},standard:{uniforms:pi([Te.common,Te.envmap,Te.aomap,Te.lightmap,Te.emissivemap,Te.bumpmap,Te.normalmap,Te.displacementmap,Te.roughnessmap,Te.metalnessmap,Te.fog,Te.lights,{emissive:{value:new Le(0)},roughness:{value:1},metalness:{value:0},envMapIntensity:{value:1}}]),vertexShader:tt.meshphysical_vert,fragmentShader:tt.meshphysical_frag},toon:{uniforms:pi([Te.common,Te.aomap,Te.lightmap,Te.emissivemap,Te.bumpmap,Te.normalmap,Te.displacementmap,Te.gradientmap,Te.fog,Te.lights,{emissive:{value:new Le(0)}}]),vertexShader:tt.meshtoon_vert,fragmentShader:tt.meshtoon_frag},matcap:{uniforms:pi([Te.common,Te.bumpmap,Te.normalmap,Te.displacementmap,Te.fog,{matcap:{value:null}}]),vertexShader:tt.meshmatcap_vert,fragmentShader:tt.meshmatcap_frag},points:{uniforms:pi([Te.points,Te.fog]),vertexShader:tt.points_vert,fragmentShader:tt.points_frag},dashed:{uniforms:pi([Te.common,Te.fog,{scale:{value:1},dashSize:{value:1},totalSize:{value:2}}]),vertexShader:tt.linedashed_vert,fragmentShader:tt.linedashed_frag},depth:{uniforms:pi([Te.common,Te.displacementmap]),vertexShader:tt.depth_vert,fragmentShader:tt.depth_frag},normal:{uniforms:pi([Te.common,Te.bumpmap,Te.normalmap,Te.displacementmap,{opacity:{value:1}}]),vertexShader:tt.meshnormal_vert,fragmentShader:tt.meshnormal_frag},sprite:{uniforms:pi([Te.sprite,Te.fog]),vertexShader:tt.sprite_vert,fragmentShader:tt.sprite_frag},background:{uniforms:{uvTransform:{value:new ke},t2D:{value:null},backgroundIntensity:{value:1}},vertexShader:tt.background_vert,fragmentShader:tt.background_frag},backgroundCube:{uniforms:{envMap:{value:null},backgroundBlurriness:{value:0},backgroundIntensity:{value:1},backgroundRotation:{value:new ke}},vertexShader:tt.backgroundCube_vert,fragmentShader:tt.backgroundCube_frag},cube:{uniforms:{tCube:{value:null},tFlip:{value:-1},opacity:{value:1}},vertexShader:tt.cube_vert,fragmentShader:tt.cube_frag},equirect:{uniforms:{tEquirect:{value:null}},vertexShader:tt.equirect_vert,fragmentShader:tt.equirect_frag},distance:{uniforms:pi([Te.common,Te.displacementmap,{referencePosition:{value:new U},nearDistance:{value:1},farDistance:{value:1e3}}]),vertexShader:tt.distance_vert,fragmentShader:tt.distance_frag},shadow:{uniforms:pi([Te.lights,Te.fog,{color:{value:new Le(0)},opacity:{value:1}}]),vertexShader:tt.shadow_vert,fragmentShader:tt.shadow_frag}};Ui.physical={uniforms:pi([Ui.standard.uniforms,{clearcoat:{value:0},clearcoatMap:{value:null},clearcoatMapTransform:{value:new ke},clearcoatNormalMap:{value:null},clearcoatNormalMapTransform:{value:new ke},clearcoatNormalScale:{value:new Ae(1,1)},clearcoatRoughness:{value:0},clearcoatRoughnessMap:{value:null},clearcoatRoughnessMapTransform:{value:new ke},dispersion:{value:0},retroreflectivity:{value:0},iridescence:{value:0},iridescenceMap:{value:null},iridescenceMapTransform:{value:new ke},iridescenceIOR:{value:1.3},iridescenceThicknessMinimum:{value:100},iridescenceThicknessMaximum:{value:400},iridescenceThicknessMap:{value:null},iridescenceThicknessMapTransform:{value:new ke},sheen:{value:0},sheenColor:{value:new Le(0)},sheenColorMap:{value:null},sheenColorMapTransform:{value:new ke},sheenRoughness:{value:1},sheenRoughnessMap:{value:null},sheenRoughnessMapTransform:{value:new ke},transmission:{value:0},transmissionMap:{value:null},transmissionMapTransform:{value:new ke},transmissionSamplerSize:{value:new Ae},transmissionSamplerMap:{value:null},thickness:{value:0},thicknessMap:{value:null},thicknessMapTransform:{value:new ke},attenuationDistance:{value:0},attenuationColor:{value:new Le(0)},specularColor:{value:new Le(1,1,1)},specularColorMap:{value:null},specularColorMapTransform:{value:new ke},specularIntensity:{value:1},specularIntensityMap:{value:null},specularIntensityMapTransform:{value:new ke},anisotropyVector:{value:new Ae},anisotropyMap:{value:null},anisotropyMapTransform:{value:new ke}}]),vertexShader:tt.meshphysical_vert,fragmentShader:tt.meshphysical_frag};var ya={r:0,b:0,g:0},Sm=new Qe,Gh=new ke;Gh.set(-1,0,0,0,1,0,0,0,1);function zh(n,e,t,i,r,o){let s=new Le(0),a=r===!0?0:1,l,c,h=null,d=0,u=null;function m(E){let C=E.isScene===!0?E.background:null;if(C&&C.isTexture){let y=E.backgroundBlurriness>0;C=e.get(C,y)}return C}function _(E){let C=!1,y=m(E);y===null?p(s,a):y&&y.isColor&&(p(y,1),C=!0);let b=n.xr.getEnvironmentBlendMode();b==="additive"?t.buffers.color.setClear(0,0,0,1,o):b==="alpha-blend"&&t.buffers.color.setClear(0,0,0,0,o),(n.autoClear||C)&&(t.buffers.depth.setTest(!0),t.buffers.depth.setMask(!0),t.buffers.color.setMask(!0),n.clear(n.autoClearColor,n.autoClearDepth,n.autoClearStencil))}function M(E,C){let y=m(C);y&&(y.isCubeTexture||y.mapping===Mn)?(c===void 0&&(c=new _e(new Pt(1,1,1),new ni({name:"BackgroundCubeMaterial",uniforms:un(Ui.backgroundCube.uniforms),vertexShader:Ui.backgroundCube.vertexShader,fragmentShader:Ui.backgroundCube.fragmentShader,side:wt,depthTest:!1,depthWrite:!1,fog:!1,allowOverride:!1})),c.geometry.deleteAttribute("normal"),c.geometry.deleteAttribute("uv"),c.onBeforeRender=function(b,v,D){this.matrixWorld.copyPosition(D.matrixWorld)},Object.defineProperty(c.material,"envMap",{get:function(){return this.uniforms.envMap.value}}),i.update(c)),c.material.uniforms.envMap.value=y,c.material.uniforms.backgroundBlurriness.value=C.backgroundBlurriness,c.material.uniforms.backgroundIntensity.value=C.backgroundIntensity,c.material.uniforms.backgroundRotation.value.setFromMatrix4(Sm.makeRotationFromEuler(C.backgroundRotation)).transpose(),y.isCubeTexture&&y.isRenderTargetTexture===!1&&c.material.uniforms.backgroundRotation.value.premultiply(Gh),c.material.toneMapped=$e.getTransfer(y.colorSpace)!==lt,(h!==y||d!==y.version||u!==n.toneMapping)&&(c.material.needsUpdate=!0,h=y,d=y.version,u=n.toneMapping),c.layers.enableAll(),E.unshift(c,c.geometry,c.material,0,0,null)):y&&y.isTexture&&(l===void 0&&(l=new _e(new cn(2,2),new ni({name:"BackgroundMaterial",uniforms:un(Ui.background.uniforms),vertexShader:Ui.background.vertexShader,fragmentShader:Ui.background.fragmentShader,side:Ci,depthTest:!1,depthWrite:!1,fog:!1,allowOverride:!1})),l.geometry.deleteAttribute("normal"),Object.defineProperty(l.material,"map",{get:function(){return this.uniforms.t2D.value}}),i.update(l)),l.material.uniforms.t2D.value=y,l.material.uniforms.backgroundIntensity.value=C.backgroundIntensity,l.material.toneMapped=$e.getTransfer(y.colorSpace)!==lt,y.matrixAutoUpdate===!0&&y.updateMatrix(),l.material.uniforms.uvTransform.value.copy(y.matrix),(h!==y||d!==y.version||u!==n.toneMapping)&&(l.material.needsUpdate=!0,h=y,d=y.version,u=n.toneMapping),l.layers.enableAll(),E.unshift(l,l.geometry,l.material,0,0,null))}function p(E,C){E.getRGB(ya,fa(n)),t.buffers.color.setClear(ya.r,ya.g,ya.b,C,o)}function f(){c!==void 0&&(c.geometry.dispose(),c.material.dispose(),c=void 0),l!==void 0&&(l.geometry.dispose(),l.material.dispose(),l=void 0)}return{getClearColor:function(){return s},setClearColor:function(E,C=1){s.set(E),a=C,p(s,a)},getClearAlpha:function(){return a},setClearAlpha:function(E){a=E,p(s,a)},render:_,addToRenderList:M,dispose:f}}function kh(n,e){let t=n.getParameter(n.MAX_VERTEX_ATTRIBS),i={},r=u(null),o=r,s=!1;function a(G,z,W,O,X){let Z=!1,J=d(G,O,W,z);o!==J&&(o=J,c(o.object)),Z=m(G,O,W,X),Z&&_(G,O,W,X),X!==null&&e.update(X,n.ELEMENT_ARRAY_BUFFER),(Z||s)&&(s=!1,y(G,z,W,O),X!==null&&n.bindBuffer(n.ELEMENT_ARRAY_BUFFER,e.get(X).buffer))}function l(){return n.createVertexArray()}function c(G){return n.bindVertexArray(G)}function h(G){return n.deleteVertexArray(G)}function d(G,z,W,O){let X=O.wireframe===!0,Z=i[z.id];Z===void 0&&(Z={},i[z.id]=Z);let J=G.isInstancedMesh===!0?G.id:0,ae=Z[J];ae===void 0&&(ae={},Z[J]=ae);let Q=ae[W.id];Q===void 0&&(Q={},ae[W.id]=Q);let se=Q[X];return se===void 0&&(se=u(l()),Q[X]=se),se}function u(G){let z=[],W=[],O=[];for(let X=0;X<t;X++)z[X]=0,W[X]=0,O[X]=0;return{geometry:null,program:null,wireframe:!1,newAttributes:z,enabledAttributes:W,attributeDivisors:O,object:G,attributes:{},index:null}}function m(G,z,W,O){let X=o.attributes,Z=z.attributes,J=0,ae=W.getAttributes();for(let Q in ae)if(ae[Q].location>=0){let le=X[Q],Oe=Z[Q];if(Oe===void 0&&(Q==="instanceMatrix"&&G.instanceMatrix&&(Oe=G.instanceMatrix),Q==="instanceColor"&&G.instanceColor&&(Oe=G.instanceColor)),le===void 0||le.attribute!==Oe||Oe&&le.data!==Oe.data)return!0;J++}return o.attributesNum!==J||o.index!==O}function _(G,z,W,O){let X={},Z=z.attributes,J=0,ae=W.getAttributes();for(let Q in ae)if(ae[Q].location>=0){let le=Z[Q];le===void 0&&(Q==="instanceMatrix"&&G.instanceMatrix&&(le=G.instanceMatrix),Q==="instanceColor"&&G.instanceColor&&(le=G.instanceColor));let Oe={};Oe.attribute=le,le&&le.data&&(Oe.data=le.data),X[Q]=Oe,J++}o.attributes=X,o.attributesNum=J,o.index=O}function M(){let G=o.newAttributes;for(let z=0,W=G.length;z<W;z++)G[z]=0}function p(G){f(G,0)}function f(G,z){let W=o.newAttributes,O=o.enabledAttributes,X=o.attributeDivisors;W[G]=1,O[G]===0&&(n.enableVertexAttribArray(G),O[G]=1),X[G]!==z&&(n.vertexAttribDivisor(G,z),X[G]=z)}function E(){let G=o.newAttributes,z=o.enabledAttributes;for(let W=0,O=z.length;W<O;W++)z[W]!==G[W]&&(n.disableVertexAttribArray(W),z[W]=0)}function C(G,z,W,O,X,Z,J){J===!0?n.vertexAttribIPointer(G,z,W,X,Z):n.vertexAttribPointer(G,z,W,O,X,Z)}function y(G,z,W,O){M();let X=O.attributes,Z=W.getAttributes(),J=z.defaultAttributeValues;for(let ae in Z){let Q=Z[ae];if(Q.location>=0){let se=X[ae];if(se===void 0&&(ae==="instanceMatrix"&&G.instanceMatrix&&(se=G.instanceMatrix),ae==="instanceColor"&&G.instanceColor&&(se=G.instanceColor)),se!==void 0){let le=se.normalized,Oe=se.itemSize,ve=e.get(se);if(ve===void 0)continue;let mt=ve.buffer,it=ve.type,ot=ve.bytesPerElement,te=it===n.INT||it===n.UNSIGNED_INT||se.gpuType===cr;if(se.isInterleavedBufferAttribute){let ne=se.data,we=ne.stride,Xe=se.offset;if(ne.isInstancedInterleavedBuffer){for(let de=0;de<Q.locationSize;de++)f(Q.location+de,ne.meshPerAttribute);G.isInstancedMesh!==!0&&O._maxInstanceCount===void 0&&(O._maxInstanceCount=ne.meshPerAttribute*ne.count)}else for(let de=0;de<Q.locationSize;de++)p(Q.location+de);n.bindBuffer(n.ARRAY_BUFFER,mt);for(let de=0;de<Q.locationSize;de++)C(Q.location+de,Oe/Q.locationSize,it,le,we*ot,(Xe+Oe/Q.locationSize*de)*ot,te)}else{if(se.isInstancedBufferAttribute){for(let ne=0;ne<Q.locationSize;ne++)f(Q.location+ne,se.meshPerAttribute);G.isInstancedMesh!==!0&&O._maxInstanceCount===void 0&&(O._maxInstanceCount=se.meshPerAttribute*se.count)}else for(let ne=0;ne<Q.locationSize;ne++)p(Q.location+ne);n.bindBuffer(n.ARRAY_BUFFER,mt);for(let ne=0;ne<Q.locationSize;ne++)C(Q.location+ne,Oe/Q.locationSize,it,le,Oe*ot,Oe/Q.locationSize*ne*ot,te)}}else if(J!==void 0){let le=J[ae];if(le!==void 0)switch(le.length){case 2:n.vertexAttrib2fv(Q.location,le);break;case 3:n.vertexAttrib3fv(Q.location,le);break;case 4:n.vertexAttrib4fv(Q.location,le);break;default:n.vertexAttrib1fv(Q.location,le)}}}}E()}function b(){T();for(let G in i){let z=i[G];for(let W in z){let O=z[W];for(let X in O){let Z=O[X];for(let J in Z)h(Z[J].object),delete Z[J];delete O[X]}}delete i[G]}}function v(G){if(i[G.id]===void 0)return;let z=i[G.id];for(let W in z){let O=z[W];for(let X in O){let Z=O[X];for(let J in Z)h(Z[J].object),delete Z[J];delete O[X]}}delete i[G.id]}function D(G){for(let z in i){let W=i[z];for(let O in W){let X=W[O];if(X[G.id]===void 0)continue;let Z=X[G.id];for(let J in Z)h(Z[J].object),delete Z[J];delete X[G.id]}}}function S(G){for(let z in i){let W=i[z],O=G.isInstancedMesh===!0?G.id:0,X=W[O];if(X!==void 0){for(let Z in X){let J=X[Z];for(let ae in J)h(J[ae].object),delete J[ae];delete X[Z]}delete W[O],Object.keys(W).length===0&&delete i[z]}}}function T(){I(),s=!0,o!==r&&(o=r,c(o.object))}function I(){r.geometry=null,r.program=null,r.wireframe=!1}return{setup:a,reset:T,resetDefaultState:I,dispose:b,releaseStatesOfGeometry:v,releaseStatesOfObject:S,releaseStatesOfProgram:D,initAttributes:M,enableAttribute:p,disableUnusedAttributes:E}}function Hh(n,e,t){let i;function r(l){i=l}function o(l,c){n.drawArrays(i,l,c),t.update(c,i,1)}function s(l,c,h){h!==0&&(n.drawArraysInstanced(i,l,c,h),t.update(c,i,h))}function a(l,c,h){if(h===0)return;e.get("WEBGL_multi_draw").multiDrawArraysWEBGL(i,l,0,c,0,h);let u=0;for(let m=0;m<h;m++)u+=c[m];t.update(u,i,1)}this.setMode=r,this.render=o,this.renderInstances=s,this.renderMultiDraw=a}function Vh(n,e,t,i){let r;function o(){if(r!==void 0)return r;if(e.has("EXT_texture_filter_anisotropic")===!0){let D=e.get("EXT_texture_filter_anisotropic");r=n.getParameter(D.MAX_TEXTURE_MAX_ANISOTROPY_EXT)}else r=0;return r}function s(D){return!(D!==jt&&i.convert(D)!==n.getParameter(n.IMPLEMENTATION_COLOR_READ_FORMAT))}function a(D){let S=D===Qt&&(e.has("EXT_color_buffer_half_float")||e.has("EXT_color_buffer_float"));return!(D!==Ot&&D!==oi&&!S&&i.convert(D)!==n.getParameter(n.IMPLEMENTATION_COLOR_READ_TYPE))}function l(D){if(D==="highp"){if(n.getShaderPrecisionFormat(n.VERTEX_SHADER,n.HIGH_FLOAT).precision>0&&n.getShaderPrecisionFormat(n.FRAGMENT_SHADER,n.HIGH_FLOAT).precision>0)return"highp";D="mediump"}return D==="mediump"&&n.getShaderPrecisionFormat(n.VERTEX_SHADER,n.MEDIUM_FLOAT).precision>0&&n.getShaderPrecisionFormat(n.FRAGMENT_SHADER,n.MEDIUM_FLOAT).precision>0?"mediump":"lowp"}let c=t.precision!==void 0?t.precision:"highp",h=l(c);h!==c&&(Ie("WebGLRenderer:",c,"not supported, using",h,"instead."),c=h);let d=t.logarithmicDepthBuffer===!0,u=t.reversedDepthBuffer===!0&&e.has("EXT_clip_control");t.reversedDepthBuffer===!0&&u===!1&&Ie("WebGLRenderer: Unable to use reversed depth buffer due to missing EXT_clip_control extension. Fallback to default depth buffer.");let m=n.getParameter(n.MAX_TEXTURE_IMAGE_UNITS),_=n.getParameter(n.MAX_VERTEX_TEXTURE_IMAGE_UNITS),M=n.getParameter(n.MAX_TEXTURE_SIZE),p=n.getParameter(n.MAX_CUBE_MAP_TEXTURE_SIZE),f=n.getParameter(n.MAX_VERTEX_ATTRIBS),E=n.getParameter(n.MAX_VERTEX_UNIFORM_VECTORS),C=n.getParameter(n.MAX_VARYING_VECTORS),y=n.getParameter(n.MAX_FRAGMENT_UNIFORM_VECTORS),b=n.getParameter(n.MAX_SAMPLES),v=n.getParameter(n.SAMPLES);return{isWebGL2:!0,getMaxAnisotropy:o,getMaxPrecision:l,textureFormatReadable:s,textureTypeReadable:a,precision:c,logarithmicDepthBuffer:d,reversedDepthBuffer:u,maxTextures:m,maxVertexTextures:_,maxTextureSize:M,maxCubemapSize:p,maxAttributes:f,maxVertexUniforms:E,maxVaryings:C,maxFragmentUniforms:y,maxSamples:b,samples:v}}function Wh(n){let e=this,t=null,i=0,r=!1,o=!1,s=new hi,a=new ke,l={value:null,needsUpdate:!1};this.uniform=l,this.numPlanes=0,this.numIntersection=0,this.init=function(d,u){let m=d.length!==0||u||i!==0||r;return r=u,i=d.length,m},this.beginShadows=function(){o=!0,h(null)},this.endShadows=function(){o=!1},this.setGlobalState=function(d,u){t=h(d,u,0)},this.setState=function(d,u,m){let _=d.clippingPlanes,M=d.clipIntersection,p=d.clipShadows,f=n.get(d);if(!r||_===null||_.length===0||o&&!p)o?h(null):c();else{let E=o?0:i,C=E*4,y=f.clippingState||null;l.value=y,y=h(_,u,C,m);for(let b=0;b!==C;++b)y[b]=t[b];f.clippingState=y,this.numIntersection=M?this.numPlanes:0,this.numPlanes+=E}};function c(){l.value!==t&&(l.value=t,l.needsUpdate=i>0),e.numPlanes=i,e.numIntersection=0}function h(d,u,m,_){let M=d!==null?d.length:0,p=null;if(M!==0){if(p=l.value,_!==!0||p===null){let f=m+M*4,E=u.matrixWorldInverse;a.getNormalMatrix(E),(p===null||p.length<f)&&(p=new Float32Array(f));for(let C=0,y=m;C!==M;++C,y+=4)s.copy(d[C]).applyMatrix4(E,a),s.normal.toArray(p,y),p[y+3]=s.constant}l.value=p,l.needsUpdate=!0}return e.numPlanes=M,e.numIntersection=0,p}}var Jr=4,Mm=6,vm=20,ym=256,ts=new Dn,Xh=new Le,pl=null,ml=0,gl=0,_l=!1,bm=new U,ir=new U,is=class{constructor(e){this._renderer=e,this._pingPongRenderTarget=null,this._lodMax=0,this._cubeSize=0,this._sizeLods=[],this._lodMeshes=[],this._backgroundBox=null,this._cubemapMaterial=null,this._equirectMaterial=null,this._blurMaterial=null,this._ggxMaterial=null}fromScene(e,t=0,i=.1,r=100,o={}){let{size:s=256,position:a=bm}=o;pl=this._renderer.getRenderTarget(),ml=this._renderer.getActiveCubeFace(),gl=this._renderer.getActiveMipmapLevel(),_l=this._renderer.xr.enabled,this._renderer.xr.enabled=!1,this._setSize(s);let l=this._allocateTargets();return l.depthBuffer=!0,this._sceneToCubeUV(e,i,r,l,a),t>0&&this._blur(l,0,0,t),this._applyPMREM(l),this._cleanup(l),l}fromEquirectangular(e,t=null){return this._fromTexture(e,t)}fromCubemap(e,t=null){return this._fromTexture(e,t)}compileCubemapShader(){this._cubemapMaterial===null&&(this._cubemapMaterial=Kh(),this._compileMaterial(this._cubemapMaterial))}compileEquirectangularShader(){this._equirectMaterial===null&&(this._equirectMaterial=Yh(),this._compileMaterial(this._equirectMaterial))}dispose(){this._dispose(),this._cubemapMaterial!==null&&this._cubemapMaterial.dispose(),this._equirectMaterial!==null&&this._equirectMaterial.dispose(),this._backgroundBox!==null&&(this._backgroundBox.geometry.dispose(),this._backgroundBox.material.dispose())}_setSize(e){this._lodMax=Math.floor(Math.log2(e)),this._cubeSize=Math.pow(2,this._lodMax)}_dispose(){this._blurMaterial!==null&&this._blurMaterial.dispose(),this._ggxMaterial!==null&&this._ggxMaterial.dispose(),this._pingPongRenderTarget!==null&&this._pingPongRenderTarget.dispose();for(let e=0;e<this._lodMeshes.length;e++)this._lodMeshes[e].geometry.dispose()}_cleanup(e){this._renderer.setRenderTarget(pl,ml,gl),this._renderer.xr.enabled=_l,e.scissorTest=!1,Zr(e,0,0,e.width,e.height)}_fromTexture(e,t){e.mapping===Pi||e.mapping===$i?this._setSize(e.image.length===0?16:e.image[0].width||e.image[0].image.width):this._setSize(e.image.width/4),pl=this._renderer.getRenderTarget(),ml=this._renderer.getActiveCubeFace(),gl=this._renderer.getActiveMipmapLevel(),_l=this._renderer.xr.enabled,this._renderer.xr.enabled=!1;let i=t||this._allocateTargets();return this._textureToCubeUV(e,i),this._applyPMREM(i),this._cleanup(i),i}_allocateTargets(){let e=3*Math.max(this._cubeSize,112),t=4*this._cubeSize,i={magFilter:Lt,minFilter:Lt,generateMipmaps:!1,type:Qt,format:jt,colorSpace:Vn,depthBuffer:!1},r=qh(e,t,i);if(this._pingPongRenderTarget===null||this._pingPongRenderTarget.width!==e||this._pingPongRenderTarget.height!==t){this._pingPongRenderTarget!==null&&this._dispose(),this._pingPongRenderTarget=qh(e,t,i);let{_lodMax:o}=this;({lodMeshes:this._lodMeshes,sizeLods:this._sizeLods}=Em(o)),this._blurMaterial=Am(o,e,t),this._ggxMaterial=Tm(o,e,t)}return r}_compileMaterial(e){let t=new _e(new pt,e);this._renderer.compile(t,ts)}_sceneToCubeUV(e,t,i,r,o){let l=new Nt(90,1,t,i),c=[1,-1,1,1,1,1],h=[1,1,1,-1,-1,-1],d=this._renderer,u=d.autoClear,m=d.toneMapping;d.getClearColor(Xh),d.toneMapping=mi,d.autoClear=!1,d.state.buffers.depth.getReversed()&&(d.setRenderTarget(r),d.clearDepth(),d.setRenderTarget(null)),this._backgroundBox===null&&(this._backgroundBox=new _e(new Pt,new ii({name:"PMREM.Background",side:wt,depthWrite:!1,depthTest:!1})));let M=this._backgroundBox,p=M.material,f=!1,E=e.background;E?E.isColor&&(p.color.copy(E),e.background=null,f=!0):(p.color.copy(Xh),f=!0);for(let C=0;C<6;C++){let y=C%3;y===0?(l.up.set(0,c[C],0),l.position.set(o.x,o.y,o.z),l.lookAt(o.x+h[C],o.y,o.z)):y===1?(l.up.set(0,0,c[C]),l.position.set(o.x,o.y,o.z),l.lookAt(o.x,o.y+h[C],o.z)):(l.up.set(0,c[C],0),l.position.set(o.x,o.y,o.z),l.lookAt(o.x,o.y,o.z+h[C]));let b=this._cubeSize;Zr(r,y*b,C>2?b:0,b,b),d.setRenderTarget(r),f&&d.render(M,l),d.render(e,l)}d.toneMapping=m,d.autoClear=u,e.background=E}_textureToCubeUV(e,t){let i=this._renderer,r=e.mapping===Pi||e.mapping===$i;r?(this._cubemapMaterial===null&&(this._cubemapMaterial=Kh()),this._cubemapMaterial.uniforms.flipEnvMap.value=e.isRenderTargetTexture===!1?-1:1):this._equirectMaterial===null&&(this._equirectMaterial=Yh());let o=r?this._cubemapMaterial:this._equirectMaterial,s=this._lodMeshes[0];s.material=o;let a=o.uniforms;a.envMap.value=e;let l=this._cubeSize;Zr(t,0,0,3*l,2*l),i.setRenderTarget(t),i.render(s,ts)}_applyPMREM(e){let t=this._renderer,i=t.autoClear;t.autoClear=!1;let r=this._lodMeshes.length;for(let o=1;o<r;o++)this._applyGGXFilter(e,o-1,o);t.autoClear=i}_applyGGXFilter(e,t,i){let r=this._renderer,o=this._pingPongRenderTarget,s=this._ggxMaterial,a=this._lodMeshes[i];a.material=s;let l=s.uniforms,c=i/(this._lodMeshes.length-1),h=t/(this._lodMeshes.length-1),d=Math.sqrt(c*c-h*h),u=c*1.25,m=d*u,{_lodMax:_}=this,M=this._sizeLods[i],p=3*M*(i>_-Jr?i-_+Jr:0),f=4*(this._cubeSize-M);l.envMap.value=e.texture,l.roughness.value=m,l.mipInt.value=_-t,Zr(o,p,f,3*M,2*M),r.setRenderTarget(o),r.render(a,ts),l.envMap.value=o.texture,l.roughness.value=0,l.mipInt.value=_-i,Zr(e,p,f,3*M,2*M),r.setRenderTarget(e),r.render(a,ts)}_blur(e,t,i,r){let o=this._pingPongRenderTarget,s=Math.min(r,Math.PI)/Math.SQRT2;this._blurPass(e,o,t,i,s),this._blurPass(o,e,i,i,s)}_blurPass(e,t,i,r,o){let s=this._renderer,a=this._blurMaterial,l=this._lodMeshes[r];l.material=a;let c=a.uniforms;c.envMap.value=e.texture,c.sigma.value=o,c.mipInt.value=this._lodMax-i;let h=this._sizeLods[r],d=3*h*(r>this._lodMax-Jr?r-this._lodMax+Jr:0),u=4*(this._cubeSize-h);Zr(t,d,u,3*h,2*h),s.setRenderTarget(t),s.render(l,ts)}};function Em(n){let e=[],t=[],i=n,r=n-Jr+1+Mm;for(let o=0;o<r;o++){let s=Math.pow(2,i);e.push(s);let a=1/(s-2),l=-a,c=1+a,h=[l,l,c,l,c,c,l,l,c,c,l,c],d=6,u=6,m=3,_=new Float32Array(m*u*d),M=new Float32Array(m*u*d);for(let f=0;f<d;f++){let E=f%3*2/3-1,C=f>2?0:-1,y=[E,C,0,E+2/3,C,0,E+2/3,C+1,0,E,C,0,E+2/3,C+1,0,E,C+1,0];_.set(y,m*u*f);for(let b=0;b<u;b++){let v=h[b*2]*2-1,D=h[b*2+1]*2-1;f===0?ir.set(1,D,v):f===1?ir.set(-v,1,-D):f===2?ir.set(-v,D,1):f===3?ir.set(-1,D,-v):f===4?ir.set(-v,-1,D):ir.set(v,D,-1),ir.toArray(M,(f*u+b)*m)}}let p=new pt;p.setAttribute("position",new fi(_,m)),p.setAttribute("outputDirection",new fi(M,m)),t.push(new _e(p,null)),i>Jr&&i--}return{lodMeshes:t,sizeLods:e}}function qh(n,e,t){let i=new Vt(n,e,t);return i.texture.mapping=Mn,i.texture.name="PMREM.cubeUv",i.scissorTest=!0,i}function Zr(n,e,t,i,r){n.viewport.set(e,t,i,r),n.scissor.set(e,t,i,r)}function Tm(n,e,t){return new ni({name:"PMREMGGXConvolution",defines:{GGX_SAMPLES:ym,CUBEUV_TEXEL_WIDTH:1/e,CUBEUV_TEXEL_HEIGHT:1/t,CUBEUV_MAX_MIP:`${n}.0`},uniforms:{envMap:{value:null},roughness:{value:0},mipInt:{value:0}},vertexShader:ba(),fragmentShader:`

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
		`,blending:vi,depthTest:!1,depthWrite:!1})}function Am(n,e,t){return new ni({name:"SphericalGaussianBlur",defines:{SAMPLES:vm,CUBEUV_TEXEL_WIDTH:1/e,CUBEUV_TEXEL_HEIGHT:1/t,CUBEUV_MAX_MIP:`${n}.0`},uniforms:{envMap:{value:null},sigma:{value:0},mipInt:{value:0}},vertexShader:ba(),fragmentShader:`

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
		`,blending:vi,depthTest:!1,depthWrite:!1})}function Yh(){return new ni({name:"EquirectangularToCubeUV",uniforms:{envMap:{value:null}},vertexShader:ba(),fragmentShader:`

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
		`,blending:vi,depthTest:!1,depthWrite:!1})}function Kh(){return new ni({name:"CubemapToCubeUV",uniforms:{envMap:{value:null},flipEnvMap:{value:-1}},vertexShader:ba(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			uniform float flipEnvMap;

			varying vec3 vOutputDirection;

			uniform samplerCube envMap;

			void main() {

				gl_FragColor = textureCube( envMap, vec3( flipEnvMap * vOutputDirection.x, vOutputDirection.yz ) );

			}
		`,blending:vi,depthTest:!1,depthWrite:!1})}function ba(){return`

		precision mediump float;
		precision mediump int;

		attribute vec3 outputDirection;

		varying vec3 vOutputDirection;

		void main() {

			vOutputDirection = outputDirection;
			gl_Position = vec4( position, 1.0 );

		}
	`}var $r=class extends Vt{constructor(e=1,t={}){super(e,e,t),this.isWebGLCubeRenderTarget=!0;let i={width:e,height:e,depth:1},r=[i,i,i,i,i,i];this.texture=new Br(r),this._setTextureOptions(t),this.texture.isRenderTargetTexture=!0}fromEquirectangularTexture(e,t){this.texture.type=t.type,this.texture.colorSpace=t.colorSpace,this.texture.generateMipmaps=t.generateMipmaps,this.texture.minFilter=t.minFilter,this.texture.magFilter=t.magFilter;let i={uniforms:{tEquirect:{value:null}},vertexShader:`

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
			`},r=new Pt(5,5,5),o=new ni({name:"CubemapFromEquirect",uniforms:un(i.uniforms),vertexShader:i.vertexShader,fragmentShader:i.fragmentShader,side:wt,blending:vi});o.uniforms.tEquirect.value=t;let s=new _e(r,o),a=t.minFilter;return t.minFilter===Fi&&(t.minFilter=Lt),new Sa(1,10,this).update(e,s),t.minFilter=a,s.geometry.dispose(),s.material.dispose(),this}clear(e,t=!0,i=!0,r=!0){let o=e.getRenderTarget();for(let s=0;s<6;s++)e.setRenderTarget(this,s),e.clear(t,i,r);e.setRenderTarget(o)}};function Zh(n){let e=new WeakMap,t=new WeakMap,i=null;function r(u,m=!1){return u==null?null:m?s(u):o(u)}function o(u){if(u&&u.isTexture){let m=u.mapping;if(m===Ms||m===vs)if(e.has(u)){let _=e.get(u).texture;return a(_,u.mapping)}else{let _=u.image;if(_&&_.height>0){let M=new $r(_.height);return M.fromEquirectangularTexture(n,u),e.set(u,M),u.addEventListener("dispose",c),a(M.texture,u.mapping)}else return null}}return u}function s(u){if(u&&u.isTexture){let m=u.mapping,_=m===Ms||m===vs,M=m===Pi||m===$i;if(_||M){let p=t.get(u),f=p!==void 0?p.texture.pmremVersion:0;if(u.isRenderTargetTexture&&u.pmremVersion!==f)return i===null&&(i=new is(n)),p=_?i.fromEquirectangular(u,p):i.fromCubemap(u,p),p.texture.pmremVersion=u.pmremVersion,t.set(u,p),p.texture;if(p!==void 0)return p.texture;{let E=u.image;return _&&E&&E.height>0||M&&E&&l(E)?(i===null&&(i=new is(n)),p=_?i.fromEquirectangular(u):i.fromCubemap(u),p.texture.pmremVersion=u.pmremVersion,t.set(u,p),u.addEventListener("dispose",h),p.texture):null}}}return u}function a(u,m){return m===Ms?u.mapping=Pi:m===vs&&(u.mapping=$i),u}function l(u){let m=0,_=6;for(let M=0;M<_;M++)u[M]!==void 0&&m++;return m===_}function c(u){let m=u.target;m.removeEventListener("dispose",c);let _=e.get(m);_!==void 0&&(e.delete(m),_.dispose())}function h(u){let m=u.target;m.removeEventListener("dispose",h);let _=t.get(m);_!==void 0&&(t.delete(m),_.dispose())}function d(){e=new WeakMap,t=new WeakMap,i!==null&&(i.dispose(),i=null)}return{get:r,dispose:d}}function Jh(n){let e={};function t(i){if(e[i]!==void 0)return e[i];let r=n.getExtension(i);return e[i]=r,r}return{has:function(i){return t(i)!==null},init:function(){t("EXT_color_buffer_float"),t("WEBGL_clip_cull_distance"),t("OES_texture_float_linear"),t("EXT_color_buffer_half_float"),t("WEBGL_multisampled_render_to_texture"),t("WEBGL_render_shared_exponent")},get:function(i){let r=t(i);return r===null&&qi("WebGLRenderer: "+i+" extension not supported."),r}}}function $h(n,e,t,i){let r={},o=new WeakMap;function s(d){let u=d.target;u.index!==null&&e.remove(u.index);for(let _ in u.attributes)e.remove(u.attributes[_]);u.removeEventListener("dispose",s),delete r[u.id];let m=o.get(u);m&&(e.remove(m),o.delete(u)),i.releaseStatesOfGeometry(u),u.isInstancedBufferGeometry===!0&&delete u._maxInstanceCount,t.memory.geometries--}function a(d,u){return r[u.id]===!0||(u.addEventListener("dispose",s),r[u.id]=!0,t.memory.geometries++),u}function l(d){let u=d.attributes;for(let m in u)e.update(u[m],n.ARRAY_BUFFER)}function c(d){let u=[],m=d.index,_=d.attributes.position,M=0;if(_===void 0)return;if(m!==null){let E=m.array;M=m.version;for(let C=0,y=E.length;C<y;C+=3){let b=E[C+0],v=E[C+1],D=E[C+2];u.push(b,v,v,D,D,b)}}else{let E=_.array;M=_.version;for(let C=0,y=E.length/3-1;C<y;C+=3){let b=C+0,v=C+1,D=C+2;u.push(b,v,v,D,D,b)}}let p=new(_.count>=65535?Fr:Ur)(u,1);p.version=M;let f=o.get(d);f&&e.remove(f),o.set(d,p)}function h(d){let u=o.get(d);if(u){let m=d.index;m!==null&&u.version<m.version&&c(d)}else c(d);return o.get(d)}return{get:a,update:l,getWireframeAttribute:h}}function Qh(n,e,t){let i;function r(d){i=d}let o,s;function a(d){o=d.type,s=d.bytesPerElement}function l(d,u){n.drawElements(i,u,o,d*s),t.update(u,i,1)}function c(d,u,m){m!==0&&(n.drawElementsInstanced(i,u,o,d*s,m),t.update(u,i,m))}function h(d,u,m){if(m===0)return;e.get("WEBGL_multi_draw").multiDrawElementsWEBGL(i,u,0,o,d,0,m);let M=0;for(let p=0;p<m;p++)M+=u[p];t.update(M,i,1)}this.setMode=r,this.setIndex=a,this.render=l,this.renderInstances=c,this.renderMultiDraw=h}function jh(n){let e={geometries:0,textures:0},t={frame:0,calls:0,triangles:0,points:0,lines:0};function i(o,s,a){switch(t.calls++,s){case n.TRIANGLES:t.triangles+=a*(o/3);break;case n.LINES:t.lines+=a*(o/2);break;case n.LINE_STRIP:t.lines+=a*(o-1);break;case n.LINE_LOOP:t.lines+=a*o;break;case n.POINTS:t.points+=a*o;break;default:et("WebGLInfo: Unknown draw mode:",s);break}}function r(){t.calls=0,t.triangles=0,t.points=0,t.lines=0}return{memory:e,render:t,programs:null,autoReset:!0,reset:r,update:i}}function ed(n,e,t){let i=new WeakMap,r=new dt;function o(s,a,l){let c=s.morphTargetInfluences,h=a.morphAttributes.position||a.morphAttributes.normal||a.morphAttributes.color,d=h!==void 0?h.length:0,u=i.get(a);if(u===void 0||u.count!==d){let T=function(){D.dispose(),i.delete(a),a.removeEventListener("dispose",T)};u!==void 0&&u.texture.dispose();let m=a.morphAttributes.position!==void 0,_=a.morphAttributes.normal!==void 0,M=a.morphAttributes.color!==void 0,p=a.morphAttributes.position||[],f=a.morphAttributes.normal||[],E=a.morphAttributes.color||[],C=0;m===!0&&(C=1),_===!0&&(C=2),M===!0&&(C=3);let y=a.attributes.position.count*C,b=1;y>e.maxTextureSize&&(b=Math.ceil(y/e.maxTextureSize),y=e.maxTextureSize);let v=new Float32Array(y*b*4*d),D=new Tr(v,y,b,d);D.type=oi,D.needsUpdate=!0;let S=C*4;for(let I=0;I<d;I++){let G=p[I],z=f[I],W=E[I],O=y*b*4*I;for(let X=0;X<G.count;X++){let Z=X*S;m===!0&&(r.fromBufferAttribute(G,X),v[O+Z+0]=r.x,v[O+Z+1]=r.y,v[O+Z+2]=r.z,v[O+Z+3]=0),_===!0&&(r.fromBufferAttribute(z,X),v[O+Z+4]=r.x,v[O+Z+5]=r.y,v[O+Z+6]=r.z,v[O+Z+7]=0),M===!0&&(r.fromBufferAttribute(W,X),v[O+Z+8]=r.x,v[O+Z+9]=r.y,v[O+Z+10]=r.z,v[O+Z+11]=W.itemSize===4?r.w:1)}}u={count:d,texture:D,size:new Ae(y,b)},i.set(a,u),a.addEventListener("dispose",T)}if(s.isInstancedMesh===!0&&s.morphTexture!==null)l.getUniforms().setValue(n,"morphTexture",s.morphTexture,t);else{let m=0;for(let M=0;M<c.length;M++)m+=c[M];let _=a.morphTargetsRelative?1:1-m;l.getUniforms().setValue(n,"morphTargetBaseInfluence",_),l.getUniforms().setValue(n,"morphTargetInfluences",c)}l.getUniforms().setValue(n,"morphTargetsTexture",u.texture,t),l.getUniforms().setValue(n,"morphTargetsTextureSize",u.size)}return{update:o}}function td(n,e,t,i,r){let o=new WeakMap;function s(c){let h=r.render.frame,d=c.geometry,u=e.get(c,d);if(o.get(u)!==h&&(e.update(u),o.set(u,h)),c.isInstancedMesh&&(c.hasEventListener("dispose",l)===!1&&c.addEventListener("dispose",l),o.get(c)!==h&&(t.update(c.instanceMatrix,n.ARRAY_BUFFER),c.instanceColor!==null&&t.update(c.instanceColor,n.ARRAY_BUFFER),o.set(c,h))),c.isSkinnedMesh){let m=c.skeleton;o.get(m)!==h&&(m.update(),o.set(m,h))}return u}function a(){o=new WeakMap}function l(c){let h=c.target;h.removeEventListener("dispose",l),i.releaseStatesOfObject(h),t.remove(h.instanceMatrix),h.instanceColor!==null&&t.remove(h.instanceColor)}return{update:s,dispose:a}}var wm={[ps]:"LINEAR_TONE_MAPPING",[ms]:"REINHARD_TONE_MAPPING",[gs]:"CINEON_TONE_MAPPING",[lr]:"ACES_FILMIC_TONE_MAPPING",[xs]:"AGX_TONE_MAPPING",[Ss]:"NEUTRAL_TONE_MAPPING",[_s]:"CUSTOM_TONE_MAPPING"};function id(n,e,t,i,r,o){let s=new Vt(e,t,{type:n,depthBuffer:r,stencilBuffer:o,samples:i?4:0,storeMultisampledDepthBuffer:!1,storeMultisampledStencilBuffer:!1,resolveDepthBuffer:!1,resolveStencilBuffer:!1}),a=null,l=null,c=new pt;c.setAttribute("position",new at([-1,3,0,-1,-1,0,3,-1,0],3)),c.setAttribute("uv",new at([0,2,0,0,2,0],2));let h=new ha({uniforms:{tDiffuse:{value:null}},vertexShader:`
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
			}`,depthTest:!1,depthWrite:!1}),d=new _e(c,h),u=new Dn(-1,1,1,-1,0,1),m=null,_=null,M=!1,p,f=null,E=[],C=!1;this.setSize=function(y,b){s.setSize(y,b),a!==null&&a.setSize(y,b),l!==null&&l.setSize(y,b);for(let v=0;v<E.length;v++){let D=E[v];D.setSize&&D.setSize(y,b)}},this.setEffects=function(y){E=y,C=E.length>0&&E[0].isRenderPass===!0;let b=s.width,v=s.height;E.length>0&&a===null&&(a=new Vt(b,v,{type:Qt,depthBuffer:!1,stencilBuffer:!1}),l=new Vt(b,v,{type:Qt,depthBuffer:!1,stencilBuffer:!1}));for(let D=0;D<E.length;D++){let S=E[D];S.setSize&&S.setSize(b,v)}},this.begin=function(y,b){if(M||y.toneMapping===mi&&E.length===0)return!1;if(f=b,b!==null){let v=b.width,D=b.height;(s.width!==v||s.height!==D)&&this.setSize(v,D)}return C===!1&&y.setRenderTarget(s),p=y.toneMapping,y.toneMapping=mi,!0},this.hasRenderPass=function(){return C},this.end=function(y,b){y.toneMapping=p,M=!0;let v=s,D=a;for(let S=0;S<E.length;S++){let T=E[S];T.enabled!==!1&&(T.render(y,D,v,b),T.needsSwap!==!1&&(v=D,D=D===a?l:a))}if(m!==y.outputColorSpace||_!==y.toneMapping){m=y.outputColorSpace,_=y.toneMapping,h.defines={},$e.getTransfer(m)===lt&&(h.defines.SRGB_TRANSFER="");let S=wm[_];S&&(h.defines[S]=""),h.needsUpdate=!0}h.uniforms.tDiffuse.value=v.texture,y.setRenderTarget(f),y.render(d,u),f=null,M=!1},this.isCompositing=function(){return M},this.dispose=function(){s.dispose(),a!==null&&a.dispose(),l!==null&&l.dispose(),c.dispose(),h.dispose()}}var cd=new Dt,Sl=new Wi(1,1),ud=new Tr,fd=new Ns,hd=new Br,nd=[],rd=[],od=new Float32Array(16),sd=new Float32Array(9),ad=new Float32Array(4);function Qr(n,e,t){let i=n[0];if(i<=0||i>0)return n;let r=e*t,o=nd[r];if(o===void 0&&(o=new Float32Array(r),nd[r]=o),e!==0){i.toArray(o,0);for(let s=1,a=0;s!==e;++s)a+=t,n[s].toArray(o,a)}return o}function Xt(n,e){if(n.length!==e.length)return!1;for(let t=0,i=n.length;t<i;t++)if(n[t]!==e[t])return!1;return!0}function qt(n,e){for(let t=0,i=e.length;t<i;t++)n[t]=e[t]}function Ea(n,e){let t=rd[e];t===void 0&&(t=new Int32Array(e),rd[e]=t);for(let i=0;i!==e;++i)t[i]=n.allocateTextureUnit();return t}function Rm(n,e){let t=this.cache;t[0]!==e&&(n.uniform1f(this.addr,e),t[0]=e)}function Cm(n,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y)&&(n.uniform2f(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if(Xt(t,e))return;n.uniform2fv(this.addr,e),qt(t,e)}}function Pm(n,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z)&&(n.uniform3f(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else if(e.r!==void 0)(t[0]!==e.r||t[1]!==e.g||t[2]!==e.b)&&(n.uniform3f(this.addr,e.r,e.g,e.b),t[0]=e.r,t[1]=e.g,t[2]=e.b);else{if(Xt(t,e))return;n.uniform3fv(this.addr,e),qt(t,e)}}function Lm(n,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z||t[3]!==e.w)&&(n.uniform4f(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if(Xt(t,e))return;n.uniform4fv(this.addr,e),qt(t,e)}}function Dm(n,e){let t=this.cache,i=e.elements;if(i===void 0){if(Xt(t,e))return;n.uniformMatrix2fv(this.addr,!1,e),qt(t,e)}else{if(Xt(t,i))return;ad.set(i),n.uniformMatrix2fv(this.addr,!1,ad),qt(t,i)}}function Im(n,e){let t=this.cache,i=e.elements;if(i===void 0){if(Xt(t,e))return;n.uniformMatrix3fv(this.addr,!1,e),qt(t,e)}else{if(Xt(t,i))return;sd.set(i),n.uniformMatrix3fv(this.addr,!1,sd),qt(t,i)}}function Nm(n,e){let t=this.cache,i=e.elements;if(i===void 0){if(Xt(t,e))return;n.uniformMatrix4fv(this.addr,!1,e),qt(t,e)}else{if(Xt(t,i))return;od.set(i),n.uniformMatrix4fv(this.addr,!1,od),qt(t,i)}}function Um(n,e){let t=this.cache;t[0]!==e&&(n.uniform1i(this.addr,e),t[0]=e)}function Fm(n,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y)&&(n.uniform2i(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if(Xt(t,e))return;n.uniform2iv(this.addr,e),qt(t,e)}}function Om(n,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z)&&(n.uniform3i(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else{if(Xt(t,e))return;n.uniform3iv(this.addr,e),qt(t,e)}}function Bm(n,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z||t[3]!==e.w)&&(n.uniform4i(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if(Xt(t,e))return;n.uniform4iv(this.addr,e),qt(t,e)}}function Gm(n,e){let t=this.cache;t[0]!==e&&(n.uniform1ui(this.addr,e),t[0]=e)}function zm(n,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y)&&(n.uniform2ui(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if(Xt(t,e))return;n.uniform2uiv(this.addr,e),qt(t,e)}}function km(n,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z)&&(n.uniform3ui(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else{if(Xt(t,e))return;n.uniform3uiv(this.addr,e),qt(t,e)}}function Hm(n,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z||t[3]!==e.w)&&(n.uniform4ui(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if(Xt(t,e))return;n.uniform4uiv(this.addr,e),qt(t,e)}}function Vm(n,e,t){let i=this.cache,r=t.allocateTextureUnit();i[0]!==r&&(n.uniform1i(this.addr,r),i[0]=r);let o;this.type===n.SAMPLER_2D_SHADOW?(Sl.compareFunction=t.isReversedDepthBuffer()?Mr:Sr,o=Sl):o=cd,t.setTexture2D(e||o,r)}function Wm(n,e,t){let i=this.cache,r=t.allocateTextureUnit();i[0]!==r&&(n.uniform1i(this.addr,r),i[0]=r),t.setTexture3D(e||fd,r)}function Xm(n,e,t){let i=this.cache,r=t.allocateTextureUnit();i[0]!==r&&(n.uniform1i(this.addr,r),i[0]=r),t.setTextureCube(e||hd,r)}function qm(n,e,t){let i=this.cache,r=t.allocateTextureUnit();i[0]!==r&&(n.uniform1i(this.addr,r),i[0]=r),t.setTexture2DArray(e||ud,r)}function Ym(n){switch(n){case 5126:return Rm;case 35664:return Cm;case 35665:return Pm;case 35666:return Lm;case 35674:return Dm;case 35675:return Im;case 35676:return Nm;case 5124:case 35670:return Um;case 35667:case 35671:return Fm;case 35668:case 35672:return Om;case 35669:case 35673:return Bm;case 5125:return Gm;case 36294:return zm;case 36295:return km;case 36296:return Hm;case 35678:case 36198:case 36298:case 36306:case 35682:return Vm;case 35679:case 36299:case 36307:return Wm;case 35680:case 36300:case 36308:case 36293:return Xm;case 36289:case 36303:case 36311:case 36292:return qm}}function Km(n,e){n.uniform1fv(this.addr,e)}function Zm(n,e){let t=Qr(e,this.size,2);n.uniform2fv(this.addr,t)}function Jm(n,e){let t=Qr(e,this.size,3);n.uniform3fv(this.addr,t)}function $m(n,e){let t=Qr(e,this.size,4);n.uniform4fv(this.addr,t)}function Qm(n,e){let t=Qr(e,this.size,4);n.uniformMatrix2fv(this.addr,!1,t)}function jm(n,e){let t=Qr(e,this.size,9);n.uniformMatrix3fv(this.addr,!1,t)}function eg(n,e){let t=Qr(e,this.size,16);n.uniformMatrix4fv(this.addr,!1,t)}function tg(n,e){n.uniform1iv(this.addr,e)}function ig(n,e){n.uniform2iv(this.addr,e)}function ng(n,e){n.uniform3iv(this.addr,e)}function rg(n,e){n.uniform4iv(this.addr,e)}function og(n,e){n.uniform1uiv(this.addr,e)}function sg(n,e){n.uniform2uiv(this.addr,e)}function ag(n,e){n.uniform3uiv(this.addr,e)}function lg(n,e){n.uniform4uiv(this.addr,e)}function cg(n,e,t){let i=this.cache,r=e.length,o=Ea(t,r);Xt(i,o)||(n.uniform1iv(this.addr,o),qt(i,o));let s;this.type===n.SAMPLER_2D_SHADOW?s=Sl:s=cd;for(let a=0;a!==r;++a)t.setTexture2D(e[a]||s,o[a])}function ug(n,e,t){let i=this.cache,r=e.length,o=Ea(t,r);Xt(i,o)||(n.uniform1iv(this.addr,o),qt(i,o));for(let s=0;s!==r;++s)t.setTexture3D(e[s]||fd,o[s])}function fg(n,e,t){let i=this.cache,r=e.length,o=Ea(t,r);Xt(i,o)||(n.uniform1iv(this.addr,o),qt(i,o));for(let s=0;s!==r;++s)t.setTextureCube(e[s]||hd,o[s])}function hg(n,e,t){let i=this.cache,r=e.length,o=Ea(t,r);Xt(i,o)||(n.uniform1iv(this.addr,o),qt(i,o));for(let s=0;s!==r;++s)t.setTexture2DArray(e[s]||ud,o[s])}function dg(n){switch(n){case 5126:return Km;case 35664:return Zm;case 35665:return Jm;case 35666:return $m;case 35674:return Qm;case 35675:return jm;case 35676:return eg;case 5124:case 35670:return tg;case 35667:case 35671:return ig;case 35668:case 35672:return ng;case 35669:case 35673:return rg;case 5125:return og;case 36294:return sg;case 36295:return ag;case 36296:return lg;case 35678:case 36198:case 36298:case 36306:case 35682:return cg;case 35679:case 36299:case 36307:return ug;case 35680:case 36300:case 36308:case 36293:return fg;case 36289:case 36303:case 36311:case 36292:return hg}}var Ml=class{constructor(e,t,i){this.id=e,this.addr=i,this.cache=[],this.type=t.type,this.setValue=Ym(t.type)}},vl=class{constructor(e,t,i){this.id=e,this.addr=i,this.cache=[],this.type=t.type,this.size=t.size,this.setValue=dg(t.type)}},yl=class{constructor(e){this.id=e,this.seq=[],this.map={}}setValue(e,t,i){let r=this.seq;for(let o=0,s=r.length;o!==s;++o){let a=r[o];a.setValue(e,t[a.id],i)}}},xl=/(\w+)(\])?(\[|\.)?/g;function ld(n,e){n.seq.push(e),n.map[e.id]=e}function pg(n,e,t){let i=n.name,r=i.length;for(xl.lastIndex=0;;){let o=xl.exec(i),s=xl.lastIndex,a=o[1],l=o[2]==="]",c=o[3];if(l&&(a=a|0),c===void 0||c==="["&&s+2===r){ld(t,c===void 0?new Ml(a,n,e):new vl(a,n,e));break}else{let d=t.map[a];d===void 0&&(d=new yl(a),ld(t,d)),t=d}}}var In=class{constructor(e,t){this.seq=[],this.map={};let i=e.getProgramParameter(t,e.ACTIVE_UNIFORMS);for(let s=0;s<i;++s){let a=e.getActiveUniform(t,s),l=e.getUniformLocation(t,a.name);pg(a,l,this)}let r=[],o=[];for(let s of this.seq)s.type===e.SAMPLER_2D_SHADOW||s.type===e.SAMPLER_CUBE_SHADOW||s.type===e.SAMPLER_2D_ARRAY_SHADOW?r.push(s):o.push(s);r.length>0&&(this.seq=r.concat(o))}setValue(e,t,i,r){let o=this.map[t];o!==void 0&&o.setValue(e,i,r)}setOptional(e,t,i){let r=t[i];r!==void 0&&this.setValue(e,i,r)}static upload(e,t,i,r){for(let o=0,s=t.length;o!==s;++o){let a=t[o],l=i[a.id];l.needsUpdate!==!1&&a.setValue(e,l.value,r)}}static seqWithValue(e,t){let i=[];for(let r=0,o=e.length;r!==o;++r){let s=e[r];s.id in t&&i.push(s)}return i}};function bl(n,e,t){let i=n.createShader(e);return n.shaderSource(i,t),n.compileShader(i),i}var mg=37297,gg=0;function _g(n,e){let t=n.split(`
`),i=[],r=Math.max(e-6,0),o=Math.min(e+6,t.length);for(let s=r;s<o;s++){let a=s+1;i.push(`${a===e?">":" "} ${a}: ${t[s]}`)}return i.join(`
`)}var dd=new ke;function xg(n){$e._getMatrix(dd,$e.workingColorSpace,n);let e=`mat3( ${dd.elements.map(t=>t.toFixed(4))} )`;switch($e.getTransfer(n)){case Wn:return[e,"LinearTransferOETF"];case lt:return[e,"sRGBTransferOETF"];default:return Ie("WebGLProgram: Unsupported color space: ",n),[e,"LinearTransferOETF"]}}function pd(n,e,t){let i=n.getShaderParameter(e,n.COMPILE_STATUS),o=(n.getShaderInfoLog(e)||"").trim();if(i&&o==="")return"";let s=/ERROR: 0:(\d+)/.exec(o);if(s){let a=parseInt(s[1]);return t.toUpperCase()+`

`+o+`

`+_g(n.getShaderSource(e),a)}else return o}function Sg(n,e){let t=xg(e);return[`vec4 ${n}( vec4 value ) {`,`	return ${t[1]}( vec4( value.rgb * ${t[0]}, value.a ) );`,"}"].join(`
`)}var Mg={[ps]:"Linear",[ms]:"Reinhard",[gs]:"Cineon",[lr]:"ACESFilmic",[xs]:"AgX",[Ss]:"Neutral",[_s]:"Custom"};function vg(n,e){let t=Mg[e];return t===void 0?(Ie("WebGLProgram: Unsupported toneMapping:",e),"vec3 "+n+"( vec3 color ) { return LinearToneMapping( color ); }"):"vec3 "+n+"( vec3 color ) { return "+t+"ToneMapping( color ); }"}var Ta=new U;function yg(){$e.getLuminanceCoefficients(Ta);let n=Ta.x.toFixed(4),e=Ta.y.toFixed(4),t=Ta.z.toFixed(4);return["float luminance( const in vec3 rgb ) {",`	const vec3 weights = vec3( ${n}, ${e}, ${t} );`,"	return dot( weights, rgb );","}"].join(`
`)}function bg(n){return[n.extensionClipCullDistance?"#extension GL_ANGLE_clip_cull_distance : require":"",n.extensionMultiDraw?"#extension GL_ANGLE_multi_draw : require":""].filter(ns).join(`
`)}function Eg(n){let e=[];for(let t in n){let i=n[t];i!==!1&&e.push("#define "+t+" "+i)}return e.join(`
`)}function Tg(n,e){let t={},i=n.getProgramParameter(e,n.ACTIVE_ATTRIBUTES);for(let r=0;r<i;r++){let o=n.getActiveAttrib(e,r),s=o.name,a=1;o.type===n.FLOAT_MAT2&&(a=2),o.type===n.FLOAT_MAT3&&(a=3),o.type===n.FLOAT_MAT4&&(a=4),t[s]={type:o.type,location:n.getAttribLocation(e,s),locationSize:a}}return t}function ns(n){return n!==""}function md(n,e){let t=e.numSpotLightShadows+e.numSpotLightMaps-e.numSpotLightShadowsWithMaps;return n.replace(/NUM_SUN_LIGHTS/g,e.numSunLights).replace(/NUM_DIR_LIGHTS/g,e.numDirLights).replace(/NUM_SPOT_LIGHTS/g,e.numSpotLights).replace(/NUM_SPOT_LIGHT_MAPS/g,e.numSpotLightMaps).replace(/NUM_SPOT_LIGHT_COORDS/g,t).replace(/NUM_RECT_AREA_LIGHTS/g,e.numRectAreaLights).replace(/NUM_POINT_LIGHTS/g,e.numPointLights).replace(/NUM_HEMI_LIGHTS/g,e.numHemiLights).replace(/NUM_SUN_LIGHT_SHADOWS/g,e.numSunLightShadows).replace(/NUM_DIR_LIGHT_SHADOWS/g,e.numDirLightShadows).replace(/NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS/g,e.numSpotLightShadowsWithMaps).replace(/NUM_SPOT_LIGHT_SHADOWS/g,e.numSpotLightShadows).replace(/NUM_POINT_LIGHT_SHADOWS/g,e.numPointLightShadows)}function gd(n,e){return n.replace(/NUM_CLIPPING_PLANES/g,e.numClippingPlanes).replace(/UNION_CLIPPING_PLANES/g,e.numClippingPlanes-e.numClipIntersection)}var Ag=/^[ \t]*#include +<([\w\d./]+)>/gm;function El(n){return n.replace(Ag,Rg)}var wg=new Map;function Rg(n,e){let t=tt[e];if(t===void 0){let i=wg.get(e);if(i!==void 0)t=tt[i],Ie('WebGLRenderer: Shader chunk "%s" has been deprecated. Use "%s" instead.',e,i);else throw new Error("THREE.WebGLProgram: Can not resolve #include <"+e+">")}return El(t)}var Cg=/#pragma unroll_loop_start\s+for\s*\(\s*int\s+i\s*=\s*(\d+)\s*;\s*i\s*<\s*(\d+)\s*;\s*i\s*\+\+\s*\)\s*{([\s\S]+?)}\s+#pragma unroll_loop_end/g;function _d(n){return n.replace(Cg,Pg)}function Pg(n,e,t,i){let r="";for(let o=parseInt(e);o<parseInt(t);o++)r+=i.replace(/\[\s*i\s*\]/g,"[ "+o+" ]").replace(/UNROLLED_LOOP_INDEX/g,o);return r}function xd(n){let e=`precision ${n.precision} float;
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
#define LOW_PRECISION`),e}var Lg={[gn]:"SHADOWMAP_TYPE_PCF",[zn]:"SHADOWMAP_TYPE_VSM"};function Dg(n){return Lg[n.shadowMapType]||"SHADOWMAP_TYPE_BASIC"}var Ig={[Pi]:"ENVMAP_TYPE_CUBE",[$i]:"ENVMAP_TYPE_CUBE",[Mn]:"ENVMAP_TYPE_CUBE_UV"};function Ng(n){return n.envMap===!1?"ENVMAP_TYPE_CUBE":Ig[n.envMapMode]||"ENVMAP_TYPE_CUBE"}var Ug={[$i]:"ENVMAP_MODE_REFRACTION"};function Fg(n){return n.envMap===!1?"ENVMAP_MODE_REFLECTION":Ug[n.envMapMode]||"ENVMAP_MODE_REFLECTION"}var Og={[ds]:"ENVMAP_BLENDING_MULTIPLY",[oc]:"ENVMAP_BLENDING_MIX",[sc]:"ENVMAP_BLENDING_ADD"};function Bg(n){return n.envMap===!1?"ENVMAP_BLENDING_NONE":Og[n.combine]||"ENVMAP_BLENDING_NONE"}function Gg(n){let e=n.envMapCubeUVHeight;if(e===null)return null;let t=Math.log2(e)-2,i=1/e;return{texelWidth:1/(3*Math.max(Math.pow(2,t),112)),texelHeight:i,maxMip:t}}function Sd(n,e,t,i){let r=n.getContext(),o=t.defines,s=t.vertexShader,a=t.fragmentShader,l=Dg(t),c=Ng(t),h=Fg(t),d=Bg(t),u=Gg(t),m=bg(t),_=Eg(o),M=r.createProgram(),p,f,E=t.glslVersion?"#version "+t.glslVersion+`
`:"";t.isRawShaderMaterial?(p=["#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,_].filter(ns).join(`
`),p.length>0&&(p+=`
`),f=["#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,_].filter(ns).join(`
`),f.length>0&&(f+=`
`)):(p=[xd(t),"#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,_,t.extensionClipCullDistance?"#define USE_CLIP_DISTANCE":"",t.batching?"#define USE_BATCHING":"",t.batchingColor?"#define USE_BATCHING_COLOR":"",t.instancing?"#define USE_INSTANCING":"",t.instancingColor?"#define USE_INSTANCING_COLOR":"",t.instancingMorph?"#define USE_INSTANCING_MORPH":"",t.useFog&&t.fog?"#define USE_FOG":"",t.useFog&&t.fogExp2?"#define FOG_EXP2":"",t.map?"#define USE_MAP":"",t.envMap?"#define USE_ENVMAP":"",t.envMap?"#define "+h:"",t.lightMap?"#define USE_LIGHTMAP":"",t.aoMap?"#define USE_AOMAP":"",t.bumpMap?"#define USE_BUMPMAP":"",t.normalMap?"#define USE_NORMALMAP":"",t.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",t.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",t.displacementMap?"#define USE_DISPLACEMENTMAP":"",t.emissiveMap?"#define USE_EMISSIVEMAP":"",t.anisotropy?"#define USE_ANISOTROPY":"",t.anisotropyMap?"#define USE_ANISOTROPYMAP":"",t.clearcoatMap?"#define USE_CLEARCOATMAP":"",t.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",t.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",t.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",t.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",t.specularMap?"#define USE_SPECULARMAP":"",t.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",t.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",t.roughnessMap?"#define USE_ROUGHNESSMAP":"",t.metalnessMap?"#define USE_METALNESSMAP":"",t.alphaMap?"#define USE_ALPHAMAP":"",t.alphaHash?"#define USE_ALPHAHASH":"",t.transmission?"#define USE_TRANSMISSION":"",t.transmissionMap?"#define USE_TRANSMISSIONMAP":"",t.thicknessMap?"#define USE_THICKNESSMAP":"",t.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",t.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",t.mapUv?"#define MAP_UV "+t.mapUv:"",t.alphaMapUv?"#define ALPHAMAP_UV "+t.alphaMapUv:"",t.lightMapUv?"#define LIGHTMAP_UV "+t.lightMapUv:"",t.aoMapUv?"#define AOMAP_UV "+t.aoMapUv:"",t.emissiveMapUv?"#define EMISSIVEMAP_UV "+t.emissiveMapUv:"",t.bumpMapUv?"#define BUMPMAP_UV "+t.bumpMapUv:"",t.normalMapUv?"#define NORMALMAP_UV "+t.normalMapUv:"",t.displacementMapUv?"#define DISPLACEMENTMAP_UV "+t.displacementMapUv:"",t.metalnessMapUv?"#define METALNESSMAP_UV "+t.metalnessMapUv:"",t.roughnessMapUv?"#define ROUGHNESSMAP_UV "+t.roughnessMapUv:"",t.anisotropyMapUv?"#define ANISOTROPYMAP_UV "+t.anisotropyMapUv:"",t.clearcoatMapUv?"#define CLEARCOATMAP_UV "+t.clearcoatMapUv:"",t.clearcoatNormalMapUv?"#define CLEARCOAT_NORMALMAP_UV "+t.clearcoatNormalMapUv:"",t.clearcoatRoughnessMapUv?"#define CLEARCOAT_ROUGHNESSMAP_UV "+t.clearcoatRoughnessMapUv:"",t.iridescenceMapUv?"#define IRIDESCENCEMAP_UV "+t.iridescenceMapUv:"",t.iridescenceThicknessMapUv?"#define IRIDESCENCE_THICKNESSMAP_UV "+t.iridescenceThicknessMapUv:"",t.sheenColorMapUv?"#define SHEEN_COLORMAP_UV "+t.sheenColorMapUv:"",t.sheenRoughnessMapUv?"#define SHEEN_ROUGHNESSMAP_UV "+t.sheenRoughnessMapUv:"",t.specularMapUv?"#define SPECULARMAP_UV "+t.specularMapUv:"",t.specularColorMapUv?"#define SPECULAR_COLORMAP_UV "+t.specularColorMapUv:"",t.specularIntensityMapUv?"#define SPECULAR_INTENSITYMAP_UV "+t.specularIntensityMapUv:"",t.transmissionMapUv?"#define TRANSMISSIONMAP_UV "+t.transmissionMapUv:"",t.thicknessMapUv?"#define THICKNESSMAP_UV "+t.thicknessMapUv:"",t.vertexTangents&&t.flatShading===!1?"#define USE_TANGENT":"",t.vertexNormals?"#define HAS_NORMAL":"",t.vertexColors?"#define USE_COLOR":"",t.vertexAlphas?"#define USE_COLOR_ALPHA":"",t.vertexUv1s?"#define USE_UV1":"",t.vertexUv2s?"#define USE_UV2":"",t.vertexUv3s?"#define USE_UV3":"",t.pointsUvs?"#define USE_POINTS_UV":"",t.flatShading?"#define FLAT_SHADED":"",t.skinning?"#define USE_SKINNING":"",t.morphTargets?"#define USE_MORPHTARGETS":"",t.morphNormals&&t.flatShading===!1?"#define USE_MORPHNORMALS":"",t.morphColors?"#define USE_MORPHCOLORS":"",t.morphTargetsCount>0?"#define MORPHTARGETS_TEXTURE_STRIDE "+t.morphTextureStride:"",t.morphTargetsCount>0?"#define MORPHTARGETS_COUNT "+t.morphTargetsCount:"",t.doubleSided?"#define DOUBLE_SIDED":"",t.flipSided?"#define FLIP_SIDED":"",t.shadowMapEnabled?"#define USE_SHADOWMAP":"",t.shadowMapEnabled?"#define "+l:"",t.sizeAttenuation?"#define USE_SIZEATTENUATION":"",t.numLightProbes>0?"#define USE_LIGHT_PROBES":"",t.logarithmicDepthBuffer?"#define USE_LOGARITHMIC_DEPTH_BUFFER":"",t.reversedDepthBuffer?"#define USE_REVERSED_DEPTH_BUFFER":"","uniform mat4 modelMatrix;","uniform mat4 modelViewMatrix;","uniform mat4 projectionMatrix;","uniform mat4 viewMatrix;","uniform mat3 normalMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;","#ifdef USE_INSTANCING","	attribute mat4 instanceMatrix;","#endif","#ifdef USE_INSTANCING_COLOR","	attribute vec3 instanceColor;","#endif","#ifdef USE_INSTANCING_MORPH","	uniform sampler2D morphTexture;","#endif","attribute vec3 position;","attribute vec3 normal;","attribute vec2 uv;","#ifdef USE_UV1","	attribute vec2 uv1;","#endif","#ifdef USE_UV2","	attribute vec2 uv2;","#endif","#ifdef USE_UV3","	attribute vec2 uv3;","#endif","#ifdef USE_TANGENT","	attribute vec4 tangent;","#endif","#if defined( USE_COLOR_ALPHA )","	attribute vec4 color;","#elif defined( USE_COLOR )","	attribute vec3 color;","#endif","#ifdef USE_SKINNING","	attribute vec4 skinIndex;","	attribute vec4 skinWeight;","#endif",`
`].filter(ns).join(`
`),f=[xd(t),"#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,_,t.useFog&&t.fog?"#define USE_FOG":"",t.useFog&&t.fogExp2?"#define FOG_EXP2":"",t.alphaToCoverage?"#define ALPHA_TO_COVERAGE":"",t.map?"#define USE_MAP":"",t.matcap?"#define USE_MATCAP":"",t.envMap?"#define USE_ENVMAP":"",t.envMap?"#define "+c:"",t.envMap?"#define "+h:"",t.envMap?"#define "+d:"",u?"#define CUBEUV_TEXEL_WIDTH "+u.texelWidth:"",u?"#define CUBEUV_TEXEL_HEIGHT "+u.texelHeight:"",u?"#define CUBEUV_MAX_MIP "+u.maxMip+".0":"",t.lightMap?"#define USE_LIGHTMAP":"",t.aoMap?"#define USE_AOMAP":"",t.bumpMap?"#define USE_BUMPMAP":"",t.normalMap?"#define USE_NORMALMAP":"",t.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",t.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",t.packedNormalMap?"#define USE_PACKED_NORMALMAP":"",t.emissiveMap?"#define USE_EMISSIVEMAP":"",t.anisotropy?"#define USE_ANISOTROPY":"",t.anisotropyMap?"#define USE_ANISOTROPYMAP":"",t.clearcoat?"#define USE_CLEARCOAT":"",t.clearcoatMap?"#define USE_CLEARCOATMAP":"",t.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",t.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",t.dispersion?"#define USE_DISPERSION":"",t.retroreflection?"#define USE_RETROREFLECTION":"",t.iridescence?"#define USE_IRIDESCENCE":"",t.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",t.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",t.specularMap?"#define USE_SPECULARMAP":"",t.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",t.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",t.roughnessMap?"#define USE_ROUGHNESSMAP":"",t.metalnessMap?"#define USE_METALNESSMAP":"",t.alphaMap?"#define USE_ALPHAMAP":"",t.alphaTest?"#define USE_ALPHATEST":"",t.alphaHash?"#define USE_ALPHAHASH":"",t.sheen?"#define USE_SHEEN":"",t.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",t.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",t.transmission?"#define USE_TRANSMISSION":"",t.transmissionMap?"#define USE_TRANSMISSIONMAP":"",t.thicknessMap?"#define USE_THICKNESSMAP":"",t.vertexTangents&&t.flatShading===!1?"#define USE_TANGENT":"",t.vertexColors||t.instancingColor?"#define USE_COLOR":"",t.vertexAlphas||t.batchingColor?"#define USE_COLOR_ALPHA":"",t.vertexUv1s?"#define USE_UV1":"",t.vertexUv2s?"#define USE_UV2":"",t.vertexUv3s?"#define USE_UV3":"",t.pointsUvs?"#define USE_POINTS_UV":"",t.gradientMap?"#define USE_GRADIENTMAP":"",t.flatShading?"#define FLAT_SHADED":"",t.doubleSided?"#define DOUBLE_SIDED":"",t.flipSided?"#define FLIP_SIDED":"",t.shadowMapEnabled?"#define USE_SHADOWMAP":"",t.shadowMapEnabled?"#define "+l:"",t.premultipliedAlpha?"#define PREMULTIPLIED_ALPHA":"",t.numLightProbes>0?"#define USE_LIGHT_PROBES":"",t.numLightProbeGrids>0?"#define USE_LIGHT_PROBES_GRID":"",t.decodeVideoTexture?"#define DECODE_VIDEO_TEXTURE":"",t.decodeVideoTextureEmissive?"#define DECODE_VIDEO_TEXTURE_EMISSIVE":"",t.logarithmicDepthBuffer?"#define USE_LOGARITHMIC_DEPTH_BUFFER":"",t.reversedDepthBuffer?"#define USE_REVERSED_DEPTH_BUFFER":"","uniform mat4 viewMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;",t.toneMapping!==mi?"#define TONE_MAPPING":"",t.toneMapping!==mi?tt.tonemapping_pars_fragment:"",t.toneMapping!==mi?vg("toneMapping",t.toneMapping):"",t.dithering?"#define DITHERING":"",t.opaque?"#define OPAQUE":"",tt.colorspace_pars_fragment,Sg("linearToOutputTexel",t.outputColorSpace),yg(),t.useDepthPacking?"#define DEPTH_PACKING "+t.depthPacking:"",`
`].filter(ns).join(`
`)),s=El(s),s=md(s,t),s=gd(s,t),a=El(a),a=md(a,t),a=gd(a,t),s=_d(s),a=_d(a),t.isRawShaderMaterial!==!0&&(E=`#version 300 es
`,p=[m,"#define attribute in","#define varying out","#define texture2D texture"].join(`
`)+`
`+p,f=["#define varying in",t.glslVersion===Ga?"":"layout(location = 0) out highp vec4 pc_fragColor;",t.glslVersion===Ga?"":"#define gl_FragColor pc_fragColor","#define gl_FragDepthEXT gl_FragDepth","#define texture2D texture","#define textureCube texture","#define texture2DProj textureProj","#define texture2DLodEXT textureLod","#define texture2DProjLodEXT textureProjLod","#define textureCubeLodEXT textureLod","#define texture2DGradEXT textureGrad","#define texture2DProjGradEXT textureProjGrad","#define textureCubeGradEXT textureGrad"].join(`
`)+`
`+f);let C=E+p+s,y=E+f+a,b=bl(r,r.VERTEX_SHADER,C),v=bl(r,r.FRAGMENT_SHADER,y);r.attachShader(M,b),r.attachShader(M,v),t.index0AttributeName!==void 0?r.bindAttribLocation(M,0,t.index0AttributeName):t.hasPositionAttribute===!0&&r.bindAttribLocation(M,0,"position"),r.linkProgram(M);function D(G){if(n.debug.checkShaderErrors){let z=r.getProgramInfoLog(M)||"",W=r.getShaderInfoLog(b)||"",O=r.getShaderInfoLog(v)||"",X=z.trim(),Z=W.trim(),J=O.trim(),ae=!0,Q=!0;if(r.getProgramParameter(M,r.LINK_STATUS)===!1)if(ae=!1,typeof n.debug.onShaderError=="function")n.debug.onShaderError(r,M,b,v);else{let se=pd(r,b,"vertex"),le=pd(r,v,"fragment");et("WebGLProgram: Shader Error "+r.getError()+" - VALIDATE_STATUS "+r.getProgramParameter(M,r.VALIDATE_STATUS)+`

Material Name: `+G.name+`
Material Type: `+G.type+`

Program Info Log: `+X+`
`+se+`
`+le)}else X!==""?Ie("WebGLProgram: Program Info Log:",X):(Z===""||J==="")&&(Q=!1);Q&&(G.diagnostics={runnable:ae,programLog:X,vertexShader:{log:Z,prefix:p},fragmentShader:{log:J,prefix:f}})}r.deleteShader(b),r.deleteShader(v),S=new In(r,M),T=Tg(r,M)}let S;this.getUniforms=function(){return S===void 0&&D(this),S};let T;this.getAttributes=function(){return T===void 0&&D(this),T};let I=t.rendererExtensionParallelShaderCompile===!1;return this.isReady=function(){return I===!1&&(I=r.getProgramParameter(M,mg)),I},this.destroy=function(){i.releaseStatesOfProgram(this),r.deleteProgram(M),this.program=void 0},this.type=t.shaderType,this.name=t.shaderName,this.id=gg++,this.cacheKey=e,this.usedTimes=1,this.program=M,this.vertexShader=b,this.fragmentShader=v,this}var zg=0,Aa=class{constructor(){this.shaderCache=new Map,this.materialCache=new Map}update(e,t,i){let r=this._getShaderCacheForMaterial(e);return r.has(t)===!1&&(r.add(t),t.usedTimes++),r.has(i)===!1&&(r.add(i),i.usedTimes++),this}remove(e){let t=this.materialCache.get(e);for(let i of t)i.usedTimes--,i.usedTimes===0&&this.shaderCache.delete(i.code);return this.materialCache.delete(e),this}getVertexShaderStage(e){return this._getShaderStage(e.vertexShader)}getFragmentShaderStage(e){return this._getShaderStage(e.fragmentShader)}dispose(){this.shaderCache.clear(),this.materialCache.clear()}_getShaderCacheForMaterial(e){let t=this.materialCache,i=t.get(e);return i===void 0&&(i=new Set,t.set(e,i)),i}_getShaderStage(e){let t=this.shaderCache,i=t.get(e);return i===void 0&&(i=new Tl(e),t.set(e,i)),i}},Tl=class{constructor(e){this.id=zg++,this.code=e,this.usedTimes=0}};function kg(n){return n===bi||n===kn||n===Hn}function Md(n,e,t,i,r,o){let s=new Tn,a=new Aa,l=new Set,c=[],h=new Map,d=i.logarithmicDepthBuffer,u=i.precision,m={MeshDepthMaterial:"depth",MeshDistanceMaterial:"distance",MeshNormalMaterial:"normal",MeshBasicMaterial:"basic",MeshLambertMaterial:"lambert",MeshPhongMaterial:"phong",MeshToonMaterial:"toon",MeshStandardMaterial:"physical",MeshPhysicalMaterial:"physical",MeshMatcapMaterial:"matcap",LineBasicMaterial:"basic",LineDashedMaterial:"dashed",PointsMaterial:"points",ShadowMaterial:"shadow",SpriteMaterial:"sprite"};function _(S){return l.add(S),S===0?"uv":`uv${S}`}function M(S,T,I,G,z,W){let O=G.fog,X=z.geometry,Z=S.isMeshStandardMaterial||S.isMeshLambertMaterial||S.isMeshPhongMaterial?G.environment:null,J=S.isMeshStandardMaterial||S.isMeshLambertMaterial&&!S.envMap||S.isMeshPhongMaterial&&!S.envMap,ae=e.get(S.envMap||Z,J),Q=ae&&ae.mapping===Mn?ae.image.height:null,se=m[S.type];S.precision!==null&&(u=i.getMaxPrecision(S.precision),u!==S.precision&&Ie("WebGLProgram.getParameters:",S.precision,"not supported, using",u,"instead."));let le=X.morphAttributes.position||X.morphAttributes.normal||X.morphAttributes.color,Oe=le!==void 0?le.length:0,ve=0;X.morphAttributes.position!==void 0&&(ve=1),X.morphAttributes.normal!==void 0&&(ve=2),X.morphAttributes.color!==void 0&&(ve=3);let mt,it,ot,te;if(se){let Mt=Ui[se];mt=Mt.vertexShader,it=Mt.fragmentShader}else{mt=S.vertexShader,it=S.fragmentShader;let Mt=a.getVertexShaderStage(S),ft=a.getFragmentShaderStage(S);a.update(S,Mt,ft),ot=Mt.id,te=ft.id}let ne=n.getRenderTarget(),we=n.state.buffers.depth.getReversed(),Xe=z.isInstancedMesh===!0,de=z.isBatchedMesh===!0,nt=!!S.map,Ut=!!S.matcap,rt=!!ae,st=!!S.aoMap,gt=!!S.lightMap,Ve=!!S.bumpMap&&S.wireframe===!1,Et=!!S.normalMap,Gt=!!S.displacementMap,si=!!S.emissiveMap,At=!!S.metalnessMap,It=!!S.roughnessMap,k=S.anisotropy>0,Kt=S.clearcoat>0,_t=S.dispersion>0,w=S.retroreflectivity>0,x=S.iridescence>0,V=S.sheen>0,q=S.transmission>0,ee=k&&!!S.anisotropyMap,pe=Kt&&!!S.clearcoatMap,ye=Kt&&!!S.clearcoatNormalMap,ie=Kt&&!!S.clearcoatRoughnessMap,oe=x&&!!S.iridescenceMap,be=x&&!!S.iridescenceThicknessMap,Fe=V&&!!S.sheenColorMap,me=V&&!!S.sheenRoughnessMap,Ee=!!S.specularMap,Be=!!S.specularColorMap,He=!!S.specularIntensityMap,Je=q&&!!S.transmissionMap,B=q&&!!S.thicknessMap,xe=!!S.gradientMap,re=!!S.alphaMap,ge=S.alphaTest>0,Ce=!!S.alphaHash,ue=!!S.extensions,Ge=mi;S.toneMapped&&(ne===null||ne.isXRRenderTarget===!0)&&(Ge=n.toneMapping);let Ue={shaderID:se,shaderType:S.type,shaderName:S.name,vertexShader:mt,fragmentShader:it,defines:S.defines,customVertexShaderID:ot,customFragmentShaderID:te,isRawShaderMaterial:S.isRawShaderMaterial===!0,glslVersion:S.glslVersion,precision:u,batching:de,batchingColor:de&&z._colorsTexture!==null,instancing:Xe,instancingColor:Xe&&z.instanceColor!==null,instancingMorph:Xe&&z.morphTexture!==null,outputColorSpace:ne===null?n.outputColorSpace:ne.isXRRenderTarget===!0?ne.texture.colorSpace:$e.workingColorSpace,alphaToCoverage:!!S.alphaToCoverage,map:nt,matcap:Ut,envMap:rt,envMapMode:rt&&ae.mapping,envMapCubeUVHeight:Q,aoMap:st,lightMap:gt,bumpMap:Ve,normalMap:Et,displacementMap:Gt,emissiveMap:si,normalMapObjectSpace:Et&&S.normalMapType===cc,normalMapTangentSpace:Et&&S.normalMapType===ko,packedNormalMap:Et&&S.normalMapType===ko&&kg(S.normalMap.format),metalnessMap:At,roughnessMap:It,anisotropy:k,anisotropyMap:ee,clearcoat:Kt,clearcoatMap:pe,clearcoatNormalMap:ye,clearcoatRoughnessMap:ie,dispersion:_t,retroreflection:w,iridescence:x,iridescenceMap:oe,iridescenceThicknessMap:be,sheen:V,sheenColorMap:Fe,sheenRoughnessMap:me,specularMap:Ee,specularColorMap:Be,specularIntensityMap:He,transmission:q,transmissionMap:Je,thicknessMap:B,gradientMap:xe,opaque:S.transparent===!1&&S.blending===_n&&S.alphaToCoverage===!1,alphaMap:re,alphaTest:ge,alphaHash:Ce,combine:S.combine,mapUv:nt&&_(S.map.channel),aoMapUv:st&&_(S.aoMap.channel),lightMapUv:gt&&_(S.lightMap.channel),bumpMapUv:Ve&&_(S.bumpMap.channel),normalMapUv:Et&&_(S.normalMap.channel),displacementMapUv:Gt&&_(S.displacementMap.channel),emissiveMapUv:si&&_(S.emissiveMap.channel),metalnessMapUv:At&&_(S.metalnessMap.channel),roughnessMapUv:It&&_(S.roughnessMap.channel),anisotropyMapUv:ee&&_(S.anisotropyMap.channel),clearcoatMapUv:pe&&_(S.clearcoatMap.channel),clearcoatNormalMapUv:ye&&_(S.clearcoatNormalMap.channel),clearcoatRoughnessMapUv:ie&&_(S.clearcoatRoughnessMap.channel),iridescenceMapUv:oe&&_(S.iridescenceMap.channel),iridescenceThicknessMapUv:be&&_(S.iridescenceThicknessMap.channel),sheenColorMapUv:Fe&&_(S.sheenColorMap.channel),sheenRoughnessMapUv:me&&_(S.sheenRoughnessMap.channel),specularMapUv:Ee&&_(S.specularMap.channel),specularColorMapUv:Be&&_(S.specularColorMap.channel),specularIntensityMapUv:He&&_(S.specularIntensityMap.channel),transmissionMapUv:Je&&_(S.transmissionMap.channel),thicknessMapUv:B&&_(S.thicknessMap.channel),alphaMapUv:re&&_(S.alphaMap.channel),vertexTangents:!!X.attributes.tangent&&(Et||k),vertexNormals:!!X.attributes.normal,vertexColors:S.vertexColors,vertexAlphas:S.vertexColors===!0&&!!X.attributes.color&&X.attributes.color.itemSize===4,pointsUvs:z.isPoints===!0&&!!X.attributes.uv&&(nt||re),fog:!!O,useFog:S.fog===!0,fogExp2:!!O&&O.isFogExp2,flatShading:S.wireframe===!1&&(S.flatShading===!0||X.attributes.normal===void 0&&Et===!1&&(S.isMeshLambertMaterial||S.isMeshPhongMaterial||S.isMeshStandardMaterial||S.isMeshPhysicalMaterial)),sizeAttenuation:S.sizeAttenuation===!0,logarithmicDepthBuffer:d,reversedDepthBuffer:we,skinning:z.isSkinnedMesh===!0,hasPositionAttribute:X.attributes.position!==void 0,morphTargets:X.morphAttributes.position!==void 0,morphNormals:X.morphAttributes.normal!==void 0,morphColors:X.morphAttributes.color!==void 0,morphTargetsCount:Oe,morphTextureStride:ve,numSunLights:T.sun.length,numDirLights:T.directional.length,numPointLights:T.point.length,numSpotLights:T.spot.length,numSpotLightMaps:T.spotLightMap.length,numRectAreaLights:T.rectArea.length,numHemiLights:T.hemi.length,numSunLightShadows:T.sunShadowMap.length,numDirLightShadows:T.directionalShadowMap.length,numPointLightShadows:T.pointShadowMap.length,numSpotLightShadows:T.spotShadowMap.length,numSpotLightShadowsWithMaps:T.numSpotLightShadowsWithMaps,numLightProbes:T.numLightProbes,numLightProbeGrids:W.length,numClippingPlanes:o.numPlanes,numClipIntersection:o.numIntersection,dithering:S.dithering,shadowMapEnabled:n.shadowMap.enabled&&I.length>0,shadowMapType:n.shadowMap.type,toneMapping:Ge,decodeVideoTexture:nt&&S.map.isVideoTexture===!0&&$e.getTransfer(S.map.colorSpace)===lt,decodeVideoTextureEmissive:si&&S.emissiveMap.isVideoTexture===!0&&$e.getTransfer(S.emissiveMap.colorSpace)===lt,premultipliedAlpha:S.premultipliedAlpha,doubleSided:S.side===ri,flipSided:S.side===wt,useDepthPacking:S.depthPacking>=0,depthPacking:S.depthPacking||0,index0AttributeName:S.index0AttributeName,extensionClipCullDistance:ue&&S.extensions.clipCullDistance===!0&&t.has("WEBGL_clip_cull_distance"),extensionMultiDraw:(ue&&S.extensions.multiDraw===!0||de)&&t.has("WEBGL_multi_draw"),rendererExtensionParallelShaderCompile:t.has("KHR_parallel_shader_compile"),customProgramCacheKey:S.customProgramCacheKey()};return Ue.vertexUv1s=l.has(1),Ue.vertexUv2s=l.has(2),Ue.vertexUv3s=l.has(3),l.clear(),Ue}function p(S){let T=[];if(S.shaderID?T.push(S.shaderID):(T.push(S.customVertexShaderID),T.push(S.customFragmentShaderID)),S.defines!==void 0)for(let I in S.defines)T.push(I),T.push(S.defines[I]);return S.isRawShaderMaterial===!1&&(f(T,S),E(T,S),T.push(n.outputColorSpace)),T.push(S.customProgramCacheKey),T.join()}function f(S,T){S.push(T.precision),S.push(T.outputColorSpace),S.push(T.envMapMode),S.push(T.envMapCubeUVHeight),S.push(T.mapUv),S.push(T.alphaMapUv),S.push(T.lightMapUv),S.push(T.aoMapUv),S.push(T.bumpMapUv),S.push(T.normalMapUv),S.push(T.displacementMapUv),S.push(T.emissiveMapUv),S.push(T.metalnessMapUv),S.push(T.roughnessMapUv),S.push(T.anisotropyMapUv),S.push(T.clearcoatMapUv),S.push(T.clearcoatNormalMapUv),S.push(T.clearcoatRoughnessMapUv),S.push(T.iridescenceMapUv),S.push(T.iridescenceThicknessMapUv),S.push(T.sheenColorMapUv),S.push(T.sheenRoughnessMapUv),S.push(T.specularMapUv),S.push(T.specularColorMapUv),S.push(T.specularIntensityMapUv),S.push(T.transmissionMapUv),S.push(T.thicknessMapUv),S.push(T.combine),S.push(T.fogExp2),S.push(T.sizeAttenuation),S.push(T.morphTargetsCount),S.push(T.morphAttributeCount),S.push(T.numSunLights),S.push(T.numDirLights),S.push(T.numPointLights),S.push(T.numSpotLights),S.push(T.numSpotLightMaps),S.push(T.numHemiLights),S.push(T.numRectAreaLights),S.push(T.numSunLightShadows),S.push(T.numDirLightShadows),S.push(T.numPointLightShadows),S.push(T.numSpotLightShadows),S.push(T.numSpotLightShadowsWithMaps),S.push(T.numLightProbes),S.push(T.shadowMapType),S.push(T.toneMapping),S.push(T.numClippingPlanes),S.push(T.numClipIntersection),S.push(T.depthPacking)}function E(S,T){s.disableAll(),T.instancing&&s.enable(0),T.instancingColor&&s.enable(1),T.instancingMorph&&s.enable(2),T.matcap&&s.enable(3),T.envMap&&s.enable(4),T.normalMapObjectSpace&&s.enable(5),T.normalMapTangentSpace&&s.enable(6),T.clearcoat&&s.enable(7),T.iridescence&&s.enable(8),T.alphaTest&&s.enable(9),T.vertexColors&&s.enable(10),T.vertexAlphas&&s.enable(11),T.vertexUv1s&&s.enable(12),T.vertexUv2s&&s.enable(13),T.vertexUv3s&&s.enable(14),T.vertexTangents&&s.enable(15),T.anisotropy&&s.enable(16),T.alphaHash&&s.enable(17),T.batching&&s.enable(18),T.dispersion&&s.enable(19),T.retroreflection&&s.enable(24),T.batchingColor&&s.enable(20),T.gradientMap&&s.enable(21),T.packedNormalMap&&s.enable(22),T.vertexNormals&&s.enable(23),S.push(s.mask),s.disableAll(),T.fog&&s.enable(0),T.useFog&&s.enable(1),T.flatShading&&s.enable(2),T.logarithmicDepthBuffer&&s.enable(3),T.reversedDepthBuffer&&s.enable(4),T.skinning&&s.enable(5),T.morphTargets&&s.enable(6),T.morphNormals&&s.enable(7),T.morphColors&&s.enable(8),T.premultipliedAlpha&&s.enable(9),T.shadowMapEnabled&&s.enable(10),T.doubleSided&&s.enable(11),T.flipSided&&s.enable(12),T.useDepthPacking&&s.enable(13),T.dithering&&s.enable(14),T.transmission&&s.enable(15),T.sheen&&s.enable(16),T.opaque&&s.enable(17),T.pointsUvs&&s.enable(18),T.decodeVideoTexture&&s.enable(19),T.decodeVideoTextureEmissive&&s.enable(20),T.alphaToCoverage&&s.enable(21),T.numLightProbeGrids>0&&s.enable(22),T.hasPositionAttribute&&s.enable(23),S.push(s.mask)}function C(S){let T=m[S.type],I;if(T){let G=Ui[T];I=Kc.clone(G.uniforms)}else I=S.uniforms;return I}function y(S,T){let I=h.get(T);return I!==void 0?++I.usedTimes:(I=new Sd(n,T,S,r),c.push(I),h.set(T,I)),I}function b(S){if(--S.usedTimes===0){let T=c.indexOf(S);c[T]=c[c.length-1],c.pop(),h.delete(S.cacheKey),S.destroy()}}function v(S){a.remove(S)}function D(){a.dispose()}return{getParameters:M,getProgramCacheKey:p,getUniforms:C,acquireProgram:y,releaseProgram:b,releaseShaderCache:v,programs:c,dispose:D}}function vd(){let n=new WeakMap;function e(s){return n.has(s)}function t(s){let a=n.get(s);return a===void 0&&(a={},n.set(s,a)),a}function i(s){n.delete(s)}function r(s,a,l){n.get(s)[a]=l}function o(){n=new WeakMap}return{has:e,get:t,remove:i,update:r,dispose:o}}function Hg(n,e){return n.groupOrder!==e.groupOrder?n.groupOrder-e.groupOrder:n.renderOrder!==e.renderOrder?n.renderOrder-e.renderOrder:n.material.id!==e.material.id?n.material.id-e.material.id:n.materialVariant!==e.materialVariant?n.materialVariant-e.materialVariant:n.z!==e.z?n.z-e.z:n.id-e.id}function yd(n,e){return n.groupOrder!==e.groupOrder?n.groupOrder-e.groupOrder:n.renderOrder!==e.renderOrder?n.renderOrder-e.renderOrder:n.z!==e.z?e.z-n.z:n.id-e.id}function bd(){let n=[],e=0,t=[],i=[],r=[];function o(){e=0,t.length=0,i.length=0,r.length=0}function s(u){let m=0;return u.isInstancedMesh&&(m+=2),u.isSkinnedMesh&&(m+=1),m}function a(u,m,_,M,p,f){let E=n[e];return E===void 0?(E={id:u.id,object:u,geometry:m,material:_,materialVariant:s(u),groupOrder:M,renderOrder:u.renderOrder,z:p,group:f},n[e]=E):(E.id=u.id,E.object=u,E.geometry=m,E.material=_,E.materialVariant=s(u),E.groupOrder=M,E.renderOrder=u.renderOrder,E.z=p,E.group=f),e++,E}function l(u,m,_,M,p,f,E){E.reversedDepth===!0&&(p=-p);let C=a(u,m,_,M,p,f);_.transmission>0?i.push(C):_.transparent===!0?r.push(C):t.push(C)}function c(u,m,_,M,p,f){let E=a(u,m,_,M,p,f);_.transmission>0?i.unshift(E):_.transparent===!0?r.unshift(E):t.unshift(E)}function h(u,m){t.length>1&&t.sort(u||Hg),i.length>1&&i.sort(m||yd),r.length>1&&r.sort(m||yd)}function d(){for(let u=e,m=n.length;u<m;u++){let _=n[u];if(_.id===null)break;_.id=null,_.object=null,_.geometry=null,_.material=null,_.group=null}}return{opaque:t,transmissive:i,transparent:r,init:o,push:l,unshift:c,finish:d,sort:h}}function Ed(){let n=new WeakMap;function e(i,r){let o=n.get(i),s;return o===void 0?(s=new bd,n.set(i,[s])):r>=o.length?(s=new bd,o.push(s)):s=o[r],s}function t(){n=new WeakMap}return{get:e,dispose:t}}function Vg(){let n={};return{get:function(e){if(n[e.id]!==void 0)return n[e.id];let t;switch(e.type){case"SunLight":case"DirectionalLight":t={direction:new U,color:new Le};break;case"SpotLight":t={position:new U,direction:new U,color:new Le,distance:0,coneCos:0,penumbraCos:0,decay:0};break;case"PointLight":t={position:new U,color:new Le,distance:0,decay:0};break;case"HemisphereLight":t={direction:new U,skyColor:new Le,groundColor:new Le};break;case"RectAreaLight":t={color:new Le,position:new U,halfWidth:new U,halfHeight:new U};break}return n[e.id]=t,t}}}function Wg(){let n={};return{get:function(e){if(n[e.id]!==void 0)return n[e.id];let t;switch(e.type){case"SunLight":case"DirectionalLight":t={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new Ae};break;case"SpotLight":t={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new Ae};break;case"PointLight":t={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new Ae,shadowCameraNear:1,shadowCameraFar:1e3};break}return n[e.id]=t,t}}}var Xg=0;function qg(n,e){return(e.castShadow?2:0)-(n.castShadow?2:0)+(e.map?1:0)-(n.map?1:0)}function Td(n){let e=new Vg,t=Wg(),i={version:0,hash:{sunLength:-1,directionalLength:-1,pointLength:-1,spotLength:-1,rectAreaLength:-1,hemiLength:-1,numSunShadows:-1,numDirectionalShadows:-1,numPointShadows:-1,numSpotShadows:-1,numSpotMaps:-1,numLightProbes:-1},ambient:[0,0,0],probe:[],sun:[],sunShadow:[],sunShadowMap:[],sunShadowMatrix:[],sunShadowCascade:[],directional:[],directionalShadow:[],directionalShadowMap:[],directionalShadowMatrix:[],spot:[],spotLightMap:[],spotShadow:[],spotShadowMap:[],spotLightMatrix:[],rectArea:[],rectAreaLTC1:null,rectAreaLTC2:null,point:[],pointShadow:[],pointShadowMap:[],pointShadowMatrix:[],hemi:[],numSpotLightShadowsWithMaps:0,numLightProbes:0};for(let c=0;c<9;c++)i.probe.push(new U);let r=new U,o=new Qe,s=new Qe;function a(c){let h=0,d=0,u=0;for(let z=0;z<9;z++)i.probe[z].set(0,0,0);let m=0,_=0,M=0,p=0,f=0,E=0,C=0,y=0,b=0,v=0,D=0,S=0,T=0,I=0;c.sort(qg);for(let z=0,W=c.length;z<W;z++){let O=c[z],X=O.color,Z=O.intensity,J=O.distance,ae=null;if(O.shadow&&O.shadow.map&&(O.shadow.map.texture.format===bi?ae=O.shadow.map.texture:ae=O.shadow.map.depthTexture||O.shadow.map.texture),O.isAmbientLight)h+=X.r*Z,d+=X.g*Z,u+=X.b*Z;else if(O.isLightProbe){for(let Q=0;Q<9;Q++)i.probe[Q].addScaledVector(O.sh.coefficients[Q],Z);I++}else if(O.isSunLight){let Q=e.get(O);if(Q.color.copy(O.color).multiplyScalar(O.intensity),O.castShadow){let se=O.shadow,le=t.get(O);le.shadowIntensity=se.intensity,le.shadowBias=se.bias,le.shadowNormalBias=se.normalBias,le.shadowRadius=se.radius,le.shadowMapSize.copy(se.mapSize).multiply(se.getFrameExtents()),i.sunShadow[_]=le,i.sunShadowMap[_]=ae;let Oe=se.getViewportCount();for(let ve=0;ve<Oe;ve++)i.sunShadowMatrix[M+ve]=se.getMatrix(ve),i.sunShadowCascade[M+ve]=se._cascadeData[ve];M+=Oe,_++}i.sun[m]=Q,m++}else if(O.isDirectionalLight){let Q=e.get(O);if(Q.color.copy(O.color).multiplyScalar(O.intensity),O.castShadow){let se=O.shadow,le=t.get(O);le.shadowIntensity=se.intensity,le.shadowBias=se.bias,le.shadowNormalBias=se.normalBias,le.shadowRadius=se.radius,le.shadowMapSize=se.mapSize,i.directionalShadow[p]=le,i.directionalShadowMap[p]=ae,i.directionalShadowMatrix[p]=O.shadow.matrix,b++}i.directional[p]=Q,p++}else if(O.isSpotLight){let Q=e.get(O);Q.position.setFromMatrixPosition(O.matrixWorld),Q.color.copy(X).multiplyScalar(Z),Q.distance=J,Q.coneCos=Math.cos(O.angle),Q.penumbraCos=Math.cos(O.angle*(1-O.penumbra)),Q.decay=O.decay,i.spot[E]=Q;let se=O.shadow;if(O.map&&(i.spotLightMap[S]=O.map,S++,se.updateMatrices(O),O.castShadow&&T++),i.spotLightMatrix[E]=se.matrix,O.castShadow){let le=t.get(O);le.shadowIntensity=se.intensity,le.shadowBias=se.bias,le.shadowNormalBias=se.normalBias,le.shadowRadius=se.radius,le.shadowMapSize=se.mapSize,i.spotShadow[E]=le,i.spotShadowMap[E]=ae,D++}E++}else if(O.isRectAreaLight){let Q=e.get(O);Q.color.copy(X).multiplyScalar(Z),Q.halfWidth.set(O.width*.5,0,0),Q.halfHeight.set(0,O.height*.5,0),i.rectArea[C]=Q,C++}else if(O.isPointLight){let Q=e.get(O);if(Q.color.copy(O.color).multiplyScalar(O.intensity),Q.distance=O.distance,Q.decay=O.decay,O.castShadow){let se=O.shadow,le=t.get(O);le.shadowIntensity=se.intensity,le.shadowBias=se.bias,le.shadowNormalBias=se.normalBias,le.shadowRadius=se.radius,le.shadowMapSize=se.mapSize,le.shadowCameraNear=se.camera.near,le.shadowCameraFar=se.camera.far,i.pointShadow[f]=le,i.pointShadowMap[f]=ae,i.pointShadowMatrix[f]=O.shadow.matrix,v++}i.point[f]=Q,f++}else if(O.isHemisphereLight){let Q=e.get(O);Q.skyColor.copy(O.color).multiplyScalar(Z),Q.groundColor.copy(O.groundColor).multiplyScalar(Z),i.hemi[y]=Q,y++}}C>0&&(n.has("OES_texture_float_linear")===!0?(i.rectAreaLTC1=Te.LTC_FLOAT_1,i.rectAreaLTC2=Te.LTC_FLOAT_2):(i.rectAreaLTC1=Te.LTC_HALF_1,i.rectAreaLTC2=Te.LTC_HALF_2)),i.ambient[0]=h,i.ambient[1]=d,i.ambient[2]=u;let G=i.hash;(G.sunLength!==m||G.directionalLength!==p||G.pointLength!==f||G.spotLength!==E||G.rectAreaLength!==C||G.hemiLength!==y||G.numSunShadows!==_||G.numDirectionalShadows!==b||G.numPointShadows!==v||G.numSpotShadows!==D||G.numSpotMaps!==S||G.numLightProbes!==I)&&(i.sun.length=m,i.directional.length=p,i.spot.length=E,i.rectArea.length=C,i.point.length=f,i.hemi.length=y,i.sunShadow.length=_,i.sunShadowMap.length=_,i.sunShadowMatrix.length=M,i.sunShadowCascade.length=M,i.directionalShadow.length=b,i.directionalShadowMap.length=b,i.directionalShadowMatrix.length=b,i.pointShadow.length=v,i.pointShadowMap.length=v,i.pointShadowMatrix.length=v,i.spotShadow.length=D,i.spotShadowMap.length=D,i.spotLightMatrix.length=D+S-T,i.spotLightMap.length=S,i.numSpotLightShadowsWithMaps=T,i.numLightProbes=I,G.sunLength=m,G.directionalLength=p,G.pointLength=f,G.spotLength=E,G.rectAreaLength=C,G.hemiLength=y,G.numSunShadows=_,G.numDirectionalShadows=b,G.numPointShadows=v,G.numSpotShadows=D,G.numSpotMaps=S,G.numLightProbes=I,i.version=Xg++)}function l(c,h){let d=0,u=0,m=0,_=0,M=0,p=0,f=h.matrixWorldInverse;for(let E=0,C=c.length;E<C;E++){let y=c[E];if(y.isSunLight){let b=i.sun[d];b.direction.setFromMatrixPosition(y.matrixWorld),b.direction.transformDirection(f),d++}else if(y.isDirectionalLight){let b=i.directional[u];b.direction.setFromMatrixPosition(y.matrixWorld),r.setFromMatrixPosition(y.target.matrixWorld),b.direction.sub(r),b.direction.transformDirection(f),u++}else if(y.isSpotLight){let b=i.spot[_];b.position.setFromMatrixPosition(y.matrixWorld),b.position.applyMatrix4(f),b.direction.setFromMatrixPosition(y.matrixWorld),r.setFromMatrixPosition(y.target.matrixWorld),b.direction.sub(r),b.direction.transformDirection(f),_++}else if(y.isRectAreaLight){let b=i.rectArea[M];b.position.setFromMatrixPosition(y.matrixWorld),b.position.applyMatrix4(f),s.identity(),o.copy(y.matrixWorld),o.premultiply(f),s.extractRotation(o),b.halfWidth.set(y.width*.5,0,0),b.halfHeight.set(0,y.height*.5,0),b.halfWidth.applyMatrix4(s),b.halfHeight.applyMatrix4(s),M++}else if(y.isPointLight){let b=i.point[m];b.position.setFromMatrixPosition(y.matrixWorld),b.position.applyMatrix4(f),m++}else if(y.isHemisphereLight){let b=i.hemi[p];b.direction.setFromMatrixPosition(y.matrixWorld),b.direction.transformDirection(f),p++}}}return{setup:a,setupView:l,state:i}}function Ad(n){let e=new Td(n),t=[],i=[],r=[];function o(u){d.camera=u,t.length=0,i.length=0,r.length=0}function s(u){t.push(u)}function a(u){i.push(u)}function l(u){r.push(u)}function c(){e.setup(t)}function h(u){e.setupView(t,u)}let d={lightsArray:t,shadowsArray:i,lightProbeGridArray:r,camera:null,lights:e,transmissionRenderTarget:{},textureUnits:0};return{init:o,state:d,setupLights:c,setupLightsView:h,pushLight:s,pushShadow:a,pushLightProbeGrid:l}}function wd(n){let e=new WeakMap;function t(r,o=0){let s=e.get(r),a;return s===void 0?(a=new Ad(n),e.set(r,[a])):o>=s.length?(a=new Ad(n),s.push(a)):a=s[o],a}function i(){e=new WeakMap}return{get:t,dispose:i}}var Rd=`
void main() {
gl_Position = vec4( position, 1.0 );
}
`,Cd=`
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
`;var Kg=[new U(1,0,0),new U(-1,0,0),new U(0,1,0),new U(0,-1,0),new U(0,0,1),new U(0,0,-1)],Zg=[new U(0,-1,0),new U(0,-1,0),new U(0,0,1),new U(0,0,-1),new U(0,-1,0),new U(0,-1,0)],Pd=new Qe,rs=new U,Al=new U;function Ld(n,e,t){let i=new Cn,r=new Ae,o=new Ae,s=new dt,a=new da,l=new pa,c={},h=t.maxTextureSize,d={[Ci]:wt,[wt]:Ci,[ri]:ri},u=new ni({defines:{VSM_SAMPLES:8},uniforms:{shadow_pass:{value:null},resolution:{value:new Ae},radius:{value:4}},vertexShader:Rd,fragmentShader:Cd}),m=u.clone();m.defines.HORIZONTAL_PASS=1;let _=new pt;_.setAttribute("position",new fi(new Float32Array([-1,-1,.5,3,-1,.5,-1,3,.5]),3));let M=new _e(_,u),p=this;this.enabled=!1,this.autoUpdate=!0,this.needsUpdate=!1,this.type=gn;let f=this.type;this.render=function(v,D,S){if(p.enabled===!1||p.autoUpdate===!1&&p.needsUpdate===!1||v.length===0)return;this.type===zl&&(Ie("WebGLShadowMap: PCFSoftShadowMap has been removed. Using PCFShadowMap instead."),this.type=gn);let T=n.getRenderTarget(),I=n.getActiveCubeFace(),G=n.getActiveMipmapLevel(),z=n.state;z.setBlending(vi),z.buffers.depth.getReversed()===!0?z.buffers.color.setClear(0,0,0,0):z.buffers.color.setClear(1,1,1,1),z.buffers.depth.setTest(!0),z.setScissorTest(!1);let W=f!==this.type;W&&D.traverse(function(O){O.material&&(Array.isArray(O.material)?O.material.forEach(X=>X.needsUpdate=!0):O.material.needsUpdate=!0)});for(let O=0,X=v.length;O<X;O++){let Z=v[O],J=Z.shadow;if(J===void 0){Ie("WebGLShadowMap:",Z,"has no shadow.");continue}if(J.autoUpdate===!1&&J.needsUpdate===!1)continue;r.copy(J.mapSize);let ae=J.getFrameExtents();r.multiply(ae),o.copy(J.mapSize),(r.x>h||r.y>h)&&(r.x>h&&(o.x=Math.floor(h/ae.x),r.x=o.x*ae.x,J.mapSize.x=o.x),r.y>h&&(o.y=Math.floor(h/ae.y),r.y=o.y*ae.y,J.mapSize.y=o.y));let Q=n.state.buffers.depth.getReversed();if(J.camera._reversedDepth=Q,J.map===null||W===!0){if(J.map!==null&&(J.map.depthTexture!==null&&(J.map.depthTexture.dispose(),J.map.depthTexture=null),J.map.dispose()),this.type===zn){if(Z.isPointLight){Ie("WebGLShadowMap: VSM shadow maps are not supported for PointLights. Use PCF or BasicShadowMap instead.");continue}J.map=new Vt(r.x,r.y,{format:bi,type:Qt,minFilter:Lt,magFilter:Lt,generateMipmaps:!1}),J.map.texture.name=Z.name+".shadowMap",J.map.depthTexture=new Wi(r.x,r.y,oi),J.map.depthTexture.name=Z.name+".shadowMapDepth",J.map.depthTexture.format=gi,J.map.depthTexture.compareFunction=null,J.map.depthTexture.minFilter=Ct,J.map.depthTexture.magFilter=Ct}else Z.isPointLight?(J.map=new $r(r.x),J.map.depthTexture=new sa(r.x,$t)):(J.map=new Vt(r.x,r.y),J.map.depthTexture=new Wi(r.x,r.y,$t)),J.map.depthTexture.name=Z.name+".shadowMap",J.map.depthTexture.format=gi,this.type===gn?(J.map.depthTexture.compareFunction=Q?Mr:Sr,J.map.depthTexture.minFilter=Lt,J.map.depthTexture.magFilter=Lt):(J.map.depthTexture.compareFunction=null,J.map.depthTexture.minFilter=Ct,J.map.depthTexture.magFilter=Ct);J.camera.updateProjectionMatrix()}J.map.isWebGLCubeRenderTarget!==!0&&(J.map.width!==r.x||J.map.height!==r.y)&&J.map.setSize(r.x,r.y);let se=J.map.isWebGLCubeRenderTarget?6:J.getViewportCount();Z.isPointLight!==!0&&J.updateMatrices(Z,S);for(let le=0;le<se;le++){let Oe=J.getCamera(le);if(Z.isPointLight){let ve=J.camera,mt=J.matrix,it=Z.distance||ve.far;it!==ve.far&&(ve.far=it,ve.updateProjectionMatrix()),rs.setFromMatrixPosition(Z.matrixWorld),ve.position.copy(rs),Al.copy(ve.position),Al.add(Kg[le]),ve.up.copy(Zg[le]),ve.lookAt(Al),ve.updateMatrixWorld(),mt.makeTranslation(-rs.x,-rs.y,-rs.z),Pd.multiplyMatrices(ve.projectionMatrix,ve.matrixWorldInverse),J._frustum.setFromProjectionMatrix(Pd,ve.coordinateSystem,ve.reversedDepth)}if(J.map.isWebGLCubeRenderTarget)n.setRenderTarget(J.map,le),n.clear();else{le===0&&(n.setRenderTarget(J.map),n.clear());let ve=J.getViewport(le);s.set(o.x*ve.x,o.y*ve.y,o.x*ve.z,o.y*ve.w),z.viewport(s)}i=J.getFrustum(le),y(D,S,Oe,Z,this.type)}J.isPointLightShadow!==!0&&this.type===zn&&E(J,S),J.needsUpdate=!1}f=this.type,p.needsUpdate=!1,n.setRenderTarget(T,I,G)};function E(v,D){let S=e.update(M);u.defines.VSM_SAMPLES!==v.blurSamples&&(u.defines.VSM_SAMPLES=v.blurSamples,m.defines.VSM_SAMPLES=v.blurSamples,u.needsUpdate=!0,m.needsUpdate=!0),v.mapPass===null?v.mapPass=new Vt(r.x,r.y,{format:bi,type:Qt}):(v.mapPass.width!==v.map.width||v.mapPass.height!==v.map.height)&&v.mapPass.setSize(v.map.width,v.map.height),u.uniforms.shadow_pass.value=v.map.depthTexture,u.uniforms.resolution.value.set(v.map.width,v.map.height),u.uniforms.radius.value=v.radius,n.setRenderTarget(v.mapPass),n.clear(),n.renderBufferDirect(D,null,S,u,M,null),m.uniforms.shadow_pass.value=v.mapPass.texture,m.uniforms.resolution.value.set(v.map.width,v.map.height),m.uniforms.radius.value=v.radius,n.setRenderTarget(v.map),n.clear(),n.renderBufferDirect(D,null,S,m,M,null)}function C(v,D,S,T){let I=null,G=S.isPointLight===!0?v.customDistanceMaterial:v.customDepthMaterial;if(G!==void 0)I=G;else if(I=S.isPointLight===!0?l:a,n.localClippingEnabled&&D.clipShadows===!0&&Array.isArray(D.clippingPlanes)&&D.clippingPlanes.length!==0||D.displacementMap&&D.displacementScale!==0||D.alphaMap&&D.alphaTest>0||D.map&&D.alphaTest>0||D.alphaToCoverage===!0){let z=I.uuid,W=D.uuid,O=c[z];O===void 0&&(O={},c[z]=O);let X=O[W];X===void 0&&(X=I.clone(),O[W]=X,D.addEventListener("dispose",b)),I=X}if(I.visible=D.visible,I.wireframe=D.wireframe,T===zn?I.side=D.shadowSide!==null?D.shadowSide:D.side:I.side=D.shadowSide!==null?D.shadowSide:d[D.side],I.alphaMap=D.alphaMap,I.alphaTest=D.alphaToCoverage===!0?.5:D.alphaTest,I.map=D.map,I.clipShadows=D.clipShadows,I.clippingPlanes=D.clippingPlanes,I.clipIntersection=D.clipIntersection,I.displacementMap=D.displacementMap,I.displacementScale=D.displacementScale,I.displacementBias=D.displacementBias,I.wireframeLinewidth=D.wireframeLinewidth,I.linewidth=D.linewidth,S.isPointLight===!0&&I.isMeshDistanceMaterial===!0){let z=n.properties.get(I);z.light=S}return I}function y(v,D,S,T,I){if(v.visible===!1)return;if(v.layers.test(D.layers)&&(v.isMesh||v.isLine||v.isPoints)&&(v.castShadow||v.receiveShadow&&I===zn)&&(!v.frustumCulled||v.intersectsFrustum(i))){v.modelViewMatrix.multiplyMatrices(S.matrixWorldInverse,v.matrixWorld);let W=e.update(v),O=v.material;if(Array.isArray(O)){let X=W.groups;for(let Z=0,J=X.length;Z<J;Z++){let ae=X[Z],Q=O[ae.materialIndex];if(Q&&Q.visible){let se=C(v,Q,T,I);v.onBeforeShadow(n,v,D,S,W,se,ae),n.renderBufferDirect(S,null,W,se,v,ae),v.onAfterShadow(n,v,D,S,W,se,ae)}}}else if(O.visible){let X=C(v,O,T,I);v.onBeforeShadow(n,v,D,S,W,X,null),n.renderBufferDirect(S,null,W,X,v,null),v.onAfterShadow(n,v,D,S,W,X,null)}}let z=v.children;for(let W=0,O=z.length;W<O;W++)y(z[W],D,S,T,I)}function b(v){v.target.removeEventListener("dispose",b);for(let S in c){let T=c[S],I=v.target.uuid;I in T&&(T[I].dispose(),delete T[I])}}}function Dd(n,e){function t(){let B=!1,xe=new dt,re=null,ge=new dt(0,0,0,0);return{setMask:function(Ce){re!==Ce&&!B&&(n.colorMask(Ce,Ce,Ce,Ce),re=Ce)},setLocked:function(Ce){B=Ce},setClear:function(Ce,ue,Ge,Ue,Mt){Mt===!0&&(Ce*=Ue,ue*=Ue,Ge*=Ue),xe.set(Ce,ue,Ge,Ue),ge.equals(xe)===!1&&(n.clearColor(Ce,ue,Ge,Ue),ge.copy(xe))},reset:function(){B=!1,re=null,ge.set(-1,0,0,0)}}}function i(){let B=!1,xe=!1,re=null,ge=null,Ce=null;return{setReversed:function(ue){if(xe!==ue){let Ge=e.get("EXT_clip_control");ue?Ge.clipControlEXT(Ge.LOWER_LEFT_EXT,Ge.ZERO_TO_ONE_EXT):Ge.clipControlEXT(Ge.LOWER_LEFT_EXT,Ge.NEGATIVE_ONE_TO_ONE_EXT),xe=ue;let Ue=Ce;Ce=null,this.setClear(Ue)}},getReversed:function(){return xe},setTest:function(ue){ue?ne(n.DEPTH_TEST):we(n.DEPTH_TEST)},setMask:function(ue){re!==ue&&!B&&(n.depthMask(ue),re=ue)},setFunc:function(ue){if(xe&&(ue=bc[ue]),ge!==ue){switch(ue){case to:n.depthFunc(n.NEVER);break;case io:n.depthFunc(n.ALWAYS);break;case no:n.depthFunc(n.LESS);break;case Sn:n.depthFunc(n.LEQUAL);break;case ro:n.depthFunc(n.EQUAL);break;case oo:n.depthFunc(n.GEQUAL);break;case so:n.depthFunc(n.GREATER);break;case ao:n.depthFunc(n.NOTEQUAL);break;default:n.depthFunc(n.LEQUAL)}ge=ue}},setLocked:function(ue){B=ue},setClear:function(ue){Ce!==ue&&(Ce=ue,xe&&(ue=1-ue),n.clearDepth(ue))},reset:function(){B=!1,re=null,ge=null,Ce=null,xe=!1}}}function r(){let B=!1,xe=null,re=null,ge=null,Ce=null,ue=null,Ge=null,Ue=null,Mt=null;return{setTest:function(ft){B||(ft?ne(n.STENCIL_TEST):we(n.STENCIL_TEST))},setMask:function(ft){xe!==ft&&!B&&(n.stencilMask(ft),xe=ft)},setFunc:function(ft,Zt,Mi){(re!==ft||ge!==Zt||Ce!==Mi)&&(n.stencilFunc(ft,Zt,Mi),re=ft,ge=Zt,Ce=Mi)},setOp:function(ft,Zt,Mi){(ue!==ft||Ge!==Zt||Ue!==Mi)&&(n.stencilOp(ft,Zt,Mi),ue=ft,Ge=Zt,Ue=Mi)},setLocked:function(ft){B=ft},setClear:function(ft){Mt!==ft&&(n.clearStencil(ft),Mt=ft)},reset:function(){B=!1,xe=null,re=null,ge=null,Ce=null,ue=null,Ge=null,Ue=null,Mt=null}}}let o=new t,s=new i,a=new r,l=new WeakMap,c=new WeakMap,h={},d={},u={},m=new WeakMap,_=[],M=null,p=!1,f=null,E=null,C=null,y=null,b=null,v=null,D=null,S=new Le(0,0,0),T=0,I=!1,G=null,z=null,W=null,O=null,X=null,Z=n.getParameter(n.MAX_COMBINED_TEXTURE_IMAGE_UNITS),J=!1,ae=0,Q=n.getParameter(n.VERSION);Q.indexOf("WebGL")!==-1?(ae=parseFloat(/^WebGL (\d)/.exec(Q)[1]),J=ae>=1):Q.indexOf("OpenGL ES")!==-1&&(ae=parseFloat(/^OpenGL ES (\d)/.exec(Q)[1]),J=ae>=2);let se=null,le={},Oe=n.getParameter(n.SCISSOR_BOX),ve=n.getParameter(n.VIEWPORT),mt=new dt().fromArray(Oe),it=new dt().fromArray(ve);function ot(B,xe,re,ge){let Ce=new Uint8Array(4),ue=n.createTexture();n.bindTexture(B,ue),n.texParameteri(B,n.TEXTURE_MIN_FILTER,n.NEAREST),n.texParameteri(B,n.TEXTURE_MAG_FILTER,n.NEAREST);for(let Ge=0;Ge<re;Ge++)B===n.TEXTURE_3D||B===n.TEXTURE_2D_ARRAY?n.texImage3D(xe,0,n.RGBA,1,1,ge,0,n.RGBA,n.UNSIGNED_BYTE,Ce):n.texImage2D(xe+Ge,0,n.RGBA,1,1,0,n.RGBA,n.UNSIGNED_BYTE,Ce);return ue}let te={};te[n.TEXTURE_2D]=ot(n.TEXTURE_2D,n.TEXTURE_2D,1),te[n.TEXTURE_CUBE_MAP]=ot(n.TEXTURE_CUBE_MAP,n.TEXTURE_CUBE_MAP_POSITIVE_X,6),te[n.TEXTURE_2D_ARRAY]=ot(n.TEXTURE_2D_ARRAY,n.TEXTURE_2D_ARRAY,1,1),te[n.TEXTURE_3D]=ot(n.TEXTURE_3D,n.TEXTURE_3D,1,1),o.setClear(0,0,0,1),s.setClear(1),a.setClear(0),ne(n.DEPTH_TEST),s.setFunc(Sn),Ve(!1),Et(Ua),ne(n.CULL_FACE),st(vi);function ne(B){h[B]!==!0&&(n.enable(B),h[B]=!0)}function we(B){h[B]!==!1&&(n.disable(B),h[B]=!1)}function Xe(B,xe){return u[B]!==xe?(n.bindFramebuffer(B,xe),u[B]=xe,B===n.DRAW_FRAMEBUFFER&&(u[n.FRAMEBUFFER]=xe),B===n.FRAMEBUFFER&&(u[n.DRAW_FRAMEBUFFER]=xe),!0):!1}function de(B,xe){let re=_,ge=!1;if(B){re=m.get(xe),re===void 0&&(re=[],m.set(xe,re));let Ce=B.textures;if(re.length!==Ce.length||re[0]!==n.COLOR_ATTACHMENT0){for(let ue=0,Ge=Ce.length;ue<Ge;ue++)re[ue]=n.COLOR_ATTACHMENT0+ue;re.length=Ce.length,ge=!0}}else re[0]!==n.BACK&&(re[0]=n.BACK,ge=!0);ge&&n.drawBuffers(re)}function nt(B){return M!==B?(n.useProgram(B),M=B,!0):!1}let Ut={[xn]:n.FUNC_ADD,[Hl]:n.FUNC_SUBTRACT,[Vl]:n.FUNC_REVERSE_SUBTRACT};Ut[Wl]=n.MIN,Ut[Xl]=n.MAX;let rt={[ql]:n.ZERO,[Yl]:n.ONE,[Kl]:n.SRC_COLOR,[fs]:n.SRC_ALPHA,[ec]:n.SRC_ALPHA_SATURATE,[Ql]:n.DST_COLOR,[Jl]:n.DST_ALPHA,[Zl]:n.ONE_MINUS_SRC_COLOR,[hs]:n.ONE_MINUS_SRC_ALPHA,[jl]:n.ONE_MINUS_DST_COLOR,[$l]:n.ONE_MINUS_DST_ALPHA,[tc]:n.CONSTANT_COLOR,[ic]:n.ONE_MINUS_CONSTANT_COLOR,[nc]:n.CONSTANT_ALPHA,[rc]:n.ONE_MINUS_CONSTANT_ALPHA};function st(B,xe,re,ge,Ce,ue,Ge,Ue,Mt,ft){if(B===vi){p===!0&&(we(n.BLEND),p=!1);return}if(p===!1&&(ne(n.BLEND),p=!0),B!==kl){if(B!==f||ft!==I){if((E!==xn||b!==xn)&&(n.blendEquation(n.FUNC_ADD),E=xn,b=xn),ft)switch(B){case _n:n.blendFuncSeparate(n.ONE,n.ONE_MINUS_SRC_ALPHA,n.ONE,n.ONE_MINUS_SRC_ALPHA);break;case yi:n.blendFunc(n.ONE,n.ONE);break;case Fa:n.blendFuncSeparate(n.ZERO,n.ONE_MINUS_SRC_COLOR,n.ZERO,n.ONE);break;case Oa:n.blendFuncSeparate(n.DST_COLOR,n.ONE_MINUS_SRC_ALPHA,n.ZERO,n.ONE);break;default:et("WebGLState: Invalid blending: ",B);break}else switch(B){case _n:n.blendFuncSeparate(n.SRC_ALPHA,n.ONE_MINUS_SRC_ALPHA,n.ONE,n.ONE_MINUS_SRC_ALPHA);break;case yi:n.blendFuncSeparate(n.SRC_ALPHA,n.ONE,n.ONE,n.ONE);break;case Fa:et("WebGLState: SubtractiveBlending requires material.premultipliedAlpha = true");break;case Oa:et("WebGLState: MultiplyBlending requires material.premultipliedAlpha = true");break;default:et("WebGLState: Invalid blending: ",B);break}C=null,y=null,v=null,D=null,S.set(0,0,0),T=0,f=B,I=ft}return}Ce=Ce||xe,ue=ue||re,Ge=Ge||ge,(xe!==E||Ce!==b)&&(n.blendEquationSeparate(Ut[xe],Ut[Ce]),E=xe,b=Ce),(re!==C||ge!==y||ue!==v||Ge!==D)&&(n.blendFuncSeparate(rt[re],rt[ge],rt[ue],rt[Ge]),C=re,y=ge,v=ue,D=Ge),(Ue.equals(S)===!1||Mt!==T)&&(n.blendColor(Ue.r,Ue.g,Ue.b,Mt),S.copy(Ue),T=Mt),f=B,I=!1}function gt(B,xe){B.side===ri?we(n.CULL_FACE):ne(n.CULL_FACE);let re=B.side===wt;xe&&(re=!re),Ve(re),B.blending===_n&&B.transparent===!1?st(vi):st(B.blending,B.blendEquation,B.blendSrc,B.blendDst,B.blendEquationAlpha,B.blendSrcAlpha,B.blendDstAlpha,B.blendColor,B.blendAlpha,B.premultipliedAlpha),s.setFunc(B.depthFunc),s.setTest(B.depthTest),s.setMask(B.depthWrite),o.setMask(B.colorWrite);let ge=B.stencilWrite;a.setTest(ge),ge&&(a.setMask(B.stencilWriteMask),a.setFunc(B.stencilFunc,B.stencilRef,B.stencilFuncMask),a.setOp(B.stencilFail,B.stencilZFail,B.stencilZPass)),si(B.polygonOffset,B.polygonOffsetFactor,B.polygonOffsetUnits),B.alphaToCoverage===!0?ne(n.SAMPLE_ALPHA_TO_COVERAGE):we(n.SAMPLE_ALPHA_TO_COVERAGE)}function Ve(B){G!==B&&(B?n.frontFace(n.CW):n.frontFace(n.CCW),G=B)}function Et(B){B!==Bl?(ne(n.CULL_FACE),B!==z&&(B===Ua?n.cullFace(n.BACK):B===Gl?n.cullFace(n.FRONT):n.cullFace(n.FRONT_AND_BACK))):we(n.CULL_FACE),z=B}function Gt(B){B!==W&&(J&&n.lineWidth(B),W=B)}function si(B,xe,re){B?(ne(n.POLYGON_OFFSET_FILL),(O!==xe||X!==re)&&(O=xe,X=re,s.getReversed()&&(xe=-xe),n.polygonOffset(xe,re))):we(n.POLYGON_OFFSET_FILL)}function At(B){B?ne(n.SCISSOR_TEST):we(n.SCISSOR_TEST)}function It(B){B===void 0&&(B=n.TEXTURE0+Z-1),se!==B&&(n.activeTexture(B),se=B)}function k(B,xe,re){re===void 0&&(se===null?re=n.TEXTURE0+Z-1:re=se);let ge=le[re];ge===void 0&&(ge={type:void 0,texture:void 0},le[re]=ge),(ge.type!==B||ge.texture!==xe)&&(se!==re&&(n.activeTexture(re),se=re),n.bindTexture(B,xe||te[B]),ge.type=B,ge.texture=xe)}function Kt(){let B=le[se];B!==void 0&&B.type!==void 0&&(n.bindTexture(B.type,null),B.type=void 0,B.texture=void 0)}function _t(){try{n.compressedTexImage2D(...arguments)}catch(B){et("WebGLState:",B)}}function w(){try{n.compressedTexImage3D(...arguments)}catch(B){et("WebGLState:",B)}}function x(){try{n.texSubImage2D(...arguments)}catch(B){et("WebGLState:",B)}}function V(){try{n.texSubImage3D(...arguments)}catch(B){et("WebGLState:",B)}}function q(){try{n.compressedTexSubImage2D(...arguments)}catch(B){et("WebGLState:",B)}}function ee(){try{n.compressedTexSubImage3D(...arguments)}catch(B){et("WebGLState:",B)}}function pe(){try{n.texStorage2D(...arguments)}catch(B){et("WebGLState:",B)}}function ye(){try{n.texStorage3D(...arguments)}catch(B){et("WebGLState:",B)}}function ie(){try{n.texImage2D(...arguments)}catch(B){et("WebGLState:",B)}}function oe(){try{n.texImage3D(...arguments)}catch(B){et("WebGLState:",B)}}function be(B){return d[B]!==void 0?d[B]:n.getParameter(B)}function Fe(B,xe){d[B]!==xe&&(n.pixelStorei(B,xe),d[B]=xe)}function me(B){mt.equals(B)===!1&&(n.scissor(B.x,B.y,B.z,B.w),mt.copy(B))}function Ee(B){it.equals(B)===!1&&(n.viewport(B.x,B.y,B.z,B.w),it.copy(B))}function Be(B,xe){let re=c.get(xe);re===void 0&&(re=new WeakMap,c.set(xe,re));let ge=re.get(B);ge===void 0&&(ge=n.getUniformBlockIndex(xe,B.name),re.set(B,ge))}function He(B,xe){let ge=c.get(xe).get(B);l.get(xe)!==ge&&(n.uniformBlockBinding(xe,ge,B.__bindingPointIndex),l.set(xe,ge))}function Je(){n.disable(n.BLEND),n.disable(n.CULL_FACE),n.disable(n.DEPTH_TEST),n.disable(n.POLYGON_OFFSET_FILL),n.disable(n.SCISSOR_TEST),n.disable(n.STENCIL_TEST),n.disable(n.SAMPLE_ALPHA_TO_COVERAGE),n.blendEquation(n.FUNC_ADD),n.blendFunc(n.ONE,n.ZERO),n.blendFuncSeparate(n.ONE,n.ZERO,n.ONE,n.ZERO),n.blendColor(0,0,0,0),n.colorMask(!0,!0,!0,!0),n.clearColor(0,0,0,0),n.depthMask(!0),n.depthFunc(n.LESS),s.setReversed(!1),n.clearDepth(1),n.stencilMask(4294967295),n.stencilFunc(n.ALWAYS,0,4294967295),n.stencilOp(n.KEEP,n.KEEP,n.KEEP),n.clearStencil(0),n.cullFace(n.BACK),n.frontFace(n.CCW),n.polygonOffset(0,0),n.activeTexture(n.TEXTURE0),n.bindFramebuffer(n.FRAMEBUFFER,null),n.bindFramebuffer(n.DRAW_FRAMEBUFFER,null),n.bindFramebuffer(n.READ_FRAMEBUFFER,null),n.useProgram(null),n.lineWidth(1),n.scissor(0,0,n.canvas.width,n.canvas.height),n.viewport(0,0,n.canvas.width,n.canvas.height),n.pixelStorei(n.PACK_ALIGNMENT,4),n.pixelStorei(n.UNPACK_ALIGNMENT,4),n.pixelStorei(n.UNPACK_FLIP_Y_WEBGL,!1),n.pixelStorei(n.UNPACK_PREMULTIPLY_ALPHA_WEBGL,!1),n.pixelStorei(n.UNPACK_COLORSPACE_CONVERSION_WEBGL,n.BROWSER_DEFAULT_WEBGL),n.pixelStorei(n.PACK_ROW_LENGTH,0),n.pixelStorei(n.PACK_SKIP_PIXELS,0),n.pixelStorei(n.PACK_SKIP_ROWS,0),n.pixelStorei(n.UNPACK_ROW_LENGTH,0),n.pixelStorei(n.UNPACK_IMAGE_HEIGHT,0),n.pixelStorei(n.UNPACK_SKIP_PIXELS,0),n.pixelStorei(n.UNPACK_SKIP_ROWS,0),n.pixelStorei(n.UNPACK_SKIP_IMAGES,0),h={},d={},se=null,le={},u={},m=new WeakMap,_=[],M=null,p=!1,f=null,E=null,C=null,y=null,b=null,v=null,D=null,S=new Le(0,0,0),T=0,I=!1,G=null,z=null,W=null,O=null,X=null,mt.set(0,0,n.canvas.width,n.canvas.height),it.set(0,0,n.canvas.width,n.canvas.height),o.reset(),s.reset(),a.reset()}return{buffers:{color:o,depth:s,stencil:a},enable:ne,disable:we,bindFramebuffer:Xe,drawBuffers:de,useProgram:nt,setBlending:st,setMaterial:gt,setFlipSided:Ve,setCullFace:Et,setLineWidth:Gt,setPolygonOffset:si,setScissorTest:At,activeTexture:It,bindTexture:k,unbindTexture:Kt,compressedTexImage2D:_t,compressedTexImage3D:w,texImage2D:ie,texImage3D:oe,pixelStorei:Fe,getParameter:be,updateUBOMapping:Be,uniformBlockBinding:He,texStorage2D:pe,texStorage3D:ye,texSubImage2D:x,texSubImage3D:V,compressedTexSubImage2D:q,compressedTexSubImage3D:ee,scissor:me,viewport:Ee,reset:Je}}function Id(n,e,t,i,r,o,s){let a=e.has("WEBGL_multisampled_render_to_texture")?e.get("WEBGL_multisampled_render_to_texture"):null,l=typeof navigator>"u"?!1:/OculusBrowser/g.test(navigator.userAgent),c=new Ae,h=new WeakMap,d=new Set,u,m=new WeakMap,_=!1;try{_=typeof OffscreenCanvas<"u"&&new OffscreenCanvas(1,1).getContext("2d")!==null}catch{}function M(w,x){return _?new OffscreenCanvas(w,x):yr("canvas")}function p(w,x,V){let q=1,ee=_t(w);if((ee.width>V||ee.height>V)&&(q=V/Math.max(ee.width,ee.height)),q<1)if(typeof HTMLImageElement<"u"&&w instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&w instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&w instanceof ImageBitmap||typeof VideoFrame<"u"&&w instanceof VideoFrame){let pe=Math.floor(q*ee.width),ye=Math.floor(q*ee.height);u===void 0&&(u=M(pe,ye));let ie=x?M(pe,ye):u;return ie.width=pe,ie.height=ye,ie.getContext("2d").drawImage(w,0,0,pe,ye),Ie("WebGLRenderer: Texture has been resized from ("+ee.width+"x"+ee.height+") to ("+pe+"x"+ye+")."),ie}else return"data"in w&&Ie("WebGLRenderer: Image in DataTexture is too big ("+ee.width+"x"+ee.height+")."),w;return w}function f(w){return w.generateMipmaps}function E(w){n.generateMipmap(w)}function C(w){return w.isWebGLCubeRenderTarget?n.TEXTURE_CUBE_MAP:w.isWebGL3DRenderTarget?n.TEXTURE_3D:w.isWebGLArrayRenderTarget||w.isCompressedArrayTexture?n.TEXTURE_2D_ARRAY:n.TEXTURE_2D}function y(w,x,V,q,ee,pe=!1){if(w!==null){if(n[w]!==void 0)return n[w];Ie("WebGLRenderer: Attempt to use non-existing WebGL internal format '"+w+"'")}let ye;q&&(ye=e.get("EXT_texture_norm16"),ye||Ie("WebGLRenderer: Unable to use normalized textures without EXT_texture_norm16 extension"));let ie=x;if(x===n.RED&&(V===n.FLOAT&&(ie=n.R32F),V===n.HALF_FLOAT&&(ie=n.R16F),V===n.UNSIGNED_BYTE&&(ie=n.R8),V===n.UNSIGNED_SHORT&&ye&&(ie=ye.R16_EXT),V===n.SHORT&&ye&&(ie=ye.R16_SNORM_EXT)),x===n.RED_INTEGER&&(V===n.UNSIGNED_BYTE&&(ie=n.R8UI),V===n.UNSIGNED_SHORT&&(ie=n.R16UI),V===n.UNSIGNED_INT&&(ie=n.R32UI),V===n.BYTE&&(ie=n.R8I),V===n.SHORT&&(ie=n.R16I),V===n.INT&&(ie=n.R32I)),x===n.RG&&(V===n.FLOAT&&(ie=n.RG32F),V===n.HALF_FLOAT&&(ie=n.RG16F),V===n.UNSIGNED_BYTE&&(ie=n.RG8),V===n.UNSIGNED_SHORT&&ye&&(ie=ye.RG16_EXT),V===n.SHORT&&ye&&(ie=ye.RG16_SNORM_EXT)),x===n.RG_INTEGER&&(V===n.UNSIGNED_BYTE&&(ie=n.RG8UI),V===n.UNSIGNED_SHORT&&(ie=n.RG16UI),V===n.UNSIGNED_INT&&(ie=n.RG32UI),V===n.BYTE&&(ie=n.RG8I),V===n.SHORT&&(ie=n.RG16I),V===n.INT&&(ie=n.RG32I)),x===n.RGB_INTEGER&&(V===n.UNSIGNED_BYTE&&(ie=n.RGB8UI),V===n.UNSIGNED_SHORT&&(ie=n.RGB16UI),V===n.UNSIGNED_INT&&(ie=n.RGB32UI),V===n.BYTE&&(ie=n.RGB8I),V===n.SHORT&&(ie=n.RGB16I),V===n.INT&&(ie=n.RGB32I)),x===n.RGBA_INTEGER&&(V===n.UNSIGNED_BYTE&&(ie=n.RGBA8UI),V===n.UNSIGNED_SHORT&&(ie=n.RGBA16UI),V===n.UNSIGNED_INT&&(ie=n.RGBA32UI),V===n.BYTE&&(ie=n.RGBA8I),V===n.SHORT&&(ie=n.RGBA16I),V===n.INT&&(ie=n.RGBA32I)),x===n.RGB&&(V===n.UNSIGNED_SHORT&&ye&&(ie=ye.RGB16_EXT),V===n.SHORT&&ye&&(ie=ye.RGB16_SNORM_EXT),V===n.UNSIGNED_INT_5_9_9_9_REV&&(ie=n.RGB9_E5),V===n.UNSIGNED_INT_10F_11F_11F_REV&&(ie=n.R11F_G11F_B10F)),x===n.RGBA){let oe=pe?Wn:$e.getTransfer(ee);V===n.FLOAT&&(ie=n.RGBA32F),V===n.HALF_FLOAT&&(ie=n.RGBA16F),V===n.UNSIGNED_BYTE&&(ie=oe===lt?n.SRGB8_ALPHA8:n.RGBA8),V===n.UNSIGNED_SHORT&&ye&&(ie=ye.RGBA16_EXT),V===n.SHORT&&ye&&(ie=ye.RGBA16_SNORM_EXT),V===n.UNSIGNED_SHORT_4_4_4_4&&(ie=n.RGBA4),V===n.UNSIGNED_SHORT_5_5_5_1&&(ie=n.RGB5_A1)}return(ie===n.R16F||ie===n.R32F||ie===n.RG16F||ie===n.RG32F||ie===n.RGBA16F||ie===n.RGBA32F)&&e.get("EXT_color_buffer_float"),ie}function b(w,x){let V;return w?x===null||x===$t||x===ji?V=n.DEPTH24_STENCIL8:x===oi?V=n.DEPTH32F_STENCIL8:x===Qi&&(V=n.DEPTH24_STENCIL8,Ie("DepthTexture: 16 bit depth attachment is not supported with stencil. Using 24-bit attachment.")):x===null||x===$t||x===ji?V=n.DEPTH_COMPONENT24:x===oi?V=n.DEPTH_COMPONENT32F:x===Qi&&(V=n.DEPTH_COMPONENT16),V}function v(w,x){return f(w)===!0||w.isFramebufferTexture&&w.minFilter!==Ct&&w.minFilter!==Lt?Math.log2(Math.max(x.width,x.height))+1:w.mipmaps!==void 0&&w.mipmaps.length>0?w.mipmaps.length:w.isCompressedTexture&&Array.isArray(w.image)?x.mipmaps.length:1}function D(w){let x=w.target;x.removeEventListener("dispose",D),T(x),x.isVideoTexture&&h.delete(x),x.isHTMLTexture&&d.delete(x)}function S(w){let x=w.target;x.removeEventListener("dispose",S),G(x)}function T(w){let x=i.get(w);if(x.__webglInit===void 0)return;let V=w.source,q=m.get(V);if(q){let ee=q[x.__cacheKey];ee.usedTimes--,ee.usedTimes===0&&I(w),Object.keys(q).length===0&&m.delete(V)}i.remove(w)}function I(w){let x=i.get(w);n.deleteTexture(x.__webglTexture);let V=w.source,q=m.get(V);delete q[x.__cacheKey],s.memory.textures--}function G(w){let x=i.get(w);if(w.depthTexture&&(w.depthTexture.dispose(),i.remove(w.depthTexture)),w.isWebGLCubeRenderTarget)for(let q=0;q<6;q++){if(Array.isArray(x.__webglFramebuffer[q]))for(let ee=0;ee<x.__webglFramebuffer[q].length;ee++)n.deleteFramebuffer(x.__webglFramebuffer[q][ee]);else n.deleteFramebuffer(x.__webglFramebuffer[q]);x.__webglDepthbuffer&&n.deleteRenderbuffer(x.__webglDepthbuffer[q])}else{if(Array.isArray(x.__webglFramebuffer))for(let q=0;q<x.__webglFramebuffer.length;q++)n.deleteFramebuffer(x.__webglFramebuffer[q]);else n.deleteFramebuffer(x.__webglFramebuffer);if(x.__webglDepthbuffer&&n.deleteRenderbuffer(x.__webglDepthbuffer),x.__webglMultisampledFramebuffer&&n.deleteFramebuffer(x.__webglMultisampledFramebuffer),x.__webglColorRenderbuffer)for(let q=0;q<x.__webglColorRenderbuffer.length;q++)x.__webglColorRenderbuffer[q]&&n.deleteRenderbuffer(x.__webglColorRenderbuffer[q]);x.__webglDepthRenderbuffer&&n.deleteRenderbuffer(x.__webglDepthRenderbuffer)}let V=w.textures;for(let q=0,ee=V.length;q<ee;q++){let pe=i.get(V[q]);pe.__webglTexture&&(n.deleteTexture(pe.__webglTexture),s.memory.textures--),i.remove(V[q])}i.remove(w)}let z=0;function W(){z=0}function O(){return z}function X(w){z=w}function Z(){let w=z;return w>=r.maxTextures&&Ie("WebGLTextures: Trying to use "+(w+1)+" texture units while this GPU supports only "+r.maxTextures),z+=1,w}function J(w){let x=[];return x.push(w.wrapS),x.push(w.wrapT),x.push(w.wrapR||0),x.push(w.magFilter),x.push(w.minFilter),x.push(w.anisotropy),x.push(w.internalFormat),x.push(w.format),x.push(w.type),x.push(w.generateMipmaps),x.push(w.premultiplyAlpha),x.push(w.flipY),x.push(w.unpackAlignment),x.push(w.colorSpace),x.join()}function ae(w,x){let V=i.get(w);if(w.isVideoTexture&&k(w),w.isRenderTargetTexture===!1&&w.isExternalTexture!==!0&&w.version>0&&V.__version!==w.version){let q=w.image;if(q===null)Ie("WebGLRenderer: Texture marked for update but no image data found.");else if(q.complete===!1)Ie("WebGLRenderer: Texture marked for update but image is incomplete");else{we(V,w,x);return}}else w.isExternalTexture&&(V.__webglTexture=w.sourceTexture?w.sourceTexture:null);t.bindTexture(n.TEXTURE_2D,V.__webglTexture,n.TEXTURE0+x)}function Q(w,x){let V=i.get(w);if(w.isRenderTargetTexture===!1&&w.version>0&&V.__version!==w.version){we(V,w,x);return}else w.isExternalTexture&&(V.__webglTexture=w.sourceTexture?w.sourceTexture:null);t.bindTexture(n.TEXTURE_2D_ARRAY,V.__webglTexture,n.TEXTURE0+x)}function se(w,x){let V=i.get(w);if(w.isRenderTargetTexture===!1&&w.version>0&&V.__version!==w.version){we(V,w,x);return}t.bindTexture(n.TEXTURE_3D,V.__webglTexture,n.TEXTURE0+x)}function le(w,x){let V=i.get(w);if(w.isCubeDepthTexture!==!0&&w.version>0&&V.__version!==w.version){Xe(V,w,x);return}t.bindTexture(n.TEXTURE_CUBE_MAP,V.__webglTexture,n.TEXTURE0+x)}let Oe={[vn]:n.REPEAT,[xi]:n.CLAMP_TO_EDGE,[lo]:n.MIRRORED_REPEAT},ve={[Ct]:n.NEAREST,[ac]:n.NEAREST_MIPMAP_NEAREST,[co]:n.NEAREST_MIPMAP_LINEAR,[Lt]:n.LINEAR,[ys]:n.LINEAR_MIPMAP_NEAREST,[Fi]:n.LINEAR_MIPMAP_LINEAR},mt={[fc]:n.NEVER,[gc]:n.ALWAYS,[hc]:n.LESS,[Sr]:n.LEQUAL,[dc]:n.EQUAL,[Mr]:n.GEQUAL,[pc]:n.GREATER,[mc]:n.NOTEQUAL};function it(w,x){if(x.type===oi&&e.has("OES_texture_float_linear")===!1&&(x.magFilter===Lt||x.magFilter===ys||x.magFilter===co||x.magFilter===Fi||x.minFilter===Lt||x.minFilter===ys||x.minFilter===co||x.minFilter===Fi)&&Ie("WebGLRenderer: Unable to use linear filtering with floating point textures. OES_texture_float_linear not supported on this device."),n.texParameteri(w,n.TEXTURE_WRAP_S,Oe[x.wrapS]),n.texParameteri(w,n.TEXTURE_WRAP_T,Oe[x.wrapT]),(w===n.TEXTURE_3D||w===n.TEXTURE_2D_ARRAY)&&n.texParameteri(w,n.TEXTURE_WRAP_R,Oe[x.wrapR]),n.texParameteri(w,n.TEXTURE_MAG_FILTER,ve[x.magFilter]),n.texParameteri(w,n.TEXTURE_MIN_FILTER,ve[x.minFilter]),x.compareFunction&&(n.texParameteri(w,n.TEXTURE_COMPARE_MODE,n.COMPARE_REF_TO_TEXTURE),n.texParameteri(w,n.TEXTURE_COMPARE_FUNC,mt[x.compareFunction])),e.has("EXT_texture_filter_anisotropic")===!0){if(x.magFilter===Ct||x.minFilter!==co&&x.minFilter!==Fi||x.type===oi&&e.has("OES_texture_float_linear")===!1)return;if(x.anisotropy>1||i.get(x).__currentAnisotropy){let V=e.get("EXT_texture_filter_anisotropic");n.texParameterf(w,V.TEXTURE_MAX_ANISOTROPY_EXT,Math.min(x.anisotropy,r.getMaxAnisotropy())),i.get(x).__currentAnisotropy=x.anisotropy}}}function ot(w,x){let V=!1;w.__webglInit===void 0&&(w.__webglInit=!0,x.addEventListener("dispose",D));let q=x.source,ee=m.get(q);ee===void 0&&(ee={},m.set(q,ee));let pe=J(x);if(pe!==w.__cacheKey){ee[pe]===void 0&&(ee[pe]={texture:n.createTexture(),usedTimes:0},s.memory.textures++,V=!0),ee[pe].usedTimes++;let ye=ee[w.__cacheKey];ye!==void 0&&(ee[w.__cacheKey].usedTimes--,ye.usedTimes===0&&I(x)),w.__cacheKey=pe,w.__webglTexture=ee[pe].texture}return V}function te(w,x,V){return Math.floor(Math.floor(w/V)/x)}function ne(w,x,V,q){let pe=w.updateRanges;if(pe.length===0)t.texSubImage2D(n.TEXTURE_2D,0,0,0,x.width,x.height,V,q,x.data);else{pe.sort((Fe,me)=>Fe.start-me.start);let ye=0;for(let Fe=1;Fe<pe.length;Fe++){let me=pe[ye],Ee=pe[Fe],Be=me.start+me.count,He=te(Ee.start,x.width,4),Je=te(me.start,x.width,4);Ee.start<=Be+1&&He===Je&&te(Ee.start+Ee.count-1,x.width,4)===He?me.count=Math.max(me.count,Ee.start+Ee.count-me.start):(++ye,pe[ye]=Ee)}pe.length=ye+1;let ie=t.getParameter(n.UNPACK_ROW_LENGTH),oe=t.getParameter(n.UNPACK_SKIP_PIXELS),be=t.getParameter(n.UNPACK_SKIP_ROWS);t.pixelStorei(n.UNPACK_ROW_LENGTH,x.width);for(let Fe=0,me=pe.length;Fe<me;Fe++){let Ee=pe[Fe],Be=Math.floor(Ee.start/4),He=Math.ceil(Ee.count/4),Je=Be%x.width,B=Math.floor(Be/x.width),xe=He,re=1;t.pixelStorei(n.UNPACK_SKIP_PIXELS,Je),t.pixelStorei(n.UNPACK_SKIP_ROWS,B),t.texSubImage2D(n.TEXTURE_2D,0,Je,B,xe,re,V,q,x.data)}w.clearUpdateRanges(),t.pixelStorei(n.UNPACK_ROW_LENGTH,ie),t.pixelStorei(n.UNPACK_SKIP_PIXELS,oe),t.pixelStorei(n.UNPACK_SKIP_ROWS,be)}}function we(w,x,V){let q=n.TEXTURE_2D;(x.isDataArrayTexture||x.isCompressedArrayTexture)&&(q=n.TEXTURE_2D_ARRAY),x.isData3DTexture&&(q=n.TEXTURE_3D);let ee=ot(w,x),pe=x.source;t.bindTexture(q,w.__webglTexture,n.TEXTURE0+V);let ye=i.get(pe);if(pe.version!==ye.__version||ee===!0){if(t.activeTexture(n.TEXTURE0+V),(typeof ImageBitmap<"u"&&x.image instanceof ImageBitmap)===!1){let re=$e.getPrimaries($e.workingColorSpace),ge=x.colorSpace===Li?null:$e.getPrimaries(x.colorSpace),Ce=x.colorSpace===Li||re===ge?n.NONE:n.BROWSER_DEFAULT_WEBGL;t.pixelStorei(n.UNPACK_FLIP_Y_WEBGL,x.flipY),t.pixelStorei(n.UNPACK_PREMULTIPLY_ALPHA_WEBGL,x.premultiplyAlpha),t.pixelStorei(n.UNPACK_COLORSPACE_CONVERSION_WEBGL,Ce)}t.pixelStorei(n.UNPACK_ALIGNMENT,x.unpackAlignment);let oe=p(x.image,!1,r.maxTextureSize);oe=Kt(x,oe);let be=o.convert(x.format,x.colorSpace),Fe=o.convert(x.type),me=y(x.internalFormat,be,Fe,x.normalized,x.colorSpace,x.isVideoTexture);it(q,x);let Ee,Be=x.mipmaps,He=x.isVideoTexture!==!0,Je=ye.__version===void 0||ee===!0,B=pe.dataReady,xe=v(x,oe);if(x.isDepthTexture)me=b(x.format===Oi,x.type),Je&&(He?t.texStorage2D(n.TEXTURE_2D,1,me,oe.width,oe.height):t.texImage2D(n.TEXTURE_2D,0,me,oe.width,oe.height,0,be,Fe,null));else if(x.isDataTexture)if(Be.length>0){He&&Je&&t.texStorage2D(n.TEXTURE_2D,xe,me,Be[0].width,Be[0].height);for(let re=0,ge=Be.length;re<ge;re++)Ee=Be[re],He?B&&t.texSubImage2D(n.TEXTURE_2D,re,0,0,Ee.width,Ee.height,be,Fe,Ee.data):t.texImage2D(n.TEXTURE_2D,re,me,Ee.width,Ee.height,0,be,Fe,Ee.data);x.generateMipmaps=!1}else He?(Je&&t.texStorage2D(n.TEXTURE_2D,xe,me,oe.width,oe.height),B&&ne(x,oe,be,Fe)):t.texImage2D(n.TEXTURE_2D,0,me,oe.width,oe.height,0,be,Fe,oe.data);else if(x.isCompressedTexture)if(x.isCompressedArrayTexture){He&&Je&&t.texStorage3D(n.TEXTURE_2D_ARRAY,xe,me,Be[0].width,Be[0].height,oe.depth);for(let re=0,ge=Be.length;re<ge;re++)if(Ee=Be[re],x.format!==jt)if(be!==null)if(He){if(B)if(x.layerUpdates.size>0){let Ce=hl(Ee.width,Ee.height,x.format,x.type);for(let ue of x.layerUpdates){let Ge=Ee.data.subarray(ue*Ce/Ee.data.BYTES_PER_ELEMENT,(ue+1)*Ce/Ee.data.BYTES_PER_ELEMENT);t.compressedTexSubImage3D(n.TEXTURE_2D_ARRAY,re,0,0,ue,Ee.width,Ee.height,1,be,Ge)}}else t.compressedTexSubImage3D(n.TEXTURE_2D_ARRAY,re,0,0,0,Ee.width,Ee.height,oe.depth,be,Ee.data)}else t.compressedTexImage3D(n.TEXTURE_2D_ARRAY,re,me,Ee.width,Ee.height,oe.depth,0,Ee.data,0,0);else Ie("WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()");else He?B&&t.texSubImage3D(n.TEXTURE_2D_ARRAY,re,0,0,0,Ee.width,Ee.height,oe.depth,be,Fe,Ee.data):t.texImage3D(n.TEXTURE_2D_ARRAY,re,me,Ee.width,Ee.height,oe.depth,0,be,Fe,Ee.data);x.layerUpdates.size>0&&x.clearLayerUpdates()}else{He&&Je&&t.texStorage2D(n.TEXTURE_2D,xe,me,Be[0].width,Be[0].height);for(let re=0,ge=Be.length;re<ge;re++)Ee=Be[re],x.format!==jt?be!==null?He?B&&t.compressedTexSubImage2D(n.TEXTURE_2D,re,0,0,Ee.width,Ee.height,be,Ee.data):t.compressedTexImage2D(n.TEXTURE_2D,re,me,Ee.width,Ee.height,0,Ee.data):Ie("WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()"):He?B&&t.texSubImage2D(n.TEXTURE_2D,re,0,0,Ee.width,Ee.height,be,Fe,Ee.data):t.texImage2D(n.TEXTURE_2D,re,me,Ee.width,Ee.height,0,be,Fe,Ee.data)}else if(x.isDataArrayTexture)if(He){if(Je&&t.texStorage3D(n.TEXTURE_2D_ARRAY,xe,me,oe.width,oe.height,oe.depth),B)if(x.layerUpdates.size>0){let re=hl(oe.width,oe.height,x.format,x.type);for(let ge of x.layerUpdates){let Ce=oe.data.subarray(ge*re/oe.data.BYTES_PER_ELEMENT,(ge+1)*re/oe.data.BYTES_PER_ELEMENT);t.texSubImage3D(n.TEXTURE_2D_ARRAY,0,0,0,ge,oe.width,oe.height,1,be,Fe,Ce)}x.clearLayerUpdates()}else t.texSubImage3D(n.TEXTURE_2D_ARRAY,0,0,0,0,oe.width,oe.height,oe.depth,be,Fe,oe.data)}else t.texImage3D(n.TEXTURE_2D_ARRAY,0,me,oe.width,oe.height,oe.depth,0,be,Fe,oe.data);else if(x.isData3DTexture)He?(Je&&t.texStorage3D(n.TEXTURE_3D,xe,me,oe.width,oe.height,oe.depth),B&&t.texSubImage3D(n.TEXTURE_3D,0,0,0,0,oe.width,oe.height,oe.depth,be,Fe,oe.data)):t.texImage3D(n.TEXTURE_3D,0,me,oe.width,oe.height,oe.depth,0,be,Fe,oe.data);else if(x.isFramebufferTexture){if(Je)if(He)t.texStorage2D(n.TEXTURE_2D,xe,me,oe.width,oe.height);else{let re=oe.width,ge=oe.height;for(let Ce=0;Ce<xe;Ce++)t.texImage2D(n.TEXTURE_2D,Ce,me,re,ge,0,be,Fe,null),re>>=1,ge>>=1}}else if(x.isHTMLTexture){if("texElementImage2D"in n){let re=n.canvas;if(re.hasAttribute("layoutsubtree")||re.setAttribute("layoutsubtree","true"),oe.parentNode!==re){re.appendChild(oe),d.add(x),re.onpaint=ge=>{let Ce=ge.changedElements;for(let ue of d)Ce.includes(ue.image)&&(ue.needsUpdate=!0)},re.requestPaint();return}if(n.texElementImage2D.length===3)n.texElementImage2D(n.TEXTURE_2D,n.RGBA8,oe);else{let Ce=n.RGBA,ue=n.RGBA,Ge=n.UNSIGNED_BYTE;n.texElementImage2D(n.TEXTURE_2D,0,Ce,ue,Ge,oe)}n.texParameteri(n.TEXTURE_2D,n.TEXTURE_MIN_FILTER,n.LINEAR),n.texParameteri(n.TEXTURE_2D,n.TEXTURE_WRAP_S,n.CLAMP_TO_EDGE),n.texParameteri(n.TEXTURE_2D,n.TEXTURE_WRAP_T,n.CLAMP_TO_EDGE)}}else if(Be.length>0){if(He&&Je){let re=_t(Be[0]);t.texStorage2D(n.TEXTURE_2D,xe,me,re.width,re.height)}for(let re=0,ge=Be.length;re<ge;re++)Ee=Be[re],He?B&&t.texSubImage2D(n.TEXTURE_2D,re,0,0,be,Fe,Ee):t.texImage2D(n.TEXTURE_2D,re,me,be,Fe,Ee);x.generateMipmaps=!1}else if(He){if(Je){let re=_t(oe);t.texStorage2D(n.TEXTURE_2D,xe,me,re.width,re.height)}B&&t.texSubImage2D(n.TEXTURE_2D,0,0,0,be,Fe,oe)}else t.texImage2D(n.TEXTURE_2D,0,me,be,Fe,oe);f(x)&&E(q),ye.__version=pe.version,x.onUpdate&&x.onUpdate(x)}w.__version=x.version}function Xe(w,x,V){if(x.image.length!==6)return;let q=ot(w,x),ee=x.source;t.bindTexture(n.TEXTURE_CUBE_MAP,w.__webglTexture,n.TEXTURE0+V);let pe=i.get(ee);if(ee.version!==pe.__version||q===!0){t.activeTexture(n.TEXTURE0+V);let ye=$e.getPrimaries($e.workingColorSpace),ie=x.colorSpace===Li?null:$e.getPrimaries(x.colorSpace),oe=x.colorSpace===Li||ye===ie?n.NONE:n.BROWSER_DEFAULT_WEBGL;t.pixelStorei(n.UNPACK_FLIP_Y_WEBGL,x.flipY),t.pixelStorei(n.UNPACK_PREMULTIPLY_ALPHA_WEBGL,x.premultiplyAlpha),t.pixelStorei(n.UNPACK_ALIGNMENT,x.unpackAlignment),t.pixelStorei(n.UNPACK_COLORSPACE_CONVERSION_WEBGL,oe);let be=x.isCompressedTexture||x.image[0].isCompressedTexture,Fe=x.image[0]&&x.image[0].isDataTexture,me=[];for(let ue=0;ue<6;ue++)!be&&!Fe?me[ue]=p(x.image[ue],!0,r.maxCubemapSize):me[ue]=Fe?x.image[ue].image:x.image[ue],me[ue]=Kt(x,me[ue]);let Ee=me[0],Be=o.convert(x.format,x.colorSpace),He=o.convert(x.type),Je=y(x.internalFormat,Be,He,x.normalized,x.colorSpace),B=x.isVideoTexture!==!0,xe=pe.__version===void 0||q===!0,re=ee.dataReady,ge=v(x,Ee);it(n.TEXTURE_CUBE_MAP,x);let Ce;if(be){B&&xe&&t.texStorage2D(n.TEXTURE_CUBE_MAP,ge,Je,Ee.width,Ee.height);for(let ue=0;ue<6;ue++){Ce=me[ue].mipmaps;for(let Ge=0;Ge<Ce.length;Ge++){let Ue=Ce[Ge];x.format!==jt?Be!==null?B?re&&t.compressedTexSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+ue,Ge,0,0,Ue.width,Ue.height,Be,Ue.data):t.compressedTexImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+ue,Ge,Je,Ue.width,Ue.height,0,Ue.data):Ie("WebGLRenderer: Attempt to load unsupported compressed texture format in .setTextureCube()"):B?re&&t.texSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+ue,Ge,0,0,Ue.width,Ue.height,Be,He,Ue.data):t.texImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+ue,Ge,Je,Ue.width,Ue.height,0,Be,He,Ue.data)}}}else{if(Ce=x.mipmaps,B&&xe){Ce.length>0&&ge++;let ue=_t(me[0]);t.texStorage2D(n.TEXTURE_CUBE_MAP,ge,Je,ue.width,ue.height)}for(let ue=0;ue<6;ue++)if(Fe){B?re&&t.texSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+ue,0,0,0,me[ue].width,me[ue].height,Be,He,me[ue].data):t.texImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+ue,0,Je,me[ue].width,me[ue].height,0,Be,He,me[ue].data);for(let Ge=0;Ge<Ce.length;Ge++){let Mt=Ce[Ge].image[ue].image;B?re&&t.texSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+ue,Ge+1,0,0,Mt.width,Mt.height,Be,He,Mt.data):t.texImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+ue,Ge+1,Je,Mt.width,Mt.height,0,Be,He,Mt.data)}}else{B?re&&t.texSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+ue,0,0,0,Be,He,me[ue]):t.texImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+ue,0,Je,Be,He,me[ue]);for(let Ge=0;Ge<Ce.length;Ge++){let Ue=Ce[Ge];B?re&&t.texSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+ue,Ge+1,0,0,Be,He,Ue.image[ue]):t.texImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+ue,Ge+1,Je,Be,He,Ue.image[ue])}}}f(x)&&E(n.TEXTURE_CUBE_MAP),pe.__version=ee.version,x.onUpdate&&x.onUpdate(x)}w.__version=x.version}function de(w,x,V,q,ee,pe){let ye=o.convert(V.format,V.colorSpace),ie=o.convert(V.type),oe=y(V.internalFormat,ye,ie,V.normalized,V.colorSpace),be=i.get(x),Fe=i.get(V);if(Fe.__renderTarget=x,!be.__hasExternalTextures){let me=Math.max(1,x.width>>pe),Ee=Math.max(1,x.height>>pe);ee===n.TEXTURE_3D||ee===n.TEXTURE_2D_ARRAY?t.texImage3D(ee,pe,oe,me,Ee,x.depth,0,ye,ie,null):t.texImage2D(ee,pe,oe,me,Ee,0,ye,ie,null)}t.bindFramebuffer(n.FRAMEBUFFER,w),It(x)?a.framebufferTexture2DMultisampleEXT(n.FRAMEBUFFER,q,ee,Fe.__webglTexture,0,At(x)):(ee===n.TEXTURE_2D||ee>=n.TEXTURE_CUBE_MAP_POSITIVE_X&&ee<=n.TEXTURE_CUBE_MAP_NEGATIVE_Z)&&n.framebufferTexture2D(n.FRAMEBUFFER,q,ee,Fe.__webglTexture,pe),t.bindFramebuffer(n.FRAMEBUFFER,null)}function nt(w,x,V){if(n.bindRenderbuffer(n.RENDERBUFFER,w),x.depthBuffer){let q=x.depthTexture,ee=q&&q.isDepthTexture?q.type:null,pe=b(x.stencilBuffer,ee),ye=x.stencilBuffer?n.DEPTH_STENCIL_ATTACHMENT:n.DEPTH_ATTACHMENT;It(x)?a.renderbufferStorageMultisampleEXT(n.RENDERBUFFER,At(x),pe,x.width,x.height):V?n.renderbufferStorageMultisample(n.RENDERBUFFER,At(x),pe,x.width,x.height):n.renderbufferStorage(n.RENDERBUFFER,pe,x.width,x.height),n.framebufferRenderbuffer(n.FRAMEBUFFER,ye,n.RENDERBUFFER,w)}else{let q=x.textures;for(let ee=0;ee<q.length;ee++){let pe=q[ee],ye=o.convert(pe.format,pe.colorSpace),ie=o.convert(pe.type),oe=y(pe.internalFormat,ye,ie,pe.normalized,pe.colorSpace);It(x)?a.renderbufferStorageMultisampleEXT(n.RENDERBUFFER,At(x),oe,x.width,x.height):V?n.renderbufferStorageMultisample(n.RENDERBUFFER,At(x),oe,x.width,x.height):n.renderbufferStorage(n.RENDERBUFFER,oe,x.width,x.height)}}n.bindRenderbuffer(n.RENDERBUFFER,null)}function Ut(w,x,V){let q=x.isWebGLCubeRenderTarget===!0;if(t.bindFramebuffer(n.FRAMEBUFFER,w),!(x.depthTexture&&x.depthTexture.isDepthTexture))throw new Error("THREE.WebGLTextures: renderTarget.depthTexture must be an instance of THREE.DepthTexture.");let ee=i.get(x.depthTexture);if(ee.__renderTarget=x,(!ee.__webglTexture||x.depthTexture.image.width!==x.width||x.depthTexture.image.height!==x.height)&&(x.depthTexture.image.width=x.width,x.depthTexture.image.height=x.height,x.depthTexture.needsUpdate=!0),q){if(ee.__webglInit===void 0&&(ee.__webglInit=!0,x.depthTexture.addEventListener("dispose",D)),ee.__webglTexture===void 0){ee.__webglTexture=n.createTexture(),t.bindTexture(n.TEXTURE_CUBE_MAP,ee.__webglTexture),it(n.TEXTURE_CUBE_MAP,x.depthTexture);let be=o.convert(x.depthTexture.format),Fe=o.convert(x.depthTexture.type),me;x.depthTexture.format===gi?me=n.DEPTH_COMPONENT24:x.depthTexture.format===Oi&&(me=n.DEPTH24_STENCIL8);for(let Ee=0;Ee<6;Ee++)n.texImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+Ee,0,me,x.width,x.height,0,be,Fe,null)}}else ae(x.depthTexture,0);let pe=ee.__webglTexture,ye=At(x),ie=q?n.TEXTURE_CUBE_MAP_POSITIVE_X+V:n.TEXTURE_2D,oe=x.depthTexture.format===Oi?n.DEPTH_STENCIL_ATTACHMENT:n.DEPTH_ATTACHMENT;if(x.depthTexture.format===gi)It(x)?a.framebufferTexture2DMultisampleEXT(n.FRAMEBUFFER,oe,ie,pe,0,ye):n.framebufferTexture2D(n.FRAMEBUFFER,oe,ie,pe,0);else if(x.depthTexture.format===Oi)It(x)?a.framebufferTexture2DMultisampleEXT(n.FRAMEBUFFER,oe,ie,pe,0,ye):n.framebufferTexture2D(n.FRAMEBUFFER,oe,ie,pe,0);else throw new Error("THREE.WebGLTextures: Unknown depthTexture format.")}function rt(w){let x=i.get(w),V=w.isWebGLCubeRenderTarget===!0;if(x.__boundDepthTexture!==w.depthTexture){let q=w.depthTexture;if(x.__depthDisposeCallback&&x.__depthDisposeCallback(),q){let ee=()=>{delete x.__boundDepthTexture,delete x.__depthDisposeCallback,q.removeEventListener("dispose",ee)};q.addEventListener("dispose",ee),x.__depthDisposeCallback=ee}x.__boundDepthTexture=q}if(w.depthTexture&&!x.__autoAllocateDepthBuffer)if(V)for(let q=0;q<6;q++)Ut(x.__webglFramebuffer[q],w,q);else{let q=w.texture.mipmaps;q&&q.length>0?Ut(x.__webglFramebuffer[0],w,0):Ut(x.__webglFramebuffer,w,0)}else if(V){x.__webglDepthbuffer=[];for(let q=0;q<6;q++)if(t.bindFramebuffer(n.FRAMEBUFFER,x.__webglFramebuffer[q]),x.__webglDepthbuffer[q]===void 0)x.__webglDepthbuffer[q]=n.createRenderbuffer(),nt(x.__webglDepthbuffer[q],w,!1);else{let ee=w.stencilBuffer?n.DEPTH_STENCIL_ATTACHMENT:n.DEPTH_ATTACHMENT,pe=x.__webglDepthbuffer[q];n.bindRenderbuffer(n.RENDERBUFFER,pe),n.framebufferRenderbuffer(n.FRAMEBUFFER,ee,n.RENDERBUFFER,pe)}}else{let q=w.texture.mipmaps;if(q&&q.length>0?t.bindFramebuffer(n.FRAMEBUFFER,x.__webglFramebuffer[0]):t.bindFramebuffer(n.FRAMEBUFFER,x.__webglFramebuffer),x.__webglDepthbuffer===void 0)x.__webglDepthbuffer=n.createRenderbuffer(),nt(x.__webglDepthbuffer,w,!1);else{let ee=w.stencilBuffer?n.DEPTH_STENCIL_ATTACHMENT:n.DEPTH_ATTACHMENT,pe=x.__webglDepthbuffer;n.bindRenderbuffer(n.RENDERBUFFER,pe),n.framebufferRenderbuffer(n.FRAMEBUFFER,ee,n.RENDERBUFFER,pe)}}t.bindFramebuffer(n.FRAMEBUFFER,null)}function st(w,x,V){let q=i.get(w);x!==void 0&&de(q.__webglFramebuffer,w,w.texture,n.COLOR_ATTACHMENT0,n.TEXTURE_2D,0),V!==void 0&&rt(w)}function gt(w){let x=w.texture,V=i.get(w),q=i.get(x);w.addEventListener("dispose",S);let ee=w.textures,pe=w.isWebGLCubeRenderTarget===!0,ye=ee.length>1;if(ye||(q.__webglTexture===void 0&&(q.__webglTexture=n.createTexture()),q.__version=x.version,s.memory.textures++),pe){V.__webglFramebuffer=[];for(let ie=0;ie<6;ie++)if(x.mipmaps&&x.mipmaps.length>0){V.__webglFramebuffer[ie]=[];for(let oe=0;oe<x.mipmaps.length;oe++)V.__webglFramebuffer[ie][oe]=n.createFramebuffer()}else V.__webglFramebuffer[ie]=n.createFramebuffer()}else{if(x.mipmaps&&x.mipmaps.length>0){V.__webglFramebuffer=[];for(let ie=0;ie<x.mipmaps.length;ie++)V.__webglFramebuffer[ie]=n.createFramebuffer()}else V.__webglFramebuffer=n.createFramebuffer();if(ye)for(let ie=0,oe=ee.length;ie<oe;ie++){let be=i.get(ee[ie]);be.__webglTexture===void 0&&(be.__webglTexture=n.createTexture(),s.memory.textures++)}if(w.samples>0&&It(w)===!1){V.__webglMultisampledFramebuffer=n.createFramebuffer(),V.__webglColorRenderbuffer=[],t.bindFramebuffer(n.FRAMEBUFFER,V.__webglMultisampledFramebuffer);for(let ie=0;ie<ee.length;ie++){let oe=ee[ie];V.__webglColorRenderbuffer[ie]=n.createRenderbuffer(),n.bindRenderbuffer(n.RENDERBUFFER,V.__webglColorRenderbuffer[ie]);let be=o.convert(oe.format,oe.colorSpace),Fe=o.convert(oe.type),me=y(oe.internalFormat,be,Fe,oe.normalized,oe.colorSpace,w.isXRRenderTarget===!0),Ee=At(w);n.renderbufferStorageMultisample(n.RENDERBUFFER,Ee,me,w.width,w.height),n.framebufferRenderbuffer(n.FRAMEBUFFER,n.COLOR_ATTACHMENT0+ie,n.RENDERBUFFER,V.__webglColorRenderbuffer[ie])}n.bindRenderbuffer(n.RENDERBUFFER,null),w.depthBuffer&&(V.__webglDepthRenderbuffer=n.createRenderbuffer(),nt(V.__webglDepthRenderbuffer,w,!0)),t.bindFramebuffer(n.FRAMEBUFFER,null)}}if(pe){t.bindTexture(n.TEXTURE_CUBE_MAP,q.__webglTexture),it(n.TEXTURE_CUBE_MAP,x);for(let ie=0;ie<6;ie++)if(x.mipmaps&&x.mipmaps.length>0)for(let oe=0;oe<x.mipmaps.length;oe++)de(V.__webglFramebuffer[ie][oe],w,x,n.COLOR_ATTACHMENT0,n.TEXTURE_CUBE_MAP_POSITIVE_X+ie,oe);else de(V.__webglFramebuffer[ie],w,x,n.COLOR_ATTACHMENT0,n.TEXTURE_CUBE_MAP_POSITIVE_X+ie,0);f(x)&&E(n.TEXTURE_CUBE_MAP),t.unbindTexture()}else if(ye){for(let ie=0,oe=ee.length;ie<oe;ie++){let be=ee[ie],Fe=i.get(be),me=n.TEXTURE_2D;(w.isWebGL3DRenderTarget||w.isWebGLArrayRenderTarget)&&(me=w.isWebGL3DRenderTarget?n.TEXTURE_3D:n.TEXTURE_2D_ARRAY),t.bindTexture(me,Fe.__webglTexture),it(me,be),de(V.__webglFramebuffer,w,be,n.COLOR_ATTACHMENT0+ie,me,0),f(be)&&E(me)}t.unbindTexture()}else{let ie=n.TEXTURE_2D;if((w.isWebGL3DRenderTarget||w.isWebGLArrayRenderTarget)&&(ie=w.isWebGL3DRenderTarget?n.TEXTURE_3D:n.TEXTURE_2D_ARRAY),t.bindTexture(ie,q.__webglTexture),it(ie,x),x.mipmaps&&x.mipmaps.length>0)for(let oe=0;oe<x.mipmaps.length;oe++)de(V.__webglFramebuffer[oe],w,x,n.COLOR_ATTACHMENT0,ie,oe);else de(V.__webglFramebuffer,w,x,n.COLOR_ATTACHMENT0,ie,0);f(x)&&E(ie),t.unbindTexture()}w.depthBuffer&&rt(w)}function Ve(w){let x=w.textures;for(let V=0,q=x.length;V<q;V++){let ee=x[V];if(f(ee)){let pe=C(w),ye=i.get(ee).__webglTexture;t.bindTexture(pe,ye),E(pe),t.unbindTexture()}}}let Et=[],Gt=[];function si(w){if(w.samples>0){if(It(w)===!1){let x=w.textures,V=w.width,q=w.height,ee=n.COLOR_BUFFER_BIT,pe=w.stencilBuffer?n.DEPTH_STENCIL_ATTACHMENT:n.DEPTH_ATTACHMENT,ye=i.get(w),ie=x.length>1;if(ie)for(let be=0;be<x.length;be++)t.bindFramebuffer(n.FRAMEBUFFER,ye.__webglMultisampledFramebuffer),n.framebufferRenderbuffer(n.FRAMEBUFFER,n.COLOR_ATTACHMENT0+be,n.RENDERBUFFER,null),t.bindFramebuffer(n.FRAMEBUFFER,ye.__webglFramebuffer),n.framebufferTexture2D(n.DRAW_FRAMEBUFFER,n.COLOR_ATTACHMENT0+be,n.TEXTURE_2D,null,0);t.bindFramebuffer(n.READ_FRAMEBUFFER,ye.__webglMultisampledFramebuffer);let oe=w.texture.mipmaps;oe&&oe.length>0?t.bindFramebuffer(n.DRAW_FRAMEBUFFER,ye.__webglFramebuffer[0]):t.bindFramebuffer(n.DRAW_FRAMEBUFFER,ye.__webglFramebuffer);for(let be=0;be<x.length;be++){if(w.resolveDepthBuffer&&(w.depthBuffer&&(ee|=n.DEPTH_BUFFER_BIT),w.stencilBuffer&&w.resolveStencilBuffer&&(ee|=n.STENCIL_BUFFER_BIT)),ie){n.framebufferRenderbuffer(n.READ_FRAMEBUFFER,n.COLOR_ATTACHMENT0,n.RENDERBUFFER,ye.__webglColorRenderbuffer[be]);let Fe=i.get(x[be]).__webglTexture;n.framebufferTexture2D(n.DRAW_FRAMEBUFFER,n.COLOR_ATTACHMENT0,n.TEXTURE_2D,Fe,0)}n.blitFramebuffer(0,0,V,q,0,0,V,q,ee,n.NEAREST),l===!0&&(Et.length=0,Gt.length=0,Et.push(n.COLOR_ATTACHMENT0+be),w.depthBuffer&&w.storeMultisampledDepthBuffer===!1&&(Et.push(pe),Gt.push(pe),n.invalidateFramebuffer(n.DRAW_FRAMEBUFFER,Gt)),n.invalidateFramebuffer(n.READ_FRAMEBUFFER,Et))}if(t.bindFramebuffer(n.READ_FRAMEBUFFER,null),t.bindFramebuffer(n.DRAW_FRAMEBUFFER,null),ie)for(let be=0;be<x.length;be++){t.bindFramebuffer(n.FRAMEBUFFER,ye.__webglMultisampledFramebuffer),n.framebufferRenderbuffer(n.FRAMEBUFFER,n.COLOR_ATTACHMENT0+be,n.RENDERBUFFER,ye.__webglColorRenderbuffer[be]);let Fe=i.get(x[be]).__webglTexture;t.bindFramebuffer(n.FRAMEBUFFER,ye.__webglFramebuffer),n.framebufferTexture2D(n.DRAW_FRAMEBUFFER,n.COLOR_ATTACHMENT0+be,n.TEXTURE_2D,Fe,0)}t.bindFramebuffer(n.DRAW_FRAMEBUFFER,ye.__webglMultisampledFramebuffer)}else if(w.depthBuffer&&w.storeMultisampledDepthBuffer===!1&&l){let x=w.stencilBuffer?n.DEPTH_STENCIL_ATTACHMENT:n.DEPTH_ATTACHMENT;n.invalidateFramebuffer(n.DRAW_FRAMEBUFFER,[x])}}}function At(w){return Math.min(r.maxSamples,w.samples)}function It(w){let x=i.get(w);return w.samples>0&&e.has("WEBGL_multisampled_render_to_texture")===!0&&x.__useRenderToTexture!==!1}function k(w){let x=s.render.frame;h.get(w)!==x&&(h.set(w,x),w.update())}function Kt(w,x){let V=w.colorSpace,q=w.format,ee=w.type;return w.isCompressedTexture===!0||w.isVideoTexture===!0||V!==Vn&&V!==Li&&($e.getTransfer(V)===lt?(q!==jt||ee!==Ot)&&Ie("WebGLTextures: sRGB encoded textures have to use RGBAFormat and UnsignedByteType."):et("WebGLTextures: Unsupported texture color space:",V)),x}function _t(w){return typeof HTMLImageElement<"u"&&w instanceof HTMLImageElement?(c.width=w.naturalWidth||w.width,c.height=w.naturalHeight||w.height):typeof VideoFrame<"u"&&w instanceof VideoFrame?(c.width=w.displayWidth,c.height=w.displayHeight):(c.width=w.width,c.height=w.height),c}this.allocateTextureUnit=Z,this.resetTextureUnits=W,this.getTextureUnits=O,this.setTextureUnits=X,this.setTexture2D=ae,this.setTexture2DArray=Q,this.setTexture3D=se,this.setTextureCube=le,this.rebindTextures=st,this.setupRenderTarget=gt,this.updateRenderTargetMipmap=Ve,this.updateMultisampleRenderTarget=si,this.setupDepthRenderbuffer=rt,this.setupFrameBufferTexture=de,this.useMultisampledRTT=It,this.isReversedDepthBuffer=function(){return t.buffers.depth.getReversed()}}function Nd(n,e){function t(i,r=Li){let o,s=$e.getTransfer(r);if(i===Ot)return n.UNSIGNED_BYTE;if(i===ur)return n.UNSIGNED_SHORT_4_4_4_4;if(i===fr)return n.UNSIGNED_SHORT_5_5_5_1;if(i===Ts)return n.UNSIGNED_INT_5_9_9_9_REV;if(i===As)return n.UNSIGNED_INT_10F_11F_11F_REV;if(i===bs)return n.BYTE;if(i===Es)return n.SHORT;if(i===Qi)return n.UNSIGNED_SHORT;if(i===cr)return n.INT;if(i===$t)return n.UNSIGNED_INT;if(i===oi)return n.FLOAT;if(i===Qt)return n.HALF_FLOAT;if(i===ws)return n.ALPHA;if(i===Rs)return n.RGB;if(i===jt)return n.RGBA;if(i===gi)return n.DEPTH_COMPONENT;if(i===Oi)return n.DEPTH_STENCIL;if(i===Cs)return n.RED;if(i===hr)return n.RED_INTEGER;if(i===bi)return n.RG;if(i===dr)return n.RG_INTEGER;if(i===pr)return n.RGBA_INTEGER;if(i===mr||i===gr||i===_r||i===xr)if(s===lt)if(o=e.get("WEBGL_compressed_texture_s3tc_srgb"),o!==null){if(i===mr)return o.COMPRESSED_SRGB_S3TC_DXT1_EXT;if(i===gr)return o.COMPRESSED_SRGB_ALPHA_S3TC_DXT1_EXT;if(i===_r)return o.COMPRESSED_SRGB_ALPHA_S3TC_DXT3_EXT;if(i===xr)return o.COMPRESSED_SRGB_ALPHA_S3TC_DXT5_EXT}else return null;else if(o=e.get("WEBGL_compressed_texture_s3tc"),o!==null){if(i===mr)return o.COMPRESSED_RGB_S3TC_DXT1_EXT;if(i===gr)return o.COMPRESSED_RGBA_S3TC_DXT1_EXT;if(i===_r)return o.COMPRESSED_RGBA_S3TC_DXT3_EXT;if(i===xr)return o.COMPRESSED_RGBA_S3TC_DXT5_EXT}else return null;if(i===uo||i===fo||i===ho||i===po)if(o=e.get("WEBGL_compressed_texture_pvrtc"),o!==null){if(i===uo)return o.COMPRESSED_RGB_PVRTC_4BPPV1_IMG;if(i===fo)return o.COMPRESSED_RGB_PVRTC_2BPPV1_IMG;if(i===ho)return o.COMPRESSED_RGBA_PVRTC_4BPPV1_IMG;if(i===po)return o.COMPRESSED_RGBA_PVRTC_2BPPV1_IMG}else return null;if(i===mo||i===go||i===_o||i===xo||i===So||i===kn||i===Mo)if(o=e.get("WEBGL_compressed_texture_etc"),o!==null){if(i===mo||i===go)return s===lt?o.COMPRESSED_SRGB8_ETC2:o.COMPRESSED_RGB8_ETC2;if(i===_o)return s===lt?o.COMPRESSED_SRGB8_ALPHA8_ETC2_EAC:o.COMPRESSED_RGBA8_ETC2_EAC;if(i===xo)return o.COMPRESSED_R11_EAC;if(i===So)return o.COMPRESSED_SIGNED_R11_EAC;if(i===kn)return o.COMPRESSED_RG11_EAC;if(i===Mo)return o.COMPRESSED_SIGNED_RG11_EAC}else return null;if(i===vo||i===yo||i===bo||i===Eo||i===To||i===Ao||i===wo||i===Ro||i===Co||i===Po||i===Lo||i===Do||i===Io||i===No)if(o=e.get("WEBGL_compressed_texture_astc"),o!==null){if(i===vo)return s===lt?o.COMPRESSED_SRGB8_ALPHA8_ASTC_4x4_KHR:o.COMPRESSED_RGBA_ASTC_4x4_KHR;if(i===yo)return s===lt?o.COMPRESSED_SRGB8_ALPHA8_ASTC_5x4_KHR:o.COMPRESSED_RGBA_ASTC_5x4_KHR;if(i===bo)return s===lt?o.COMPRESSED_SRGB8_ALPHA8_ASTC_5x5_KHR:o.COMPRESSED_RGBA_ASTC_5x5_KHR;if(i===Eo)return s===lt?o.COMPRESSED_SRGB8_ALPHA8_ASTC_6x5_KHR:o.COMPRESSED_RGBA_ASTC_6x5_KHR;if(i===To)return s===lt?o.COMPRESSED_SRGB8_ALPHA8_ASTC_6x6_KHR:o.COMPRESSED_RGBA_ASTC_6x6_KHR;if(i===Ao)return s===lt?o.COMPRESSED_SRGB8_ALPHA8_ASTC_8x5_KHR:o.COMPRESSED_RGBA_ASTC_8x5_KHR;if(i===wo)return s===lt?o.COMPRESSED_SRGB8_ALPHA8_ASTC_8x6_KHR:o.COMPRESSED_RGBA_ASTC_8x6_KHR;if(i===Ro)return s===lt?o.COMPRESSED_SRGB8_ALPHA8_ASTC_8x8_KHR:o.COMPRESSED_RGBA_ASTC_8x8_KHR;if(i===Co)return s===lt?o.COMPRESSED_SRGB8_ALPHA8_ASTC_10x5_KHR:o.COMPRESSED_RGBA_ASTC_10x5_KHR;if(i===Po)return s===lt?o.COMPRESSED_SRGB8_ALPHA8_ASTC_10x6_KHR:o.COMPRESSED_RGBA_ASTC_10x6_KHR;if(i===Lo)return s===lt?o.COMPRESSED_SRGB8_ALPHA8_ASTC_10x8_KHR:o.COMPRESSED_RGBA_ASTC_10x8_KHR;if(i===Do)return s===lt?o.COMPRESSED_SRGB8_ALPHA8_ASTC_10x10_KHR:o.COMPRESSED_RGBA_ASTC_10x10_KHR;if(i===Io)return s===lt?o.COMPRESSED_SRGB8_ALPHA8_ASTC_12x10_KHR:o.COMPRESSED_RGBA_ASTC_12x10_KHR;if(i===No)return s===lt?o.COMPRESSED_SRGB8_ALPHA8_ASTC_12x12_KHR:o.COMPRESSED_RGBA_ASTC_12x12_KHR}else return null;if(i===Uo||i===Fo||i===Oo)if(o=e.get("EXT_texture_compression_bptc"),o!==null){if(i===Uo)return s===lt?o.COMPRESSED_SRGB_ALPHA_BPTC_UNORM_EXT:o.COMPRESSED_RGBA_BPTC_UNORM_EXT;if(i===Fo)return o.COMPRESSED_RGB_BPTC_SIGNED_FLOAT_EXT;if(i===Oo)return o.COMPRESSED_RGB_BPTC_UNSIGNED_FLOAT_EXT}else return null;if(i===Bo||i===Go||i===Hn||i===zo)if(o=e.get("EXT_texture_compression_rgtc"),o!==null){if(i===Bo)return o.COMPRESSED_RED_RGTC1_EXT;if(i===Go)return o.COMPRESSED_SIGNED_RED_RGTC1_EXT;if(i===Hn)return o.COMPRESSED_RED_GREEN_RGTC2_EXT;if(i===zo)return o.COMPRESSED_SIGNED_RED_GREEN_RGTC2_EXT}else return null;return i===ji?n.UNSIGNED_INT_24_8:n[i]!==void 0?n[i]:null}return{convert:t}}var Jg=`
void main() {

	gl_Position = vec4( position, 1.0 );

}`,$g=`
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

}`,wa=class{constructor(){this.texture=null,this.mesh=null,this.depthNear=0,this.depthFar=0}init(e,t){if(this.texture===null){let i=new Gr(e.texture);(e.depthNear!==t.depthNear||e.depthFar!==t.depthFar)&&(this.depthNear=e.depthNear,this.depthFar=e.depthFar),this.texture=i}}getMesh(e){if(this.texture!==null&&this.mesh===null){let t=e.cameras[0].viewport,i=new ni({vertexShader:Jg,fragmentShader:$g,uniforms:{depthColor:{value:this.texture},depthWidth:{value:t.z},depthHeight:{value:t.w}}});this.mesh=new _e(new cn(20,20),i)}return this.mesh}reset(){this.texture=null,this.mesh=null}getDepthTexture(){return this.texture}};var Ra=class extends ei{constructor(e,t){super();let i=this,r=null,o=1,s=null,a="local-floor",l=1,c=null,h=null,d=null,u=null,m=null,_=null,M=typeof XRWebGLBinding<"u",p=new wa,f={},E=t.getContextAttributes(),C=null,y=null,b=[],v=[],D=new Ae,S=null,T=null,I=new Nt;I.viewport=new dt;let G=new Nt;G.viewport=new dt;let z=[I,G],W=new Ma,O=null,X=null;this.cameraAutoUpdate=!0,this.enabled=!1,this.isPresenting=!1,this.getController=function(te){let ne=b[te];return ne===void 0&&(ne=new Cr,b[te]=ne),ne.getTargetRaySpace()},this.getControllerGrip=function(te){let ne=b[te];return ne===void 0&&(ne=new Cr,b[te]=ne),ne.getGripSpace()},this.getHand=function(te){let ne=b[te];return ne===void 0&&(ne=new Cr,b[te]=ne),ne.getHandSpace()};function Z(te){let ne=v.indexOf(te.inputSource);if(ne===-1)return;let we=b[ne];we!==void 0&&(we.update(te.inputSource,te.frame,c||s),we.dispatchEvent({type:te.type,data:te.inputSource}))}function J(){r.removeEventListener("select",Z),r.removeEventListener("selectstart",Z),r.removeEventListener("selectend",Z),r.removeEventListener("squeeze",Z),r.removeEventListener("squeezestart",Z),r.removeEventListener("squeezeend",Z),r.removeEventListener("end",J),r.removeEventListener("inputsourceschange",ae);for(let te=0;te<b.length;te++){let ne=v[te];ne!==null&&(v[te]=null,b[te].disconnect(ne))}O=null,X=null,p.reset();for(let te in f)delete f[te];if(e.setRenderTarget(C),m=null,u=null,d=null,r=null,y=null,ot.stop(),i.isPresenting=!1,e.setPixelRatio(S),e.setSize(D.width,D.height,!1),T!==null){let te=T.camera;te.fov=T.fov,te.zoom=T.zoom,te.updateProjectionMatrix(),T=null}i.dispatchEvent({type:"sessionend"})}this.setFramebufferScaleFactor=function(te){o=te,i.isPresenting===!0&&Ie("WebXRManager: Cannot change framebuffer scale while presenting.")},this.setReferenceSpaceType=function(te){a=te,i.isPresenting===!0&&Ie("WebXRManager: Cannot change reference space type while presenting.")},this.getReferenceSpace=function(){return c||s},this.setReferenceSpace=function(te){c=te},this.getBaseLayer=function(){return u!==null?u:m},this.getBinding=function(){return d===null&&M&&(d=new XRWebGLBinding(r,t)),d},this.getFrame=function(){return _},this.getSession=function(){return r},this.setSession=async function(te){if(r=te,r!==null){if(C=e.getRenderTarget(),r.addEventListener("select",Z),r.addEventListener("selectstart",Z),r.addEventListener("selectend",Z),r.addEventListener("squeeze",Z),r.addEventListener("squeezestart",Z),r.addEventListener("squeezeend",Z),r.addEventListener("end",J),r.addEventListener("inputsourceschange",ae),E.xrCompatible!==!0&&await t.makeXRCompatible(),S=e.getPixelRatio(),e.getSize(D),M&&"createProjectionLayer"in XRWebGLBinding.prototype){let we=null,Xe=null,de=null;E.depth&&(de=E.stencil?t.DEPTH24_STENCIL8:t.DEPTH_COMPONENT24,we=E.stencil?Oi:gi,Xe=E.stencil?ji:$t);let nt={colorFormat:t.RGBA8,depthFormat:de,scaleFactor:o};d=this.getBinding(),u=d.createProjectionLayer(nt),r.updateRenderState({layers:[u]}),e.setPixelRatio(1),e.setSize(u.textureWidth,u.textureHeight,!1),y=new Vt(u.textureWidth,u.textureHeight,{format:jt,type:Ot,depthTexture:new Wi(u.textureWidth,u.textureHeight,Xe,void 0,void 0,void 0,void 0,void 0,void 0,we),stencilBuffer:E.stencil,colorSpace:e.outputColorSpace,samples:E.antialias?4:0,resolveDepthBuffer:u.ignoreDepthValues===!1,resolveStencilBuffer:u.ignoreDepthValues===!1,storeMultisampledDepthBuffer:u.ignoreDepthValues===!1,storeMultisampledStencilBuffer:u.ignoreDepthValues===!1})}else{let we={antialias:E.antialias,alpha:!0,depth:E.depth,stencil:E.stencil,framebufferScaleFactor:o};m=new XRWebGLLayer(r,t,we),r.updateRenderState({baseLayer:m}),e.setPixelRatio(1),e.setSize(m.framebufferWidth,m.framebufferHeight,!1),y=new Vt(m.framebufferWidth,m.framebufferHeight,{format:jt,type:Ot,colorSpace:e.outputColorSpace,stencilBuffer:E.stencil,resolveDepthBuffer:m.ignoreDepthValues===!1,resolveStencilBuffer:m.ignoreDepthValues===!1,storeMultisampledDepthBuffer:m.ignoreDepthValues===!1,storeMultisampledStencilBuffer:m.ignoreDepthValues===!1})}y.isXRRenderTarget=!0,this.setFoveation(l),c=null,s=await r.requestReferenceSpace(a),ot.setContext(r),ot.start(),i.isPresenting=!0,i.dispatchEvent({type:"sessionstart"})}},this.getEnvironmentBlendMode=function(){if(r!==null)return r.environmentBlendMode},this.getDepthTexture=function(){return p.getDepthTexture()};function ae(te){for(let ne=0;ne<te.removed.length;ne++){let we=te.removed[ne],Xe=v.indexOf(we);Xe>=0&&(v[Xe]=null,b[Xe].disconnect(we))}for(let ne=0;ne<te.added.length;ne++){let we=te.added[ne],Xe=v.indexOf(we);if(Xe===-1){for(let nt=0;nt<b.length;nt++)if(nt>=v.length){v.push(we),Xe=nt;break}else if(v[nt]===null){v[nt]=we,Xe=nt;break}if(Xe===-1)break}let de=b[Xe];de&&de.connect(we)}}let Q=new U,se=new U;function le(te,ne,we){Q.setFromMatrixPosition(ne.matrixWorld),se.setFromMatrixPosition(we.matrixWorld);let Xe=Q.distanceTo(se),de=ne.projectionMatrix.elements,nt=we.projectionMatrix.elements,Ut=de[14]/(de[10]-1),rt=de[14]/(de[10]+1),st=(de[9]+1)/de[5],gt=(de[9]-1)/de[5],Ve=(de[8]-1)/de[0],Et=(nt[8]+1)/nt[0],Gt=Ut*Ve,si=Ut*Et,At=Xe/(-Ve+Et),It=At*-Ve;if(ne.matrixWorld.decompose(te.position,te.quaternion,te.scale),te.translateX(It),te.translateZ(At),te.matrixWorld.compose(te.position,te.quaternion,te.scale),te.matrixWorldInverse.copy(te.matrixWorld).invert(),de[10]===-1)te.projectionMatrix.copy(ne.projectionMatrix),te.projectionMatrixInverse.copy(ne.projectionMatrixInverse);else{let k=Ut+At,Kt=rt+At,_t=Gt-It,w=si+(Xe-It),x=st*rt/Kt*k,V=gt*rt/Kt*k;te.projectionMatrix.makePerspective(_t,w,x,V,k,Kt),te.projectionMatrixInverse.copy(te.projectionMatrix).invert()}}function Oe(te,ne){ne===null?te.matrixWorld.copy(te.matrix):te.matrixWorld.multiplyMatrices(ne.matrixWorld,te.matrix),te.matrixWorldInverse.copy(te.matrixWorld).invert()}this.updateCamera=function(te){if(r===null)return;let ne=te.near,we=te.far;p.texture!==null&&(p.depthNear>0&&(ne=p.depthNear),p.depthFar>0&&(we=p.depthFar)),W.near=G.near=I.near=ne,W.far=G.far=I.far=we,(O!==W.near||X!==W.far)&&(r.updateRenderState({depthNear:W.near,depthFar:W.far}),O=W.near,X=W.far),W.layers.mask=te.layers.mask|6,I.layers.mask=W.layers.mask&-5,G.layers.mask=W.layers.mask&-3;let Xe=te.parent,de=W.cameras;Oe(W,Xe);for(let nt=0;nt<de.length;nt++)Oe(de[nt],Xe);de.length===2?le(W,I,G):W.projectionMatrix.copy(I.projectionMatrix),T===null&&te.isPerspectiveCamera&&(T={camera:te,fov:te.fov,zoom:te.zoom}),ve(te,W,Xe)};function ve(te,ne,we){we===null?te.matrix.copy(ne.matrixWorld):(te.matrix.copy(we.matrixWorld),te.matrix.invert(),te.matrix.multiply(ne.matrixWorld)),te.matrix.decompose(te.position,te.quaternion,te.scale),te.updateMatrixWorld(!0),te.projectionMatrix.copy(ne.projectionMatrix),te.projectionMatrixInverse.copy(ne.projectionMatrixInverse),te.isPerspectiveCamera&&(te.fov=Xn*2*Math.atan(1/te.projectionMatrix.elements[5]),te.zoom=1)}this.getCamera=function(){return W},this.getFoveation=function(){if(!(u===null&&m===null))return l},this.setFoveation=function(te){l=te,u!==null&&(u.fixedFoveation=te),m!==null&&m.fixedFoveation!==void 0&&(m.fixedFoveation=te)},this.hasDepthSensing=function(){return p.texture!==null},this.getDepthSensingMesh=function(){return p.getMesh(W)},this.getCameraTexture=function(te){return f[te]};let mt=null;function it(te,ne){if(h=ne.getViewerPose(c||s),_=ne,h!==null){let we=h.views;m!==null&&(e.setRenderTargetFramebuffer(y,m.framebuffer),e.setRenderTarget(y));let Xe=!1;we.length!==W.cameras.length&&(W.cameras.length=0,Xe=!0);for(let rt=0;rt<we.length;rt++){let st=we[rt],gt=null;if(m!==null)gt=m.getViewport(st);else{let Et=d.getViewSubImage(u,st);gt=Et.viewport,rt===0&&(e.setRenderTargetTextures(y,Et.colorTexture,Et.depthStencilTexture),e.setRenderTarget(y))}let Ve=z[rt];Ve===void 0&&(Ve=new Nt,Ve.layers.enable(rt),Ve.viewport=new dt,z[rt]=Ve),Ve.matrix.fromArray(st.transform.matrix),Ve.matrix.decompose(Ve.position,Ve.quaternion,Ve.scale),Ve.projectionMatrix.fromArray(st.projectionMatrix),Ve.projectionMatrixInverse.copy(Ve.projectionMatrix).invert(),Ve.viewport.set(gt.x,gt.y,gt.width,gt.height),rt===0&&(W.matrix.copy(Ve.matrix),W.matrix.decompose(W.position,W.quaternion,W.scale)),Xe===!0&&W.cameras.push(Ve)}let de=r.enabledFeatures;if(de&&de.includes("depth-sensing")&&r.depthUsage=="gpu-optimized"&&M){d=i.getBinding();let rt=d.getDepthInformation(we[0]);rt&&rt.isValid&&rt.texture&&p.init(rt,r.renderState)}if(de&&de.includes("camera-access")&&M){e.state.unbindTexture(),d=i.getBinding();for(let rt=0;rt<we.length;rt++){let st=we[rt].camera;if(st){let gt=f[st];gt||(gt=new Gr,f[st]=gt);let Ve=d.getCameraImage(st);gt.sourceTexture=Ve}}}}for(let we=0;we<b.length;we++){let Xe=v[we],de=b[we];Xe!==null&&de!==void 0&&de.update(Xe,ne,c||s)}mt&&mt(te,ne),ne.detectedPlanes&&i.dispatchEvent({type:"planesdetected",data:ne}),_=null}let ot=new va;ot.setAnimationLoop(it),this.setAnimationLoop=function(te){mt=te},this.dispose=function(){}}};var Qg=new Qe,Ud=new ke;Ud.set(-1,0,0,0,1,0,0,0,1);function Fd(n,e){function t(p,f){p.matrixAutoUpdate===!0&&p.updateMatrix(),f.value.copy(p.matrix)}function i(p,f){f.color.getRGB(p.fogColor.value,fa(n)),f.isFog?(p.fogNear.value=f.near,p.fogFar.value=f.far):f.isFogExp2&&(p.fogDensity.value=f.density)}function r(p,f,E,C,y){f.isNodeMaterial?f.uniformsNeedUpdate=!1:f.isMeshBasicMaterial?o(p,f):f.isMeshLambertMaterial?(o(p,f),f.envMap&&(p.envMapIntensity.value=f.envMapIntensity)):f.isMeshToonMaterial?(o(p,f),d(p,f)):f.isMeshPhongMaterial?(o(p,f),h(p,f),f.envMap&&(p.envMapIntensity.value=f.envMapIntensity)):f.isMeshStandardMaterial?(o(p,f),u(p,f),f.isMeshPhysicalMaterial&&m(p,f,y)):f.isMeshMatcapMaterial?(o(p,f),_(p,f)):f.isMeshDepthMaterial?o(p,f):f.isMeshDistanceMaterial?(o(p,f),M(p,f)):f.isMeshNormalMaterial?o(p,f):f.isLineBasicMaterial?(s(p,f),f.isLineDashedMaterial&&a(p,f)):f.isPointsMaterial?l(p,f,E,C):f.isSpriteMaterial?c(p,f):f.isShadowMaterial?(p.color.value.copy(f.color),p.opacity.value=f.opacity):f.isShaderMaterial&&(f.uniformsNeedUpdate=!1)}function o(p,f){p.opacity.value=f.opacity,f.color&&p.diffuse.value.copy(f.color),f.emissive&&p.emissive.value.copy(f.emissive).multiplyScalar(f.emissiveIntensity),f.map&&(p.map.value=f.map,t(f.map,p.mapTransform)),f.alphaMap&&(p.alphaMap.value=f.alphaMap,t(f.alphaMap,p.alphaMapTransform)),f.bumpMap&&(p.bumpMap.value=f.bumpMap,t(f.bumpMap,p.bumpMapTransform),p.bumpScale.value=f.bumpScale,f.side===wt&&(p.bumpScale.value*=-1)),f.normalMap&&(p.normalMap.value=f.normalMap,t(f.normalMap,p.normalMapTransform),p.normalScale.value.copy(f.normalScale),f.side===wt&&p.normalScale.value.negate()),f.displacementMap&&(p.displacementMap.value=f.displacementMap,t(f.displacementMap,p.displacementMapTransform),p.displacementScale.value=f.displacementScale,p.displacementBias.value=f.displacementBias),f.emissiveMap&&(p.emissiveMap.value=f.emissiveMap,t(f.emissiveMap,p.emissiveMapTransform)),f.specularMap&&(p.specularMap.value=f.specularMap,t(f.specularMap,p.specularMapTransform)),f.alphaTest>0&&(p.alphaTest.value=f.alphaTest);let E=e.get(f),C=E.envMap,y=E.envMapRotation;C&&(p.envMap.value=C,p.envMapRotation.value.setFromMatrix4(Qg.makeRotationFromEuler(y)).transpose(),C.isCubeTexture&&C.isRenderTargetTexture===!1&&p.envMapRotation.value.premultiply(Ud),p.reflectivity.value=f.reflectivity,p.ior.value=f.ior,p.refractionRatio.value=f.refractionRatio),f.lightMap&&(p.lightMap.value=f.lightMap,p.lightMapIntensity.value=f.lightMapIntensity,t(f.lightMap,p.lightMapTransform)),f.aoMap&&(p.aoMap.value=f.aoMap,p.aoMapIntensity.value=f.aoMapIntensity,t(f.aoMap,p.aoMapTransform))}function s(p,f){p.diffuse.value.copy(f.color),p.opacity.value=f.opacity,f.map&&(p.map.value=f.map,t(f.map,p.mapTransform))}function a(p,f){p.dashSize.value=f.dashSize,p.totalSize.value=f.dashSize+f.gapSize,p.scale.value=f.scale}function l(p,f,E,C){p.diffuse.value.copy(f.color),p.opacity.value=f.opacity,p.size.value=f.size*E,p.scale.value=C*.5,f.map&&(p.map.value=f.map,t(f.map,p.uvTransform)),f.alphaMap&&(p.alphaMap.value=f.alphaMap,t(f.alphaMap,p.alphaMapTransform)),f.alphaTest>0&&(p.alphaTest.value=f.alphaTest)}function c(p,f){p.diffuse.value.copy(f.color),p.opacity.value=f.opacity,p.rotation.value=f.rotation,f.map&&(p.map.value=f.map,t(f.map,p.mapTransform)),f.alphaMap&&(p.alphaMap.value=f.alphaMap,t(f.alphaMap,p.alphaMapTransform)),f.alphaTest>0&&(p.alphaTest.value=f.alphaTest)}function h(p,f){p.specular.value.copy(f.specular),p.shininess.value=Math.max(f.shininess,1e-4)}function d(p,f){f.gradientMap&&(p.gradientMap.value=f.gradientMap)}function u(p,f){p.metalness.value=f.metalness,f.metalnessMap&&(p.metalnessMap.value=f.metalnessMap,t(f.metalnessMap,p.metalnessMapTransform)),p.roughness.value=f.roughness,f.roughnessMap&&(p.roughnessMap.value=f.roughnessMap,t(f.roughnessMap,p.roughnessMapTransform)),f.envMap&&(p.envMapIntensity.value=f.envMapIntensity)}function m(p,f,E){p.ior.value=f.ior,f.sheen>0&&(p.sheenColor.value.copy(f.sheenColor).multiplyScalar(f.sheen),p.sheenRoughness.value=f.sheenRoughness,f.sheenColorMap&&(p.sheenColorMap.value=f.sheenColorMap,t(f.sheenColorMap,p.sheenColorMapTransform)),f.sheenRoughnessMap&&(p.sheenRoughnessMap.value=f.sheenRoughnessMap,t(f.sheenRoughnessMap,p.sheenRoughnessMapTransform))),f.clearcoat>0&&(p.clearcoat.value=f.clearcoat,p.clearcoatRoughness.value=f.clearcoatRoughness,f.clearcoatMap&&(p.clearcoatMap.value=f.clearcoatMap,t(f.clearcoatMap,p.clearcoatMapTransform)),f.clearcoatRoughnessMap&&(p.clearcoatRoughnessMap.value=f.clearcoatRoughnessMap,t(f.clearcoatRoughnessMap,p.clearcoatRoughnessMapTransform)),f.clearcoatNormalMap&&(p.clearcoatNormalMap.value=f.clearcoatNormalMap,t(f.clearcoatNormalMap,p.clearcoatNormalMapTransform),p.clearcoatNormalScale.value.copy(f.clearcoatNormalScale),f.side===wt&&p.clearcoatNormalScale.value.negate())),f.dispersion>0&&(p.dispersion.value=f.dispersion),f.retroreflectivity>0&&(p.retroreflectivity.value=f.retroreflectivity),f.iridescence>0&&(p.iridescence.value=f.iridescence,p.iridescenceIOR.value=f.iridescenceIOR,p.iridescenceThicknessMinimum.value=f.iridescenceThicknessRange[0],p.iridescenceThicknessMaximum.value=f.iridescenceThicknessRange[1],f.iridescenceMap&&(p.iridescenceMap.value=f.iridescenceMap,t(f.iridescenceMap,p.iridescenceMapTransform)),f.iridescenceThicknessMap&&(p.iridescenceThicknessMap.value=f.iridescenceThicknessMap,t(f.iridescenceThicknessMap,p.iridescenceThicknessMapTransform))),f.transmission>0&&(p.transmission.value=f.transmission,p.transmissionSamplerMap.value=E.texture,p.transmissionSamplerSize.value.set(E.width,E.height),f.transmissionMap&&(p.transmissionMap.value=f.transmissionMap,t(f.transmissionMap,p.transmissionMapTransform)),p.thickness.value=f.thickness,f.thicknessMap&&(p.thicknessMap.value=f.thicknessMap,t(f.thicknessMap,p.thicknessMapTransform)),p.attenuationDistance.value=f.attenuationDistance,p.attenuationColor.value.copy(f.attenuationColor)),f.anisotropy>0&&(p.anisotropyVector.value.set(f.anisotropy*Math.cos(f.anisotropyRotation),f.anisotropy*Math.sin(f.anisotropyRotation)),f.anisotropyMap&&(p.anisotropyMap.value=f.anisotropyMap,t(f.anisotropyMap,p.anisotropyMapTransform))),p.specularIntensity.value=f.specularIntensity,p.specularColor.value.copy(f.specularColor),f.specularColorMap&&(p.specularColorMap.value=f.specularColorMap,t(f.specularColorMap,p.specularColorMapTransform)),f.specularIntensityMap&&(p.specularIntensityMap.value=f.specularIntensityMap,t(f.specularIntensityMap,p.specularIntensityMapTransform))}function _(p,f){f.matcap&&(p.matcap.value=f.matcap)}function M(p,f){let E=e.get(f).light;p.referencePosition.value.setFromMatrixPosition(E.matrixWorld),p.nearDistance.value=E.shadow.camera.near,p.farDistance.value=E.shadow.camera.far}return{refreshFogUniforms:i,refreshMaterialUniforms:r}}function Od(n,e,t,i){let r={},o={},s=[],a=n.getParameter(n.MAX_UNIFORM_BUFFER_BINDINGS);function l(y,b){let v=b.program;i.uniformBlockBinding(y,v)}function c(y,b){let v=r[y.id];v===void 0&&(p(y),v=h(y),r[y.id]=v,y.addEventListener("dispose",E));let D=b.program;i.updateUBOMapping(y,D);let S=e.render.frame;o[y.id]!==S&&(u(y),o[y.id]=S)}function h(y){let b=d();y.__bindingPointIndex=b;let v=n.createBuffer(),D=y.__size,S=y.usage;return n.bindBuffer(n.UNIFORM_BUFFER,v),n.bufferData(n.UNIFORM_BUFFER,D,S),n.bindBuffer(n.UNIFORM_BUFFER,null),n.bindBufferBase(n.UNIFORM_BUFFER,b,v),v}function d(){for(let y=0;y<a;y++)if(s.indexOf(y)===-1)return s.push(y),y;return et("WebGLRenderer: Maximum number of simultaneously usable uniforms groups reached."),0}function u(y){let b=r[y.id],v=y.uniforms,D=y.__cache;n.bindBuffer(n.UNIFORM_BUFFER,b);for(let S=0,T=v.length;S<T;S++){let I=v[S];if(Array.isArray(I))for(let G=0,z=I.length;G<z;G++)m(I[G],S,G,D);else m(I,S,0,D)}n.bindBuffer(n.UNIFORM_BUFFER,null)}function m(y,b,v,D){if(M(y,b,v,D)===!0){let S=y.__offset,T=y.value;if(Array.isArray(T)){let I=0;for(let G=0;G<T.length;G++){let z=T[G],W=f(z);_(z,y.__data,I),typeof z!="number"&&typeof z!="boolean"&&!z.isMatrix3&&!ArrayBuffer.isView(z)&&(I+=W.storage/Float32Array.BYTES_PER_ELEMENT)}}else _(T,y.__data,0);n.bufferSubData(n.UNIFORM_BUFFER,S,y.__data)}}function _(y,b,v){typeof y=="number"||typeof y=="boolean"?b[0]=y:y.isMatrix3?(b[0]=y.elements[0],b[1]=y.elements[1],b[2]=y.elements[2],b[3]=0,b[4]=y.elements[3],b[5]=y.elements[4],b[6]=y.elements[5],b[7]=0,b[8]=y.elements[6],b[9]=y.elements[7],b[10]=y.elements[8],b[11]=0):ArrayBuffer.isView(y)?b.set(new y.constructor(y.buffer,y.byteOffset,b.length)):y.toArray(b,v)}function M(y,b,v,D){let S=y.value,T=b+"_"+v;if(D[T]===void 0)return typeof S=="number"||typeof S=="boolean"?D[T]=S:ArrayBuffer.isView(S)?D[T]=S.slice():D[T]=S.clone(),!0;{let I=D[T];if(typeof S=="number"||typeof S=="boolean"){if(I!==S)return D[T]=S,!0}else{if(ArrayBuffer.isView(S))return!0;if(I.equals(S)===!1)return I.copy(S),!0}}return!1}function p(y){let b=y.uniforms,v=0,D=16;for(let T=0,I=b.length;T<I;T++){let G=Array.isArray(b[T])?b[T]:[b[T]];for(let z=0,W=G.length;z<W;z++){let O=G[z],X=Array.isArray(O.value)?O.value:[O.value];for(let Z=0,J=X.length;Z<J;Z++){let ae=X[Z],Q=f(ae),se=v%D,le=se%Q.boundary,Oe=se+le;v+=le,Oe!==0&&D-Oe<Q.storage&&(v+=D-Oe),O.__data=new Float32Array(Q.storage/Float32Array.BYTES_PER_ELEMENT),O.__offset=v,v+=Q.storage}}}let S=v%D;return S>0&&(v+=D-S),y.__size=v,y.__cache={},this}function f(y){let b={boundary:0,storage:0};return typeof y=="number"||typeof y=="boolean"?(b.boundary=4,b.storage=4):y.isVector2?(b.boundary=8,b.storage=8):y.isVector3||y.isColor?(b.boundary=16,b.storage=12):y.isVector4?(b.boundary=16,b.storage=16):y.isMatrix3?(b.boundary=48,b.storage=48):y.isMatrix4?(b.boundary=64,b.storage=64):y.isTexture?Ie("WebGLRenderer: Texture samplers can not be part of an uniforms group."):ArrayBuffer.isView(y)?(b.boundary=16,b.storage=y.byteLength):Ie("WebGLRenderer: Unsupported uniform value type.",y),b}function E(y){let b=y.target;b.removeEventListener("dispose",E);let v=s.indexOf(b.__bindingPointIndex);s.splice(v,1),n.deleteBuffer(r[b.id]),delete r[b.id],delete o[b.id]}function C(){for(let y in r)n.deleteBuffer(r[y]);s=[],r={},o={}}return{bind:l,update:c,dispose:C}}var jg=new Uint16Array([12469,15057,12620,14925,13266,14620,13807,14376,14323,13990,14545,13625,14713,13328,14840,12882,14931,12528,14996,12233,15039,11829,15066,11525,15080,11295,15085,10976,15082,10705,15073,10495,13880,14564,13898,14542,13977,14430,14158,14124,14393,13732,14556,13410,14702,12996,14814,12596,14891,12291,14937,11834,14957,11489,14958,11194,14943,10803,14921,10506,14893,10278,14858,9960,14484,14039,14487,14025,14499,13941,14524,13740,14574,13468,14654,13106,14743,12678,14818,12344,14867,11893,14889,11509,14893,11180,14881,10751,14852,10428,14812,10128,14765,9754,14712,9466,14764,13480,14764,13475,14766,13440,14766,13347,14769,13070,14786,12713,14816,12387,14844,11957,14860,11549,14868,11215,14855,10751,14825,10403,14782,10044,14729,9651,14666,9352,14599,9029,14967,12835,14966,12831,14963,12804,14954,12723,14936,12564,14917,12347,14900,11958,14886,11569,14878,11247,14859,10765,14828,10401,14784,10011,14727,9600,14660,9289,14586,8893,14508,8533,15111,12234,15110,12234,15104,12216,15092,12156,15067,12010,15028,11776,14981,11500,14942,11205,14902,10752,14861,10393,14812,9991,14752,9570,14682,9252,14603,8808,14519,8445,14431,8145,15209,11449,15208,11451,15202,11451,15190,11438,15163,11384,15117,11274,15055,10979,14994,10648,14932,10343,14871,9936,14803,9532,14729,9218,14645,8742,14556,8381,14461,8020,14365,7603,15273,10603,15272,10607,15267,10619,15256,10631,15231,10614,15182,10535,15118,10389,15042,10167,14963,9787,14883,9447,14800,9115,14710,8665,14615,8318,14514,7911,14411,7507,14279,7198,15314,9675,15313,9683,15309,9712,15298,9759,15277,9797,15229,9773,15166,9668,15084,9487,14995,9274,14898,8910,14800,8539,14697,8234,14590,7790,14479,7409,14367,7067,14178,6621,15337,8619,15337,8631,15333,8677,15325,8769,15305,8871,15264,8940,15202,8909,15119,8775,15022,8565,14916,8328,14804,8009,14688,7614,14569,7287,14448,6888,14321,6483,14088,6171,15350,7402,15350,7419,15347,7480,15340,7613,15322,7804,15287,7973,15229,8057,15148,8012,15046,7846,14933,7611,14810,7357,14682,7069,14552,6656,14421,6316,14251,5948,14007,5528,15356,5942,15356,5977,15353,6119,15348,6294,15332,6551,15302,6824,15249,7044,15171,7122,15070,7050,14949,6861,14818,6611,14679,6349,14538,6067,14398,5651,14189,5311,13935,4958,15359,4123,15359,4153,15356,4296,15353,4646,15338,5160,15311,5508,15263,5829,15188,6042,15088,6094,14966,6001,14826,5796,14678,5543,14527,5287,14377,4985,14133,4586,13869,4257,15360,1563,15360,1642,15358,2076,15354,2636,15341,3350,15317,4019,15273,4429,15203,4732,15105,4911,14981,4932,14836,4818,14679,4621,14517,4386,14359,4156,14083,3795,13808,3437,15360,122,15360,137,15358,285,15355,636,15344,1274,15322,2177,15281,2765,15215,3223,15120,3451,14995,3569,14846,3567,14681,3466,14511,3305,14344,3121,14037,2800,13753,2467,15360,0,15360,1,15359,21,15355,89,15346,253,15325,479,15287,796,15225,1148,15133,1492,15008,1749,14856,1882,14685,1886,14506,1783,14324,1608,13996,1398,13702,1183]),Zi=null;function Bd(){return Zi===null&&(Zi=new $s(jg,16,16,bi,Qt),Zi.name="DFG_LUT",Zi.minFilter=Lt,Zi.magFilter=Lt,Zi.wrapS=xi,Zi.wrapT=xi,Zi.generateMipmaps=!1,Zi.needsUpdate=!0),Zi}var os=class{constructor(e={}){let{canvas:t=Mc(),context:i=null,depth:r=!0,stencil:o=!1,alpha:s=!1,antialias:a=!1,premultipliedAlpha:l=!0,preserveDrawingBuffer:c=!1,powerPreference:h="default",failIfMajorPerformanceCaveat:d=!1,reversedDepthBuffer:u=!1,outputBufferType:m=Ot}=e;this.isWebGLRenderer=!0;let _;if(i!==null){if(typeof WebGLRenderingContext<"u"&&i instanceof WebGLRenderingContext)throw new Error("THREE.WebGLRenderer: WebGL 1 is not supported since r163.");_=i.getContextAttributes().alpha}else _=s;let M=m,p=new Set([pr,dr,hr]),f=new Set([Ot,$t,Qi,ji,ur,fr]),E=new Uint32Array(4),C=new Int32Array(4),y=new U,b=null,v=null,D=[],S=[],T=null;this.domElement=t,this.debug={checkShaderErrors:!0,diagnostics:{keywords:!1},onShaderError:null},this.autoClear=!0,this.autoClearColor=!0,this.autoClearDepth=!0,this.autoClearStencil=!0,this.sortObjects=!0,this.clippingPlanes=[],this.localClippingEnabled=!1,this.toneMapping=mi,this.toneMappingExposure=1,this.transmissionResolutionScale=1;let I=this,G=!1,z=null,W=null,O=null,X=null;this._outputColorSpace=Ht;let Z=0,J=0,ae=null,Q=-1,se=null,le=new dt,Oe=new dt,ve=null,mt=new Le(0),it=0,ot=t.width,te=t.height,ne=1,we=null,Xe=null,de=new dt(0,0,ot,te),nt=new dt(0,0,ot,te),Ut=!1,rt=new Cn,st=!1,gt=!1,Ve=new Qe,Et=new U,Gt=new dt,si={background:null,fog:null,environment:null,overrideMaterial:null,isScene:!0},At=!1;function It(){return ae===null?ne:1}let k=i;function Kt(g,A){return t.getContext(g,A)}let _t,w,x,V,q,ee,pe,ye,ie,oe,be,Fe,me,Ee,Be,He,Je,B,xe,re,ge,Ce,ue;try{let g={alpha:!0,depth:r,stencil:o,antialias:a,premultipliedAlpha:l,preserveDrawingBuffer:c,powerPreference:h,failIfMajorPerformanceCaveat:d};if("setAttribute"in t&&t.setAttribute("data-engine",`three.js r${"186"}`),t.addEventListener("webglcontextlost",Mt,!1),t.addEventListener("webglcontextrestored",ft,!1),t.addEventListener("webglcontextcreationerror",Zt,!1),k===null){let A="webgl2";if(k=Kt(A,g),k===null)throw Kt(A)?new Error("THREE.WebGLRenderer: Error creating WebGL context with your selected attributes."):new Error("THREE.WebGLRenderer: Error creating WebGL context.")}Ge()}catch(g){throw t.removeEventListener("webglcontextlost",Mt,!1),t.removeEventListener("webglcontextrestored",ft,!1),t.removeEventListener("webglcontextcreationerror",Zt,!1),et("WebGLRenderer: "+g.message),g}function Ge(){_t=new Jh(k),_t.init(),ge=new Nd(k,_t),w=new Vh(k,_t,e,ge),x=new Dd(k,_t),w.reversedDepthBuffer&&u&&x.buffers.depth.setReversed(!0),W=k.createFramebuffer(),O=k.createFramebuffer(),X=k.createFramebuffer(),V=new jh(k),q=new vd,ee=new Id(k,_t,x,q,w,ge,V),pe=new Zh(I),ye=new nu(k),Ce=new kh(k,ye),ie=new $h(k,ye,V,Ce),oe=new td(k,ie,ye,Ce,V),B=new ed(k,w,ee),Be=new Wh(q),be=new Md(I,pe,_t,w,Ce,Be),Fe=new Fd(I,q),me=new Ed,Ee=new wd(_t),Je=new zh(I,pe,x,oe,_,l),He=new Ld(I,oe,w),ue=new Od(k,V,w,x),xe=new Hh(k,_t,V),re=new Qh(k,_t,V),V.programs=be.programs,I.capabilities=w,I.extensions=_t,I.properties=q,I.renderLists=me,I.shadowMap=He,I.state=x,I.info=V}M!==Ot&&(T=new id(M,t.width,t.height,a,r,o));let Ue=new Ra(I,k);this.xr=Ue,this.getContext=function(){return k},this.getContextAttributes=function(){return k.getContextAttributes()},this.forceContextLoss=function(){let g=_t.get("WEBGL_lose_context");g&&g.loseContext()},this.forceContextRestore=function(){let g=_t.get("WEBGL_lose_context");g&&g.restoreContext()},this.getPixelRatio=function(){return ne},this.setPixelRatio=function(g){g!==void 0&&(ne=g,this.setSize(ot,te,!1))},this.getSize=function(g){return g.set(ot,te)},this.setSize=function(g,A,R=!0){if(Ue.isPresenting){Ie("WebGLRenderer: Can't change size while VR device is presenting.");return}ot=g,te=A,t.width=Math.floor(g*ne),t.height=Math.floor(A*ne),R===!0&&(t.style.width=g+"px",t.style.height=A+"px"),T!==null&&T.setSize(t.width,t.height),this.setViewport(0,0,g,A)},this.getDrawingBufferSize=function(g){return g.set(ot*ne,te*ne).floor()},this.setDrawingBufferSize=function(g,A,R){ot=g,te=A,ne=R,t.width=Math.floor(g*R),t.height=Math.floor(A*R),this.setViewport(0,0,g,A)},this.setEffects=function(g){if(M===Ot){et("WebGLRenderer: setEffects() requires outputBufferType set to HalfFloatType or FloatType.");return}if(g){for(let A=0;A<g.length;A++)if(g[A].isOutputPass===!0){Ie("WebGLRenderer: OutputPass is not needed in setEffects(). Tone mapping and color space conversion are applied automatically.");break}}T.setEffects(g||[])},this.getCurrentViewport=function(g){return g.copy(le)},this.getViewport=function(g){return g.copy(de)},this.setViewport=function(g,A,R,L){g.isVector4?de.set(g.x,g.y,g.z,g.w):de.set(g,A,R,L),x.viewport(le.copy(de).multiplyScalar(ne).round())},this.getScissor=function(g){return g.copy(nt)},this.setScissor=function(g,A,R,L){g.isVector4?nt.set(g.x,g.y,g.z,g.w):nt.set(g,A,R,L),x.scissor(Oe.copy(nt).multiplyScalar(ne).round())},this.getScissorTest=function(){return Ut},this.setScissorTest=function(g){x.setScissorTest(Ut=g)},this.setOpaqueSort=function(g){we=g},this.setTransparentSort=function(g){Xe=g},this.getClearColor=function(g){return g.copy(Je.getClearColor())},this.setClearColor=function(){Je.setClearColor(...arguments)},this.getClearAlpha=function(){return Je.getClearAlpha()},this.setClearAlpha=function(){Je.setClearAlpha(...arguments)},this.clear=function(g=!0,A=!0,R=!0){let L=0;if(g){let F=!1;if(ae!==null){let ce=ae.texture.format;F=p.has(ce)}if(F){let ce=ae.texture.type,he=f.has(ce),$=Je.getClearColor(),fe=Je.getClearAlpha(),Re=$.r,Ke=$.g,Ye=$.b;he?(E[0]=Re,E[1]=Ke,E[2]=Ye,E[3]=fe,k.clearBufferuiv(k.COLOR,0,E)):(C[0]=Re,C[1]=Ke,C[2]=Ye,C[3]=fe,k.clearBufferiv(k.COLOR,0,C))}else L|=k.COLOR_BUFFER_BIT}A&&(L|=k.DEPTH_BUFFER_BIT,this.state.buffers.depth.setMask(!0)),R&&(L|=k.STENCIL_BUFFER_BIT,this.state.buffers.stencil.setMask(4294967295)),L!==0&&k.clear(L)},this.clearColor=function(){this.clear(!0,!1,!1)},this.clearDepth=function(){this.clear(!1,!0,!1)},this.clearStencil=function(){this.clear(!1,!1,!0)},this.setNodesHandler=function(g){g.setRenderer(this),z=g},this.dispose=function(){t.removeEventListener("webglcontextlost",Mt,!1),t.removeEventListener("webglcontextrestored",ft,!1),t.removeEventListener("webglcontextcreationerror",Zt,!1),Je.dispose(),me.dispose(),Ee.dispose(),q.dispose(),pe.dispose(),oe.dispose(),Ce.dispose(),ue.dispose(),be.dispose(),Ue.dispose(),Ue.removeEventListener("sessionstart",eo),Ue.removeEventListener("sessionend",On),Ji.stop()};function Mt(g){g.preventDefault(),za("WebGLRenderer: Context Lost."),G=!0}function ft(){za("WebGLRenderer: Context Restored."),G=!1;let g=V.autoReset,A=He.enabled,R=He.autoUpdate,L=He.needsUpdate,F=He.type;Ge(),V.autoReset=g,He.enabled=A,He.autoUpdate=R,He.needsUpdate=L,He.type=F}function Zt(g){et("WebGLRenderer: A WebGL context could not be created. Reason: ",g.statusMessage)}function Mi(g){let A=g.target;A.removeEventListener("dispose",Mi),ls(A)}function ls(g){cs(g),q.remove(g)}function cs(g){let A=q.get(g).programs;A!==void 0&&(A.forEach(function(R){be.releaseProgram(R)}),g.isShaderMaterial&&be.releaseShaderCache(g))}this.renderBufferDirect=function(g,A,R,L,F,ce){A===null&&(A=si);let he=F.isMesh&&F.matrixWorld.determinantAffine()<0,$=qe(g,A,R,L,F);x.setMaterial(L,he);let fe=R.index,Re=1;if(L.wireframe===!0){if(fe=ie.getWireframeAttribute(R),fe===void 0)return;Re=2}let Ke=R.drawRange,Ye=R.attributes.position,Ne=Ke.start*Re,ht=(Ke.start+Ke.count)*Re;ce!==null&&(Ne=Math.max(Ne,ce.start*Re),ht=Math.min(ht,(ce.start+ce.count)*Re)),fe!==null?(Ne=Math.max(Ne,0),ht=Math.min(ht,fe.count)):Ye!=null&&(Ne=Math.max(Ne,0),ht=Math.min(ht,Ye.count));let Rt=ht-Ne;if(Rt<0||Rt===1/0)return;Ce.setup(F,L,$,R,fe);let yt,St=xe;if(fe!==null&&(yt=ye.get(fe),St=re,St.setIndex(yt)),F.isMesh)L.wireframe===!0?(x.setLineWidth(L.wireframeLinewidth*It()),St.setMode(k.LINES)):St.setMode(k.TRIANGLES);else if(F.isLine){let Jt=L.linewidth;Jt===void 0&&(Jt=1),x.setLineWidth(Jt*It()),F.isLineSegments?St.setMode(k.LINES):F.isLineLoop?St.setMode(k.LINE_LOOP):St.setMode(k.LINE_STRIP)}else F.isPoints?St.setMode(k.POINTS):F.isSprite&&St.setMode(k.TRIANGLES);if(F.isBatchedMesh)if(_t.get("WEBGL_multi_draw"))St.renderMultiDraw(F._multiDrawStarts,F._multiDrawCounts,F._multiDrawCount);else{let Jt=F._multiDrawStarts,Pe=F._multiDrawCounts,kt=F._multiDrawCount,ct=fe?ye.get(fe).bytesPerElement:1,Ri=q.get(L).currentProgram.getUniforms();for(let Xi=0;Xi<kt;Xi++)Ri.setValue(k,"_gl_DrawID",Xi),St.render(Jt[Xi]/ct,Pe[Xi])}else if(F.isInstancedMesh)St.renderInstances(Ne,Rt,F.count);else if(R.isInstancedBufferGeometry){let Jt=R._maxInstanceCount!==void 0?R._maxInstanceCount:1/0,Pe=Math.min(R.instanceCount,Jt);St.renderInstances(Ne,Rt,Pe)}else St.render(Ne,Rt)};function Fn(g,A,R,L){z!==null&&g.isNodeMaterial&&z.setObject(L,g),st===!0&&Be.setState(g,R,!1),g.transparent===!0&&g.side===ri&&g.forceSinglePass===!1?(g.side=wt,g.needsUpdate=!0,j(g,A,L),g.side=Ci,g.needsUpdate=!0,j(g,A,L),g.side=ri):j(g,A,L)}this.compile=function(g,A,R=null){R===null&&(R=g),z!==null&&z.renderStart(g,A,R),v=Ee.get(R),v.init(A),S.push(v),R.traverseVisible(function(F){F.isLight&&F.layers.test(A.layers)&&(v.pushLight(F),F.castShadow&&v.pushShadow(F))}),g!==R&&g.traverseVisible(function(F){F.isLight&&F.layers.test(A.layers)&&(v.pushLight(F),F.castShadow&&v.pushShadow(F))}),v.setupLights(),z!==null&&z.updateLights(v.state.lightsArray),gt=this.localClippingEnabled,st=Be.init(this.clippingPlanes,gt),st===!0&&Be.setGlobalState(this.clippingPlanes,A),z!==null&&He.render(v.state.shadowsArray,R,A);let L=new Set;return g.traverse(function(F){if(!(F.isMesh||F.isPoints||F.isLine||F.isSprite))return;let ce=F.material;if(ce)if(Array.isArray(ce))for(let he=0;he<ce.length;he++){let $=ce[he];Fn($,R,A,F),L.add($)}else Fn(ce,R,A,F),L.add(ce)}),v=S.pop(),z!==null&&z.renderEnd(),L},this.compileAsync=function(g,A,R=null){let L=this.compile(g,A,R);return new Promise(F=>{function ce(){if(L.forEach(function(he){let fe=q.get(he).currentProgram;(fe===void 0||fe.isReady())&&L.delete(he)}),L.size===0){F(g);return}setTimeout(ce,10)}_t.get("KHR_parallel_shader_compile")!==null?ce():setTimeout(ce,10)})};let or=null;function us(g){or&&or(g)}function eo(){Ji.stop()}function On(){Ji.start()}let Ji=new va;Ji.setAnimationLoop(us),typeof self<"u"&&Ji.setContext(self),this.setAnimationLoop=function(g){or=g,Ue.setAnimationLoop(g),g===null?Ji.stop():Ji.start()},Ue.addEventListener("sessionstart",eo),Ue.addEventListener("sessionend",On),this.render=function(g,A){if(A!==void 0&&A.isCamera!==!0){et("WebGLRenderer.render: camera is not an instance of THREE.Camera.");return}if(G===!0)return;z!==null&&z.renderStart(g,A);let R=Ue.enabled===!0&&Ue.isPresenting===!0,L=T!==null&&(ae===null||R)&&T.begin(I,ae);if(g.matrixWorldAutoUpdate===!0&&g.updateMatrixWorld(),A.parent===null&&A.matrixWorldAutoUpdate===!0&&A.updateMatrixWorld(),Ue.enabled===!0&&Ue.isPresenting===!0&&(T===null||T.isCompositing()===!1)&&(Ue.cameraAutoUpdate===!0&&Ue.updateCamera(A),A=Ue.getCamera()),g.isScene===!0&&g.onBeforeRender(I,g,A,ae),v=Ee.get(g,S.length),v.init(A),v.state.textureUnits=ee.getTextureUnits(),S.push(v),Ve.multiplyMatrices(A.projectionMatrix,A.matrixWorldInverse),rt.setFromProjectionMatrix(Ve,_i,A.reversedDepth),gt=this.localClippingEnabled,st=Be.init(this.clippingPlanes,gt),b=me.get(g,D.length),b.init(),D.push(b),Ue.enabled===!0&&Ue.isPresenting===!0){let he=I.xr.getDepthSensingMesh();he!==null&&P(he,A,-1/0,I.sortObjects)}P(g,A,0,I.sortObjects),b.finish(),z!==null&&z.updateLights(v.state.lightsArray),I.sortObjects===!0&&b.sort(we,Xe),At=Ue.enabled===!1||Ue.isPresenting===!1||Ue.hasDepthSensing()===!1,At&&Je.addToRenderList(b,g),this.info.render.frame++,this.info.autoReset===!0&&this.info.reset(),st===!0&&Be.beginShadows();let F=v.state.shadowsArray;if(He.render(F,g,A),st===!0&&Be.endShadows(),(L&&T.hasRenderPass())===!1){let he=b.opaque,$=b.transmissive;if(v.setupLights(),A.isArrayCamera){let fe=A.cameras;if($.length>0)for(let Re=0,Ke=fe.length;Re<Ke;Re++){let Ye=fe[Re];Y(he,$,g,Ye)}At&&Je.render(g);for(let Re=0,Ke=fe.length;Re<Ke;Re++){let Ye=fe[Re];N(b,g,Ye,Ye.viewport)}}else $.length>0&&Y(he,$,g,A),At&&Je.render(g),N(b,g,A)}ae!==null&&J===0&&(ee.updateMultisampleRenderTarget(ae),ee.updateRenderTargetMipmap(ae)),L&&T.end(I),g.isScene===!0&&g.onAfterRender(I,g,A),Ce.resetDefaultState(),Q=-1,se=null,S.pop(),S.length>0?(v=S[S.length-1],ee.setTextureUnits(v.state.textureUnits),st===!0&&Be.setGlobalState(I.clippingPlanes,v.state.camera)):v=null,D.pop(),D.length>0?b=D[D.length-1]:b=null,z!==null&&z.renderEnd()};function P(g,A,R,L){if(g.visible===!1)return;if(g.layers.test(A.layers)){if(g.isGroup)R=g.renderOrder;else if(g.isLOD)g.autoUpdate===!0&&g.update(A);else if(g.isLightProbeGrid)v.pushLightProbeGrid(g);else if(g.isLight)v.pushLight(g),g.castShadow&&v.pushShadow(g);else if(g.isSprite){if(!g.frustumCulled||g.intersectsFrustum(rt)){L&&Gt.setFromMatrixPosition(g.matrixWorld).applyMatrix4(Ve);let he=oe.update(g),$=g.material;$.visible&&b.push(g,he,$,R,Gt.z,null,A)}}else if((g.isMesh||g.isLine||g.isPoints)&&(!g.frustumCulled||g.intersectsFrustum(rt))){let he=oe.update(g),$=g.material;if(L&&(g.boundingSphere!==void 0?(g.boundingSphere===null&&g.computeBoundingSphere(),Gt.copy(g.boundingSphere.center)):(he.boundingSphere===null&&he.computeBoundingSphere(),Gt.copy(he.boundingSphere.center)),Gt.applyMatrix4(g.matrixWorld).applyMatrix4(Ve)),Array.isArray($)){let fe=he.groups;for(let Re=0,Ke=fe.length;Re<Ke;Re++){let Ye=fe[Re],Ne=$[Ye.materialIndex];Ne&&Ne.visible&&b.push(g,he,Ne,R,Gt.z,Ye,A)}}else $.visible&&b.push(g,he,$,R,Gt.z,null,A)}}let ce=g.children;for(let he=0,$=ce.length;he<$;he++)P(ce[he],A,R,L)}function N(g,A,R,L){let{opaque:F,transmissive:ce,transparent:he}=g;v.setupLightsView(R),st===!0&&Be.setGlobalState(I.clippingPlanes,R),L&&x.viewport(le.copy(L)),F.length>0&&K(F,A,R),ce.length>0&&K(ce,A,R),he.length>0&&K(he,A,R),x.buffers.depth.setTest(!0),x.buffers.depth.setMask(!0),x.buffers.color.setMask(!0),x.setPolygonOffset(!1)}function Y(g,A,R,L){if((R.isScene===!0?R.overrideMaterial:null)!==null)return;if(v.state.transmissionRenderTarget[L.id]===void 0){let Ne=_t.has("EXT_color_buffer_half_float")||_t.has("EXT_color_buffer_float");v.state.transmissionRenderTarget[L.id]=new Vt(1,1,{generateMipmaps:!0,type:Ne?Qt:Ot,minFilter:Fi,samples:Math.max(4,w.samples),stencilBuffer:o,resolveDepthBuffer:!1,resolveStencilBuffer:!1,storeMultisampledDepthBuffer:!1,storeMultisampledStencilBuffer:!1,colorSpace:$e.workingColorSpace})}let ce=v.state.transmissionRenderTarget[L.id],he=L.viewport||le;ce.setSize(he.z*I.transmissionResolutionScale,he.w*I.transmissionResolutionScale);let $=I.getRenderTarget(),fe=I.getActiveCubeFace(),Re=I.getActiveMipmapLevel();I.setRenderTarget(ce),I.getClearColor(mt),it=I.getClearAlpha(),it<1&&I.setClearColor(16777215,.5),I.clear(),At&&Je.render(R);let Ke=I.toneMapping;I.toneMapping=mi;let Ye=L.viewport;if(L.viewport!==void 0&&(L.viewport=void 0),v.setupLightsView(L),st===!0&&Be.setGlobalState(I.clippingPlanes,L),K(g,R,L),ee.updateMultisampleRenderTarget(ce),ee.updateRenderTargetMipmap(ce),_t.has("WEBGL_multisampled_render_to_texture")===!1){let Ne=!1;for(let ht=0,Rt=A.length;ht<Rt;ht++){let yt=A[ht],{object:St,geometry:Jt,material:Pe,group:kt}=yt;if(Pe.side===ri&&St.layers.test(L.layers)){let ct=Pe.side;Pe.side=wt,Pe.needsUpdate=!0,H(St,R,L,Jt,Pe,kt),Pe.side=ct,Pe.needsUpdate=!0,Ne=!0}}Ne===!0&&(ee.updateMultisampleRenderTarget(ce),ee.updateRenderTargetMipmap(ce))}I.setRenderTarget($,fe,Re),I.setClearColor(mt,it),Ye!==void 0&&(L.viewport=Ye),I.toneMapping=Ke}function K(g,A,R){let L=A.isScene===!0?A.overrideMaterial:null;for(let F=0,ce=g.length;F<ce;F++){let he=g[F],{object:$,geometry:fe,group:Re}=he,Ke=he.material;Ke.allowOverride===!0&&L!==null&&(Ke=L),$.layers.test(R.layers)&&H($,A,R,fe,Ke,Re)}}function H(g,A,R,L,F,ce){z!==null&&F.isNodeMaterial&&z.setObject(g,F),g.onBeforeRender(I,A,R,L,F,ce),g.modelViewMatrix.multiplyMatrices(R.matrixWorldInverse,g.matrixWorld),g.normalMatrix.getNormalMatrix(g.modelViewMatrix),F.onBeforeRender(I,A,R,L,g,ce),F.transparent===!0&&F.side===ri&&F.forceSinglePass===!1?(F.side=wt,F.needsUpdate=!0,I.renderBufferDirect(R,A,L,F,g,ce),F.side=Ci,F.needsUpdate=!0,I.renderBufferDirect(R,A,L,F,g,ce),F.side=ri):I.renderBufferDirect(R,A,L,F,g,ce),g.onAfterRender(I,A,R,L,F,ce)}function j(g,A,R){A.isScene!==!0&&(A=si);let L=q.get(g),F=v.state.lights,ce=v.state.shadowsArray,he=F.state.version,$=be.getParameters(g,F.state,ce,A,R,v.state.lightProbeGridArray),fe=be.getProgramCacheKey($),Re=L.programs;L.environment=g.isMeshStandardMaterial||g.isMeshLambertMaterial||g.isMeshPhongMaterial?A.environment:null,L.fog=A.fog;let Ke=g.isMeshStandardMaterial||g.isMeshLambertMaterial&&!g.envMap||g.isMeshPhongMaterial&&!g.envMap;L.envMap=pe.get(g.envMap||L.environment,Ke),L.envMapRotation=L.environment!==null&&g.envMap===null?A.environmentRotation:g.envMapRotation,Re===void 0&&(g.addEventListener("dispose",Mi),Re=new Map,L.programs=Re);let Ye=Re.get(fe);if(Ye!==void 0){if(L.currentProgram===Ye&&L.lightsStateVersion===he)return Se(g,$),Ye}else $.uniforms=be.getUniforms(g),z!==null&&g.isNodeMaterial&&z.build(g,R,$),g.onBeforeCompile($,I),Ye=be.acquireProgram($,fe),Re.set(fe,Ye),L.uniforms=$.uniforms;let Ne=L.uniforms;return(!g.isShaderMaterial&&!g.isRawShaderMaterial||g.clipping===!0)&&(Ne.clippingPlanes=Be.uniform),Se(g,$),L.needsLights=je(g),L.lightsStateVersion=he,L.needsLights&&(Ne.ambientLightColor.value=F.state.ambient,Ne.lightProbe.value=F.state.probe,Ne.sunLights.value=F.state.sun,Ne.sunLightShadows.value=F.state.sunShadow,Ne.directionalLights.value=F.state.directional,Ne.directionalLightShadows.value=F.state.directionalShadow,Ne.spotLights.value=F.state.spot,Ne.spotLightShadows.value=F.state.spotShadow,Ne.rectAreaLights.value=F.state.rectArea,Ne.ltc_1.value=F.state.rectAreaLTC1,Ne.ltc_2.value=F.state.rectAreaLTC2,Ne.pointLights.value=F.state.point,Ne.pointLightShadows.value=F.state.pointShadow,Ne.hemisphereLights.value=F.state.hemi,Ne.sunShadowMatrix.value=F.state.sunShadowMatrix,Ne.sunShadowCascade.value=F.state.sunShadowCascade,Ne.directionalShadowMatrix.value=F.state.directionalShadowMatrix,Ne.spotLightMatrix.value=F.state.spotLightMatrix,Ne.spotLightMap.value=F.state.spotLightMap,Ne.pointShadowMatrix.value=F.state.pointShadowMatrix),L.lightProbeGrid=v.state.lightProbeGridArray.length>0,L.currentProgram=Ye,L.uniformsList=null,Ye}function ze(g){if(g.uniformsList===null){let A=g.currentProgram.getUniforms();g.uniformsList=In.seqWithValue(A.seq,g.uniforms)}return g.uniformsList}function Se(g,A){let R=q.get(g);R.outputColorSpace=A.outputColorSpace,R.batching=A.batching,R.batchingColor=A.batchingColor,R.instancing=A.instancing,R.instancingColor=A.instancingColor,R.instancingMorph=A.instancingMorph,R.skinning=A.skinning,R.morphTargets=A.morphTargets,R.morphNormals=A.morphNormals,R.morphColors=A.morphColors,R.morphTargetsCount=A.morphTargetsCount,R.numClippingPlanes=A.numClippingPlanes,R.numIntersection=A.numClipIntersection,R.vertexAlphas=A.vertexAlphas,R.vertexTangents=A.vertexTangents,R.toneMapping=A.toneMapping}function Me(g,A){if(g.length===0)return null;if(g.length===1)return g[0].texture!==null?g[0]:null;y.setFromMatrixPosition(A.matrixWorld);for(let R=0,L=g.length;R<L;R++){let F=g[R];if(F.texture!==null&&F.boundingBox.containsPoint(y))return F}return null}function qe(g,A,R,L,F){A.isScene!==!0&&(A=si),ee.resetTextureUnits();let ce=A.fog,he=L.isMeshStandardMaterial||L.isMeshLambertMaterial||L.isMeshPhongMaterial?A.environment:null,$=ae===null?I.outputColorSpace:ae.isXRRenderTarget===!0?ae.texture.colorSpace:$e.workingColorSpace,fe=L.isMeshStandardMaterial||L.isMeshLambertMaterial&&!L.envMap||L.isMeshPhongMaterial&&!L.envMap,Re=pe.get(L.envMap||he,fe),Ke=L.vertexColors===!0&&!!R.attributes.color&&R.attributes.color.itemSize===4,Ye=!!R.attributes.tangent&&(!!L.normalMap||L.anisotropy>0),Ne=!!R.morphAttributes.position,ht=!!R.morphAttributes.normal,Rt=!!R.morphAttributes.color,yt=mi;L.toneMapped&&(ae===null||ae.isXRRenderTarget===!0)&&(yt=I.toneMapping);let St=R.morphAttributes.position||R.morphAttributes.normal||R.morphAttributes.color,Jt=St!==void 0?St.length:0,Pe=q.get(L),kt=v.state.lights;if(st===!0&&(gt===!0||g!==se)){let Tt=g===se&&L.id===Q;Be.setState(L,g,Tt)}let ct=!1;L.version===Pe.__version?(Pe.needsLights&&Pe.lightsStateVersion!==kt.state.version||Pe.outputColorSpace!==$||F.isBatchedMesh&&Pe.batching===!1||!F.isBatchedMesh&&Pe.batching===!0||F.isBatchedMesh&&Pe.batchingColor===!0&&F._colorsTexture===null||F.isBatchedMesh&&Pe.batchingColor===!1&&F._colorsTexture!==null||F.isInstancedMesh&&Pe.instancing===!1||!F.isInstancedMesh&&Pe.instancing===!0||F.isSkinnedMesh&&Pe.skinning===!1||!F.isSkinnedMesh&&Pe.skinning===!0||F.isInstancedMesh&&Pe.instancingColor===!0&&F.instanceColor===null||F.isInstancedMesh&&Pe.instancingColor===!1&&F.instanceColor!==null||F.isInstancedMesh&&Pe.instancingMorph===!0&&F.morphTexture===null||F.isInstancedMesh&&Pe.instancingMorph===!1&&F.morphTexture!==null||Pe.envMap!==Re||L.fog===!0&&Pe.fog!==ce||Pe.numClippingPlanes!==void 0&&(Pe.numClippingPlanes!==Be.numPlanes||Pe.numIntersection!==Be.numIntersection)||Pe.vertexAlphas!==Ke||Pe.vertexTangents!==Ye||Pe.morphTargets!==Ne||Pe.morphNormals!==ht||Pe.morphColors!==Rt||Pe.toneMapping!==yt||Pe.morphTargetsCount!==Jt||!!Pe.lightProbeGrid!=v.state.lightProbeGridArray.length>0)&&(ct=!0):(ct=!0,Pe.__version=L.version);let Ri=Pe.currentProgram;ct===!0&&(Ri=j(L,A,F),z&&L.isNodeMaterial&&z.onUpdateProgram(L,Ri,Pe));let Xi=!1,dn=!1,sr=!1,bt=Ri.getUniforms(),Ft=Pe.uniforms;if(x.useProgram(Ri.program)&&(Xi=!0,dn=!0,sr=!0),L.id!==Q&&(Q=L.id,dn=!0),Pe.needsLights){let Tt=Me(v.state.lightProbeGridArray,F);Pe.lightProbeGrid!==Tt&&(Pe.lightProbeGrid=Tt,dn=!0)}if(Xi||se!==g){x.buffers.depth.getReversed()&&g.reversedDepth!==!0&&(g._reversedDepth=!0,g.updateProjectionMatrix()),bt.setValue(k,"projectionMatrix",g.projectionMatrix),bt.setValue(k,"viewMatrix",g.matrixWorldInverse);let mn=bt.map.cameraPosition;mn!==void 0&&mn.setValue(k,Et.setFromMatrixPosition(g.matrixWorld)),w.logarithmicDepthBuffer&&bt.setValue(k,"logDepthBufFC",2/(Math.log(g.far+1)/Math.LN2)),(L.isMeshPhongMaterial||L.isMeshToonMaterial||L.isMeshLambertMaterial||L.isMeshBasicMaterial||L.isMeshStandardMaterial||L.isShaderMaterial)&&bt.setValue(k,"isOrthographic",g.isOrthographicCamera===!0),se!==g&&(se=g,dn=!0,sr=!0)}if(Pe.needsLights&&(kt.state.sunShadowMap.length>0&&bt.setValue(k,"sunShadowMap",kt.state.sunShadowMap,ee),kt.state.directionalShadowMap.length>0&&bt.setValue(k,"directionalShadowMap",kt.state.directionalShadowMap,ee),kt.state.spotShadowMap.length>0&&bt.setValue(k,"spotShadowMap",kt.state.spotShadowMap,ee),kt.state.pointShadowMap.length>0&&bt.setValue(k,"pointShadowMap",kt.state.pointShadowMap,ee)),F.isSkinnedMesh){bt.setOptional(k,F,"bindMatrix"),bt.setOptional(k,F,"bindMatrixInverse");let Tt=F.skeleton;Tt&&(Tt.boneTexture===null&&Tt.computeBoneTexture(),bt.setValue(k,"boneTexture",Tt.boneTexture,ee))}F.isBatchedMesh&&(bt.setOptional(k,F,"batchingTexture"),bt.setValue(k,"batchingTexture",F._matricesTexture,ee),bt.setOptional(k,F,"batchingIdTexture"),bt.setValue(k,"batchingIdTexture",F._indirectTexture,ee),bt.setOptional(k,F,"batchingColorTexture"),F._colorsTexture!==null&&bt.setValue(k,"batchingColorTexture",F._colorsTexture,ee));let pn=R.morphAttributes;if((pn.position!==void 0||pn.normal!==void 0||pn.color!==void 0)&&B.update(F,R,Ri),(dn||Pe.receiveShadow!==F.receiveShadow)&&(Pe.receiveShadow=F.receiveShadow,bt.setValue(k,"receiveShadow",F.receiveShadow)),(L.isMeshStandardMaterial||L.isMeshLambertMaterial||L.isMeshPhongMaterial)&&L.envMap===null&&A.environment!==null&&(Ft.envMapIntensity.value=A.environmentIntensity),Ft.dfgLUT!==void 0&&(Ft.dfgLUT.value=Bd()),dn){if(bt.setValue(k,"toneMappingExposure",I.toneMappingExposure),Pe.needsLights&&We(Ft,sr),ce&&L.fog===!0&&Fe.refreshFogUniforms(Ft,ce),Fe.refreshMaterialUniforms(Ft,L,ne,te,v.state.transmissionRenderTarget[g.id]),Pe.needsLights&&Pe.lightProbeGrid){let Tt=Pe.lightProbeGrid;Ft.probesSH.value=Tt.texture,Ft.probesMin.value.copy(Tt.boundingBox.min),Ft.probesMax.value.copy(Tt.boundingBox.max),Ft.probesResolution.value.copy(Tt.resolution)}In.upload(k,ze(Pe),Ft,ee)}if(L.isShaderMaterial&&L.uniformsNeedUpdate===!0&&(In.upload(k,ze(Pe),Ft,ee),L.uniformsNeedUpdate=!1),L.isSpriteMaterial&&bt.setValue(k,"center",F.center),bt.setValue(k,"modelViewMatrix",F.modelViewMatrix),bt.setValue(k,"normalMatrix",F.normalMatrix),bt.setValue(k,"modelMatrix",F.matrixWorld),L.uniformsGroups!==void 0){let Tt=L.uniformsGroups;for(let mn=0,ar=Tt.length;mn<ar;mn++){let Ol=Tt[mn];ue.update(Ol,Ri),ue.bind(Ol,Ri)}}return Ri}function We(g,A){g.ambientLightColor.needsUpdate=A,g.lightProbe.needsUpdate=A,g.sunLights.needsUpdate=A,g.sunLightShadows.needsUpdate=A,g.directionalLights.needsUpdate=A,g.directionalLightShadows.needsUpdate=A,g.pointLights.needsUpdate=A,g.pointLightShadows.needsUpdate=A,g.spotLights.needsUpdate=A,g.spotLightShadows.needsUpdate=A,g.rectAreaLights.needsUpdate=A,g.hemisphereLights.needsUpdate=A}function je(g){return g.isMeshLambertMaterial||g.isMeshToonMaterial||g.isMeshPhongMaterial||g.isMeshStandardMaterial||g.isShadowMaterial||g.isShaderMaterial&&g.lights===!0}this.getActiveCubeFace=function(){return Z},this.getActiveMipmapLevel=function(){return J},this.getRenderTarget=function(){return ae},this.setRenderTargetTextures=function(g,A,R){let L=q.get(g);L.__autoAllocateDepthBuffer=g.resolveDepthBuffer===!1,L.__autoAllocateDepthBuffer===!1&&(L.__useRenderToTexture=!1),q.get(g.texture).__webglTexture=A,q.get(g.depthTexture).__webglTexture=L.__autoAllocateDepthBuffer?void 0:R,L.__hasExternalTextures=!0},this.setRenderTargetFramebuffer=function(g,A){let R=q.get(g);R.__webglFramebuffer=A,R.__useDefaultFramebuffer=A===void 0},this.setRenderTarget=function(g,A=0,R=0){ae=g,Z=A,J=R;let L=null,F=!1,ce=!1;if(g){let $=q.get(g);if($.__useDefaultFramebuffer!==void 0){x.bindFramebuffer(k.FRAMEBUFFER,$.__webglFramebuffer),le.copy(g.viewport),Oe.copy(g.scissor),ve=g.scissorTest,x.viewport(le),x.scissor(Oe),x.setScissorTest(ve),Q=-1;return}else if($.__webglFramebuffer===void 0)ee.setupRenderTarget(g);else if($.__hasExternalTextures)ee.rebindTextures(g,q.get(g.texture).__webglTexture,q.get(g.depthTexture).__webglTexture);else if(g.depthBuffer){let Ke=g.depthTexture;if($.__boundDepthTexture!==Ke){if(Ke!==null&&q.has(Ke)&&(g.width!==Ke.image.width||g.height!==Ke.image.height))throw new Error("THREE.WebGLRenderer: Attached DepthTexture is initialized to the incorrect size.");ee.setupDepthRenderbuffer(g)}}let fe=g.texture;(fe.isData3DTexture||fe.isDataArrayTexture||fe.isCompressedArrayTexture)&&(ce=!0);let Re=q.get(g).__webglFramebuffer;g.isWebGLCubeRenderTarget?(Array.isArray(Re[A])?L=Re[A][R]:L=Re[A],F=!0):g.samples>0&&ee.useMultisampledRTT(g)===!1?L=q.get(g).__webglMultisampledFramebuffer:Array.isArray(Re)?L=Re[R]:L=Re,le.copy(g.viewport),Oe.copy(g.scissor),ve=g.scissorTest}else le.copy(de).multiplyScalar(ne).floor(),Oe.copy(nt).multiplyScalar(ne).floor(),ve=Ut;if(R!==0&&(L=W),x.bindFramebuffer(k.FRAMEBUFFER,L)&&x.drawBuffers(g,L),x.viewport(le),x.scissor(Oe),x.setScissorTest(ve),F){let $=q.get(g.texture);k.framebufferTexture2D(k.FRAMEBUFFER,k.COLOR_ATTACHMENT0,k.TEXTURE_CUBE_MAP_POSITIVE_X+A,$.__webglTexture,R)}else if(ce){let $=A;for(let fe=0;fe<g.textures.length;fe++){let Re=q.get(g.textures[fe]);k.framebufferTextureLayer(k.FRAMEBUFFER,k.COLOR_ATTACHMENT0+fe,Re.__webglTexture,R,$)}}else if(g!==null&&R!==0){let $=q.get(g.texture);k.framebufferTexture2D(k.FRAMEBUFFER,k.COLOR_ATTACHMENT0,k.TEXTURE_2D,$.__webglTexture,R)}Q=-1};function De(g){let A=q.get(g);return(A.__readFormat!==g.format||A.__readType!==g.type)&&(A.__readFormat=g.format,A.__readType=g.type,A.__formatReadable=w.textureFormatReadable(g.format),A.__typeReadable=w.textureTypeReadable(g.type)),A}this.readRenderTargetPixels=function(g,A,R,L,F,ce,he,$=0){if(!(g&&g.isWebGLRenderTarget)){et("WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");return}let fe=q.get(g).__webglFramebuffer;if(g.isWebGLCubeRenderTarget&&he!==void 0&&(fe=fe[he]),fe){x.bindFramebuffer(k.FRAMEBUFFER,fe);try{let Re=g.textures[$],Ke=Re.format,Ye=Re.type;g.textures.length>1&&k.readBuffer(k.COLOR_ATTACHMENT0+$);let Ne=De(Re);if(Ne.__formatReadable===!1){et("WebGLRenderer.readRenderTargetPixels: renderTarget is not in RGBA or implementation defined format.");return}if(Ne.__typeReadable===!1){et("WebGLRenderer.readRenderTargetPixels: renderTarget is not in UnsignedByteType or implementation defined type.");return}A>=0&&A<=g.width-L&&R>=0&&R<=g.height-F&&k.readPixels(A,R,L,F,ge.convert(Ke),ge.convert(Ye),ce)}finally{let Re=ae!==null?q.get(ae).__webglFramebuffer:null;x.bindFramebuffer(k.FRAMEBUFFER,Re)}}},this.readRenderTargetPixelsAsync=async function(g,A,R,L,F,ce,he,$=0){if(!(g&&g.isWebGLRenderTarget))throw new Error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");let fe=q.get(g).__webglFramebuffer;if(g.isWebGLCubeRenderTarget&&he!==void 0&&(fe=fe[he]),fe)if(A>=0&&A<=g.width-L&&R>=0&&R<=g.height-F){x.bindFramebuffer(k.FRAMEBUFFER,fe);let Re=g.textures[$],Ke=Re.format,Ye=Re.type;g.textures.length>1&&k.readBuffer(k.COLOR_ATTACHMENT0+$);let Ne=De(Re);if(Ne.__formatReadable===!1)throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in RGBA or implementation defined format.");if(Ne.__typeReadable===!1)throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in UnsignedByteType or implementation defined type.");let ht=k.createBuffer();k.bindBuffer(k.PIXEL_PACK_BUFFER,ht),k.bufferData(k.PIXEL_PACK_BUFFER,ce.byteLength,k.STREAM_READ),k.readPixels(A,R,L,F,ge.convert(Ke),ge.convert(Ye),0),k.bindBuffer(k.PIXEL_PACK_BUFFER,null);let Rt=ae!==null?q.get(ae).__webglFramebuffer:null;x.bindFramebuffer(k.FRAMEBUFFER,Rt);let yt=k.fenceSync(k.SYNC_GPU_COMMANDS_COMPLETE,0);return k.flush(),await yc(k,yt,4),k.bindBuffer(k.PIXEL_PACK_BUFFER,ht),k.getBufferSubData(k.PIXEL_PACK_BUFFER,0,ce),k.bindBuffer(k.PIXEL_PACK_BUFFER,null),k.deleteBuffer(ht),k.deleteSync(yt),ce}else throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: requested read bounds are out of range.")},this.copyFramebufferToTexture=function(g,A=null,R=0){let L=Math.pow(2,-R),F=Math.floor(g.image.width*L),ce=Math.floor(g.image.height*L),he=A!==null?A.x:0,$=A!==null?A.y:0;ee.setTexture2D(g,0),k.copyTexSubImage2D(k.TEXTURE_2D,R,0,0,he,$,F,ce),x.unbindTexture()},this.copyTextureToTexture=function(g,A,R=null,L=null,F=0,ce=0){let he,$,fe,Re,Ke,Ye,Ne,ht,Rt,yt=g.isCompressedTexture?g.mipmaps[ce]:g.image;if(R!==null)he=R.max.x-R.min.x,$=R.max.y-R.min.y,fe=R.isBox3?R.max.z-R.min.z:1,Re=R.min.x,Ke=R.min.y,Ye=R.isBox3?R.min.z:0;else{let Ft=Math.pow(2,-F);he=Math.floor(yt.width*Ft),$=Math.floor(yt.height*Ft),g.isDataArrayTexture?fe=yt.depth:g.isData3DTexture?fe=Math.floor(yt.depth*Ft):fe=1,Re=0,Ke=0,Ye=0}L!==null?(Ne=L.x,ht=L.y,Rt=L.z):(Ne=0,ht=0,Rt=0);let St=ge.convert(A.format),Jt=ge.convert(A.type),Pe;A.isData3DTexture?(ee.setTexture3D(A,0),Pe=k.TEXTURE_3D):A.isDataArrayTexture||A.isCompressedArrayTexture?(ee.setTexture2DArray(A,0),Pe=k.TEXTURE_2D_ARRAY):(ee.setTexture2D(A,0),Pe=k.TEXTURE_2D),x.activeTexture(k.TEXTURE0),x.pixelStorei(k.UNPACK_FLIP_Y_WEBGL,A.flipY),x.pixelStorei(k.UNPACK_PREMULTIPLY_ALPHA_WEBGL,A.premultiplyAlpha),x.pixelStorei(k.UNPACK_ALIGNMENT,A.unpackAlignment);let kt=x.getParameter(k.UNPACK_ROW_LENGTH),ct=x.getParameter(k.UNPACK_IMAGE_HEIGHT),Ri=x.getParameter(k.UNPACK_SKIP_PIXELS),Xi=x.getParameter(k.UNPACK_SKIP_ROWS),dn=x.getParameter(k.UNPACK_SKIP_IMAGES);x.pixelStorei(k.UNPACK_ROW_LENGTH,yt.width),x.pixelStorei(k.UNPACK_IMAGE_HEIGHT,yt.height),x.pixelStorei(k.UNPACK_SKIP_PIXELS,Re),x.pixelStorei(k.UNPACK_SKIP_ROWS,Ke),x.pixelStorei(k.UNPACK_SKIP_IMAGES,Ye);let sr=g.isDataArrayTexture||g.isData3DTexture,bt=A.isDataArrayTexture||A.isData3DTexture;if(g.isDepthTexture){let Ft=q.get(g),pn=q.get(A),Tt=q.get(Ft.__renderTarget),mn=q.get(pn.__renderTarget);x.bindFramebuffer(k.READ_FRAMEBUFFER,Tt.__webglFramebuffer),x.bindFramebuffer(k.DRAW_FRAMEBUFFER,mn.__webglFramebuffer);for(let ar=0;ar<fe;ar++)sr&&(k.framebufferTextureLayer(k.READ_FRAMEBUFFER,k.COLOR_ATTACHMENT0,q.get(g).__webglTexture,F,Ye+ar),k.framebufferTextureLayer(k.DRAW_FRAMEBUFFER,k.COLOR_ATTACHMENT0,q.get(A).__webglTexture,ce,Rt+ar)),k.blitFramebuffer(Re,Ke,he,$,Ne,ht,he,$,k.DEPTH_BUFFER_BIT,k.NEAREST);x.bindFramebuffer(k.READ_FRAMEBUFFER,null),x.bindFramebuffer(k.DRAW_FRAMEBUFFER,null)}else if(F!==0||g.isRenderTargetTexture||q.has(g)){let Ft=q.get(g),pn=q.get(A);x.bindFramebuffer(k.READ_FRAMEBUFFER,O),x.bindFramebuffer(k.DRAW_FRAMEBUFFER,X);for(let Tt=0;Tt<fe;Tt++)sr?k.framebufferTextureLayer(k.READ_FRAMEBUFFER,k.COLOR_ATTACHMENT0,Ft.__webglTexture,F,Ye+Tt):k.framebufferTexture2D(k.READ_FRAMEBUFFER,k.COLOR_ATTACHMENT0,k.TEXTURE_2D,Ft.__webglTexture,F),bt?k.framebufferTextureLayer(k.DRAW_FRAMEBUFFER,k.COLOR_ATTACHMENT0,pn.__webglTexture,ce,Rt+Tt):k.framebufferTexture2D(k.DRAW_FRAMEBUFFER,k.COLOR_ATTACHMENT0,k.TEXTURE_2D,pn.__webglTexture,ce),F!==0?k.blitFramebuffer(Re,Ke,he,$,Ne,ht,he,$,k.COLOR_BUFFER_BIT,k.NEAREST):bt?k.copyTexSubImage3D(Pe,ce,Ne,ht,Rt+Tt,Re,Ke,he,$):k.copyTexSubImage2D(Pe,ce,Ne,ht,Re,Ke,he,$);x.bindFramebuffer(k.READ_FRAMEBUFFER,null),x.bindFramebuffer(k.DRAW_FRAMEBUFFER,null)}else bt?g.isDataTexture||g.isData3DTexture?k.texSubImage3D(Pe,ce,Ne,ht,Rt,he,$,fe,St,Jt,yt.data):A.isCompressedArrayTexture?k.compressedTexSubImage3D(Pe,ce,Ne,ht,Rt,he,$,fe,St,yt.data):k.texSubImage3D(Pe,ce,Ne,ht,Rt,he,$,fe,St,Jt,yt):g.isDataTexture?k.texSubImage2D(k.TEXTURE_2D,ce,Ne,ht,he,$,St,Jt,yt.data):g.isCompressedTexture?k.compressedTexSubImage2D(k.TEXTURE_2D,ce,Ne,ht,yt.width,yt.height,St,yt.data):k.texSubImage2D(k.TEXTURE_2D,ce,Ne,ht,he,$,St,Jt,yt);x.pixelStorei(k.UNPACK_ROW_LENGTH,kt),x.pixelStorei(k.UNPACK_IMAGE_HEIGHT,ct),x.pixelStorei(k.UNPACK_SKIP_PIXELS,Ri),x.pixelStorei(k.UNPACK_SKIP_ROWS,Xi),x.pixelStorei(k.UNPACK_SKIP_IMAGES,dn),ce===0&&A.generateMipmaps&&k.generateMipmap(Pe),x.unbindTexture()},this.initRenderTarget=function(g){q.get(g).__webglFramebuffer===void 0&&ee.setupRenderTarget(g)},this.initTexture=function(g){g.isCubeTexture?ee.setTextureCube(g,0):g.isData3DTexture?ee.setTexture3D(g,0):g.isDataArrayTexture||g.isCompressedArrayTexture?ee.setTexture2DArray(g,0):ee.setTexture2D(g,0),x.unbindTexture()},this.resetState=function(){Z=0,J=0,ae=null,x.reset(),Ce.reset()},typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}get coordinateSystem(){return _i}get outputColorSpace(){return this._outputColorSpace}set outputColorSpace(e){this._outputColorSpace=e;let t=this.getContext();t.drawingBufferColorSpace=$e._getDrawingBufferColorSpace(e),t.unpackColorSpace=$e._getUnpackColorSpace()}};var Gd={type:"change"},Rl={type:"start"},kd={type:"end"},Ca=new Ai,zd=new hi,e0=Math.cos(70*ka.DEG2RAD),Yt=new U,Si=2*Math.PI,vt={NONE:-1,ROTATE:0,DOLLY:1,PAN:2,TOUCH_ROTATE:3,TOUCH_PAN:4,TOUCH_DOLLY_PAN:5,TOUCH_DOLLY_ROTATE:6},wl=1e-6,Pa=class extends es{constructor(e,t=null){super(e,t),this.state=vt.NONE,this.target=new U,this.cursor=new U,this.minDistance=0,this.maxDistance=1/0,this.minZoom=0,this.maxZoom=1/0,this.minTargetRadius=0,this.maxTargetRadius=1/0,this.minPolarAngle=0,this.maxPolarAngle=Math.PI,this.minAzimuthAngle=-1/0,this.maxAzimuthAngle=1/0,this.enableDamping=!1,this.dampingFactor=.05,this.enableZoom=!0,this.zoomSpeed=1,this.enableRotate=!0,this.rotateSpeed=1,this.keyRotateSpeed=1,this.enablePan=!0,this.panSpeed=1,this.screenSpacePanning=!0,this.keyPanSpeed=7,this.zoomToCursor=!1,this.autoRotate=!1,this.autoRotateSpeed=2,this.keys={LEFT:"ArrowLeft",UP:"ArrowUp",RIGHT:"ArrowRight",BOTTOM:"ArrowDown"},this.mouseButtons={LEFT:Bn.ROTATE,MIDDLE:Bn.DOLLY,RIGHT:Bn.PAN},this.touches={ONE:Gn.ROTATE,TWO:Gn.DOLLY_PAN},this.target0=this.target.clone(),this.position0=this.object.position.clone(),this.zoom0=this.object.zoom,this._cursorStyle="auto",this._domElementKeyEvents=null,this._lastPosition=new U,this._lastQuaternion=new ci,this._lastTargetPosition=new U,this._quat=new ci().setFromUnitVectors(e.up,new U(0,1,0)),this._quatInverse=this._quat.clone().invert(),this._spherical=new Kr,this._sphericalDelta=new Kr,this._scale=1,this._panOffset=new U,this._rotateStart=new Ae,this._rotateEnd=new Ae,this._rotateDelta=new Ae,this._panStart=new Ae,this._panEnd=new Ae,this._panDelta=new Ae,this._dollyStart=new Ae,this._dollyEnd=new Ae,this._dollyDelta=new Ae,this._dollyDirection=new U,this._mouse=new Ae,this._performCursorZoom=!1,this._pointers=[],this._pointerPositions={},this._controlActive=!1,this._onPointerMove=i0.bind(this),this._onPointerDown=t0.bind(this),this._onPointerUp=n0.bind(this),this._onContextMenu=u0.bind(this),this._onMouseWheel=s0.bind(this),this._onKeyDown=a0.bind(this),this._onTouchStart=l0.bind(this),this._onTouchMove=c0.bind(this),this._onMouseDown=r0.bind(this),this._onMouseMove=o0.bind(this),this._interceptControlDown=f0.bind(this),this._interceptControlUp=h0.bind(this),this.domElement!==null&&this.connect(this.domElement),this.update()}set cursorStyle(e){this._cursorStyle=e,e==="grab"?this.domElement.style.cursor="grab":this.domElement.style.cursor="auto"}get cursorStyle(){return this._cursorStyle}connect(e){super.connect(e),this.domElement.addEventListener("pointerdown",this._onPointerDown),this.domElement.addEventListener("pointercancel",this._onPointerUp),this.domElement.addEventListener("contextmenu",this._onContextMenu),this.domElement.addEventListener("wheel",this._onMouseWheel,{passive:!1}),this.domElement.getRootNode().addEventListener("keydown",this._interceptControlDown,{passive:!0,capture:!0}),this.domElement.style.touchAction="none"}disconnect(){this.state=vt.NONE,this.domElement.removeEventListener("pointerdown",this._onPointerDown),this.domElement.ownerDocument.removeEventListener("pointermove",this._onPointerMove),this.domElement.ownerDocument.removeEventListener("pointerup",this._onPointerUp),this.domElement.removeEventListener("pointercancel",this._onPointerUp),this.domElement.removeEventListener("wheel",this._onMouseWheel),this.domElement.removeEventListener("contextmenu",this._onContextMenu),this.stopListenToKeyEvents();let e=this.domElement.getRootNode();e.removeEventListener("keydown",this._interceptControlDown,{capture:!0}),e.removeEventListener("keyup",this._interceptControlUp,{capture:!0}),this._controlActive=!1,this._pointers.length=0,this._pointerPositions={},this.domElement.style.touchAction="",this.domElement.style.cursor="auto"}dispose(){this.disconnect()}getPolarAngle(){return this._spherical.phi}getAzimuthalAngle(){return this._spherical.theta}getDistance(){return this.object.position.distanceTo(this.target)}listenToKeyEvents(e){e.addEventListener("keydown",this._onKeyDown),this._domElementKeyEvents=e}stopListenToKeyEvents(){this._domElementKeyEvents!==null&&(this._domElementKeyEvents.removeEventListener("keydown",this._onKeyDown),this._domElementKeyEvents=null)}saveState(){this.target0.copy(this.target),this.position0.copy(this.object.position),this.zoom0=this.object.zoom}reset(){this.target.copy(this.target0),this.object.position.copy(this.position0),this.object.zoom=this.zoom0,this.object.updateProjectionMatrix(),this.dispatchEvent(Gd),this.update(),this.state=vt.NONE}pan(e,t){this._pan(e,t),this.update()}dollyIn(e){this._dollyIn(e),this.update()}dollyOut(e){this._dollyOut(e),this.update()}rotateLeft(e){this._rotateLeft(e),this.update()}rotateUp(e){this._rotateUp(e),this.update()}update(e=null){let t=this.object.position;Yt.copy(t).sub(this.target),Yt.applyQuaternion(this._quat),this._spherical.setFromVector3(Yt),this.autoRotate&&this.state===vt.NONE&&this._rotateLeft(this._getAutoRotationAngle(e)),this.enableDamping?(this._spherical.theta+=this._sphericalDelta.theta*this.dampingFactor,this._spherical.phi+=this._sphericalDelta.phi*this.dampingFactor):(this._spherical.theta+=this._sphericalDelta.theta,this._spherical.phi+=this._sphericalDelta.phi);let i=this.minAzimuthAngle,r=this.maxAzimuthAngle;isFinite(i)&&isFinite(r)&&(i<-Math.PI?i+=Si:i>Math.PI&&(i-=Si),r<-Math.PI?r+=Si:r>Math.PI&&(r-=Si),i<=r?this._spherical.theta=Math.max(i,Math.min(r,this._spherical.theta)):this._spherical.theta=this._spherical.theta>(i+r)/2?Math.max(i,this._spherical.theta):Math.min(r,this._spherical.theta)),this._spherical.phi=Math.max(this.minPolarAngle,Math.min(this.maxPolarAngle,this._spherical.phi)),this._spherical.makeSafe(),this.enableDamping===!0?this.target.addScaledVector(this._panOffset,this.dampingFactor):this.target.add(this._panOffset),this.target.sub(this.cursor),this.target.clampLength(this.minTargetRadius,this.maxTargetRadius),this.target.add(this.cursor);let o=!1;if(this.zoomToCursor&&this._performCursorZoom||this.object.isOrthographicCamera)this._spherical.radius=this._clampDistance(this._spherical.radius);else{let s=this._spherical.radius;this._spherical.radius=this._clampDistance(this._spherical.radius*this._scale),o=s!=this._spherical.radius}if(Yt.setFromSpherical(this._spherical),Yt.applyQuaternion(this._quatInverse),t.copy(this.target).add(Yt),this.object.lookAt(this.target),this.enableDamping===!0?(this._sphericalDelta.theta*=1-this.dampingFactor,this._sphericalDelta.phi*=1-this.dampingFactor,this._panOffset.multiplyScalar(1-this.dampingFactor)):(this._sphericalDelta.set(0,0,0),this._panOffset.set(0,0,0)),this.zoomToCursor&&this._performCursorZoom){let s=null;if(this.object.isPerspectiveCamera){let a=Yt.length();s=this._clampDistance(a*this._scale);let l=a-s;this.object.position.addScaledVector(this._dollyDirection,l),this.object.updateMatrixWorld(),o=!!l}else if(this.object.isOrthographicCamera){let a=new U(this._mouse.x,this._mouse.y,0);a.unproject(this.object);let l=this.object.zoom;this.object.zoom=Math.max(this.minZoom,Math.min(this.maxZoom,this.object.zoom/this._scale)),this.object.updateProjectionMatrix(),o=l!==this.object.zoom;let c=new U(this._mouse.x,this._mouse.y,0);c.unproject(this.object),this.object.position.sub(c).add(a),this.object.updateMatrixWorld(),s=Yt.length()}else console.warn("WARNING: OrbitControls.js encountered an unknown camera type - zoom to cursor disabled."),this.zoomToCursor=!1;s!==null&&(this.screenSpacePanning?this.target.set(0,0,-1).transformDirection(this.object.matrix).multiplyScalar(s).add(this.object.position):(Ca.origin.copy(this.object.position),Ca.direction.set(0,0,-1).transformDirection(this.object.matrix),Math.abs(this.object.up.dot(Ca.direction))<e0?this.object.lookAt(this.target):(zd.setFromNormalAndCoplanarPoint(this.object.up,this.target),Ca.intersectPlane(zd,this.target))))}else if(this.object.isOrthographicCamera){let s=this.object.zoom;this.object.zoom=Math.max(this.minZoom,Math.min(this.maxZoom,this.object.zoom/this._scale)),s!==this.object.zoom&&(this.object.updateProjectionMatrix(),o=!0)}return this._scale=1,this._performCursorZoom=!1,o||this._lastPosition.distanceToSquared(this.object.position)>wl||8*(1-this._lastQuaternion.dot(this.object.quaternion))>wl||this._lastTargetPosition.distanceToSquared(this.target)>wl?(this.dispatchEvent(Gd),this._lastPosition.copy(this.object.position),this._lastQuaternion.copy(this.object.quaternion),this._lastTargetPosition.copy(this.target),!0):!1}_getAutoRotationAngle(e){return e!==null?Si/60*this.autoRotateSpeed*e:Si/60/60*this.autoRotateSpeed}_getZoomScale(e){let t=Math.abs(e*.01);return Math.pow(.95,this.zoomSpeed*t)}_rotateLeft(e){this._sphericalDelta.theta-=e}_rotateUp(e){this._sphericalDelta.phi-=e}_panLeft(e,t){Yt.setFromMatrixColumn(t,0),Yt.multiplyScalar(-e),this._panOffset.add(Yt)}_panUp(e,t){this.screenSpacePanning===!0?Yt.setFromMatrixColumn(t,1):(Yt.setFromMatrixColumn(t,0),Yt.crossVectors(this.object.up,Yt)),Yt.multiplyScalar(e),this._panOffset.add(Yt)}_pan(e,t){let i=this.domElement;if(this.object.isPerspectiveCamera){let r=this.object.position;Yt.copy(r).sub(this.target);let o=Yt.length();o*=Math.tan(this.object.fov/2*Math.PI/180),this._panLeft(2*e*o/i.clientHeight,this.object.matrix),this._panUp(2*t*o/i.clientHeight,this.object.matrix)}else this.object.isOrthographicCamera?(this._panLeft(e*(this.object.right-this.object.left)/this.object.zoom/i.clientWidth,this.object.matrix),this._panUp(t*(this.object.top-this.object.bottom)/this.object.zoom/i.clientHeight,this.object.matrix)):(console.warn("WARNING: OrbitControls.js encountered an unknown camera type - pan disabled."),this.enablePan=!1)}_dollyOut(e){this.object.isPerspectiveCamera||this.object.isOrthographicCamera?this._scale/=e:(console.warn("WARNING: OrbitControls.js encountered an unknown camera type - dolly/zoom disabled."),this.enableZoom=!1)}_dollyIn(e){this.object.isPerspectiveCamera||this.object.isOrthographicCamera?this._scale*=e:(console.warn("WARNING: OrbitControls.js encountered an unknown camera type - dolly/zoom disabled."),this.enableZoom=!1)}_updateZoomParameters(e,t){if(!this.zoomToCursor)return;this._performCursorZoom=!0;let i=this.domElement.getBoundingClientRect(),r=e-i.left,o=t-i.top,s=i.width,a=i.height;this._mouse.x=r/s*2-1,this._mouse.y=-(o/a)*2+1,this._dollyDirection.set(this._mouse.x,this._mouse.y,1).unproject(this.object).sub(this.object.position).normalize()}_clampDistance(e){return Math.max(this.minDistance,Math.min(this.maxDistance,e))}_handleMouseDownRotate(e){this._rotateStart.set(e.clientX,e.clientY)}_handleMouseDownDolly(e){this._updateZoomParameters(e.clientX,e.clientX),this._dollyStart.set(e.clientX,e.clientY)}_handleMouseDownPan(e){this._panStart.set(e.clientX,e.clientY)}_handleMouseMoveRotate(e){this._rotateEnd.set(e.clientX,e.clientY),this._rotateDelta.subVectors(this._rotateEnd,this._rotateStart).multiplyScalar(this.rotateSpeed);let t=this.domElement;this._rotateLeft(Si*this._rotateDelta.x/t.clientHeight),this._rotateUp(Si*this._rotateDelta.y/t.clientHeight),this._rotateStart.copy(this._rotateEnd),this.update()}_handleMouseMoveDolly(e){this._dollyEnd.set(e.clientX,e.clientY),this._dollyDelta.subVectors(this._dollyEnd,this._dollyStart),this._dollyDelta.y>0?this._dollyOut(this._getZoomScale(this._dollyDelta.y)):this._dollyDelta.y<0&&this._dollyIn(this._getZoomScale(this._dollyDelta.y)),this._dollyStart.copy(this._dollyEnd),this.update()}_handleMouseMovePan(e){this._panEnd.set(e.clientX,e.clientY),this._panDelta.subVectors(this._panEnd,this._panStart).multiplyScalar(this.panSpeed),this._pan(this._panDelta.x,this._panDelta.y),this._panStart.copy(this._panEnd),this.update()}_handleMouseWheel(e){this._updateZoomParameters(e.clientX,e.clientY),e.deltaY<0?this._dollyIn(this._getZoomScale(e.deltaY)):e.deltaY>0&&this._dollyOut(this._getZoomScale(e.deltaY)),this.update()}_handleKeyDown(e){let t=!1;switch(e.code){case this.keys.UP:e.ctrlKey||e.metaKey||e.shiftKey?this.enableRotate&&this._rotateUp(Si*this.keyRotateSpeed/this.domElement.clientHeight):this.enablePan&&this._pan(0,this.keyPanSpeed),t=!0;break;case this.keys.BOTTOM:e.ctrlKey||e.metaKey||e.shiftKey?this.enableRotate&&this._rotateUp(-Si*this.keyRotateSpeed/this.domElement.clientHeight):this.enablePan&&this._pan(0,-this.keyPanSpeed),t=!0;break;case this.keys.LEFT:e.ctrlKey||e.metaKey||e.shiftKey?this.enableRotate&&this._rotateLeft(Si*this.keyRotateSpeed/this.domElement.clientHeight):this.enablePan&&this._pan(this.keyPanSpeed,0),t=!0;break;case this.keys.RIGHT:e.ctrlKey||e.metaKey||e.shiftKey?this.enableRotate&&this._rotateLeft(-Si*this.keyRotateSpeed/this.domElement.clientHeight):this.enablePan&&this._pan(-this.keyPanSpeed,0),t=!0;break}t&&(e.preventDefault(),this.update())}_handleTouchStartRotate(e){if(this._pointers.length===1)this._rotateStart.set(e.pageX,e.pageY);else{let t=this._getSecondPointerPosition(e),i=.5*(e.pageX+t.x),r=.5*(e.pageY+t.y);this._rotateStart.set(i,r)}}_handleTouchStartPan(e){if(this._pointers.length===1)this._panStart.set(e.pageX,e.pageY);else{let t=this._getSecondPointerPosition(e),i=.5*(e.pageX+t.x),r=.5*(e.pageY+t.y);this._panStart.set(i,r)}}_handleTouchStartDolly(e){let t=this._getSecondPointerPosition(e),i=e.pageX-t.x,r=e.pageY-t.y,o=Math.sqrt(i*i+r*r);this._dollyStart.set(0,o)}_handleTouchStartDollyPan(e){this.enableZoom&&this._handleTouchStartDolly(e),this.enablePan&&this._handleTouchStartPan(e)}_handleTouchStartDollyRotate(e){this.enableZoom&&this._handleTouchStartDolly(e),this.enableRotate&&this._handleTouchStartRotate(e)}_handleTouchMoveRotate(e){if(this._pointers.length==1)this._rotateEnd.set(e.pageX,e.pageY);else{let i=this._getSecondPointerPosition(e),r=.5*(e.pageX+i.x),o=.5*(e.pageY+i.y);this._rotateEnd.set(r,o)}this._rotateDelta.subVectors(this._rotateEnd,this._rotateStart).multiplyScalar(this.rotateSpeed);let t=this.domElement;this._rotateLeft(Si*this._rotateDelta.x/t.clientHeight),this._rotateUp(Si*this._rotateDelta.y/t.clientHeight),this._rotateStart.copy(this._rotateEnd)}_handleTouchMovePan(e){if(this._pointers.length===1)this._panEnd.set(e.pageX,e.pageY);else{let t=this._getSecondPointerPosition(e),i=.5*(e.pageX+t.x),r=.5*(e.pageY+t.y);this._panEnd.set(i,r)}this._panDelta.subVectors(this._panEnd,this._panStart).multiplyScalar(this.panSpeed),this._pan(this._panDelta.x,this._panDelta.y),this._panStart.copy(this._panEnd)}_handleTouchMoveDolly(e){let t=this._getSecondPointerPosition(e),i=e.pageX-t.x,r=e.pageY-t.y,o=Math.sqrt(i*i+r*r);this._dollyEnd.set(0,o),this._dollyDelta.set(0,Math.pow(this._dollyEnd.y/this._dollyStart.y,this.zoomSpeed)),this._dollyOut(this._dollyDelta.y),this._dollyStart.copy(this._dollyEnd);let s=(e.pageX+t.x)*.5,a=(e.pageY+t.y)*.5;this._updateZoomParameters(s,a)}_handleTouchMoveDollyPan(e){this.enableZoom&&this._handleTouchMoveDolly(e),this.enablePan&&this._handleTouchMovePan(e)}_handleTouchMoveDollyRotate(e){this.enableZoom&&this._handleTouchMoveDolly(e),this.enableRotate&&this._handleTouchMoveRotate(e)}_addPointer(e){this._pointers.push(e.pointerId)}_removePointer(e){delete this._pointerPositions[e.pointerId];for(let t=0;t<this._pointers.length;t++)if(this._pointers[t]==e.pointerId){this._pointers.splice(t,1);return}}_isTrackingPointer(e){for(let t=0;t<this._pointers.length;t++)if(this._pointers[t]==e.pointerId)return!0;return!1}_trackPointer(e){let t=this._pointerPositions[e.pointerId];t===void 0&&(t=new Ae,this._pointerPositions[e.pointerId]=t),t.set(e.pageX,e.pageY)}_getSecondPointerPosition(e){let t=e.pointerId===this._pointers[0]?this._pointers[1]:this._pointers[0];return this._pointerPositions[t]}_customWheelEvent(e){let t=e.deltaMode,i={clientX:e.clientX,clientY:e.clientY,deltaY:e.deltaY};switch(t){case 1:i.deltaY*=16;break;case 2:i.deltaY*=100;break}return e.ctrlKey&&!this._controlActive&&(i.deltaY*=10),i}};function t0(n){this.enabled!==!1&&(this._pointers.length===0&&(this.domElement.setPointerCapture(n.pointerId),this.domElement.ownerDocument.addEventListener("pointermove",this._onPointerMove),this.domElement.ownerDocument.addEventListener("pointerup",this._onPointerUp)),!this._isTrackingPointer(n)&&(this._addPointer(n),n.pointerType==="touch"?this._onTouchStart(n):this._onMouseDown(n),this._cursorStyle==="grab"&&(this.domElement.style.cursor="grabbing")))}function i0(n){this.enabled!==!1&&(n.pointerType==="touch"?this._onTouchMove(n):this._onMouseMove(n))}function n0(n){switch(this._removePointer(n),this._pointers.length){case 0:this.domElement.releasePointerCapture(n.pointerId),this.domElement.ownerDocument.removeEventListener("pointermove",this._onPointerMove),this.domElement.ownerDocument.removeEventListener("pointerup",this._onPointerUp),this.dispatchEvent(kd),this.state=vt.NONE,this._cursorStyle==="grab"&&(this.domElement.style.cursor="grab");break;case 1:let e=this._pointers[0],t=this._pointerPositions[e];this._onTouchStart({pointerId:e,pageX:t.x,pageY:t.y});break}}function r0(n){let e;switch(n.button){case 0:e=this.mouseButtons.LEFT;break;case 1:e=this.mouseButtons.MIDDLE;break;case 2:e=this.mouseButtons.RIGHT;break;default:e=-1}switch(e){case Bn.DOLLY:if(this.enableZoom===!1)return;this._handleMouseDownDolly(n),this.state=vt.DOLLY;break;case Bn.ROTATE:if(n.ctrlKey||n.metaKey||n.shiftKey){if(this.enablePan===!1)return;this._handleMouseDownPan(n),this.state=vt.PAN}else{if(this.enableRotate===!1)return;this._handleMouseDownRotate(n),this.state=vt.ROTATE}break;case Bn.PAN:if(n.ctrlKey||n.metaKey||n.shiftKey){if(this.enableRotate===!1)return;this._handleMouseDownRotate(n),this.state=vt.ROTATE}else{if(this.enablePan===!1)return;this._handleMouseDownPan(n),this.state=vt.PAN}break;default:this.state=vt.NONE}this.state!==vt.NONE&&this.dispatchEvent(Rl)}function o0(n){switch(this.state){case vt.ROTATE:if(this.enableRotate===!1)return;this._handleMouseMoveRotate(n);break;case vt.DOLLY:if(this.enableZoom===!1)return;this._handleMouseMoveDolly(n);break;case vt.PAN:if(this.enablePan===!1)return;this._handleMouseMovePan(n);break}}function s0(n){this.enabled===!1||this.enableZoom===!1||this.state!==vt.NONE||(n.preventDefault(),this.dispatchEvent(Rl),this._handleMouseWheel(this._customWheelEvent(n)),this.dispatchEvent(kd))}function a0(n){this.enabled!==!1&&this._handleKeyDown(n)}function l0(n){switch(this._trackPointer(n),this._pointers.length){case 1:switch(this.touches.ONE){case Gn.ROTATE:if(this.enableRotate===!1)return;this._handleTouchStartRotate(n),this.state=vt.TOUCH_ROTATE;break;case Gn.PAN:if(this.enablePan===!1)return;this._handleTouchStartPan(n),this.state=vt.TOUCH_PAN;break;default:this.state=vt.NONE}break;case 2:switch(this.touches.TWO){case Gn.DOLLY_PAN:if(this.enableZoom===!1&&this.enablePan===!1)return;this._handleTouchStartDollyPan(n),this.state=vt.TOUCH_DOLLY_PAN;break;case Gn.DOLLY_ROTATE:if(this.enableZoom===!1&&this.enableRotate===!1)return;this._handleTouchStartDollyRotate(n),this.state=vt.TOUCH_DOLLY_ROTATE;break;default:this.state=vt.NONE}break;default:this.state=vt.NONE}this.state!==vt.NONE&&this.dispatchEvent(Rl)}function c0(n){switch(this._trackPointer(n),this.state){case vt.TOUCH_ROTATE:if(this.enableRotate===!1)return;this._handleTouchMoveRotate(n),this.update();break;case vt.TOUCH_PAN:if(this.enablePan===!1)return;this._handleTouchMovePan(n),this.update();break;case vt.TOUCH_DOLLY_PAN:if(this.enableZoom===!1&&this.enablePan===!1)return;this._handleTouchMoveDollyPan(n),this.update();break;case vt.TOUCH_DOLLY_ROTATE:if(this.enableZoom===!1&&this.enableRotate===!1)return;this._handleTouchMoveDollyRotate(n),this.update();break;default:this.state=vt.NONE}}function u0(n){this.enabled!==!1&&n.preventDefault()}function f0(n){n.key==="Control"&&(this._controlActive=!0,this.domElement.getRootNode().addEventListener("keyup",this._interceptControlUp,{passive:!0,capture:!0}))}function h0(n){n.key==="Control"&&(this._controlActive=!1,this.domElement.getRootNode().removeEventListener("keyup",this._interceptControlUp,{passive:!0,capture:!0}))}var Nn=class extends xt{constructor(e=document.createElement("div")){super(),this.isCSS2DObject=!0,this.element=e,this.element.style.position="absolute",this.element.style.userSelect="none",this.element.setAttribute("draggable",!1),this.center=new Ae(.5,.5),this.rotation2D=0,this.addEventListener("removed",function(){this.traverse(function(t){t.element&&t.element instanceof t.element.ownerDocument.defaultView.Element&&t.element.parentNode!==null&&t.element.remove()})})}copy(e,t){return super.copy(e,t),this.element=e.element.cloneNode(!0),this.center=e.center,this.rotation2D=e.rotation2D,this}},jr=new U,Hd=new Qe,Vd=new Qe,Wd=new U,Xd=new U,La=class{constructor(e={}){let t=this,i,r,o,s,a={objects:new WeakMap},l=e.element!==void 0?e.element:document.createElement("div");l.style.overflow="hidden",this.domElement=l,this.sortObjects=!0,this.getSize=function(){return{width:i,height:r}},this.render=function(_,M){_.matrixWorldAutoUpdate===!0&&_.updateMatrixWorld(),M.parent===null&&M.matrixWorldAutoUpdate===!0&&M.updateMatrixWorld(),Hd.copy(M.matrixWorldInverse),Vd.multiplyMatrices(M.projectionMatrix,Hd),h(_,_,M),this.sortObjects&&m(_)},this.setSize=function(_,M){i=_,r=M,o=i/2,s=r/2,l.style.width=_+"px",l.style.height=M+"px"};function c(_){_.isCSS2DObject&&(_.element.style.display="none");for(let M=0,p=_.children.length;M<p;M++)c(_.children[M])}function h(_,M,p){if(_.visible===!1){c(_);return}if(_.isCSS2DObject){jr.setFromMatrixPosition(_.matrixWorld),jr.applyMatrix4(Vd);let f=jr.z>=-1&&jr.z<=1&&_.layers.test(p.layers)===!0,E=_.element;if(E.style.display=f===!0?"":"none",f===!0){_.onBeforeRender(t,M,p);let y=100*_.center.x,b=100*_.center.y;E.style.transformOrigin=`${y}% ${b}%`;let v=-_.rotation2D,D=jr.x*o+o,S=-jr.y*s+s;E.style.transform=`translate(${-y}%, ${-b}%) translate(${D}px, ${S}px) rotate(${v}rad)`,E.parentNode!==l&&l.appendChild(E),_.onAfterRender(t,M,p)}let C={distanceToCameraSquared:d(p,_)};a.objects.set(_,C)}for(let f=0,E=_.children.length;f<E;f++)h(_.children[f],M,p)}function d(_,M){return Wd.setFromMatrixPosition(_.matrixWorld),Xd.setFromMatrixPosition(M.matrixWorld),Wd.distanceToSquared(Xd)}function u(_){let M=[];return _.traverseVisible(function(p){p.isCSS2DObject&&M.push(p)}),M}function m(_){let M=u(_).sort(function(f,E){if(f.renderOrder!==E.renderOrder)return E.renderOrder-f.renderOrder;let C=a.objects.get(f).distanceToCameraSquared,y=a.objects.get(E).distanceToCameraSquared;return C-y}),p=M.length;for(let f=0,E=M.length;f<E;f++)M[f].element.style.zIndex=p-f}}};var Yd=["loc","player","org","trade","danger","distress","rumor","unknown","comms","infra","resource","threshold","economy","event"];var qd={loc:{id:"loc",label:"Location",meaning:"here",fallback:"here",category:"LOCATION",counterpart:"room",d:"M3.2 3.2h9.6v9.6H3.2z M6.2 6.2h3.6v3.6H6.2z"},player:{id:"player",label:"Player",meaning:"a Player",fallback:"P",category:"PLAYER",counterpart:"player",d:"M8 2.4l5.6 5.6L8 13.6 2.4 8z"},org:{id:"org",label:"Institution",meaning:"institution",fallback:"org",category:"INSTITUTION",counterpart:"organization",d:"M3.5 13V5.4 M8 13V3.4 M12.5 13V5.4 M3 13.2h10"},trade:{id:"trade",label:"Trade",meaning:"trade or opportunity",fallback:"trade",category:"TRADE",counterpart:"trade",d:"M2.6 5.4h8.4 M8.4 3.2l3 2.2-3 2.2 M13.4 10.6H5 M7.6 8.4l-3 2.2 3 2.2"},danger:{id:"danger",label:"Danger",meaning:"hostile or contested",fallback:"danger",category:"DANGER",counterpart:"contest",d:"M8 2.6l6.2 10.6H1.8z M8 6.6v3.2 M8 11.6v.9"},distress:{id:"distress",label:"Distress",meaning:"strained or failing works",fallback:"strained",category:"DISTRESS",counterpart:"condition",d:"M3.4 3.2h9.2 M3.4 12.8h9.2 M3.4 3.2l9.2 9.6 M12.6 3.2l-9.2 9.6"},rumor:{id:"rumor",label:"Rumor",meaning:"unconfirmed claim",fallback:"rumor",category:"RUMOR",counterpart:"rumor",d:"M3 11.2h3.4 M6.2 8h4 M10.2 4.8h2.8"},unknown:{id:"unknown",label:"Unknown",meaning:"incomplete or unreadable",fallback:"?",category:"UNKNOWN",counterpart:"artifact",d:"M5.2 3.2H12.8V7 M12.8 9.2v3.6H3.2V5.6"},comms:{id:"comms",label:"Signal",meaning:"message or board traffic",fallback:"message",category:"COMMUNICATION",counterpart:"message",d:"M8 12.6v-1.4 M5.2 9.2a3.6 3.6 0 0 1 5.6 0 M3.4 7a6.2 6.2 0 0 1 9.2 0"},infra:{id:"infra",label:"Works",meaning:"infrastructure",fallback:"works",category:"INFRASTRUCTURE",counterpart:"infrastructure",d:"M3.2 3.2h4.2v4.2H3.2z M8.6 3.2h4.2v4.2H8.6z M3.2 8.6h4.2v4.2H3.2z M8.6 8.6h4.2v4.2H8.6z"},resource:{id:"resource",label:"Resource",meaning:"stock or harvest",fallback:"stock",category:"RESOURCE",counterpart:"resource",d:"M4.2 12.2V7.2h2.2v5 M7 12.2V4.4h2.2v7.8 M9.8 12.2V8.4h2.2v3.8 M3.4 12.4h9.4"},threshold:{id:"threshold",label:"Threshold",meaning:"consequential change",fallback:"change",category:"THRESHOLD",counterpart:"exit",d:"M4.2 13V3.8h7.6V13 M6.6 13V8.2h2.8V13"},economy:{id:"economy",label:"Economy",meaning:"economic change",fallback:"trade",category:"ECONOMIC CHANGE",counterpart:"market",d:"M8 3.2v9.4 M3.4 6.6L8 4.4l4.6 2.2 M3.6 11.4h3.2 M9.2 11.4h3.2"},event:{id:"event",label:"Event",meaning:"world event",fallback:"event",category:"WORLD EVENT",counterpart:"event",d:"M8 2.6v3.2 M8 10.2v3.2 M2.6 8h3.2 M10.2 8h3.2 M4.4 4.4l2.2 2.2 M9.4 9.4l2.2 2.2 M11.6 4.4l-2.2 2.2 M6.6 9.4l-2.2 2.2"}};function Kd(n){return qd[n]||qd.unknown}var Qd=320,jd=180;var BP=100*1024,GP=200*1024;var d0=Object.fromEntries(Yd.map(n=>[n,Kd(n).d]));var Zd={north:[0,-1],n:[0,-1],south:[0,1],s:[0,1],east:[1,0],e:[1,0],west:[-1,0],w:[-1,0],up:[.35,-.65],down:[-.35,.65],northeast:[1,-1],northwest:[-1,-1],southeast:[1,1],southwest:[-1,1]},Cl={NORMAL:280,NOTABLE:560,MAJOR:920};function Da(n){if(!n||!n.room_id||n.hidden===!0)return!1;let e=n.tags||[];for(let t=0;t<e.length;t++){let i=String(e[t]||"").toLowerCase();if(i==="hidden"||i==="secret"||i==="unpublished")return!1}return!0}function ep(n){return String(n||"").replace(/[<>&"'`]/g,"").replace(/[\u0000-\u001f\u007f]/g,"").slice(0,24)}function p0(n,e,t){if(!Array.isArray(n))return[];let i=String(e||"").trim().toLowerCase(),r=String(t||"").trim().toLowerCase(),o=r.replace(/^room\./,""),s=[];for(let a=0;a<n.length;a++){let l=ep(n[a]);if(!l)continue;let c=l.toLowerCase();c.startsWith("room.")||i&&c===i||r&&(c===r||c===o)||s.indexOf(l)>=0||s.push(l)}return s}function m0(n,e,t){if(!Da(n))return"unknown";let i=Number(n.players_present||0),r=String(t||"");if(r){if(String(n.room_id||"")===r)return"active"}else if(n.active===!0||i>0)return"active";let o=n.room_id||"";if(!r&&(e||[]).some(c=>c.room_id===o))return"active";if((n.entities||[]).filter(l=>l&&l.hidden!==!0).length||String(n.description||"").trim()||r&&i>0)return"known";let a=n.tags||[];for(let l=0;l<a.length;l++)if(String(a[l]||"").toLowerCase()==="partial")return"partial";return"empty"}function Jd(n){let e=String(n||"");return!e||e==="loc"||e==="player"||!Object.prototype.hasOwnProperty.call(d0,e)?null:e}function g0(n,e){let t={},i=[];function r(l){!l||t[l]||(t[l]=!0,i.push(l))}let o=n.entities||[];for(let l=0;l<o.length;l++){let c=o[l];!c||c.hidden===!0||r(Jd(c.glyph))}let s=n.room_id||"",a=e||[];for(let l=0;l<a.length;l++){let c=a[l];!c||c.room_id!==s||r(Jd(c.glyph))}return i.sort(),i.slice(0,4)}function _0(n,e){let t=[],i=n.exits||[];for(let r=0;r<i.length;r++){let o=i[r];if(!o||o.hidden===!0)continue;let s=String(o.to_room_id||"");!s||!e.has(s)||t.push(o)}return t}function x0(n,e){let t=String(n||"").toLowerCase().trim();if(Zd[t])return Zd[t];let i=(e%4+4)%4;return i===0?[1,0]:i===1?[0,1]:i===2?[-1,0]:[0,-1]}function ss(n,e){return Math.round(n*2)/2+","+Math.round(e*2)/2}function $d(n,e,t){if(!t.has(ss(n,e)))return[n,e];let i=[1,-1,2,-2,3,-3];for(let r=0;r<i.length;r++){let o=i[r];for(let s=0;s<i.length;s++){let a=n+o*.5,l=e+i[s]*.5;if(!t.has(ss(a,l)))return[a,l]}}return[n+.75,e+.75]}function tp(n,e,t){let i=(n||[]).filter(Da).slice().sort((b,v)=>String(b.room_id).localeCompare(String(v.room_id))),r=new Set(i.map(b=>String(b.room_id))),o=new Map,s=new Set,a=[],l=new Set;if(i.length){let b=String(i[0].room_id);o.set(b,[0,0]),s.add(ss(0,0));let v=[b],D=new Set([b]);for(;v.length;){let T=v.shift(),I=i.find(W=>W.room_id===T);if(!I)continue;let G=o.get(T)||[0,0],z=_0(I,r).slice().sort((W,O)=>String(W.direction||"").localeCompare(String(O.direction||""))||String(W.to_room_id||"").localeCompare(String(O.to_room_id||"")));for(let W=0;W<z.length;W++){let O=String(z[W].to_room_id),X=T<O?T+">"+O:O+">"+T;if(l.has(X)||(l.add(X),a.push({from:T,to:O,direction:String(z[W].direction||"")})),D.has(O))continue;let Z=x0(z[W].direction,W+T.length),J=G[0]+Z[0]*2,ae=G[1]+Z[1]*2,Q=$d(J,ae,s);J=Q[0],ae=Q[1],o.set(O,[J,ae]),s.add(ss(J,ae)),D.add(O),v.push(O)}}let S=0;for(let T=0;T<i.length;T++){let I=String(i[T].room_id);if(o.has(I))continue;let G=$d(S*2,2,s);o.set(I,G),s.add(ss(G[0],G[1])),S+=1}}let c=1/0,h=1/0,d=-1/0,u=-1/0;o.forEach(b=>{b[0]<c&&(c=b[0]),b[1]<h&&(h=b[1]),b[0]>d&&(d=b[0]),b[1]>u&&(u=b[1])}),Number.isFinite(c)||(c=0,h=0,d=0,u=0);let m=Math.max(1,d-c),_=Math.max(1,u-h),M=28,p=24,f=Qd-M*2,E=jd-p*2,C=i.map(b=>{let v=String(b.room_id),D=o.get(v)||[0,0],S=M+(D[0]-c)/m*f,T=p+(D[1]-h)/_*E,I=S0(S,T),G=ep(b.name||v),z=p0(b.public_player_labels,G,v);return{room_id:v,name:G,x:I.x,y:I.y,gx:D[0],gy:D[1],certainty:m0(b,e,t),players:Math.max(0,Number(b.players_present||0)||0),labels:z,marks:g0(b,e)}}),y=new Map(C.map(b=>[b.room_id,b.certainty]));for(let b=0;b<a.length;b++){let v=a[b],D=y.get(v.from),S=y.get(v.to);v.dashed=D==="partial"||S==="partial"}return{nodes:C,edges:a}}function S0(n,e){return{x:Math.max(12,Math.min(Qd-12,Math.round(n))),y:Math.max(14,Math.min(jd-14,Math.round(e)))}}var HP=160*1024,as=4,M0=20*Math.PI/180,v0=70*Math.PI/180,op=Cl.NOTABLE,y0=3,b0={NORMAL:2500,NOTABLE:3500,MAJOR:4e3},hn={MIN_GAP_MS:400,MAX_GAP_MS:2500,UNKNOWN_GAP_MS:600,MAX_TOTAL_MS:9e3},Ll=1100,Dl=3e3,ip={DWELL_MS:4e3,MAJOR_PREEMPT_MS:1500};function sp(n){let e=[];for(let r of Array.isArray(n)?n:[]){let o=r?.sequence;if(typeof o!="number"||!Number.isSafeInteger(o))continue;let s=r?.occurredAt,a=typeof s=="number"&&Number.isFinite(s)?s:null,l=e.find(c=>c.sequence===o);if(l){l.occurredAt===null&&a!==null&&(l.occurredAt=a);continue}e.push({sequence:o,occurredAt:a})}e.sort((r,o)=>r.sequence-o.sequence);let t=[];for(let r=0;r<e.length;r++){let o=0;if(r>0){let s=e[r-1].occurredAt,a=e[r].occurredAt,l=hn.UNKNOWN_GAP_MS;if(s!==null&&a!==null){let c=a-s;c>=0&&(l=Math.min(hn.MAX_GAP_MS,Math.max(hn.MIN_GAP_MS,c)))}o=t[r-1].atMs+l}t.push({sequence:e[r].sequence,atMs:o})}let i=t.length?t[t.length-1].atMs:0;if(i>hn.MAX_TOTAL_MS){let r=hn.MAX_TOTAL_MS/i;for(let o of t)o.atMs=Math.round(o.atMs*r)}return t}function ap(n,e){let t=typeof e=="number"&&Number.isFinite(e)?e:0,i=t;for(let o of Array.isArray(n)?n:[])typeof o!="number"||!Number.isFinite(o)||o>i&&(i=o);let r=i-t;return r>hn.MAX_TOTAL_MS?{flush:!0,offsetMs:0}:r<=0?{flush:!1,offsetMs:0}:{flush:!1,offsetMs:r+hn.MIN_GAP_MS}}var E0=["faint","marked","deep"],np=["low","moderate","high"];function Pl(n,e){let t=String(n??"").trim().toLowerCase();return e.includes(t)?t:""}function T0(n){let e={},t=n&&typeof n=="object"?n.base:null,i=t&&Array.isArray(t.rooms)?t.rooms:[];for(let r of i){if(!r||typeof r!="object")continue;let o=r,s=String(o.room_id||"");if(!s)continue;let a={scar:Pl(o.scar_band,E0),pressure:Pl(o.pressure_band,np),protocol:Pl(o.protocol_band,np)};(a.scar||a.pressure||a.protocol)&&(e[s]=a)}return e}function lp(n){let e=[];return n.scar&&e.push("scar "+n.scar),n.pressure&&e.push("pressure "+n.pressure),n.protocol&&e.push("protocol "+n.protocol),e.join(" \xB7 ")}var fn={MAX_OPACITY:.55,MIN_OPACITY:.18,SIZE:4.2};function cp(n){let e=n?.active===!0,t=n?.major===!0,i=n?.followed===!0,r=Math.max(0,Number(n?.players)||0);if(!e&&!t&&!i&&r<=0)return 0;let o=fn.MIN_OPACITY+(fn.MAX_OPACITY-fn.MIN_OPACITY)*Math.min(1,r/6);return t&&(o=Math.min(fn.MAX_OPACITY,o+.15)),i&&(o=Math.max(o,fn.MIN_OPACITY+.1)),o=Math.max(0,Math.min(fn.MAX_OPACITY,o)),Math.round(o*1e3)/1e3}var A0=/\b(?:player|room|entity|ctrl|event|controller|device)\.[a-z0-9._-]+/i;function Un(n,e){let t=String(n??"").replace(/[\u0000-\u001f\u007f]/g,"").replace(/\s+/g," ").trim();return!t||A0.test(t)?"":t.length>e?t.slice(0,e):t}function up(n){return Un(n,48)}function w0(n){let e=up(n.name).toLowerCase(),t=[];for(let i of Array.isArray(n.public_player_labels)?n.public_player_labels:[]){let r=Un(i,32);!r||r.toLowerCase()===e||t.includes(r)||t.push(r)}return t}function rp(n,e){let t=e+" ";for(let i of Array.isArray(n)?n:[])if(String(i??"").startsWith(t))return Un(i,120);return""}function R0(n,e){let t=rp(n.public_focus_lines,e);return t||rp(n.public_title_lines,e)}function fp(n,e={}){let t=Array.isArray(n?.rooms)?n.rooms:[],i=Array.isArray(n?.recent_events)?n.recent_events:[],r=tp(t,i),o=new Map;for(let M of t)Da(M)&&o.set(String(M.room_id),M);let s=T0(e.map),a={scar:"",pressure:"",protocol:""},l=r.nodes.filter(M=>o.has(M.room_id)),c=l.length?l.reduce((M,p)=>M+(p.gx??0),0)/l.length:0,h=l.length?l.reduce((M,p)=>M+(p.gy??0),0)/l.length:0,d=[],u=0;for(let M of l){let p=o.get(M.room_id),f=up(p.name);if(!f)continue;let E=((M.gx??0)-c)*as,C=((M.gy??0)-h)*as;u=Math.max(u,Math.hypot(E,C));let y=Array.isArray(p.traces)?p.traces.filter(S=>S&&Un(S.text,400)).length:0,b=Math.max(0,Number(p.players_present)||0),v=w0(p),D=v.slice(0,6).map(S=>({handle:S,line:R0(p,S)}));d.push({id:M.room_id,name:f,x:E,z:C,certainty:M.certainty,active:p.active===!0||M.certainty==="active",players:b,handles:v,tokens:D,unnamed:Math.max(0,Math.min(b,6)-D.length),more:Math.max(0,Math.max(b,v.length)-6),traces:y,selected:!!e.selectedId&&e.selectedId===M.room_id,followed:!!e.followRoomId&&e.followRoomId===M.room_id,major:!!e.majorRoomId&&e.majorRoomId===M.room_id,bands:s[M.room_id]||a})}let m=new Set(d.map(M=>M.id)),_=[];for(let M of r.edges){if(!m.has(M.from)||!m.has(M.to))continue;let p=(o.get(M.to)?.exits||[]).some(f=>f&&f.hidden!==!0&&String(f.to_room_id)===M.from);_.push({from:M.from,to:M.to,direction:M.direction,dashed:!!M.dashed,oneWay:!p})}return{sites:d,routes:_,radius:u+as*.75}}function hp(n){let e=String(n||"").toUpperCase();return e==="MAJOR"||e==="NOTABLE"?e:"NORMAL"}function dp(n,e,t,i={}){let r=new Set(t),o=[],s=e;for(let c of Array.isArray(n)?n:[]){let h=c?.sequence;if(typeof h!="number"||!Number.isSafeInteger(h)||((s===null||h>s)&&(s=h),e===null||h<=e))continue;let d=String(c.room_id||"");if(!r.has(d))continue;let u=hp(c.tier),m={roomId:d,tier:u,ttl:Cl[u],sequence:h},_=c.projection_id;typeof _=="string"&&_&&(m.projectionId=_),o.push(m)}if(e===null){let c=Number.isSafeInteger(i.snapshotSequence)?i.snapshotSequence:0;return{pulses:[],lastSequence:Math.max(s??c,c)}}if(i.reduce)return{pulses:[],lastSequence:s};o.sort((c,h)=>h.sequence-c.sequence);let a=o.find(c=>c.tier==="MAJOR"),l=o.filter(c=>c.tier!=="MAJOR").slice(0,y0);return{pulses:a?[a,...l]:l,lastSequence:s}}function C0(n,e){let t=i=>i.replace(/\.+$/,"").toLowerCase();return t(n)===t(e)}function pp(n,e,t){if(e===null)return[];let i=new Set(t),r=[];for(let a of Array.isArray(n)?n:[]){let l=a,c=l?.sequence;if(typeof c!="number"||!Number.isSafeInteger(c)||c<=e)continue;let h=String(l.room_id||"");if(!i.has(h))continue;let d=Un(l.line,120);if(!d)continue;let u=hp(l.tier),m=Un(l.actor_label,32),_=Un(l.consequence,120);_&&C0(_,d)&&(_=""),r.push({roomId:h,tier:u,sequence:c,line:d,actor:m,consequence:_,holdMs:b0[u]})}r.sort((a,l)=>l.sequence-a.sequence);let o=r.find(a=>a.tier==="MAJOR"),s=r.filter(a=>a.tier!=="MAJOR").slice(0,2);return o?[o,...s]:s}function mp(n,e){let t=new Set;for(let i of Array.isArray(n)?n:[])for(let r of e)(r.from===i.roomId||r.to===i.roomId)&&t.add(r.from+"|"+r.to);return t}function Il(n){let e=new Map,t=new Set,i=Array.isArray(n?.sites)?n.sites:[];for(let r of i){let o=Array.isArray(r.handles)?r.handles:[];for(let s of o){if(!s||t.has(s))continue;let a=e.get(s);a===void 0?e.set(s,r.id):a!==r.id&&(e.delete(s),t.add(s))}}return e}function P0(n,e,t){for(let i of Array.isArray(n)?n:[])if(i&&(i.from===e&&i.to===t||i.from===t&&i.to===e&&i.oneWay===!1))return!0;return!1}function gp(n,e,t,i){let r=Il(e),o=new Map;for(let a of Array.isArray(i)?i:[]){if(!a||typeof a!="object")continue;let l=a,c=l.sequence;if(typeof c!="number"||!Number.isSafeInteger(c))continue;let h=c+"|"+String(l.room_id||"");o.has(h)||o.set(h,l)}let s=new Map;for(let a of Array.isArray(t)?t:[]){if(!a||a.projectionId!=="agent_move")continue;let l=o.get(a.sequence+"|"+a.roomId);if(!l)continue;let c=Un(l.actor_label,32);if(!c)continue;let h=n?n.get(c):void 0,d=r.get(c);if(!h||!d||h===d||d!==a.roomId||!P0(e.routes,h,d))continue;let u=s.get(c);u&&u.sequence>=a.sequence||s.set(c,{handle:c,from:h,to:d,sequence:a.sequence})}return Array.from(s.values()).sort((a,l)=>a.sequence-l.sequence)}function Nl(n){let e=Math.max(n,as*2);return{minDistance:e*.8,maxDistance:e*3.2,maxTargetRadius:e,minPolarAngle:M0,maxPolarAngle:v0}}function _p(n){let t=Math.max(n,as*2)*2.3,i=40*Math.PI/180,r=-.35;return{target:[0,0,0],position:[t*Math.sin(i)*Math.sin(r),t*Math.cos(i),t*Math.sin(i)*Math.cos(r)]}}function xp(n,e,t,i){return e.selectedId&&e.selectedId!==n.selectedId?e.selectedId:e.followRoomId&&e.followRoomId!==n.followRoomId?e.followRoomId:i?"":t||""}function Ia(n){return n==="MAJOR"?1:0}function Sp(n,e,t){let i=null;for(let s of Array.isArray(e)?e:[]){if(!s)continue;let a=String(s.roomId||"");if(!a)continue;let l=String(s.tier||"").toUpperCase();if(l!=="MAJOR"&&l!=="NOTABLE")continue;let c=typeof s.sequence=="number"&&Number.isFinite(s.sequence)?s.sequence:0,h=l;(!i||Ia(h)>Ia(i.tier)||Ia(h)===Ia(i.tier)&&c>i.sequence)&&(i={roomId:a,tier:h,sequence:c})}if(!i)return null;let r={roomId:i.roomId,tier:i.tier,sequence:i.sequence,at:t};if(!n)return r;if(i.roomId===n.roomId)return null;let o=t-n.at;return o>=ip.DWELL_MS||i.tier==="MAJOR"&&n.tier!=="MAJOR"&&o>=ip.MAJOR_PREEMPT_MS?r:null}var L0={NORMAL:.25,NOTABLE:.45,MAJOR:.7},D0={low:.14,moderate:.28,high:.42},I0={faint:.45,marked:.7,deep:1},Bt=2.4,N0=new U(0,1,0),U0=new Set(["ArrowLeft","ArrowRight","ArrowUp","ArrowDown"]);function nr(n,e){try{return getComputedStyle(document.documentElement).getPropertyValue(n).trim()||e}catch{return e}}function F0(){return{world:new Le(nr("--color-surface-world","#111720")),plate:new Le("#435364"),raised:new Le("#566A7E"),edge:new Le("#9BA8B4"),ink:new Le(nr("--color-text-primary","#F0EAE0")),active:new Le(nr("--color-state-active","#3DDCFF")),warning:new Le(nr("--color-state-warning","#FFB020")),social:new Le(nr("--color-state-social","#D4B68A")),unknown:new Le(nr("--color-state-unknown","#A67BFF")),machine:new Le(nr("--color-text-machine","#A4C6D4")),route:new Le("#6B8698")}}var Mp=[4054271,16756768,5432744,11963647,16739211,7387391];function Ul(n){if(!n)return 13216898;let e=0;for(let t=0;t<n.length;t++)e=e*31+n.charCodeAt(t)>>>0;return Mp[e%Mp.length]}function rr(n,e){try{let t=document.createElement("canvas");t.width=n,t.height=e;let i=typeof t.getContext=="function"?t.getContext("2d"):null;return i?{canvas:t,ctx2d:i}:null}catch{return null}}function Na(n){let e=n>>>0;return()=>{e=e+1831565813|0;let t=Math.imul(e^e>>>15,1|e);return t=t+Math.imul(t^t>>>7,61|t)^t,((t^t>>>14)>>>0)/4294967296}}function O0(){let n=rr(128,128);if(!n)return null;let{canvas:e,ctx2d:t}=n,i=t.createRadialGradient(64,64,0,64,64,64);return i.addColorStop(0,"rgba(255,255,255,1)"),i.addColorStop(.16,"rgba(255,255,255,0.88)"),i.addColorStop(.36,"rgba(255,255,255,0.44)"),i.addColorStop(.64,"rgba(255,255,255,0.14)"),i.addColorStop(.86,"rgba(255,255,255,0.03)"),i.addColorStop(1,"rgba(255,255,255,0)"),t.fillStyle=i,t.fillRect(0,0,128,128),new Vi(e)}function B0(){let n=rr(64,128);if(!n)return null;let{canvas:e,ctx2d:t}=n,i=t.createLinearGradient(0,128,0,0);i.addColorStop(0,"rgba(255,255,255,0.85)"),i.addColorStop(.28,"rgba(255,255,255,0.34)"),i.addColorStop(.65,"rgba(255,255,255,0.09)"),i.addColorStop(1,"rgba(255,255,255,0)"),t.fillStyle=i,t.fillRect(0,0,64,128),t.globalCompositeOperation="multiply";let r=t.createLinearGradient(0,0,64,0);return r.addColorStop(0,"rgba(180,180,180,1)"),r.addColorStop(.25,"rgba(255,255,255,1)"),r.addColorStop(.5,"rgba(195,195,195,1)"),r.addColorStop(.75,"rgba(255,255,255,1)"),r.addColorStop(1,"rgba(180,180,180,1)"),t.fillStyle=r,t.fillRect(0,0,64,128),new Vi(e)}function G0(){let n=rr(256,256);if(!n)return null;let{canvas:e,ctx2d:t}=n,i=t.createLinearGradient(0,0,0,256);i.addColorStop(0,"#0b111c"),i.addColorStop(.32,"#152132"),i.addColorStop(.58,"#243342"),i.addColorStop(.76,"#43382e"),i.addColorStop(.88,"#62452b"),i.addColorStop(1,"#26201c"),t.fillStyle=i,t.fillRect(0,0,256,256);let r=Na(4117);for(let s=0;s<110;s++){let a=r()*256,l=r()*135,c=.22+r()*.65;t.fillStyle=`rgba(236,242,252,${c.toFixed(2)})`,t.fillRect(a,l,r()>.78?1.6:1,r()>.78?1.6:1)}let o=new Vi(e);return o.colorSpace=Ht,o}function z0(){let n=rr(512,512),e=rr(512,512);if(!n||!e)return null;let t=n.ctx2d,i=e.ctx2d,r=t.createRadialGradient(256,256,16,256,256,256);r.addColorStop(0,"#232a35"),r.addColorStop(.22,"#292c34"),r.addColorStop(.38,"#3e3229"),r.addColorStop(.62,"#513c2c"),r.addColorStop(.84,"#3b2c22"),r.addColorStop(1,"#221c19"),t.fillStyle=r,t.fillRect(0,0,512,512),i.fillStyle="#808080",i.fillRect(0,0,512,512);let o=Na(9021);for(let c=0;c<72;c++){let h=o()*Math.PI*2,d=76+o()*170,u=256+Math.cos(h)*d,m=256+Math.sin(h)*d,_=20+o()*48,M=t.createRadialGradient(u,m,0,u,m,_),p=o()>.3;M.addColorStop(0,p?"rgba(186,128,74,0.22)":"rgba(74,126,154,0.16)"),M.addColorStop(1,"rgba(0,0,0,0)"),t.fillStyle=M,t.fillRect(u-_,m-_,_*2,_*2)}let s=t.createRadialGradient(256,256,14,256,256,66);s.addColorStop(0,"rgba(10,14,22,0.46)"),s.addColorStop(.8,"rgba(12,16,24,0.28)"),s.addColorStop(1,"rgba(0,0,0,0)"),t.fillStyle=s,t.fillRect(184,184,144,144),t.lineWidth=1.25,i.lineWidth=1.5;for(let c=20;c<=240;c+=12){let h=c<62;t.strokeStyle=h?"rgba(224,186,130,0.24)":"rgba(238,188,128,0.19)",i.strokeStyle=h?"rgba(56,56,56,0.52)":"rgba(196,196,196,0.4)",t.beginPath(),i.beginPath();for(let d=0;d<=72;d++){let u=d/72*Math.PI*2,m=h?0:Math.sin(u*5+c*.08)*3+Math.cos(u*3-c*.05)*2.2,_=256+Math.cos(u)*(c+m),M=256+Math.sin(u)*(c+m);d===0?(t.moveTo(_,M),i.moveTo(_,M)):(t.lineTo(_,M),i.lineTo(_,M))}t.stroke(),i.stroke()}t.strokeStyle="rgba(218,178,122,0.2)",t.lineWidth=1;for(let c=0;c<12;c++){let h=c/12*Math.PI*2;t.beginPath(),t.moveTo(256+Math.cos(h)*18,256+Math.sin(h)*18),t.lineTo(256+Math.cos(h)*110,256+Math.sin(h)*110),t.stroke()}t.strokeStyle="rgba(92,216,255,0.26)",t.lineWidth=1.4,t.beginPath(),t.arc(256,256,56,0,Math.PI*2),t.stroke();for(let c=0;c<4200;c++){let h=o()*512|0,d=o()*512|0,u=o();t.fillStyle=u>.5?"rgba(255,232,200,0.055)":"rgba(0,0,0,0.08)",t.fillRect(h,d,2,2);let m=92+u*72|0;i.fillStyle=`rgb(${m},${m},${m})`,i.fillRect(h,d,2,2)}let a=new Vi(n.canvas);a.colorSpace=Ht;let l=new Vi(e.canvas);return{map:a,bump:l}}function k0(){let n=rr(256,256),e=rr(256,256);if(!n||!e)return null;let t=n.ctx2d,i=e.ctx2d;t.fillStyle="#c8d0d8",t.fillRect(0,0,256,256),i.fillStyle="#a8a8a8",i.fillRect(0,0,256,256);let r=Na(3141),o=64;for(let l=0;l<4;l++)for(let c=0;c<4;c++){let h=192+(r()*24|0);t.fillStyle=`rgb(${h},${h+4},${h+9})`,t.fillRect(c*o+2,l*o+2,o-4,o-4);let d=152+(r()*34|0);i.fillStyle=`rgb(${d},${d},${d})`,i.fillRect(c*o+2,l*o+2,o-4,o-4),t.fillStyle="#6c7680",i.fillStyle="#505050";for(let[u,m]of[[7,7],[o-9,7],[7,o-9],[o-9,o-9]])t.fillRect(c*o+u,l*o+m,2.5,2.5),i.fillRect(c*o+u,l*o+m,2.5,2.5)}t.strokeStyle="#5e6872",t.lineWidth=2,i.strokeStyle="#363636",i.lineWidth=2.5;for(let l=0;l<=256;l+=o)t.beginPath(),t.moveTo(l,0),t.lineTo(l,256),t.stroke(),t.beginPath(),t.moveTo(0,l),t.lineTo(256,l),t.stroke(),i.beginPath(),i.moveTo(l,0),i.lineTo(l,256),i.stroke(),i.beginPath(),i.moveTo(0,l),i.lineTo(256,l),i.stroke();t.strokeStyle="#e6ecf2",t.lineWidth=3,t.strokeRect(8,8,240,240),i.strokeStyle="#dcdcdc",i.lineWidth=3,i.strokeRect(8,8,240,240);for(let l=0;l<420;l++){let c=r()*256,h=r()*256,d=10+r()*34;t.fillStyle=r()>.5?"rgba(255,255,255,0.055)":"rgba(30,38,48,0.055)",t.fillRect(c,h,d,1)}let s=new Vi(n.canvas);s.colorSpace=Ht,s.wrapS=s.wrapT=vn;let a=new Vi(e.canvas);return a.wrapS=a.wrapT=vn,{map:s,bump:a}}function H0(n,e,t){let i=new Wt,r=new cn(128,128,64,64),o=r.attributes.position;for(let f=0;f<o.count;f++){let E=o.getX(f),C=o.getY(f),y=Math.hypot(E,C),b=0;if(y>15.5){let v=Math.min(1,(y-15.5)/8.5),D=v*v*(3-2*v),S=(Math.sin(E*.14)*Math.cos(C*.13)+.5*Math.sin(E*.25-C*.21)+.65)*1.9,T=Math.min(4.6,(y-15.5)*.18),I=Math.round(S*2.5)/2.5;b=Math.max(0,D*(S*.65+I*.35)*(.45+T*.32))}o.setZ(f,b)}r.computeVertexNormals();let s=new ut({color:n?15919324:2893604,map:n?n.map:null,bumpMap:n?n.bump:null,bumpScale:.34,roughness:.86,metalness:.1}),a=new _e(r,s);a.rotation.x=-Math.PI/2,a.position.y=-.15,a.receiveShadow=!0,a.raycast=()=>{},i.add(a);let l=new _e(new tr(13.65,13.92,80),new ut({color:13936738,emissive:9068068,emissiveIntensity:.52,roughness:.38,metalness:.72,transparent:!0,opacity:.7}));l.rotation.x=-Math.PI/2,l.position.y=-.135,l.raycast=()=>{},i.add(l);let c=new _e(new tr(14.75,14.9,80),new ii({color:5228276,transparent:!0,opacity:.24,blending:yi,depthWrite:!1}));c.rotation.x=-Math.PI/2,c.position.y=-.132,c.raycast=()=>{},i.add(c);let h=new ut({color:3353899,emissive:1053464,emissiveIntensity:.22,roughness:.9,metalness:.12}),d=[[-19,-15,2.2,4.4,2.3,7],[-9,-20,2,3.8,1.9,6],[5,-21,2.6,5,2.5,7],[17,-16,2.4,4.4,2.2,6],[22,-5,2.6,4.8,2,7],[20,9.5,2.3,4.2,1.9,6],[13,19,2.6,4.8,1.8,7],[-5,20.5,2.4,4.4,1.7,6],[-18,15,2.5,4.8,2.2,7],[-22,2,2.8,5.2,2.4,7],[-15,-24,3.6,6.8,3.4,8],[18,-23.5,3.8,7,3.3,8]];for(let f=0;f<d.length;f++){let[E,C,y,b,v,D]=d[f],S=new _e(new wi(y,b,v,D),h);S.position.set(E,v*.42-.15,C),S.rotation.y=f*.85,S.castShadow=!0,S.receiveShadow=!0,S.raycast=()=>{},i.add(S)}if(e){let f=new _e(new wi(48,48,28,48,1,!0),new ii({map:e,side:wt,fog:!1,depthWrite:!1}));f.position.y=8,f.raycast=()=>{},i.add(f)}let u=140,m=new Float32Array(u*3),_=Na(1337);for(let f=0;f<u;f++){let E=_()*Math.PI*2,C=3.2+_()*20,y=.5+_()*4.8;m[f*3]=Math.cos(E)*C,m[f*3+1]=y,m[f*3+2]=Math.sin(E)*C}let M=new pt;M.setAttribute("position",new fi(m,3));let p=new Zo(M,new jn({color:15912864,map:t||null,size:t?.3:.13,transparent:!0,opacity:.48,blending:yi,depthWrite:!1}));return p.raycast=()=>{},i.add(p),i}var Fl=n=>1-Math.pow(1-n,3);function V0(n,e){let t=e.canvas,i=e.labels,r=!!e.reduce,o=typeof e.onSelect=="function"?e.onSelect:()=>{},s=typeof e.onLost=="function"?e.onLost:()=>{},a=F0(),l=O0(),c=B0(),h=G0(),d=z0(),u=k0();try{let P=typeof t.getContext=="function"?t.getContext("webgl2")||t.getContext("webgl"):null;P&&typeof P.pixelStorei=="function"&&(P.pixelStorei(P.UNPACK_FLIP_Y_WEBGL,!1),P.pixelStorei(P.UNPACK_PREMULTIPLY_ALPHA_WEBGL,!1))}catch{}let m=new os({canvas:t,antialias:!0,powerPreference:"low-power"});m.setPixelRatio(Math.min(window.devicePixelRatio||1,2)),m.setClearColor(1251618,1),m.toneMapping=lr,m.toneMappingExposure=1.44,m.shadowMap.enabled=!0,m.shadowMap.type=gn;let _=new La({element:i}),M=new Wo;M.fog=new Vo(1449255,.0082);let p=H0(d,h,l);M.add(p),M.add(new $o(16507580,2502978,1.35));let f=new Xr(16764814,2.55);f.position.set(-14,15,11),f.castShadow=!0,f.shadow.mapSize.set(2048,2048),f.shadow.radius=2.5,f.shadow.camera.left=-16,f.shadow.camera.right=16,f.shadow.camera.top=16,f.shadow.camera.bottom=-16,f.shadow.camera.near=2,f.shadow.camera.far=48,f.shadow.bias=-4e-4,f.shadow.normalBias=.025,M.add(f);let E=new Xr(5952255,1.35);E.position.set(14,9,-12),M.add(E);let C=new Qo(16759398,2.3,28,1.25);C.position.set(0,3.6,1),M.add(C);let y=new Nt(38,1,.1,2e3),b=new Pa(y,t);b.enableDamping=!0,b.dampingFactor=.08,b.screenSpacePanning=!1,b.listenToKeyEvents(n);let v={subBase:new Pt(Bt+.34,.14,Bt+.34),collar:new Pt(Bt+.14,.07,Bt+.14),plate:new Pt(Bt,.22,Bt),trimX:new Pt(Bt+.04,.045,.05),trimZ:new Pt(.05,.045,Bt+.04),cornerPost:new Pt(.12,.12,.12),ring:new Pt(Bt+.56,.04,Bt+.56),scar:new Pt(Bt-.56,.02,Bt-.56),beacon:new wi(Bt*.48,Bt*.62,1.45,24,1,!0),pipBase:new wi(.18,.21,.055,10),pipRing:new tr(.18,.25,16),pip:new wi(.11,.19,.36,8),pipCollar:new kr(.125,.022,6,12),pipHead:new er(.13,0),pipVisor:new Pt(.14,.055,.09),trailDot:new er(.065,0),core:new er(.28,0),torus:new kr(.46,.036,8,28),torusSm:new kr(.32,.028,8,24),pillar:new Pt(.16,.88,.16),beam:new Pt(.12,.12,1),fin:new Pt(.08,.62,.38),dish:new Jo(.36,.22,14,1,!0),monolith:new Pt(.2,.96,.1),silo:new wi(.21,.23,.68,12),dome:new wi(.28,.56,.36,8),crate:new Pt(.34,.22,.24),pipe:new wi(.065,.065,.85,8),unitBox:new Pt(1,1,1),trace:new er(.13,0),arrow:new Jo(.19,.5,6),pulse:new tr(1.7,1.98,48),halo:new cn(1,1)},D=new Set(Object.values(v)),S=[],T=[],I=new Wt;M.add(I);let G=null,z={sites:[],routes:[],radius:8},W={},O=null,X=[],Z=null,J=!1,ae=null,Q=!1,se=0,le=!1,Oe=!1,ve=new Map,mt=[],it=[],ot=new Map,te=new Map,ne=[],we=[];function Xe(P,N){return P.userData.siteId=N,P}function de(P,N,Y,K,H){let j=new _e(v.unitBox,K);return j.scale.set(P,N,Y),H!==!1&&(j.castShadow=!0,j.receiveShadow=!0),j}function nt(P,N){let Y=new Wt,K=[],H=new Le(2041649).lerp(new Le(P),.34),j=new ii({color:P,transparent:!0,opacity:N?.8:.36,blending:yi,depthWrite:!1,side:ri});K.push(j);let ze=new _e(v.pipRing,j);ze.rotation.x=-Math.PI/2,ze.position.y=.015,ze.raycast=()=>{},Y.add(ze);let Se=new ut({color:3161162,roughness:.42,metalness:.68});K.push(Se);let Me=new _e(v.pipBase,Se);Me.position.y=.04,Me.castShadow=!0,Me.receiveShadow=!0,Y.add(Me);let qe=new ut({color:H,emissive:P,emissiveIntensity:N?.32:.12,roughness:.38,metalness:.4});K.push(qe);let We=new _e(v.pip,qe);We.position.y=.24,We.castShadow=!0,We.receiveShadow=!0,Y.add(We);let je=new ut({color:P,emissive:P,emissiveIntensity:N?1.25:.4,roughness:.22,metalness:.42});K.push(je);let De=new _e(v.pipCollar,je);De.rotation.x=Math.PI/2,De.position.y=.43,Y.add(De);let g=new Wt;g.position.y=.59;let A=new ut({color:16317439,emissive:P,emissiveIntensity:N?1.45:.45,roughness:.16,metalness:.3});K.push(A);let R=new _e(v.pipHead,A);R.castShadow=!0,g.add(R);let L=new ut({color:1054752,emissive:P,emissiveIntensity:N?1.8:.5,roughness:.1,metalness:.6});K.push(L);let F=new _e(v.pipVisor,L);return F.position.set(0,0,.07),g.add(F),Y.add(g),Y.scale.setScalar(1.14),{root:Y,head:g,bodyMat:qe,mats:K}}function Ut(P,N,Y){let K=String(N.id||""),H=new Wt;H.position.set(0,Y,0),H.scale.setScalar(1.22),P.add(H);let j=0,ze=new ut({color:3556178,roughness:.42,metalness:.68}),Se=new ut({color:7571354,roughness:.34,metalness:.64}),Me=new ut({color:12490332,roughness:.34,metalness:.74}),qe=new ut({color:10285311,emissive:4054271,emissiveIntensity:1.68,roughness:.18}),We=new ut({color:16768140,emissive:16751130,emissiveIntensity:1.78,roughness:.18}),je=new ut({color:14271231,emissive:10777855,emissiveIntensity:1.6,roughness:.2});if(K.includes("generator")){let De=new _e(v.dome,ze);De.scale.set(1.1,.38,1.1),De.position.set(0,j+.07,-.58),De.castShadow=!0,De.receiveShadow=!0,H.add(De);for(let L of[-.62,.62]){let F=new _e(v.fin,Se);F.position.set(L,j+.34,-.58),F.rotation.z=L<0?.16:-.16,F.castShadow=!0,F.receiveShadow=!0,H.add(F);let ce=de(.11,.06,.34,Me);ce.position.set(L*.94,j+.66,-.58),H.add(ce)}let g=new _e(v.core,We);g.position.set(0,j+.56,-.58),g.castShadow=!0,g.userData.spin=1.25,H.add(g),S.push(g);let A=new _e(v.torus,qe);A.position.copy(g.position),A.rotation.x=Math.PI/3,A.userData.spin=-.85,H.add(A),S.push(A);let R=new _e(v.torusSm,qe);if(R.position.copy(g.position),R.rotation.set(-Math.PI/3.4,.6,Math.PI/4),R.userData.spin=1.1,H.add(R),S.push(R),l){let L=new _e(v.halo,new ii({map:l,color:16754227,transparent:!0,opacity:.45,blending:yi,depthWrite:!1}));L.rotation.x=-Math.PI/2,L.position.set(0,j+.02,-.58),L.scale.set(1.6,1.6,1),L.raycast=()=>{},H.add(L)}}else if(K.includes("relay")){let De=de(.76,.18,.66,ze);De.position.set(.5,j+.09,-.62),H.add(De);let g=new _e(v.pillar,Se);g.scale.set(.85,1.15,.85),g.position.set(.5,j+.58,-.62),g.castShadow=!0,H.add(g);for(let he of[.36,.62,.86]){let $=de(.32,.04,.32,Me);$.position.set(.5,j+he,-.62),H.add($)}let A=new Wt;A.position.set(.5,j+1.12,-.62),A.userData.spin=.55;let R=new _e(v.dish,new ut({color:10796747,emissive:4054271,emissiveIntensity:.25,roughness:.32,metalness:.58,side:ri}));R.rotation.z=.68,R.castShadow=!0,A.add(R);let L=new _e(v.trace,qe);L.scale.setScalar(.55),L.position.set(-.18,.14,0),A.add(L),H.add(A),S.push(A);let F=de(.055,.74,.055,Se);F.position.set(-.58,j+.37,-.74),H.add(F);let ce=new _e(v.trace,We);ce.scale.setScalar(.45),ce.position.set(-.58,j+.78,-.74),H.add(ce)}else if(K.includes("archive")){let De=new _e(v.dome,ze);De.scale.set(1.5,.35,1),De.position.set(0,j+.06,-.64),De.receiveShadow=!0,H.add(De);let g=new ut({color:1713458,emissive:2525352,emissiveIntensity:.34,metalness:.62,roughness:.24}),A=[[-.78,-.52,.35,.84],[-.42,-.76,.18,1.02],[0,-.84,0,1.18],[.42,-.76,-.18,1.02],[.78,-.52,-.35,.84]];for(let[L,F,ce,he]of A){let $=new _e(v.monolith,g);$.scale.set(.9,he,1),$.position.set(L,j+.48*he,F),$.rotation.y=ce,$.castShadow=!0,$.receiveShadow=!0,H.add($);let fe=de(.04,.62*he,.115,qe,!1);fe.position.set(L,j+.5*he,F),fe.rotation.y=ce,H.add(fe)}let R=new _e(v.core,qe);R.scale.setScalar(.68),R.position.set(0,j+.58,-.44),R.userData.spin=.9,H.add(R),S.push(R)}else if(K.includes("civic")){let De=[[-.86,-.82],[.86,-.82],[-.86,.14],[.86,.14]];for(let[L,F]of De){let ce=new _e(v.pillar,Se);ce.scale.set(.75,F<0?.96:.62,.75),ce.position.set(L,j+(F<0?.42:.27),F),ce.castShadow=!0,H.add(ce);let he=new _e(v.trace,We);he.scale.setScalar(.58),he.position.set(L,j+(F<0?.92:.62),F),H.add(he)}let g=new _e(v.torus,Me);g.scale.setScalar(1.32),g.rotation.x=Math.PI/2,g.position.set(0,j+.05,-.34),H.add(g);let A=new _e(v.torusSm,We);A.rotation.x=Math.PI/2,A.position.set(0,j+.09,-.34),H.add(A);let R=new _e(v.core,We);R.scale.set(.62,.42,.62),R.position.set(0,j+.66,-.34),R.userData.spin=.5,H.add(R),S.push(R)}else if(K.includes("transit")){for(let g of[-.74,-.24]){let A=new _e(v.torus,Se);A.position.set(0,j+.44,g),A.scale.set(1.48,1.32,1.4),A.castShadow=!0,H.add(A);let R=new _e(v.torus,qe);R.position.set(0,j+.44,g),R.scale.set(1.36,1.22,.65),H.add(R)}for(let[g,A]of[[-.86,-.49],[.86,-.49],[-.86,.2],[.86,.2]]){let R=de(.11,.26,.11,ze);R.position.set(g,j+.13,A),H.add(R);let L=de(.12,.04,.12,qe,!1);L.position.set(g,j+.28,A),H.add(L)}let De=new _e(v.torusSm,qe);De.rotation.x=Math.PI/2,De.position.set(0,j+.03,-.49),De.userData.spin=.7,H.add(De),S.push(De)}else if(K.includes("foundry")){let De=new _e(v.silo,ze);De.scale.set(1.18,1.55,1.18),De.position.set(-.62,j+.52,-.68),De.castShadow=!0,H.add(De);let g=new _e(v.torusSm,Me);g.rotation.x=Math.PI/2,g.scale.setScalar(.86),g.position.set(-.62,j+.88,-.68),H.add(g);let A=new _e(v.trace,We);A.scale.set(.95,.35,.95),A.position.set(-.62,j+1.06,-.68),H.add(A);let R=de(1.06,.22,.44,ze);R.position.set(.28,j+.11,-.62),H.add(R);let L=de(.9,.08,.26,We,!1);L.position.set(.28,j+.22,-.62),H.add(L);for(let F of[-.08,.28,.64]){let ce=new _e(v.fin,Se);ce.scale.set(.9,.72,.85),ce.position.set(F,j+.38,-.78),ce.rotation.x=.28,ce.castShadow=!0,H.add(ce)}}else if(K.includes("storage")){for(let[L,F,ce]of[[-.68,-.72,1.15],[-.22,-.78,.95],[-.46,-.34,.82]]){let he=new _e(v.silo,Se);he.scale.set(.95,ce,.95),he.position.set(L,j+.34*ce,F),he.castShadow=!0,he.receiveShadow=!0,H.add(he);let $=new _e(v.torusSm,ze);$.rotation.x=Math.PI/2,$.scale.setScalar(.72),$.position.set(L,j+.46*ce,F),H.add($)}let De=new ut({color:8086342,roughness:.62,metalness:.28}),g=new _e(v.crate,De);g.position.set(.48,j+.11,-.68),g.castShadow=!0,H.add(g);let A=new _e(v.crate,ze);A.position.set(.52,j+.33,-.66),A.rotation.y=.18,A.castShadow=!0,H.add(A);for(let L of[.16,.86]){let F=de(.08,.78,.08,Me);F.position.set(L,j+.39,-.68),H.add(F)}let R=de(.82,.08,.14,Me);R.position.set(.51,j+.78,-.68),H.add(R)}else if(K.includes("vault")){let De=new _e(v.dome,ze);De.scale.set(1.25,1.15,1.15),De.position.set(0,j+.21,-.64),De.castShadow=!0,De.receiveShadow=!0,H.add(De);let g=de(.46,.1,.46,Se);g.position.set(0,j+.44,-.64),H.add(g);for(let L of[-.62,.62]){let F=new _e(v.pipe,Me);F.rotation.z=Math.PI/2,F.scale.set(1,.56,1),F.position.set(L,j+.14,-.64),F.castShadow=!0,H.add(F)}let A=de(.52,.03,.22,qe,!1);A.position.set(0,j+.02,-.12),H.add(A);let R=new _e(v.trace,We);R.scale.setScalar(.48),R.position.set(0,j+.56,-.64),H.add(R)}else if(K.includes("outer")){let De=new _e(v.pillar,Se);De.scale.set(.85,1.12,.85),De.position.set(-.62,j+.49,-.68),De.castShadow=!0,H.add(De);let g=de(.08,.08,1.05,Me);g.position.set(-.32,j+.92,-.44),g.rotation.set(-.34,-.58,0),H.add(g);for(let R of[.22,.74]){let L=de(.06,.52,.06,ze);L.position.set(R,j+.26,-.76),H.add(L);let F=de(.14,.07,.09,We,!1);F.position.set(R,j+.54,-.72),F.rotation.x=.35,H.add(F)}let A=new _e(v.core,je);A.scale.setScalar(.55),A.position.set(-.62,j+1.12,-.68),A.userData.spin=1.1,H.add(A),S.push(A)}else{for(let R of[-.66,.66]){let L=new _e(v.pillar,ze);L.scale.set(1.25,1.18,1.15),L.position.set(R,j+.52,-.68),L.castShadow=!0,L.receiveShadow=!0,H.add(L);let F=de(.05,.76,.2,qe,!1);F.position.set(R*.84,j+.5,-.68),H.add(F)}let De=de(1.76,.16,.3,Se);De.position.set(0,j+1.06,-.68),H.add(De);let g=de(1.18,.06,.1,We,!1);g.position.set(0,j+1.16,-.68),H.add(g);let A=de(.84,.03,.1,je,!1);A.position.set(0,j+.02,-.68),H.add(A)}}function rt(P){let N=Ul(P),Y=new Wt,K=new ut({color:N,roughness:.32,metalness:.35,emissive:N,emissiveIntensity:.9}),H=new _e(v.pip,K);H.castShadow=!0,Y.add(H);let j=new ut({color:16777215,emissive:N,emissiveIntensity:1.35,roughness:.18}),ze=new _e(v.pipHead,j);ze.position.y=.34,Y.add(ze);let Se=[];for(let Me=0;Me<6;Me++){let qe=new ii({color:N,transparent:!0,opacity:.65*(1-Me/6),blending:yi,depthWrite:!1}),We=new _e(v.trailDot,qe);We.scale.setScalar(1-Me*.13),We.raycast=()=>{},I.add(We),Se.push({mesh:We,mat:qe})}return{group:Y,mat:K,extraMats:[j],trail:Se}}function st(P){if(P.mesh&&I.remove(P.mesh),P.mat&&P.mat.dispose(),P.extraMats)for(let N of P.extraMats)N.dispose();if(P.trail)for(let N of P.trail)I.remove(N.mesh),N.mat.dispose();P.mesh=null,P.mat=null,P.extraMats=null,P.trail=null}function gt(){let P=Math.max(1,n.clientWidth),N=Math.max(1,n.clientHeight);if(m.setSize(P,N,!1),_.setSize(P,N),y.aspect=P/N,y.updateProjectionMatrix(),Q&&!J&&!Z&&ye()){let Y=pe();y.position.copy(Y.position),b.update()}Ve()}function Ve(){if(!(Oe||se)){if(document.hidden){le=!0;return}se=requestAnimationFrame(Et)}}function Et(P){if(se=0,Oe)return;let N=!1;if(Z){let K=Z.ms>0?Math.min(1,(P-Z.start)/Z.ms):1,H=Fl(K);b.target.lerpVectors(Z.fromTarget,Z.toTarget,H),y.position.lerpVectors(Z.fromPos,Z.toPos,H),b.update(),K>=1?Z=null:N=!0}for(let K of ve.values())K.position.y=0;X=X.filter(K=>{let H=ve.get(K.roomId);K.start===void 0&&(K.start=P);let j=(P-K.start)/K.ttl;return!H||j>=1?(K.ring&&(I.remove(K.ring),K.ring.material.dispose()),!1):(H.position.y=Math.max(H.position.y,Math.sin(j*Math.PI)*L0[K.tier]),K.ring&&(K.ring.scale.setScalar(1+j*.9),K.ring.material.opacity=.92*(1-j)),N=!0,!0)});for(let K=we.length-1;K>=0;K--){let H=we[K];if(r||!H.ring)continue;let j=H.ms>0?(P-H.start)/H.ms:1;if(j>=1){me(H.roomId);continue}H.ring.scale.setScalar(1.15+.25*Math.sin(j*Math.PI*6)),H.ring.material.opacity=.58*(1-j*j),N=!0}for(let K=ne.length-1;K>=0;K--){let H=ne[K];if(!H.mesh||!H.mat||!H.destMesh)continue;H.start<0&&(H.start=P);let j=Math.min(1,(P-H.start)/Ll),ze=Fl(j),Se=H.from.x+(H.to.x-H.from.x)*ze,Me=H.from.y+(H.to.y-H.from.y)*ze+Math.sin(j*Math.PI)*.78,qe=H.from.z+(H.to.z-H.from.z)*ze;H.mesh.position.set(Se,Me,qe);let We=H.to.x-H.from.x,je=H.to.z-H.from.z;if(We*We+je*je>1e-6&&(H.mesh.rotation.y=Math.atan2(We,je),H.mesh.rotation.x=.24*Math.sin(j*Math.PI)),H.trail)for(let De=0;De<H.trail.length;De++){let g=Math.max(0,j-(De+1)*.045),A=Fl(g);H.trail[De].mesh.position.set(H.from.x+We*A,H.from.y+(H.to.y-H.from.y)*A+Math.sin(g*Math.PI)*.78+.14,H.from.z+je*A),H.trail[De].mat.opacity=g>0?.62*(1-De/H.trail.length)*(1-j*.35):0}j>=1?(st(H),H.destMesh.visible=!0,H.destPlate&&(H.destPlate.visible=!0,H.destPlate.element&&(H.destPlate.element.style.visibility="")),ne.splice(K,1)):N=!0}let Y=mp(X.filter(K=>K.projectionId==="agent_move"),z.routes);for(let K of mt){let H=Y.has(K.from+"|"+K.to);for(let j of K.mats)j.color.copy(H?a.active:a.route),j.emissive&&(j.emissive.setHex(H?a.active.getHex():3434109),j.emissiveIntensity=H?2.1:.72)}if(!r){let K=P*.001;for(let H of S)H.rotation.y=K*(H.userData.spin||.7);for(let H of T)H.position.y=H.userData.baseY+Math.sin(K*2.2+(H.userData.phase||0))*.055,H.userData.head&&(H.userData.head.rotation.y=K*1.25);!document.hidden&&(S.length>0||T.length>0)&&(N=!0)}b.enableDamping&&b.update(),m.render(M,y),_.render(M,y),Gt(),N&&Ve()}function Gt(){let P=Array.from(i.querySelectorAll(".stage3d-label, .stage3d-nameplate"));P.sort((Se,Me)=>Number(Me.dataset.priority||0)-Number(Se.dataset.priority||0));let N=n.getBoundingClientRect(),Y=[],K=8,H=6,j=58,ze=(Se,Me)=>Se.left<Me.right+K&&Se.right>Me.left-K&&Se.top<Me.bottom+H&&Se.bottom>Me.top-H;for(let Se of P){if(Se.classList.remove("is-tucked"),Se.style.marginLeft="",Se.style.marginTop="",Se.style.display==="none")continue;let Me=Se.getBoundingClientRect();if(Me.width<=0||Me.height<=0)continue;let qe=0,We=0,je={left:Me.left,right:Me.right,top:Me.top,bottom:Me.bottom},De=Se.classList.contains("stage3d-nameplate"),g=!Y.some(A=>ze(je,A));if(!g)for(let A=0;A<8;A++){let R=0,L=0,F=0;for(let he of Y){if(!ze(je,he))continue;F++;let $=Math.min(je.right+K-he.left,he.right+K-je.left),fe=Math.min(je.bottom+H-he.top,he.bottom+H-je.top),Re=(je.left+je.right)*.5-(he.left+he.right)*.5,Ke=(je.top+je.bottom)*.5-(he.top+he.bottom)*.5;fe<=$*1.15?L+=(Ke===0?De?-1:1:Math.sign(Ke))*(fe+3):R+=(Re===0?1:Math.sign(Re))*($+3)}if(!F){g=!0;break}qe+=R,We+=L;let ce=Math.hypot(qe,We);if(ce>j&&(qe=qe/ce*j,We=We/ce*j),N.width>40&&N.height>40){let he=N.left+8-Me.left,$=N.right-8-Me.right,fe=N.top+8-Me.top,Re=N.bottom-8-Me.bottom;he<=$&&(qe=Math.max(he,Math.min($,qe))),fe<=Re&&(We=Math.max(fe,Math.min(Re,We)))}if(je={left:Me.left+qe,right:Me.right+qe,top:Me.top+We,bottom:Me.bottom+We},!Y.some(he=>ze(je,he))){g=!0;break}}g?(Math.abs(qe)>=1&&(Se.style.marginLeft=Math.round(qe)+"px"),Math.abs(We)>=1&&(Se.style.marginTop=Math.round(We)+"px"),Y.push(je)):Se.classList.add("is-tucked")}}function si(P){let N=document.createElement("div");N.className="stage3d-label";let Y=[];P.active&&Y.push("active"),P.selected&&Y.push("selected"),P.followed&&Y.push("followed"),P.major&&Y.push("major"),(P.certainty==="partial"||P.certainty==="unknown")&&Y.push("partial"),N.setAttribute("data-state",Y.join(" ")),N.dataset.priority=String((P.selected?32:0)+(P.followed?16:0)+(P.major?8:0)+(P.active?4:0)+(P.players>0?2:0)),N.title=P.name;let K=document.createElement("span");if(K.textContent=P.name,N.append(K),P.handles.length){let Se=document.createElement("span");Se.className="stage3d-handles",Se.textContent=P.handles.join(", "),N.append(Se)}else if(P.players>0){let Se=document.createElement("span");Se.className="stage3d-handles",Se.textContent=P.players===1?"1 agent":P.players+" agents",N.append(Se)}for(let Se of P.tokens.filter(Me=>Me.line).slice(0,2)){let Me=document.createElement("span");Me.className="stage3d-lines",Me.textContent=Se.line,N.append(Me)}let H=lp(P.bands);if(H){let Se=document.createElement("span");Se.className="stage3d-bands",Se.textContent=H,N.append(Se)}let j=P.major?"MAJOR":P.followed?"Followed":P.selected?"Selected":"";if(j){let Se=document.createElement("span");Se.className="stage3d-state",Se.textContent=j,N.append(Se)}N.addEventListener("click",Se=>{Se.stopPropagation(),o(P.id)});let ze=new Nn(N);return ze.position.set(0,.12,Bt/2+.24),ze}function At(P){let N=new Wt;N.userData.siteId=P.id;let Y=P.certainty==="partial"||P.certainty==="unknown",K=P.selected?.14:0;if(l){let $=new _e(v.halo,new ii({map:l,color:329482,transparent:!0,opacity:Y?.35:.62,depthWrite:!1}));$.rotation.x=-Math.PI/2,$.position.y=-.105,$.scale.set(Bt+1.4,Bt+1.4,1),$.renderOrder=-2,$.raycast=()=>{},N.add($)}let H=new _e(v.subBase,new ut({color:1580582,roughness:.72,metalness:.48,transparent:Y,opacity:Y?.5:1}));H.position.y=-.02+K*.4,H.castShadow=!0,H.receiveShadow=!0,Xe(H,P.id),N.add(H);let j=new _e(v.collar,new ut({color:3884884,roughness:.38,metalness:.68,transparent:Y,opacity:Y?.52:1}));j.position.y=.08+K*.75,j.castShadow=!0,j.receiveShadow=!0,Xe(j,P.id),N.add(j);let ze=(P.selected||P.active?a.raised:a.plate).clone();P.bands.pressure&&ze.lerp(a.warning,D0[P.bands.pressure]);let Se=new ut({color:ze,map:u?u.map:null,bumpMap:u?u.bump:null,bumpScale:.055,roughness:.56,metalness:.32,transparent:Y,opacity:Y?.58:1}),Me=new _e(v.plate,Se);Me.position.y=.21+K,Me.castShadow=!0,Me.receiveShadow=!0,Xe(Me,P.id),N.add(Me);let qe=P.major?a.warning:P.selected?a.ink:P.active||P.followed?a.active:a.edge,We=P.major||P.selected||P.active||P.followed,je=new ut({color:qe,emissive:qe,emissiveIntensity:P.major?1.15:P.active||P.followed?.92:P.selected?.78:.12,roughness:.28,metalness:.45,transparent:Y,opacity:Y?.55:1}),De=Me.position.y+.095,g=Bt/2;for(let $ of[-g,g]){let fe=new _e(v.trimX,je);fe.position.set(0,De,$),N.add(fe)}for(let $ of[-g,g]){let fe=new _e(v.trimZ,je);fe.position.set($,De,0),N.add(fe)}let A=new ut({color:2897474,roughness:.4,metalness:.72});for(let[$,fe]of[[-g,-g],[g,-g],[-g,g],[g,g]]){let Re=new _e(v.cornerPost,A);Re.position.set($,Me.position.y+.075,fe),Re.castShadow=!0,N.add(Re)}if(Y){let $=new Qn(new zr(v.plate),new Hr({color:qe,dashSize:.25,gapSize:.18}));$.position.copy(Me.position),$.computeLineDistances(),N.add($)}if(P.followed||P.major){let $=new Qn(new zr(v.ring),new ln({color:P.major?a.warning:a.active}));$.position.y=.01,N.add($)}let R=cp(P);if(R>0&&l){let $=P.major?a.warning:P.followed||P.active?a.active:a.social,fe=new _e(v.halo,new ii({map:l,color:$,transparent:!0,opacity:Math.min(.86,R*1.48),blending:yi,depthWrite:!1}));if(fe.rotation.x=-Math.PI/2,fe.position.y=-.07,fe.scale.set(fn.SIZE*1.28,fn.SIZE*1.28,1),fe.userData.glow=!0,fe.renderOrder=-1,fe.raycast=()=>{},N.add(fe),c&&(P.major||P.followed||P.active)){let Re=new _e(v.beacon,new ii({map:c,color:$,transparent:!0,opacity:P.major?.38:P.followed?.3:.2,blending:yi,depthWrite:!1,side:ri}));Re.position.y=Me.position.y+.78,Re.raycast=()=>{},N.add(Re)}}if(P.bands.scar){let $=new Qn(new zr(v.scar),new Hr({color:a.unknown,dashSize:.2,gapSize:.12,transparent:!0,opacity:I0[P.bands.scar]}));$.position.y=Me.position.y+.13,$.computeLineDistances(),N.add($)}let L=Me.position.y+.11;Ut(N,P,L);let F=P.tokens.slice(0,6),ce=F.length+P.unnamed,he=new Map;for(let $=0;$<ce;$++){let fe=F[$],Re=Ul(fe?fe.handle:""),Ke=nt(Re,!!fe),Ye=Ke.root,Ne=L+.01,ht=$%3,Rt=Math.floor($/3),yt=Math.min(3,ce-Rt*3),St=(ht-(yt-1)*.5)*.68,Jt=Rt===0?.24:.74;if(Ye.position.set(St,Ne,Jt),Ye.userData.baseY=Ne,Ye.userData.phase=$*1.15,Ye.userData.head=Ke.head,N.add(Ye),T.push(Ye),fe){Ye.userData.handle=fe.handle;let Pe=document.createElement("div");Pe.className="stage3d-nameplate",Pe.textContent=fe.handle,Pe.dataset.priority="-1";let kt=new Nn(Pe),ct=yt===1?P.x>=0?.72:-.72:St*.38;kt.position.set(Ye.position.x+ct,Ne+1.38+Rt*.22,Ye.position.z-.1),N.add(kt),he.set(fe.handle,{mesh:Ye,nameplate:kt})}}if(N.userData.tokens=he,P.more>0){let $=document.createElement("div");$.className="stage3d-more",$.textContent="+"+P.more;let fe=new Nn($);fe.position.set(.95,L+.35,.95),N.add(fe)}if(P.traces>0){let $=new _e(v.trace,new ut({color:a.machine,emissive:a.machine,emissiveIntensity:.75,roughness:.25}));$.position.set(Bt/2-.3,L+.14,Bt/2-.3),N.add($)}return N.add(si(P)),N.position.set(P.x,0,P.z),N}function It(P,N,Y){let K=new Wt,H=Y.x-N.x,j=Y.z-N.z,ze=Math.hypot(H,j);if(ze<.01)return K;let Se=(N.x+Y.x)*.5,Me=(N.z+Y.z)*.5,qe=Math.atan2(H,j),We=new ut({color:2897990,roughness:.44,metalness:.65,transparent:P.dashed,opacity:P.dashed?.62:1});We.userData.isBed=!0;let je=de(.38,.055,ze,We,!1);je.receiveShadow=!0,je.position.set(Se,-.05,Me),je.rotation.y=qe,K.add(je);let De=new ut({color:a.route.clone(),emissive:new Le(3434109),emissiveIntensity:.72,roughness:.24,metalness:.25});if(De.userData.routeGlow=!0,P.dashed){let g=Math.max(3,Math.floor(ze/.55));for(let A=0;A<g;A++){let R=(A+.5)/g,L=de(.11,.034,.28,De,!1);L.position.set(N.x+H*R,-.015,N.z+j*R),L.rotation.y=qe,K.add(L)}}else{let g=de(.095,.034,ze,De,!1);g.position.set(Se,-.015,Me),g.rotation.y=qe,K.add(g)}if(P.oneWay){let g=new U(H,0,j).normalize(),A=new ut({color:a.route.clone(),emissive:new Le(3434109),emissiveIntensity:.85,roughness:.22});A.userData.routeGlow=!0;let R=new _e(v.arrow,A);R.position.set(N.x+g.x*ze*.58,.06,N.z+g.z*ze*.58),R.quaternion.setFromUnitVectors(N0,g),K.add(R)}return K}function k(){for(let P of ne)st(P);ne.length=0}function Kt(){for(let P of ne)st(P),P.destMesh=null,P.destPlate=null}function _t(P){let N=!1;for(let Y=ne.length-1;Y>=0;Y--){let K=ne[Y],H=K.start<0?P:K.start;if(P-H>=Ll){ne.splice(Y,1);continue}let j=ve.get(K.fromId),ze=ve.get(K.toId),Se=ze&&ze.userData.tokens?ze.userData.tokens.get(K.handle):null;if(!j||!ze||!Se||!Se.mesh){ne.splice(Y,1);continue}let Me=Se.mesh.position.y+.24,qe=rt(K.handle),We=qe.mat instanceof ut?qe.mat:new ut({color:Ul(K.handle)}),je=qe.group;je.position.set(j.position.x,Me,j.position.z),I.add(je),K.start=H,K.mesh=je,K.mat=We,K.extraMats=qe.extraMats,K.trail=qe.trail,K.from=new U(j.position.x,Me,j.position.z),K.to=new U(ze.position.x,Me,ze.position.z),K.destMesh=Se.mesh,K.destPlate=Se.nameplate||null,Se.mesh.visible=!1,Se.nameplate&&(Se.nameplate.visible=!1,Se.nameplate.element&&(Se.nameplate.element.style.visibility="hidden")),N=!0}N&&Ve()}function w(){Kt();for(let N of we)N.timer&&clearTimeout(N.timer),N.timer=0,N.ring&&(I.remove(N.ring),N.ring.material&&N.ring.material.dispose()),N.label&&N.label.classList.remove("is-moment"),N.ring=null,N.label=null;let P=new Set;I.traverse(N=>{N.isCSS2DObject&&N.element&&N.element.parentNode&&N.element.remove(),N.geometry&&!D.has(N.geometry)&&N.geometry.dispose(),N.material&&!P.has(N.material)&&(P.add(N.material),N.material.dispose())}),M.remove(I),I=new Wt,M.add(I),ve.clear(),mt=[],S=[],T=[];for(let N of X)N.ring=null}function x(P){G&&(G.element&&G.element.parentNode&&G.element.remove(),M.remove(G));let N=document.createElement("div");N.className="stage3d-compass",N.textContent="N",G=new Nn(N),G.position.set(0,.05,-P-1.2),M.add(G)}function V(P){let N=Nl(P);b.minDistance=N.minDistance,b.maxDistance=N.maxDistance,b.maxTargetRadius=N.maxTargetRadius,b.minPolarAngle=N.minPolarAngle,b.maxPolarAngle=N.maxPolarAngle}function q(P,N){Z={start:performance.now(),ms:r?0:op,fromTarget:b.target.clone(),toTarget:P,fromPos:y.position.clone(),toPos:N},Ve()}function ee(P){let N=ve.get(P);if(!N)return;let Y=new U(N.position.x,0,N.position.z),K=y.position.clone().sub(b.target);q(Y,Y.clone().add(K))}function pe(){let P=_p(z.radius),N=new U(...P.position).multiplyScalar(.81),Y=Math.atan(Math.tan(y.fov*Math.PI/360)*y.aspect),K=z.radius*.92/Math.tan(Y),H=Nl(z.radius);return N.setLength(Math.min(H.maxDistance,Math.max(N.length(),K))),{target:new U(...P.target),position:N}}function ye(){return b.target.lengthSq()<1e-6}function ie(){let P=pe();J=!1,ae=null,q(P.target,P.position)}function oe(P){let N=new _e(v.pulse,new ii({color:a.warning,transparent:!0,opacity:.92,blending:yi,depthWrite:!1}));N.rotation.x=-Math.PI/2;let Y=ve.get(P);return N.position.set(Y.position.x,.03,Y.position.z),I.add(N),N}function be(P){let N=ve.get(P);if(!N)return null;for(let Y of N.children)if(Y.isCSS2DObject&&Y.element&&Y.element.classList.contains("stage3d-label"))return Y.element;return null}function Fe(P){let N=ve.get(P);if(!N)return null;let Y=new _e(v.pulse,new ii({color:a.warning,transparent:!0,opacity:.58,blending:yi,depthWrite:!1}));return Y.rotation.x=-Math.PI/2,Y.position.set(N.position.x,.03,N.position.z),Y.scale.setScalar(r?1.2:1.15),I.add(Y),Y}function me(P){for(let N=we.length-1;N>=0;N--){let Y=we[N];P!==void 0&&Y.roomId!==P||(Y.timer&&clearTimeout(Y.timer),Y.timer=0,Y.ring&&(I.remove(Y.ring),Y.ring.material&&Y.ring.material.dispose()),Y.label&&Y.label.classList.remove("is-moment"),we.splice(N,1))}}function Ee(P){if(!ve.has(P))return;me(P);let N=Fe(P);if(!N)return;let Y=be(P);Y&&Y.classList.add("is-moment");let K={roomId:P,ring:N,label:Y,start:performance.now(),ms:Dl,timer:0};r&&(N.material.opacity=.45,K.timer=setTimeout(()=>{me(P),Ve()},Dl)),we.push(K),Ve()}function Be(P){for(let N=we.length-1;N>=0;N--){let Y=we[N],K=P-Y.start;if(K>=Y.ms||!ve.has(Y.roomId)){me(Y.roomId);continue}if(Y.ring=Fe(Y.roomId),!Y.ring){me(Y.roomId);continue}if(Y.label=be(Y.roomId),Y.label&&Y.label.classList.add("is-moment"),r){let H=Math.max(0,Y.ms-K);Y.timer=setTimeout(()=>{me(Y.roomId),Ve()},H)}}}function He(P){let N=ot.get(P);if(N)return N;let Y=ve.get(P);if(!Y)return null;let K=document.createElement("div");K.className="stage3d-says";let H=document.createElement("div");H.className="stage3d-says-list",K.append(H);let j=new Nn(K);return j.position.set(0,1.55,-Bt/2),Y.add(j),N={obj:j,el:H,anchor:K},ot.set(P,N),N}function Je(P){let N=He(P.roomId);if(!N)return;let Y=document.createElement("div");if(Y.className="stage3d-say"+(P.tier==="MAJOR"?" is-major":""),P.actor){let j=document.createElement("b");j.textContent=P.actor,Y.append(j," ")}let K=document.createElement("span");if(K.className="stage3d-say-line",K.textContent=P.line,Y.append(K),P.consequence){let j=document.createElement("span");j.className="stage3d-say-consequence",j.textContent=P.consequence,Y.append(j)}P.tier==="MAJOR"?N.el.prepend(Y):N.el.append(Y);let H={caption:P,el:Y,timer:0};H.timer=setTimeout(()=>{it=it.filter(j=>j!==H),Y.remove(),N.el.childElementCount||(N.obj.parent&&N.obj.parent.remove(N.obj),N.anchor.remove(),ot.get(P.roomId)===N&&ot.delete(P.roomId)),Ve()},Math.max(0,P.holdMs)),it.push(H),Ve()}let B=[],xe=!1;function re(P){if(r)return;for(let Se=ne.length-1;Se>=0;Se--){let Me=ne[Se];Me.handle===P.handle&&(st(Me),Me.destMesh&&(Me.destMesh.visible=!0),Me.destPlate&&(Me.destPlate.visible=!0,Me.destPlate.element&&(Me.destPlate.element.style.visibility="")),ne.splice(Se,1))}let N=ve.get(P.from),Y=ve.get(P.to);if(!N||!Y)return;let K=Y.userData.tokens&&Y.userData.tokens.get(P.handle);if(!K||!K.mesh)return;let H=K.mesh.position.y+.24,j=rt(P.handle),ze=j.group;ze.position.set(N.position.x,H,N.position.z),I.add(ze),K.mesh.visible=!1,K.nameplate&&(K.nameplate.visible=!1,K.nameplate.element&&(K.nameplate.element.style.visibility="hidden")),ne.push({handle:P.handle,fromId:P.from,toId:P.to,mesh:ze,mat:j.mat,extraMats:j.extraMats,trail:j.trail,from:new U(N.position.x,H,N.position.z),to:new U(Y.position.x,H,Y.position.z),start:-1,destMesh:K.mesh,destPlate:K.nameplate||null}),Ve()}function ge(P){for(let N of P.pulses)ve.has(N.roomId)&&(N.tier==="MAJOR"&&(N.ring=oe(N.roomId)),X.push(N));for(let N of P.moments||[])Ee(N);for(let N of P.captions)Je(N);for(let N of P.travels)re(N);if(Q&&!J&&!W.followRoomId){let N=Sp(ae,P.pulses.filter(Y=>ve.has(Y.roomId)),performance.now());N&&(ae=N,ee(N.roomId))}Ve()}function Ce(P){let N=B.indexOf(P);N>=0&&B.splice(N,1),P.timer=0;let Y=B.filter(K=>K.sequence<P.sequence).sort((K,H)=>K.sequence-H.sequence);for(let K of Y){let H=B.indexOf(K);H>=0&&B.splice(H,1),K.timer&&clearTimeout(K.timer),K.timer=0,ge(K.slot)}ge(P.slot)}function ue(P,N){let Y={timer:0,sequence:P.sequence,atMs:N,startedAt:performance.now(),remaining:N,slot:P};B.push(Y),xe||(Y.timer=setTimeout(()=>Ce(Y),N))}function Ge(P){let N=performance.now();for(let Y of B)Y.timer&&(clearTimeout(Y.timer),Y.remaining=Math.max(0,Y.atMs-(N-Y.startedAt)),Y.timer=0);if(xe=!!P,!P)for(let Y of B){let K=Math.max(0,Y.remaining);Y.atMs=K,Y.startedAt=performance.now(),Y.timer=setTimeout(()=>Ce(Y),K)}}function Ue(P,N){if(Oe)return;let Y=W;W=N||{};let K=z.radius,H=te;z=fp(P,W),w();for(let R of z.sites){let L=At(R);ve.set(R.id,L),I.add(L)}mt=[];for(let R of z.routes){let L=ve.get(R.from),F=ve.get(R.to);if(!L||!F)continue;let ce=It(R,L.position,F.position);I.add(ce);let he=[],$=new Set;ce.traverse(fe=>{fe.material&&fe.material.color&&fe.material.userData&&fe.material.userData.routeGlow&&!$.has(fe.material)&&($.add(fe.material),he.push(fe.material))}),mt.push({from:R.from,to:R.to,mats:he})}(!Q||Math.abs(K-z.radius)>.01)&&(x(z.radius),V(z.radius));for(let R of X)R.tier==="MAJOR"&&!R.ring&&ve.has(R.roomId)&&(R.ring=oe(R.roomId));Be(performance.now());for(let[R,L]of ot){let F=ve.get(R);F&&F.add(L.obj)}_t(performance.now());let j=dp(P&&P.recent_events,O,ve.keys(),{reduce:r,snapshotSequence:P&&P.sequence}),ze=pp(P&&P.recent_events,O,ve.keys());O=j.lastSequence;let Se=r?[]:gp(H,z,j.pulses,P&&P.recent_events);te=Il(z);let Me=new Map,qe=Array.isArray(P&&P.recent_events)?P.recent_events:[];for(let R of qe)R&&typeof R.sequence=="number"&&typeof R.occurred_at=="number"&&Me.set(R.sequence,R.occurred_at);let We=new Map,je=R=>{let L=We.get(R);return L||(L={sequence:R,occurredAt:Me.get(R),pulses:[],captions:[],travels:[],moments:[]},We.set(R,L)),L};for(let R of j.pulses)je(R.sequence).pulses.push(R);for(let R of ze){let L=je(R.sequence);L.captions.push(R),R.tier==="MAJOR"&&!L.moments.includes(R.roomId)&&L.moments.push(R.roomId)}for(let R of Se)je(R.sequence).travels.push(R);let De=performance.now(),g=De;for(let R of B){let L=R.timer?R.startedAt+R.atMs:De+R.remaining;L>g&&(g=L)}let A=ap([g],De);if(!xe&&(A.flush||g-De>hn.MAX_TOTAL_MS)){let R=B.slice().sort((L,F)=>L.sequence-F.sequence);B.length=0;for(let L of R)L.timer&&clearTimeout(L.timer),L.timer=0,ge(L.slot)}for(let R of sp(Array.from(We.values()))){let L=We.get(R.sequence);if(!L)continue;let F=A.offsetMs+R.atMs;F<=0?ge(L):ue(L,F)}if(Q){let R=xp(Y,W,"",J);R&&((R===W.selectedId||R===W.followRoomId)&&(J=!1),ee(R))}else{Q=!0;let R=pe();b.target.copy(R.target),y.position.copy(R.position),b.update()}Ve()}let Mt=new jo,ft=new Ae,Zt=null,Mi=P=>{Zt={x:P.clientX,y:P.clientY}},ls=P=>{if(!Zt||Math.hypot(P.clientX-Zt.x,P.clientY-Zt.y)>5){Zt=null;return}Zt=null;let N=t.getBoundingClientRect();ft.set((P.clientX-N.left)/N.width*2-1,-((P.clientY-N.top)/N.height)*2+1),Mt.setFromCamera(ft,y);let Y=Mt.intersectObjects(I.children,!0).find(K=>K.object.userData&&K.object.userData.siteId);Y&&o(Y.object.userData.siteId)};t.addEventListener("pointerdown",Mi),t.addEventListener("pointerup",ls),b.addEventListener("start",()=>{J=!0,Z=null,ae=null}),b.addEventListener("change",Ve);let cs=P=>{U0.has(P.key)&&(J=!0,Z=null,ae=null)};n.addEventListener("keydown",cs);let Fn=e.reset,or=()=>ie();Fn&&Fn.addEventListener("click",or);let us=()=>{!document.hidden&&le&&(le=!1,Ve())};document.addEventListener("visibilitychange",us);let eo=P=>{P.preventDefault(),s()};t.addEventListener("webglcontextlost",eo);let On=typeof ResizeObserver=="function"?new ResizeObserver(gt):null;On?On.observe(n):window.addEventListener("resize",gt),gt();function Ji(){if(Oe)return;Oe=!0,se&&cancelAnimationFrame(se);for(let N of it)N.timer&&clearTimeout(N.timer);it=[];for(let N of B)N.timer&&clearTimeout(N.timer);B.length=0;for(let N of ot.values())N.anchor.remove();ot.clear(),k(),w(),we.length=0;let P=new Set;p.traverse(N=>{N.geometry&&N.geometry.dispose(),N.material&&!P.has(N.material)&&(P.add(N.material),N.material.dispose())}),f.shadow&&typeof f.shadow.dispose=="function"&&f.shadow.dispose(),typeof f.dispose=="function"&&f.dispose(),typeof E.dispose=="function"&&E.dispose(),typeof C.dispose=="function"&&C.dispose();for(let N of Object.values(v))N.dispose();l&&l.dispose(),c&&c.dispose(),h&&h.dispose(),d&&(d.map.dispose(),d.bump.dispose()),u&&(u.map.dispose(),u.bump.dispose()),b.dispose(),t.removeEventListener("pointerdown",Mi),t.removeEventListener("pointerup",ls),t.removeEventListener("webglcontextlost",eo),n.removeEventListener("keydown",cs),b.stopListenToKeyEvents(),document.removeEventListener("visibilitychange",us),Fn&&Fn.removeEventListener("click",or),On?On.disconnect():window.removeEventListener("resize",gt),i.replaceChildren();try{let N=m.getContext();N&&typeof N.pixelStorei=="function"&&(N.pixelStorei(N.UNPACK_FLIP_Y_WEBGL,!1),N.pixelStorei(N.UNPACK_PREMULTIPLY_ALPHA_WEBGL,!1))}catch{}m.dispose()}return{update:Ue,focus:ee,reset:ie,dispose:Ji,pause:Ge}}window.NoemaWatchStage={mount:V0};
