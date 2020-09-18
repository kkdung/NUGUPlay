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
<p align="center">
<img src="./img/programmer.png?raw=true"/>
</p>

<p align="center">이제부터 BackEnd를 해야 합니다</p>

 이제부터 BackEnd를 해야 합니다
코드의 설명에 있어서 로또번호를 생성하는 부분을 예시로 설명하겠습니다.

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

이렇게 미리 파싱을 하는 이유는 function안에서 사용시 더욱 편하게 사용하기 위해서 입니다. **Action**이름으로 **Switch**를 하며, **Parameter**의 경우 여러가지 이름이 들어올 수 있기 때문에 이 정도로 파싱을 합니다. 그 다음으로는 **Switch**에서 처리를 합니다.

### Switch 부분

    //액션 선언 모음, 여기서 액션을 선언해 줍니다.
      const ACTION_NOWLOTTO = 'action.nowLotto'; //현재회차 로또
      const ACTION_SELECTLOTTONUM = 'action.selectLottoNum'; //특정회차 로또
      const ACTION_MAKELOTTONUM = 'action.makeLottoNum'; // 로또번호 생성
      const ACTION_LOTTOCHANGE = 'action.lottoChange'; // 로또 교환 장소
    
      // Intent가 오는 부분, actionName으로 구분합니다.
      // case안에서 작동할 function을 적습니다.
      switch (actionName) {
        case ACTION_NOWLOTTO:
          return nowlotto_function()
          break;
        case ACTION_SELECTLOTTONUM:
          return selectLottoNum_function()
          break;
        case ACTION_MAKELOTTONUM:
          return makeLottoNum_function()
          break;
        case ACTION_LOTTOCHANGE:
          return lottoChange_function()
          break;
      }


*  **ACTION_NOWLOTTO** :  NUGU Play kit에서 지정한 Action 이름인  **action.nowLotto**값이 들어옵니다. **nowlotto_function**으로 가게 됩니다.
*  **ACTION_SELECTLOTTONUM** :  NUGU Play kit에서 지정한 Action 이름인  **action.selectLottoNum**값이 들어옵니다. **selectLottoNum_function**으로 가게 됩니다.
*  **ACTION_MAKELOTTONUM** :  NUGU Play kit에서 지정한 Action 이름인  **action.makeLottoNum**값이 들어옵니다. **makeLottoNum_function**으로 가게 됩니다.
*  **ACTION_LOTTOCHANGE** :  NUGU Play kit에서 지정한 Action 이름인  **action.lottoChange**값이 들어옵니다. **lottoChange_function**으로 가게 됩니다.

현재는 예시이기 때문에 4가지 정도의 **Action**을 사용하였습니다. 여기에 **NUGU Play kit**상에서 action.help와 action.support 부분이 추가적으로 존재하지만 이는 **NUGU Play kit**에서 움직이기 때문에 **BackEnd**에서는 설계를 하지 않아도 됩니다.

### function설명

각 function은 예시를 위해서 다양하게 구성을 하였습니다.

*  **nowlotto_function**
현재 회차의 로또번호와 상금을 조회합니다. Request시 **파라메터는 없으나** Response시 **여러 파라메터 저장하여 데이터를 보내는 형태**입니다. **request**와 **cheerio**를 이용하여 웹 페이지에 대한 크롤링을 사용하였습니다.
>크롤링: 웹 페이지를 그대로 가져와서 거기서 데이터를 추출해 내는 행위

*  **selectLottoNum_function**
회차별 로또번호와 상금을 조회합니다. Request시 **파라메터에 사용자가 말한 회차**(숫자)를 가져오며, Response시 **텍스트 자체를 파라메터로 보내는 형태**입니다. **request**를 이용하여 **JSON**을 요청, 파싱하여 데이터 얻습니다. **NUGU Play kit**에서 파라메터를 받아서 사용하는 구조가 아니기 때문에 **shuffle function을 이용하여 랜덤으로 말하게** 됩니다. 자세한 것은 코드를 참조해 주세요.

*  **makeLottoNum_function**
**Request시 파라메터는 없으며 Response시 여러 파라메터 저장**하여 데이터를 보내는 형태입니다. 내부 로직을 통해서 랜덤한 로또번호를 생성합니다.

