# 라스트브레드 : 생존 - AI스피커 멀티플레이 구현

<p align="center">
<img src="./img/lastbread.png?raw=true"/ width = "600px">
</p>

## 개요

**라스트브레드:생존**은 인공지능 스피커를 통해 **4명의 사용자를 매칭한 뒤 서로 상호작용**할 수 있도록 개발 된 **세계 최초의 멀티플레이 음성 게임** 입니다.  AI스피커에는 소켓통신같은 통신 기능이 제공되지 않습니다. 백 엔드 서버를 활용해 매칭룸과 사용자의 상태를 관리해주는 방법으로 구현한 서비스입니다. **SKT NUGU 스피커를 통해 상용화 출시**했습니다.

<p align="center">
  <img src="./img/상용화2.png?raw=true"/ width = "300px" style="margin-right:10px"><img src="./img/상용화1.png?raw=true"/ width = "300px" style="margin-left:10px">
</p>
<p align="center"><strong>SK텔레콤 NUGU Play 상용화 출시(2019.11)</strong></p>



## 특징

AI 스피커를 통해 **음성으로 플레이** 한다는 특징을 최우선으로 고려했습니다.  

* 쉽고 간단한 게임 방법

* Audio길이를 조절해 사용자간 동기화

* 백 엔드 서버를 통해 4명의 플레이어를 실시간으로 관리

  

## 플레이 방법

<p align="center">
<img src="./img/play.png?raw=true"/ width = "400px">
</p>

 하루 단위로 진행되는 배팅 서바이벌 게임입니다.

 1. **4명**의 플레이어가 **실시간 매칭**됩니다.
  2. 모든 플레이어는 **빵 2개**와 **10만원**을 가지고 시작합니다.
  3. 하루에 한 번씩 배팅을 통해 빵을 구매합니다.
  4. 가장 많은 금액을 배팅한 플레이어가 빵을 차지하며, 배팅한 금액은 모두 사라집니다.
  5. 빵은 하루에 1개씩 사라집니다. **남은 빵이 없을 경우 사망**합니다.



## 백 엔드 서버

### 진행 프로세스

1. 사용자가 "게임시작"을 말하면, 20초 동안 음악을 재생하고, 시간 내에 접속하는 사용자들은 최대 4명까지 같은 방으로 매칭

2. 사용자들을 키 값으로 구분하여, 각 사용자의 서버 요청시간에 따른 음악의 길이를 조절해 시간을 동기화

   <p align="center">
   <img src="./img/backend.png?raw=true"/ width = "800px">
   </p>

3. 개별 컨텍스트(사망,생존,배팅 상황 등)에 따라 각 사용자에 맞는 Prompt 제공

4. 사용자의 배팅이 완료되면 배팅금액 차감 및 배팅 승자에게 빵 1개를 추가

5. 1일이 지날 때마다 빵 차감 및 생존자 처리

6. 최종으로 1인이 남으면 게임 종료 및 랭킹 점수 추가  


## 주요코드 설명
### JSON 분석
처음으로 오는 부분은 **Request의 body를 분석**해야 합니다. 여기에 NUGU에서 오는 Request가 오며 이 부분에 주요 **JSON**이 있습니다. 다음은 Request가 오는 예시입니다.

    const requestBody = req.body; //request의 body부분
    if(requestBody.action.hasOwnProperty('parameters')){
      if(Object.keys(requestBody.action.parameters).length === 0){
        parameters = ''
      }else{
        parameters = requestBody.action.parameters// 파라메터 부분
      }
    } //파라메터 부분, {} 이 오는 경우를 방지해야 합니다.
    const context = requestBody.action.context; //컨텍스트, OAuth연결시 토큰이 들어옵니다
    const actionName = requestBody.action.actionName; // action의 이름

*  **Parameters** :  **NUGU Play kit**에서 지정한 **Parameter**값이 들어옵니다. 사용시 **Parameters.ParameterName.value**로 불러오면 됩니다.
*  **context** :  **OAuth**사용시 **Token**이 들어옵니다.
*  **actionName** :   **NUGU Play kit**에서 지정한 **action**이름을 얻을 수 있습니다.

이렇게 미리 파싱을 하는 이유는 function안에서 사용시 더욱 편하게 사용하기 위해서 입니다.

### function설명

일반적으로는 **Parameter** 이외에는 건드릴 일은 없습니다. 왜냐하면 챗봇의 경우 결국 데이터의 전달로 구현을 하기 때문입니다. 만약 다른 요소를 건드려야 할 경우 수정을 하시면 됩니다.

## 데모영상
[![LastBread 데모영상](http://img.youtube.com/vi/SGdDEcz-w2w/maxresdefault.jpg)](https://www.youtube.com/watch?v=SGdDEcz-w2w)

*이미지를 클릭하면 링크연결*



다른 장소에서 2개의 스피커로 실제로 데모한 영상입니다.ㅋㅋ;

## 수상

### 🏆2019 SKT NUGU Play 공모전(상반기) - 우수상, 500만원🏆

<p align="center">
<img src="./img/lastbread_상장.png?raw=true"/ width = "450px">
</p>



관련기사 : 

https://www.sktelecom.com/advertise/press_detail.do?idx=4874

https://news.naver.com/main/read.nhn?mode=LSD&mid=sec&sid1=105&oid=277&aid=0004457066

## 개발

리보이스팀 - 한진섭, 김인섭

**jshan93ag@naver.com** 

