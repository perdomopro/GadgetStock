package com.perdomazo.firstproject.config;

import com.perdomazo.firstproject.Models.GadgetModel;
import com.perdomazo.firstproject.Repositories.GadgetRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;

/**
 * DataSeeder initiates realistic sample secondhand gadget inventory and sales history
 * on startup when running under the "dev" profile.
 *
 * Guarantees idempotency via gadgetRepository.count() check.
 * Compatible with both M1 model fields and M2 extended fields (category, repairCost, listedPrice).
 */
@Component
@Profile("dev")
public class DataSeeder implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataSeeder.class);

    private final GadgetRepository gadgetRepository;

    public DataSeeder(GadgetRepository gadgetRepository) {
        this.gadgetRepository = gadgetRepository;
    }

    @Override
    public void run(String... args) throws Exception {
        if (gadgetRepository.count() == 0) {
            log.info("Database is empty. Seeding initial development secondhand gadget dataset...");
            seedGadgets();
            log.info("DataSeeder completed successfully. Seeded {} gadgets.", gadgetRepository.count());
        } else {
            log.info("Gadget database already contains {} records. Skipping DataSeeder.", gadgetRepository.count());
        }
    }

    private void seedGadgets() {
        LocalDateTime now = LocalDateTime.now();

        List<GadgetModel> seedList = Arrays.asList(
            // 1. Smartphones: Available
            buildGadget(
                "iPhone 13",
                "128GB Midnight",
                "Smartphones",
                new BigDecimal("300.00"),
                new BigDecimal("45.00"),
                new BigDecimal("450.00"),
                "Batería nueva, excelente estado",
                true,
                false,
                null,
                now.minusDays(7),
                null
            ),
            // 2. Smartphones: Sold
            buildGadget(
                "Samsung Galaxy S21",
                "Phantom Gray 128GB",
                "Smartphones",
                new BigDecimal("200.00"),
                new BigDecimal("30.00"),
                new BigDecimal("320.00"),
                "Pantalla cambiada con repuesto original",
                true,
                true,
                new BigDecimal("310.00"),
                now.minusDays(10),
                now.minusDays(2)
            ),
            // 3. Laptops: Available (No repair needed)
            buildGadget(
                "MacBook Air M1",
                "256GB Space Gray 8GB RAM",
                "Laptops",
                new BigDecimal("500.00"),
                BigDecimal.ZERO,
                new BigDecimal("680.00"),
                "Estado impecable, ciclo de batería bajo",
                false,
                false,
                null,
                now.minusDays(4),
                null
            ),
            // 4. Laptops: Sold
            buildGadget(
                "ThinkPad T480",
                "Intel Core i5 16GB 512GB SSD",
                "Laptops",
                new BigDecimal("150.00"),
                new BigDecimal("60.00"),
                new BigDecimal("280.00"),
                "Teclado y batería externa sustituidos",
                true,
                true,
                new BigDecimal("270.00"),
                now.minusDays(15),
                now.minusDays(5)
            ),
            // 5. Consolas: Available
            buildGadget(
                "Nintendo Switch OLED",
                "Edición Blanca 64GB",
                "Consolas",
                new BigDecimal("180.00"),
                new BigDecimal("25.00"),
                new BigDecimal("260.00"),
                "Joy-Con reparados sin drift, mica de cristal",
                true,
                false,
                null,
                now.minusDays(3),
                null
            ),
            // 6. Consolas: Sold
            buildGadget(
                "PlayStation 4 Pro",
                "1TB Negro Jet Black",
                "Consolas",
                new BigDecimal("120.00"),
                new BigDecimal("40.00"),
                new BigDecimal("220.00"),
                "Mantenimiento térmico y pasta nueva aplicada",
                true,
                true,
                new BigDecimal("210.00"),
                now.minusDays(20),
                now.minusDays(10)
            ),
            // 7. Audio: Available
            buildGadget(
                "Sony WH-1000XM4",
                "Silver Cancelación de Ruido",
                "Audio",
                new BigDecimal("90.00"),
                new BigDecimal("15.00"),
                new BigDecimal("160.00"),
                "Almohadillas nuevas, estuche original incluido",
                true,
                false,
                null,
                now.minusDays(1),
                null
            ),
            // 8. Audio: Sold (Extended balance item)
            buildGadget(
                "AirPods Pro 1st Gen",
                "A2084 con estuche MagSafe",
                "Audio",
                new BigDecimal("70.00"),
                new BigDecimal("10.00"),
                new BigDecimal("130.00"),
                "Limpieza ultrasónica y almohadillas nuevas",
                true,
                true,
                new BigDecimal("125.00"),
                now.minusDays(12),
                now.minusDays(3)
            )
        );

        gadgetRepository.saveAll(seedList);
    }

    /**
     * Builds a GadgetModel instance populated with standard M1 fields and
     * dynamically assigns M2 fields (category, repairCost, listedPrice) if present on the entity.
     */
    private GadgetModel buildGadget(
            String name,
            String model,
            String category,
            BigDecimal price,
            BigDecimal repairCost,
            BigDecimal listedPrice,
            String comments,
            Boolean repair,
            Boolean isSold,
            BigDecimal soldPrice,
            LocalDateTime registerDate,
            LocalDateTime soldDate
    ) {
        GadgetModel g = new GadgetModel();
        g.setName(name);
        g.setModel(model);
        g.setPrice(price);
        g.setComments(comments);
        g.setRepair(repair);
        g.setIsSold(isSold);
        g.setSoldPrice(soldPrice);
        g.setRegisterDate(registerDate);
        g.setSoldDate(soldDate);

        g.setCategory(category != null ? category : "");
        g.setRepairCost(repairCost != null ? repairCost : BigDecimal.ZERO);
        g.setListedPrice(listedPrice);

        return g;
    }
}