*  **lottoChange_function**
로또 당첨금 교환장소를 말합니다. **Request시 파라메터는 없으며 response 텍스트 자체를 파라메터로 저장**합니다. 정해진 텍스트를 출력하는 형태입니다.


### nowlotto_function (현재회차 조회)

> request와 크롤링 부분은 설명을 생략합니다.

    function nowlotto_function() {
    console.log('nowlotto_function')
    return asyncTask(0)
      .then(function(items) {
        console.log('items: ', items)
      //여기서 서버연결후 데이터 출력 items으로 가져옴
      let returnValue = items.returnValue; // success or fail
    
      if (returnValue == "fail") { // 서버접속 실패 혹은 200에러 등
        //현재회차의 경우 에러가 나는 일은 없습니다.
    
      } else { // 서버가 에러가 나지 않는다면
        let firstWinAmount = items.firstWinamnt; // 1등상 액수
        let firstPrizeHuman = items.firstPrzwnerCo; // 총 인원
        let rawDate = items.drwNoDate; // 당첨날짜
    
        //날짜 구하는 부분
        var dt = new Date(rawDate);
        let month = dt.getMonth() + 1;
        let dateText = dt.getFullYear() + '년 ' + month + '월 ' + dt.getDate() + '일';
        let kai = items.drwNo; // 회차
    
        // 번호들, 보너스번호
        let number1 = items.drwtNo1;
        let number2 = items.drwtNo2;
        let number3 = items.drwtNo3;
        let number4 = items.drwtNo4;
        let number5 = items.drwtNo5;
        let number6 = items.drwtNo6;
        let bnusNo = items.bnusNo;
        let firstHowTo = '';
        let resultFirstPrize = numberWithCommas(firstWinAmount);
    
        if (items.firstHowTo != undefined) {
          firstHowTo = items.firstHowTo
          firstPrizeHuman = firstHowTo
        }
        output.firstPrizeHuman = firstPrizeHuman;
        output.resultFirstPrize = resultFirstPrize;
        output.dateText = dateText;
        output.kai = kai;
        //당첨번호 6개의 숫자를 보낼 파라메터에 저장
        output.first = number1;
        output.second = number2;
        output.third = number3;
        output.fourth = number4;
        output.fifth = number5;
        output.sixth = number6;
        output.bnusNo = bnusNo;
        console.log(output)
        return res.send(makeJSON(output));
      }
    
    });
      } // nowlotto_function


 * **output.firstPrizeHuman~bnusNo**
Response의 **Parameter**로 보낼 숫자를 넣습니다. **Parameter**의 이름은 **Action**에서 지정한 **Parameter**와 동일한 이름(**firstPrizeHuman~bnusNo**)으로 합니다.

* **return res.send(makeJSON(output));**
Response JSON을 만들어 둔 function에 **Parameter** 데이터를 넣어서 **NUGU**에 전송을 합니다.

**NUGU Play kit**에서는 **Parameter**의 firstNum부터 sixthNum의 데이터를 받아 텍스트에 사용을 합니다. 처리 부분은 다음과 같습니다.

### selectLottoNum_function (특정회차 조회)

