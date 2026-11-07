import { DummyData } from "@/src/core/data/dummyData";
import { NotificationInMemoryDataSource } from "@/src/features/notifications/data/datasources/NotificationInMemoryDataSource";
import { NotificationRepositoryImpl } from "@/src/features/notifications/data/repositories/NotificationRepositoryImpl";
import { NotificationPublisher } from "@/src/features/notifications/domain/NotificationPublisher";
import { NotificationRepository } from "@/src/features/notifications/domain/repositories/NotificationRepository";
import { fake } from "../../support/fake";

describe("NotificationPublisher", () => {
  it("avisa a todos menos a quien comentó, una vez cada uno", async () => {
    const repo = new NotificationRepositoryImpl(new NotificationInMemoryDataSource(new DummyData(false)));
    const publisher = new NotificationPublisher(repo);
    await publisher.commentAdded({ listingId: "l1", listingTitle: "Huerta", authorId: "ana", authorName: "Ana", comment: "Buena idea", recipientIds: ["ana", "beto", "beto", "caro", ""] });
    expect(await repo.getMine("ana")).toHaveLength(0);
    const [beto] = await repo.getMine("beto");
    expect(beto.title).toBe('Nuevo comentario en "Huerta"');
    expect(beto.body).toBe("Ana: Buena idea");
    expect(beto.isRead).toBe(false);
    await repo.markAllRead("beto");
    expect((await repo.getMine("beto"))[0].isRead).toBe(true);
  });

  it("fallar al notificar no hace fallar la acción", async () => {
    const broken = fake<NotificationRepository>({ send: async () => Promise.reject(new Error("sin red")) });
    await expect(new NotificationPublisher(broken).memberRemoved({ listingId: "l", listingTitle: "t", deciderId: "a", userId: "b" })).resolves.toBeUndefined();
  });
});
