import streamlit as st
import math
import random


# --- 게임 로직 함수 ---

def check_winner(board):
    win_combinations = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8],
        [0, 3, 6], [1, 4, 7], [2, 5, 8],
        [0, 4, 8], [2, 4, 6]
    ]
    for combo in win_combinations:
        if board[combo[0]] == board[combo[1]] == board[combo[2]] != "":
            return board[combo[0]]
    if "" not in board:
        return "Draw"
    return None


def minimax(board, depth, is_maximizing):
    winner = check_winner(board)
    if winner == "O": return 10 - depth
    if winner == "X": return depth - 10
    if winner == "Draw": return 0

    if is_maximizing:
        best_score = -math.inf
        for i in range(9):
            if board[i] == "":
                board[i] = "O"
                score = minimax(board, depth + 1, False)
                board[i] = ""
                best_score = max(score, best_score)
        return best_score
    else:
        best_score = math.inf
        for i in range(9):
            if board[i] == "":
                board[i] = "X"
                score = minimax(board, depth + 1, True)
                board[i] = ""
                best_score = min(score, best_score)
        return best_score


def get_ai_move(board, difficulty):
    moves_with_scores = []
    for i in range(9):
        if board[i] == "":
            board[i] = "O"
            score = minimax(board, 0, False)
            board[i] = ""
            moves_with_scores.append((i, score))

    if not moves_with_scores:
        return None

    # 점수 높은 순으로 정렬
    moves_with_scores.sort(key=lambda x: x[1], reverse=True)
    max_score = moves_with_scores[0][1]
    best_moves = [m[0] for m in moves_with_scores if m[1] == max_score]

    # 1. '어려움' 이거나 80% 확률로 최선의 수 중 랜덤 선택
    if difficulty == "어려움" or random.random() > 0.2:
        return random.choice(best_moves)

    # 2. 20% 확률로 실수 (차선의 수 중 랜덤 선택)
    else:
        suboptimal_moves = [m for m in moves_with_scores if m[1] < max_score]
        if suboptimal_moves:
            # 차선 중에서도 가장 높은 점수(가장 덜 멍청한 수) 추출
            sub_max_score = max([m[1] for m in suboptimal_moves])
            better_suboptimal_moves = [m[0] for m in suboptimal_moves if m[1] == sub_max_score]
            return random.choice(better_suboptimal_moves)
        else:
            return random.choice(best_moves)


# --- 스트림릿 UI 구성 ---

st.set_page_config(page_title="Tic-Tac-Toe AI Ultimate", layout="centered")
st.title("🎮 Tic-Tac-Toe AI v3")

# 사이드바 설정
st.sidebar.header("⚙️ 게임 설정")
difficulty = st.sidebar.selectbox("난이도 선택", ["어려움", "보통"])
order = st.sidebar.radio("순서 선택", ["내가 선공 (X)", "컴퓨터 선공 (O)"])

# 세션 상태 초기화
if 'board' not in st.session_state:
    st.session_state.board = [""] * 9
if 'winner' not in st.session_state:
    st.session_state.winner = None
if 'initialized' not in st.session_state:
    st.session_state.initialized = False


def reset_game():
    st.session_state.board = [""] * 9
    st.session_state.winner = None
    st.session_state.initialized = False


# 컴퓨터 선공 처리 (게임이 새로 시작되었을 때 한 번만 실행)
if order == "컴퓨터 선공 (O)" and not st.session_state.initialized and "" not in st.session_state.board:
    comp_move = get_ai_move(st.session_state.board, difficulty)
    if comp_move is not None:
        st.session_state.board[comp_move] = "O"
    st.session_state.initialized = True


def handle_click(i):
    if st.session_state.board[i] == "" and st.session_state.winner is None:
        # 플레이어 턴
        st.session_state.board[i] = "X"
        st.session_state.winner = check_winner(st.session_state.board)

        # 컴퓨터 턴
        if st.session_state.winner is None:
            comp_move = get_ai_move(st.session_state.board, difficulty)
            if comp_move is not None:
                st.session_state.board[comp_move] = "O"
                st.session_state.winner = check_winner(st.session_state.board)


# 상태 메시지 표시
if st.session_state.winner:
    if st.session_state.winner == "Draw":
        st.info("무승부입니다! 🤝")
    else:
        win_text = "당신의 승리! 🎉" if st.session_state.winner == "X" else "컴퓨터의 승리! 🤖"
        st.success(f"결과: {win_text}")
else:
    st.write("당신의 차례입니다 (X)" if "" in st.session_state.board else "")

# 3x3 보드 출력
cols = st.columns(3)
for i in range(9):
    with cols[i % 3]:
        val = st.session_state.board[i]
        # 버튼 스타일링을 위한 CSS 클래스 적용
        btn_key = f"btn_{i}"

        # 버튼 텍스트 색상 처리 (X는 Blue, O는 Red 느낌으로)
        label = val if val != "" else " "

        st.button(
            label,
            key=btn_key,
            on_click=handle_click,
            args=(i,),
            use_container_width=True,
            disabled=(val != "" or st.session_state.winner is not None)
        )

if st.button("게임 재시작", on_click=reset_game):
    st.rerun()

# --- CSS 커스텀 (스타일링) ---
st.markdown(f"""
    <style>
    /* 버튼 크기 및 폰트 설정 */
    div.stButton > button {{
        height: 100px;
        font-size: 40px !important;
        font-weight: bold;
        border-radius: 10px;
    }}
    /* X와 O 색상 구분 (브라우저 검사 도구 기준 텍스트 포함 시) */
    /* Streamlit 버튼 내 텍스트 색상을 직접 제어하기 위해 하단 추가 */
    </style>
""", unsafe_allow_html=True)