> request의 api요청 부분은 설명을 생략합니다.

    function selectLottoNum_function() {
    console.log('selectLottoNum_function')
    const selectNum = Parameters.selectNum.value // Request에 있는 Parameters의 회차 값 불러오기
    const numberValues = selectNum.replace(/[^0-9]/g, ""); // 안전을 위해서 들어온 Parameter값을 숫자만 남기기
    let speechText = '';
    
    return asyncTask(numberValues)
      .then(function(items) {
        console.log(items)
      //여기서 서버연결후 데이터 출력 items으로 가져옴
      let returnValue = items.returnValue; // success or fail
    
      if (returnValue == "fail") { // 서버접속 실패 혹은 200에러 등
        speechText = "아직 진행되지 않은 로또회차이거나 서버에러 등으로 서비스를 제공할 수 없었습니다. 다른 회차를 말해주세요.";
        output.selectLotto = speechText;
      } else { // 서버가 움직인다면
        let firstWinAmount = items.firstWinamnt; // 1등상 액수
        let firstPrizeHuman = items.firstPrzwnerCo; // 총 인원
        let rawDate = items.drwNoDate; // 당첨날짜
    
        //날짜 구하는 부분
        var dt = new Date(rawDate);
        let month = dt.getMonth() + 1;
        let dateText = dt.getFullYear() + '년 ' + month + '월 ' + dt.getDate() + '일';
        let kai = items.drwNo; // 회차
    
        // 번호들, 보너스번호
        let number1 = items.drwtNo1;
        let number2 = items.drwtNo2;
        let number3 = items.drwtNo3;
        let number4 = items.drwtNo4;
        let number5 = items.drwtNo5;
        let number6 = items.drwtNo6;
        let bnusNo = items.bnusNo;
        let firstHowTo = '';
        let resultFirstPrize = numberWithCommas(firstWinAmount);
    
        if (items.firstHowTo != undefined) {
          firstPrizeHuman = items.firstHowTos
        }
    
        speechText = dateText + "의 " + kai + "회차 로또번호는 " +
          number1 +
          ", " +
          number2 +
          ", " +
          number3 +
          ", " +
          number4 +
          ", " +
          number5 +
          ", " +
          number6 +
          " 보너스 번호는 " +
          bnusNo +
          " 입니다. 1등상은 " + firstPrizeHuman + "명이 당첨되었으며 액수는 1인당 " + resultFirstPrize + "원 입니다.";
        output.selectLotto = speechText;
      }
      return res.send(makeJSON(output));
    
        });
      } // selectLottoNum_function

다음은 특정 회차를 조회하는 부분입니다.

 * **speechText** : **NUGU**가 말할 텍스트를 제작합니다. 만약 API가 실패하였거나 없는 회차인 경우 fail부분의

> 아직 진행되지 않은 로또회차 이거나 서버에러 등으로 서비스를 제공할 수 없었습니다. 다른 회차를 말해주세요.

텍스트가 진행됩니다.

 * **output.selectLotto** : Response의 **Parameter**로 보낼 텍스트를 넣습니다. **Parameter**의 이름은 **Action**에서 지정한 **Parameter**와 동일한 이름(**selectLotto**)으로 합니다.

* **return res.send(makeJSON(output));** : Response JSON을 만들어 둔 function에 **Parameter** 데이터를 넣어서 **NUGU**에 전송을 합니다.


### makeLottoNum_function (로또번호 생성)

    function makeLottoNum_function() {
    
    //1~45 Array생성
    let allLottoArray = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45];
    // 6개만 가져올 것
    let getArrays = [1, 2, 3, 4, 5, 6];
    let resultArray = shuffle(allLottoArray);
    for (var i = 0; i < 6; i++) {
      getArrays[i] = resultArray[i];
    }
    
    getArrays.sort(function(a, b) {
      return a - b
    }); // 사용자 경험을 위한 번호 정렬
    
    //생성된 6개의 숫자를 보낼 파라메터에 저장
    output.firstNum = getArrays[0];
    output.secondNum = getArrays[1];
    output.thirdNum = getArrays[2];
    output.fourthNum = getArrays[3];
    output.fifthNum = getArrays[4];
    output.sixthNum = getArrays[5];
    
    return res.send(makeJSON(output));
      } // makeLottoNum_function

 * **output.firstNum~sixthNum**
Response의 **Parameter**로 보낼 숫자를 넣습니다. **Parameter**의 이름은 **Action**에서 지정한 **Parameter**와 동일한 이름(**firstNum~sixthNum**)으로 합니다.

* **return res.send(makeJSON(output));**
Response JSON을 만들어 둔 function에 **Parameter** 데이터를 넣어서 **NUGU**에 전송을 합니다.

**NUGU Play kit**에서는 **Parameter**의 firstNum부터 sixthNum의 데이터를 받아 텍스트에 사용을 합니다. 처리 부분은 다음과 같습니다.


