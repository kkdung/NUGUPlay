# 오늘의 퀴즈 - AI스피커 퀴즈 게임 구현

<p align="center">
<img src="./img/todayquiz.png?raw=true"/ width = "600px">
</p>


## 개요

**오늘의 퀴즈**는 인공지능 스피커를 통해 **하루에 한 개씩 퀴즈를 제공하는** 퀴즈 컨텐츠 입니다. 백 엔드 서버와 엑셀 데이터를 활용해 사용자 별로 오늘의 퀴즈와 정답을 맞췄을 경우 보너스 퀴즈를 제공해줍니다. **SKT NUGU 스피커를 통해 상용화 출시**했습니다.



**출시한 서비스 중 사용자가 가장 많은 서비스 입니다 **

- 총 누적 요청 건 수 19302건 (2019.11 ~ 2020.06)

- 월 평균 사용자 수 : 250~350명 (2019.11 ~ 2020.06)

  



<p align="center">
  <img src="./img/상용화1.jpeg?raw=true"/ width = "300px" style="margin-right:10px"><img src="./img/상용화2.jpeg?raw=true"/ width = "300px" style="margin-left:10px">
</p>
<p align="center"><strong>SK텔레콤 NUGU Play 상용화 출시(2019.10)</strong></p>



## 특징

* 날짜별로 오늘의 퀴즈 제공 

* 음악 퀴즈, 보너스 퀴즈 등 특별한 컨텐츠

  

## 플레이 방법

 1. **"오늘의 퀴즈 시작"**이라고 말하면 날짜별로 퀴즈가 제공됩니다.
  2. 문제를 잘 듣고 정답을 맞춰주세요.
  3. 정답을 맞추면 보너스 퀴즈가 제공됩니다.
   4. 정답을 맞추고 포인트를 획득 하실 수 있습니다.



## 데모영상

[![LastBread 데모영상](http://img.youtube.com/vi/vmA_X5KzOas/maxresdefault.jpg)](https://www.youtube.com/watch?v=vmA_X5KzOas)

*이미지를 클릭하면 링크연결*




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



## 개발

리보이스팀 - 한진섭, 김인섭

**jshan93ag@naver.com** 

