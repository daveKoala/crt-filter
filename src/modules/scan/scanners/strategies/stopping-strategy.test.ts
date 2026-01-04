import { expect } from "chai";
import { ConsecutiveOldBatchesStrategy } from "./consecutive-old-batches-strategy";
import { FixedBatchStrategy } from "./fixed-batch-strategy";
import { CertificateCountStrategy } from "./certificate-count-strategy";
import { CompositeStrategy } from "./composite-strategy";
import type { BatchInfo } from "./stopping-strategy";

describe("Stopping Strategies", () => {
  const createBatchInfo = (
    batchNumber: number,
    certsNewer: number,
    certsOlder: number
  ): BatchInfo => ({
    batchNumber,
    totalEntries: 1000,
    certsNewerThanCutoff: certsNewer,
    certsOlderThanCutoff: certsOlder,
    totalCertsChecked: certsNewer + certsOlder,
    cutoffTime: Date.now() - 365 * 24 * 60 * 60 * 1000,
    oldestEntryTimestamp: Date.now() - 400 * 24 * 60 * 60 * 1000,
  });

  describe("ConsecutiveOldBatchesStrategy", () => {
    it("should not stop on first batch with old certs", () => {
      const strategy = new ConsecutiveOldBatchesStrategy(5, 90);
      strategy.reset();

      const decision = strategy.shouldStop(createBatchInfo(0, 5, 95)); // 95% old
      expect(decision.shouldStop).to.be.false;
    });

    it("should stop after 5 consecutive batches with >90% old certs", () => {
      const strategy = new ConsecutiveOldBatchesStrategy(5, 90);
      strategy.reset();

      // Process 5 batches with mostly old certs
      for (let i = 0; i < 4; i++) {
        const decision = strategy.shouldStop(createBatchInfo(i, 5, 95));
        expect(decision.shouldStop).to.be.false;
      }

      // 5th batch should trigger stop
      const decision = strategy.shouldStop(createBatchInfo(4, 5, 95));
      expect(decision.shouldStop).to.be.true;
      expect(decision.reason).to.include("5 consecutive batches");
    });

    it("should reset counter when encountering batch with newer certs", () => {
      const strategy = new ConsecutiveOldBatchesStrategy(5, 90);
      strategy.reset();

      // 3 old batches
      strategy.shouldStop(createBatchInfo(0, 5, 95));
      strategy.shouldStop(createBatchInfo(1, 5, 95));
      strategy.shouldStop(createBatchInfo(2, 5, 95));

      // 1 batch with newer certs (should reset)
      strategy.shouldStop(createBatchInfo(3, 50, 50)); // 50% old

      // 4 more old batches (shouldn't stop yet since counter was reset)
      strategy.shouldStop(createBatchInfo(4, 5, 95));
      strategy.shouldStop(createBatchInfo(5, 5, 95));
      strategy.shouldStop(createBatchInfo(6, 5, 95));
      const decision = strategy.shouldStop(createBatchInfo(7, 5, 95));
      expect(decision.shouldStop).to.be.false;
    });

    it("should not count batches with no certs checked", () => {
      const strategy = new ConsecutiveOldBatchesStrategy(5, 90);
      strategy.reset();

      const decision = strategy.shouldStop(createBatchInfo(0, 0, 0));
      expect(decision.shouldStop).to.be.false;
    });
  });

  describe("FixedBatchStrategy", () => {
    it("should not stop before reaching max batches", () => {
      const strategy = new FixedBatchStrategy(10);
      strategy.reset();

      for (let i = 0; i < 9; i++) {
        const decision = strategy.shouldStop(createBatchInfo(i, 50, 50));
        expect(decision.shouldStop).to.be.false;
      }
    });

    it("should stop after reaching max batches", () => {
      const strategy = new FixedBatchStrategy(10);
      strategy.reset();

      const decision = strategy.shouldStop(createBatchInfo(10, 50, 50));
      expect(decision.shouldStop).to.be.true;
      expect(decision.reason).to.include("maximum batch limit");
    });
  });

  describe("CertificateCountStrategy", () => {
    it("should not stop before finding target certificates", () => {
      const strategy = new CertificateCountStrategy(100);
      strategy.reset();

      // First batch finds 40 certs
      let decision = strategy.shouldStop(createBatchInfo(0, 40, 10));
      expect(decision.shouldStop).to.be.false;

      // Second batch finds 30 more (total 70)
      decision = strategy.shouldStop(createBatchInfo(1, 30, 20));
      expect(decision.shouldStop).to.be.false;
    });

    it("should stop after finding target certificates", () => {
      const strategy = new CertificateCountStrategy(100);
      strategy.reset();

      // First batch: 60 certs
      strategy.shouldStop(createBatchInfo(0, 60, 10));

      // Second batch: 50 certs (total 110)
      const decision = strategy.shouldStop(createBatchInfo(1, 50, 20));
      expect(decision.shouldStop).to.be.true;
      expect(decision.reason).to.include("110 certificates");
    });
  });

  describe("CompositeStrategy", () => {
    it("should stop when ANY sub-strategy triggers", () => {
      const batchStrategy = new FixedBatchStrategy(10);
      const certStrategy = new CertificateCountStrategy(50);
      const composite = new CompositeStrategy([batchStrategy, certStrategy]);

      composite.reset();

      // Trigger certificate count strategy
      const decision = composite.shouldStop(createBatchInfo(0, 60, 10));
      expect(decision.shouldStop).to.be.true;
      expect(decision.reason).to.include("certificates");
    });

    it("should continue if no sub-strategy triggers", () => {
      const batchStrategy = new FixedBatchStrategy(10);
      const certStrategy = new CertificateCountStrategy(100);
      const composite = new CompositeStrategy([batchStrategy, certStrategy]);

      composite.reset();

      const decision = composite.shouldStop(createBatchInfo(5, 30, 10));
      expect(decision.shouldStop).to.be.false;
    });

    it("should reset all sub-strategies", () => {
      const strategy1 = new CertificateCountStrategy(50);
      const strategy2 = new FixedBatchStrategy(5);
      const composite = new CompositeStrategy([strategy1, strategy2]);

      // Trigger strategy1
      composite.shouldStop(createBatchInfo(0, 60, 10));

      // Reset should clear state
      composite.reset();

      // Should not stop immediately after reset
      const decision = composite.shouldStop(createBatchInfo(0, 10, 5));
      expect(decision.shouldStop).to.be.false;
    });
  });

  describe("Strategy descriptions", () => {
    it("ConsecutiveOldBatchesStrategy should have descriptive text", () => {
      const strategy = new ConsecutiveOldBatchesStrategy(5, 90);
      expect(strategy.getDescription()).to.include("5 consecutive batches");
      expect(strategy.getDescription()).to.include("90%");
    });

    it("FixedBatchStrategy should have descriptive text", () => {
      const strategy = new FixedBatchStrategy(1000);
      expect(strategy.getDescription()).to.include("1000 batches");
    });

    it("CertificateCountStrategy should have descriptive text", () => {
      const strategy = new CertificateCountStrategy(5000);
      expect(strategy.getDescription()).to.include("5000");
    });

    it("CompositeStrategy should combine descriptions", () => {
      const strategy = new CompositeStrategy([
        new FixedBatchStrategy(10),
        new CertificateCountStrategy(100),
      ]);
      const desc = strategy.getDescription();
      expect(desc).to.include("10 batches");
      expect(desc).to.include("100");
      expect(desc).to.include("OR");
    });
  });
});