### lottoChange_function (로또 교환장소)

    function lottoChange_function() {
    const selectNum = Parameters.selectPrize.value // Request에 있는 Parameters의 1~5등 불러오기
    const numberValues = selectNum.replace(/[^0-9]/g, ""); // 안전을 위해서 들어온 Parameter값을 숫자만 남기기
    console.log('numberValues: ', numberValues)
    let speechText = '';
    
    switch (numberValues) {
      case 1:
        speechText = '혹시 1등이신가요? 1등은 신분증을 가지고 농협은행 본점에서만 수령이 가능합니다.';
        break;
      case 2:
        speechText = '2등은 신분증을 가지고 지역농협을 제외한 농협은행 영업점에서 당첨금을 수령하시면 됩니다.';
        break;
      case 3:
        speechText = '3등은 신분증을 가지고 지역농협을 제외한 농협은행 영업점에서 당첨금을 수령하시면 됩니다.';
        break;
      case 4:
        speechText = '4등은 5만원입니다. 복권 판매점에서 교환하면 됩니다. ';
        break;
      case 5:
        speechText = '5등은 5천원! 복권 판매점에서 교환하면 됩니다. ';
        break;
      default:
        speechText = '그런 상은 존재하지 않습니다. 로또는 1등부터 5등까지만 있답니다. ';
    }
    
    /**
     * 완성된 텍스트 전체를 Parameter로 넘기는 형태입니다.
     * shuffle(lastTextArr[0])는 사용자경험을 위한 모듈입니다.
     */
    output.lottoChange = speechText + shuffle(lastTextArr)[0];
    return res.send(makeJSON(output));
    
      } //lottoChange_function

* **Parameters.selectPrize.value**
위에서 선언해 둔 **Parameters**를 이용하여 **Request**로 들어온 **selectPrize**라는 숫자 데이터를 얻습니다. 이때 데이터는 **value**에 있습니다.

 * **speechText**
 NUGU가 말할 텍스트를 제작합니다. **Parameter**에 있는 숫자 Value를 읽어 각 상을 Switch로 찾습니다.

 * **output.lottoChange**
Response의 **Parameter**로 보낼 텍스트를 넣습니다. **Parameter**의 이름은 **Action**에서 지정한 **Parameter**와 동일한 이름(**lottoChange**)으로 합니다.

* **return res.send(makeJSON(output));**
Response JSON을 만들어 둔 function에 **Parameter** 데이터를 넣어서 **NUGU**에 전송을 합니다.

### makeJSON (Response 될 JSON만드는 부분)

    function makeJSON(JSONs) {
    let JSONReturn = {
      "version": "2.0",
      "resultCode": "OK",
      "directives": {
        "AudioPlayer": {
          "type": "AudioPlayer.Play",
          "audioitems": {
            "stream": {
              "url": "",
              "offsetInMilliseconds": "",
              "progressReport": {
                "progressReportDelayInMilliseconds": "",
                "progressReportIntervalInMilliseconds": ""
              },
              "token": "",
              "expectedPreviousToken": ""
            },
            "metadata": {}
          }
        }
      }
    
    }
    JSONReturn.output = JSONs
    return JSONReturn;
    } //makeJSON

**Response**에 넣을  **JSON**을 만드는 부분입니다. 각 function에서 output은 **Parameter**을 만들고 이 부분에서 완성된 **output JSON을 저장하는 구조**입니다. 이렇게 만드는 것은 **Parameter**의 사용은 **BackEnd** 사용 시 필수인데, 매번 JSON을 만들기엔 번거롭기 때문입니다. 그래서 미리 만들어 놓고 **Parameter**만 바꾸어서 사용을 하는 방식으로 구현을 하였습니다.

일반적으로는 **Parameter** 이외에는 건드릴 일은 없습니다. 왜냐하면 챗봇의 경우 결국 데이터의 전달로 구현을 하기 때문입니다. 만약 다른 요소를 건드려야 할 경우 수정을 하시면 됩니다.

## 데모영상
[![LastBread 데모영상](http://img.youtube.com/vi/SGdDEcz-w2w/0.jpg)](https://www.youtube.com/watch?v=SGdDEcz-w2w)

*이미지를 클릭하면 링크연결*



다른 장소에서 2개의 스피커로 실제로 데모한 영상입니다.ㅋㅋ;

## 수상



2019 SKT NUGU Play 공모전(상반기) - 우수상





## 개발

리보이스팀 - 한진섭, 김인섭

**jshan93ag@naver.com** 

