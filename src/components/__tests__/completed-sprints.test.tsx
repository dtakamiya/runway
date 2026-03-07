import { render, screen, fireEvent } from "@testing-library/react"
import { CompletedSprints, type CompletedSprintFormData } from "../completed-sprints"

const makeSprint = (overrides: Partial<CompletedSprintFormData> = {}): CompletedSprintFormData => ({
  id: crypto.randomUUID(),
  actualPoints: "20",
  ...overrides,
})

describe("CompletedSprints - 削除ボタンの表示", () => {
  it("スプリントが1件のとき削除ボタンが表示される", () => {
    const sprints = [makeSprint({ id: "s1" })]
    render(<CompletedSprints sprints={sprints} onChange={jest.fn()} />)
    expect(screen.getAllByRole("button", { name: /を削除/ })).toHaveLength(1)
  })

  it("スプリントが2件のとき、S1とS2両方に削除ボタンが表示される", () => {
    const sprints = [makeSprint({ id: "s1" }), makeSprint({ id: "s2" })]
    render(<CompletedSprints sprints={sprints} onChange={jest.fn()} />)
    expect(screen.getAllByRole("button", { name: /を削除/ })).toHaveLength(2)
  })

  it("スプリントが3件のとき、全スプリントに削除ボタンが表示される", () => {
    const sprints = [makeSprint({ id: "s1" }), makeSprint({ id: "s2" }), makeSprint({ id: "s3" })]
    render(<CompletedSprints sprints={sprints} onChange={jest.fn()} />)
    expect(screen.getAllByRole("button", { name: /を削除/ })).toHaveLength(3)
  })

  it("S1（先頭スプリント）の削除ボタンをクリックするとS1が除外される", () => {
    const s1 = makeSprint({ id: "s1", actualPoints: "10" })
    const s2 = makeSprint({ id: "s2", actualPoints: "20" })
    const handleChange = jest.fn()
    render(<CompletedSprints sprints={[s1, s2]} onChange={handleChange} />)

    fireEvent.click(screen.getByRole("button", { name: "Sprint 1 を削除" }))

    expect(handleChange).toHaveBeenCalledTimes(1)
    const result: CompletedSprintFormData[] = handleChange.mock.calls[0][0]
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe("s2")
  })

  it("末尾以外のスプリントの削除ボタンをクリックするとそのスプリントが除外される", () => {
    const s1 = makeSprint({ id: "s1" })
    const s2 = makeSprint({ id: "s2" })
    const s3 = makeSprint({ id: "s3" })
    const handleChange = jest.fn()
    render(<CompletedSprints sprints={[s1, s2, s3]} onChange={handleChange} />)

    fireEvent.click(screen.getByRole("button", { name: "Sprint 2 を削除" }))

    const result: CompletedSprintFormData[] = handleChange.mock.calls[0][0]
    expect(result.map((s) => s.id)).toEqual(["s1", "s3"])
  })
})
